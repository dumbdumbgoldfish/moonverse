import { TagSuggestionStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import {
  findSimilarTags,
  getBlockingCanonicalMatch,
  normalizeTagName,
  tagCompactKey,
  tagSlug,
  type TagCandidate,
  validateTagNameInput,
} from "@/lib/tag-similarity";

export interface TagSuggestionRow {
  id: string;
  name: string;
  normalizedName: string;
  status: TagSuggestionStatus;
  reason: string | null;
  createdAt: string;
  suggestedBy: {
    id: string;
    username: string;
    displayName: string;
  };
  novel: {
    id: string;
    title: string;
  } | null;
  similarTags: TagCandidate[];
}

const TAG_SUGGESTION_UNAVAILABLE =
  "Tag suggestions are unavailable. Run: npx prisma generate && rm -rf .next && restart the dev server.";

function tagSuggestionDb() {
  const delegate = (db as PrismaClient).tagSuggestion;
  if (!delegate || typeof delegate.findFirst !== "function") {
    throw new Error(TAG_SUGGESTION_UNAVAILABLE);
  }
  return delegate;
}

async function loadTagCandidates(): Promise<TagCandidate[]> {
  const tags = await db.tag.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
  return tags;
}

export async function evaluateTagSuggestionInput(
  rawName: string,
  candidates?: TagCandidate[]
) {
  const validationError = validateTagNameInput(rawName);
  if (validationError) {
    return {
      ok: false as const,
      code: "INVALID" as const,
      error: validationError,
      normalizedName: normalizeTagName(rawName),
      compactKey: tagCompactKey(rawName),
    };
  }

  const catalog = candidates ?? (await loadTagCandidates());
  const similarity = findSimilarTags(rawName, catalog);
  const blocking = getBlockingCanonicalMatch(similarity);

  if (blocking) {
    return {
      ok: false as const,
      code:
        blocking.matchType === "exact"
          ? ("EXACT_EXISTS" as const)
          : blocking.matchType === "slug"
            ? ("SLUG_EXISTS" as const)
            : ("COMPACT_EXISTS" as const),
      error: `This tag already exists as “${blocking.tag.name}”. Select it instead.`,
      existingTag: blocking.tag,
      similarity,
    };
  }

  return {
    ok: true as const,
    normalizedName: similarity.normalizedName,
    compactKey: similarity.compactKey,
    slug: similarity.slug,
    similarity,
  };
}

export async function createTagSuggestion(input: {
  userId: string;
  rawName: string;
  novelId?: string | null;
  reason?: string | null;
}) {
  const evaluation = await evaluateTagSuggestionInput(input.rawName);
  if (!evaluation.ok) {
    return {
      success: false as const,
      code: evaluation.code,
      error: evaluation.error,
      existingTag: "existingTag" in evaluation ? evaluation.existingTag : undefined,
      similarity: "similarity" in evaluation ? evaluation.similarity : undefined,
    };
  }

  const { normalizedName, compactKey } = evaluation;

  const userPending = await tagSuggestionDb().findFirst({
    where: {
      suggestedByUserId: input.userId,
      compactKey,
      status: TagSuggestionStatus.PENDING,
    },
    select: { id: true },
  });

  if (userPending) {
    return {
      success: false as const,
      code: "PENDING_DUPLICATE" as const,
      error: "You already suggested this tag and it is pending review.",
    };
  }

  const globalPending = await tagSuggestionDb().findFirst({
    where: {
      compactKey,
      status: TagSuggestionStatus.PENDING,
    },
    select: { id: true },
  });

  if (globalPending) {
    return {
      success: false as const,
      code: "GLOBAL_PENDING" as const,
      error: "This tag has already been suggested and is awaiting moderator review.",
    };
  }

  if (input.novelId) {
    const novel = await db.novel.findUnique({
      where: { id: input.novelId },
      select: { id: true },
    });
    if (!novel) {
      return {
        success: false as const,
        code: "INVALID" as const,
        error: "The selected novel context could not be found.",
      };
    }
  }

  const reason = input.reason?.trim() || null;

  const suggestion = await tagSuggestionDb().create({
    data: {
      name: normalizedName,
      normalizedName,
      compactKey,
      suggestedByUserId: input.userId,
      novelId: input.novelId ?? null,
      reason,
    },
    select: { id: true, name: true, createdAt: true },
  });

  return {
    success: true as const,
    suggestion,
  };
}

export async function listPendingTagSuggestions(): Promise<TagSuggestionRow[]> {
  const [pending, candidates] = await Promise.all([
    tagSuggestionDb().findMany({
      where: { status: TagSuggestionStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: {
        suggestedBy: {
          select: { id: true, username: true, displayName: true },
        },
        novel: {
          select: { id: true, title: true },
        },
      },
    }),
    loadTagCandidates(),
  ]);

  return pending.map((row) => {
    const similarity = findSimilarTags(row.name, candidates);
    const similar = [
      similarity.exactMatch,
      similarity.slugMatch,
      similarity.compactMatch,
      ...similarity.fuzzyMatches,
    ]
      .filter((match): match is NonNullable<typeof match> => Boolean(match))
      .reduce<TagCandidate[]>((acc, match) => {
        if (acc.some((tag) => tag.id === match.tag.id)) return acc;
        acc.push(match.tag);
        return acc;
      }, [])
      .slice(0, 5);

    return {
      id: row.id,
      name: row.name,
      normalizedName: row.normalizedName,
      status: row.status,
      reason: row.reason,
      createdAt: row.createdAt.toISOString(),
      suggestedBy: row.suggestedBy,
      novel: row.novel,
      similarTags: similar,
    };
  });
}

async function assertPendingSuggestion(suggestionId: string) {
  const suggestion = await tagSuggestionDb().findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion) {
    throw new Error("Tag suggestion not found.");
  }

  if (suggestion.status !== TagSuggestionStatus.PENDING) {
    throw new Error("This suggestion has already been reviewed.");
  }

  return suggestion;
}

export async function approveTagSuggestionAsNew(
  suggestionId: string,
  reviewerId: string
) {
  return db.$transaction(async (tx) => {
    const suggestion = await tx.tagSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new Error("Tag suggestion not found.");
    }

    if (suggestion.status !== TagSuggestionStatus.PENDING) {
      throw new Error("This suggestion has already been reviewed.");
    }

    const slug = tagSlug(suggestion.normalizedName);
    if (!slug) {
      throw new Error("Suggested tag could not be slugified.");
    }

    const tags = await tx.tag.findMany({
      select: { id: true, name: true, slug: true },
    });

    const conflict = tags.find((tag) => {
      const tagCompact = tag.slug.replace(/-/g, "");
      return (
        tag.slug === slug ||
        tagCompact === suggestion.compactKey ||
        tagCompactKey(tag.name) === suggestion.compactKey
      );
    });

    if (conflict) {
      throw new Error(
        `A canonical tag already exists: “${conflict.name}”. Map to existing instead.`
      );
    }

    const tag = await tx.tag.create({
      data: {
        name: suggestion.normalizedName,
        slug,
      },
      select: { id: true, name: true, slug: true },
    });

    const reviewedAt = new Date();

    await tx.tagSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: TagSuggestionStatus.APPROVED,
        resolvedTagId: tag.id,
        reviewedByUserId: reviewerId,
        reviewedAt,
      },
    });

    return { tag, suggestionId };
  });
}

