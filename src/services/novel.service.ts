import { cache } from "react";
import { db } from "@/lib/db";
import { isMissingCoverUrl, resolveCoverUrl } from "@/lib/review-utils";
import { mapDbReadingLink, resolveNovelReadingLinks } from "@/lib/reading-links";
import { slugify } from "@/lib/slugify";
import { getAllReviews } from "@/services/review.service";
import type { ReadingLinkItem } from "@/types/reading-link";
import type {
  NovelDetail,
  NovelRecommendation,
  ReviewListItem,
} from "@/types/review";

export interface NovelSelectOption {
  id: string;
  title: string;
  author: string | null;
  coverUrl?: string | null;
  genres: string[];
  reviewCount: number;
  verifiedSourceCount: number;
}

export interface CreateNovelInput {
  title: string;
  author?: string;
  coverUrl?: string;
  externalLink?: string;
  synopsis?: string;
  originalLanguage?: string;
  publicationStatus?: string;
  genreIds?: string[];
  tagIds?: string[];
  /** Custom or selected genre names (created if missing). */
  genreNames?: string[];
  /** Custom or selected tag names (created if missing). */
  tagNames?: string[];
}

export interface NovelWriteContext {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  publicationStatus: string | null;
  genres: string[];
  reviewCount: number;
  verifiedSources: {
    id: string;
    platform: string;
    label: string | null;
    url: string;
  }[];
  /** Normalized URLs already attached (any moderation status) for duplicate checks. */
  existingNormalizedUrls: string[];
}

export async function getNovelsForSelect(): Promise<NovelSelectOption[]> {
  const novels = await db.novel.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      genres: { select: { name: true }, take: 4 },
      _count: {
        select: {
          reviews: true,
          readingLinks: {
            where: { active: true, moderationStatus: "APPROVED" },
          },
        },
      },
    },
  });

  return novels.map((novel) => ({
    id: novel.id,
    title: novel.title,
    author: novel.author,
    coverUrl: resolveCoverUrl(novel.coverUrl),
    genres: novel.genres.map((genre) => genre.name),
    reviewCount: novel._count.reviews,
    verifiedSourceCount: novel._count.readingLinks,
  }));
}

export async function getNovelWriteContext(
  novelId: string
): Promise<NovelWriteContext | null> {
  const novel = await db.novel.findUnique({
    where: { id: novelId },
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      publicationStatus: true,
      genres: { select: { name: true }, take: 6 },
      _count: { select: { reviews: true } },
      readingLinks: {
        where: { active: true },
        select: {
          id: true,
          platform: true,
          label: true,
          url: true,
          normalizedUrl: true,
          moderationStatus: true,
          isVerified: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!novel) return null;

  const verifiedSources = novel.readingLinks
    .filter(
      (link) =>
        link.moderationStatus === "APPROVED" || link.isVerified
    )
    .map((link) => ({
      id: link.id,
      platform: link.platform,
      label: link.label,
      url: link.url,
    }));

  return {
    id: novel.id,
    title: novel.title,
    author: novel.author,
    coverUrl: resolveCoverUrl(novel.coverUrl),
    publicationStatus: novel.publicationStatus,
    genres: novel.genres.map((genre) => genre.name),
    reviewCount: novel._count.reviews,
    verifiedSources,
    existingNormalizedUrls: novel.readingLinks.map((link) => link.normalizedUrl),
  };
}

export async function findLikelyDuplicateNovels(
  title: string,
  author?: string | null,
  limit = 5
): Promise<NovelSelectOption[]> {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) return [];

  const authorTrimmed = author?.trim() || null;
  const matches = await db.novel.findMany({
    where: {
      title: { equals: normalizedTitle, mode: "insensitive" },
      ...(authorTrimmed
        ? { author: { equals: authorTrimmed, mode: "insensitive" } }
        : {}),
    },
    take: limit,
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      genres: { select: { name: true }, take: 4 },
      _count: {
        select: {
          reviews: true,
          readingLinks: {
            where: { active: true, moderationStatus: "APPROVED" },
          },
        },
      },
    },
  });

  return matches.map((novel) => ({
    id: novel.id,
    title: novel.title,
    author: novel.author,
    coverUrl: resolveCoverUrl(novel.coverUrl),
    genres: novel.genres.map((genre) => genre.name),
    reviewCount: novel._count.reviews,
    verifiedSourceCount: novel._count.readingLinks,
  }));
}

function normalizeLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

async function resolveGenreConnects(
  genreIds: string[] = [],
  genreNames: string[] = []
) {
  const connects: { id: string }[] = [];
  const seen = new Set<string>();

  if (genreIds.length > 0) {
    const existing = await db.genre.findMany({
      where: { id: { in: genreIds } },
      select: { id: true, name: true },
    });
    for (const genre of existing) {
      const key = genre.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      connects.push({ id: genre.id });
    }
  }

  for (const raw of genreNames) {
    const name = normalizeLabel(raw);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const baseSlug = slugify(name) || "genre";
    let slug = baseSlug;
    let attempt = 1;
    while (true) {
      try {
        const genre = await db.genre.upsert({
          where: { name },
          update: {},
          create: { name, slug },
          select: { id: true },
        });
        connects.push({ id: genre.id });
        break;
      } catch {
        attempt += 1;
        slug = `${baseSlug}-${attempt}`;
        if (attempt > 20) throw new Error(`Unable to create genre "${name}".`);
      }
    }
  }

  return connects;
}

async function resolveTagConnects(
  tagIds: string[] = [],
  tagNames: string[] = []
) {
  const connects: { id: string }[] = [];
  const seen = new Set<string>();

  if (tagIds.length > 0) {
    const existing = await db.tag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true, name: true },
    });
    for (const tag of existing) {
      const key = tag.name.toLowerCase();
      if (seen.has(key) || /spoiler/i.test(tag.name)) continue;
      seen.add(key);
      connects.push({ id: tag.id });
    }
  }

  for (const raw of tagNames) {
    const name = normalizeLabel(raw);
    if (!name || /spoiler/i.test(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const baseSlug = slugify(name) || "tag";
    let slug = baseSlug;
    let attempt = 1;
    while (true) {
      try {
        const tag = await db.tag.upsert({
          where: { name },
          update: {},
          create: { name, slug },
          select: { id: true },
        });
        connects.push({ id: tag.id });
        break;
      } catch {
        attempt += 1;
        slug = `${baseSlug}-${attempt}`;
        if (attempt > 20) throw new Error(`Unable to create tag "${name}".`);
      }
    }
  }

  return connects;
}

export async function createNovel(input: CreateNovelInput) {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Novel title is required.");
  }

  const [genreConnects, tagConnects] = await Promise.all([
    resolveGenreConnects(input.genreIds, input.genreNames),
    resolveTagConnects(input.tagIds, input.tagNames),
  ]);

  return db.novel.create({
    data: {
      title,
      author: input.author?.trim() || null,
      coverUrl: input.coverUrl?.trim() || null,
      externalLink: input.externalLink?.trim() || null,
      synopsis: input.synopsis?.trim() || null,
      originalLanguage: input.originalLanguage?.trim() || null,
      publicationStatus: input.publicationStatus?.trim() || null,
      genres: genreConnects.length
        ? { connect: genreConnects }
        : undefined,
      tags: tagConnects.length ? { connect: tagConnects } : undefined,
    },
  });
}