export async function mapTagSuggestionToExisting(
  suggestionId: string,
  tagId: string,
  reviewerId: string
) {
  return db.$transaction(async (tx) => {
    const suggestion = await tx.tagSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      throw new Error("Tag suggestion not found.");
    }

    if (suggestion.status !== TagSuggestionStatus.PENDING) {
      throw new Error("This suggestion has already been reviewed.");
    }

    const tag = await tx.tag.findUnique({
      where: { id: tagId },
      select: { id: true, name: true },
    });

    if (!tag) {
      throw new Error("Selected canonical tag was not found.");
    }

    const reviewedAt = new Date();

    await tx.tagSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: TagSuggestionStatus.MAPPED,
        resolvedTagId: tag.id,
        reviewedByUserId: reviewerId,
        reviewedAt,
      },
    });

    return { tag, suggestionId };
  });
}

export async function rejectTagSuggestion(
  suggestionId: string,
  reviewerId: string,
  rejectionReason?: string | null
) {
  const suggestion = await assertPendingSuggestion(suggestionId);
  const reviewedAt = new Date();

  await tagSuggestionDb().update({
    where: { id: suggestion.id },
    data: {
      status: TagSuggestionStatus.REJECTED,
      reviewedByUserId: reviewerId,
      reviewedAt,
      rejectionReason: rejectionReason?.trim() || null,
      resolvedTagId: null,
    },
  });
}

export async function getUserPendingTagSuggestions(userId: string) {
  const rows = await tagSuggestionDb().findMany({
    where: {
      suggestedByUserId: userId,
      status: TagSuggestionStatus.PENDING,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      normalizedName: true,
      compactKey: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
}