const getNovelByIdUncached = async (
  id: string
): Promise<NovelDetail | null> => {
  const novel = await db.novel.findUnique({
    where: { id },
    include: {
      genres: true,
      tags: true,
      aliases: true,
      contentWarnings: { include: { warning: true } },
      readingLinks: {
        where: { active: true, moderationStatus: "APPROVED" },
        orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { platform: "asc" }],
      },
      reviews: {
        select: { rating: true },
      },
      readingStatuses: { select: { status: true } },
    },
  });

  if (!novel) return null;

  const reviewCount = novel.reviews.length;
  const averageRating =
    reviewCount > 0
      ? novel.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: novel.reviews.filter((review) => review.rating === rating).length,
  }));

  const likedTagCounts = new Map<string, number>();
  for (const review of novel.reviews) {
    if (review.rating < 4) continue;
    for (const tag of novel.tags) {
      likedTagCounts.set(tag.name, (likedTagCounts.get(tag.name) ?? 0) + 1);
    }
  }
  const likedTropes = [...likedTagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  const publicLists = await db.folder.findMany({
    where: {
      isPublic: true,
      reviews: { some: { review: { novelId: id } } },
    },
    select: { id: true, name: true },
    take: 8,
    orderBy: { updatedAt: "desc" },
  });

  const tropes = novel.tags
    .filter((tag) => tag.kind !== "MOOD")
    .map((t) => t.name);
  const moods = novel.tags
    .filter((tag) => tag.kind === "MOOD")
    .map((t) => t.name);

  const dbLinks = novel.readingLinks
    .map(mapDbReadingLink)
    .filter((link): link is NonNullable<typeof link> => link !== null);
  const readingLinks = resolveNovelReadingLinks(
    novel.id,
    dbLinks,
    novel.externalLink
  );

  return {
    id: novel.id,
    title: novel.title,
    author: novel.author,
    coverUrl: resolveCoverUrl(novel.coverUrl),
    externalLink: novel.externalLink,
    synopsis: novel.synopsis,
    originalLanguage: novel.originalLanguage,
    publicationStatus: novel.publicationStatus,
    publisher: novel.publisher,
    aliases: novel.aliases.map((alias) => alias.title),
    tropes,
    moods,
    contentWarnings: novel.contentWarnings.map((row) => ({
      name: row.warning.name,
      slug: row.warning.slug,
    })),
    chapterCount: novel.chapterCount ?? null,
    lengthBand: novel.lengthBand ?? null,
    metadataSource: novel.metadataSource ?? null,
    lastVerifiedAt: novel.lastVerifiedAt?.toISOString() ?? null,
    likedTropes,
    saveCount: novel.readingStatuses.length,
    readingStatusCounts: {
      want: novel.readingStatuses.filter((row) => row.status === "WANT").length,
      reading: novel.readingStatuses.filter((row) => row.status === "READING").length,
      finished: novel.readingStatuses.filter((row) => row.status === "FINISHED").length,
    },
    publicLists,
    genres: novel.genres.map((g) => g.name),
    tags: novel.tags.map((t) => t.name),
    reviewCount,
    averageRating,
    ratingDistribution,
    createdAt: novel.createdAt.toISOString(),
    readingLinks,
  };
};

export const getNovelById = cache(getNovelByIdUncached);

function normalized(value: string | null | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function buildRecommendationReason(
  sharedGenres: string[],
  sharedTags: string[]
): string {
  if (sharedGenres.length > 0 && sharedTags.length > 0) {
    return `Shares ${sharedGenres[0]} and ${sharedTags[0]}`;
  }
  if (sharedTags.length >= 2) {
    return `Also tagged ${sharedTags[0]}`;
  }
  if (sharedGenres.length > 0) {
    return `Popular with readers of this genre`;
  }
  // Unreachable when callers enforce genre or 2-tag match.
  return "Shares related reading themes";
}

const MOONIE_RECOMMEND_MAX = 25;

/**
 * Strict novel-level recommendations. Candidates must share a genre or at
 * least two tags; unrelated trending novels are never used as filler.
 * Only novels with a real cover image are returned (max 25).
 */
export async function getSimilarNovels(
  novelId: string,
  limit = MOONIE_RECOMMEND_MAX
): Promise<NovelRecommendation[]> {
  const cappedLimit = Math.min(
    Math.max(1, Math.floor(limit)),
    MOONIE_RECOMMEND_MAX
  );

  const source = await db.novel.findUnique({
    where: { id: novelId },
    select: {
      id: true,
      originalLanguage: true,
      publisher: true,
      genres: { select: { id: true, name: true } },
      tags: { select: { id: true, name: true } },
      readingLinks: {
        where: { active: true, moderationStatus: "APPROVED" },
        select: { platform: true },
      },
    },
  });

  if (!source) return [];

  const genreIds = source.genres.map((genre) => genre.id);
  const tagIds = source.tags.map((tag) => tag.id);
  if (genreIds.length === 0 && tagIds.length < 2) return [];

  const candidates = await db.novel.findMany({
    where: {
      id: { not: source.id },
      // Require real artwork; exclude empty and legacy Picsum cover URLs.
      AND: [
        { coverUrl: { not: null } },
        { NOT: { coverUrl: "" } },
        { NOT: { coverUrl: { contains: "picsum.photos" } } },
      ],
      OR: [
        ...(genreIds.length
          ? [{ genres: { some: { id: { in: genreIds } } } }]
          : []),
        ...(tagIds.length
          ? [{ tags: { some: { id: { in: tagIds } } } }]
          : []),
      ],
    },
    take: 200,
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      originalLanguage: true,
      publisher: true,
      genres: { select: { id: true, name: true } },
      tags: { select: { id: true, name: true } },
      reviews: { select: { rating: true } },
      readingLinks: {
        where: { active: true, moderationStatus: "APPROVED" },
        select: { platform: true },
      },
    },
  });

  const sourceGenreIds = new Set(genreIds);
  const sourceTagIds = new Set(tagIds);
  const sourcePlatforms = new Set(
    source.readingLinks.map((link) => normalized(link.platform))
  );

  return candidates
    .map((candidate) => {
      const sharedGenres = candidate.genres
        .filter((genre) => sourceGenreIds.has(genre.id))
        .map((genre) => genre.name);
      const sharedTags = candidate.tags
        .filter((tag) => sourceTagIds.has(tag.id))
        .map((tag) => tag.name);

      if (sharedGenres.length === 0 && sharedTags.length < 2) return null;
      if (isMissingCoverUrl(candidate.coverUrl)) return null;

      const sameLanguage =
        normalized(source.originalLanguage) !== "" &&
        normalized(source.originalLanguage) ===
          normalized(candidate.originalLanguage);
      const samePublisher =
        normalized(source.publisher) !== "" &&
        normalized(source.publisher) === normalized(candidate.publisher);
      const samePlatform = candidate.readingLinks.some((link) =>
        sourcePlatforms.has(normalized(link.platform))
      );
      const reviewCount = candidate.reviews.length;
      const averageRating =
        reviewCount > 0
          ? candidate.reviews.reduce(
              (total, review) => total + review.rating,
              0
            ) / reviewCount
          : null;

      return {
        id: candidate.id,
        title: candidate.title,
        author: candidate.author,
        coverUrl: resolveCoverUrl(candidate.coverUrl),
        averageRating,
        reviewCount,
        genres: candidate.genres.map((genre) => genre.name),
        tags: candidate.tags.map((tag) => tag.name),
        matchingLabels: [...sharedGenres, ...sharedTags].slice(0, 2),
        reason: buildRecommendationReason(sharedGenres, sharedTags),
        score:
          sharedGenres.length * 12 +
          sharedTags.length * 5 +
          (sameLanguage ? 3 : 0) +
          (samePublisher ? 2 : 0) +
          (samePlatform ? 2 : 0),
      };
    })
    .filter(
      (
        candidate
      ): candidate is NovelRecommendation & { score: number } =>
        candidate !== null
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.averageRating ?? 0) - (a.averageRating ?? 0) ||
        b.reviewCount - a.reviewCount ||
        a.title.localeCompare(b.title)
    )
    .slice(0, cappedLimit)
    .map((candidate): NovelRecommendation => candidate);
}

/** Batch-fetch reading links for Moonie recommendations and cards. */
export async function getReadingLinksByNovelIds(
  novelIds: string[]
): Promise<Map<string, ReadingLinkItem[]>> {
  if (novelIds.length === 0) return new Map();

  const novels = await db.novel.findMany({
    where: { id: { in: novelIds } },
    select: {
      id: true,
      externalLink: true,
      readingLinks: {
        where: { active: true, moderationStatus: "APPROVED" },
        orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { platform: "asc" }],
      },
    },
  });

  const result = new Map<string, ReadingLinkItem[]>();
  for (const novel of novels) {
    const dbLinks = novel.readingLinks
      .map(mapDbReadingLink)
      .filter((link): link is NonNullable<typeof link> => link !== null);
    result.set(
      novel.id,
      resolveNovelReadingLinks(novel.id, dbLinks, novel.externalLink)
    );
  }
  return result;
}

export async function getReviewsByNovelId(
  novelId: string
): Promise<ReviewListItem[]> {
  return getAllReviews({ novelId, sort: "latest" });
}

export async function getAllGenres() {
  return db.genre.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getAllTags() {
  return db.tag.findMany({
    orderBy: { name: "asc" },
  });
}
