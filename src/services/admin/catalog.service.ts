import { type TagKind } from "@prisma/client";
import { ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-styles";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { buildReadingLinksFromUrls } from "@/lib/reading-platforms";
import type { AdminGenreSummary, AdminListPage, AdminNovelSummary, AdminTagSummary } from "@/types/admin";

export async function getAdminNovels(
  query?: string,
  page = 1,
  pageSize = ADMIN_LIST_PAGE_SIZE
): Promise<AdminListPage<AdminNovelSummary>> {
  const q = query?.trim();
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { author: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;
  const safePage = Math.max(1, page);

  const [total, novels] = await Promise.all([
    db.novel.count({ where }),
    db.novel.findMany({
      where,
      orderBy: { title: "asc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: {
        genres: { select: { id: true, name: true } },
        tags: { select: { id: true, name: true } },
        _count: { select: { reviews: true } },
      },
    }),
  ]);

  return {
    items: novels.map((novel) => ({
      id: novel.id,
      title: novel.title,
      author: novel.author,
      coverUrl: novel.coverUrl,
      externalLink: novel.externalLink,
      reviewCount: novel._count.reviews,
      genreNames: novel.genres.map((g) => g.name),
      tagNames: novel.tags.map((t) => t.name),
      genreIds: novel.genres.map((g) => g.id),
      tagIds: novel.tags.map((t) => t.id),
      createdAt: novel.createdAt.toISOString(),
    })),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminNovelById(novelId: string) {
  return db.novel.findUnique({
    where: { id: novelId },
    include: {
      genres: true,
      tags: true,
      _count: { select: { reviews: true } },
    },
  });
}

export async function adminCreateNovel(input: {
  title: string;
  author?: string;
  coverUrl?: string;
  externalLink?: string;
  genreIds: string[];
  tagIds: string[];
}) {
  const title = input.title.trim();
  if (!title) throw new Error("Novel title is required.");

  const externalLink = input.externalLink?.trim() || null;
  const seedLinks = externalLink
    ? buildReadingLinksFromUrls([externalLink], { language: "en" })
    : [];

  return db.novel.create({
    data: {
      title,
      author: input.author?.trim() || null,
      coverUrl: input.coverUrl?.trim() || null,
      externalLink,
      genres: { connect: input.genreIds.map((id) => ({ id })) },
      tags: { connect: input.tagIds.map((id) => ({ id })) },
      readingLinks:
        seedLinks.length > 0
          ? {
              create: seedLinks.map((link) => ({
                platform: link.platform,
                url: link.url,
                normalizedUrl: link.normalizedUrl,
                category: link.category,
                language: link.language,
                country: link.country,
                label: link.label,
                active: true,
                moderationStatus: "APPROVED",
                isOfficial: link.isOfficial ?? false,
                isVerified: true,
              })),
            }
          : undefined,
    },
  });
}

export async function adminUpdateNovel(
  novelId: string,
  input: {
    title: string;
    author?: string;
    coverUrl?: string;
    externalLink?: string;
    genreIds: string[];
    tagIds: string[];
  }
) {
  const title = input.title.trim();
  if (!title) throw new Error("Novel title is required.");

  return db.novel.update({
    where: { id: novelId },
    data: {
      title,
      author: input.author?.trim() || null,
      coverUrl: input.coverUrl?.trim() || null,
      externalLink: input.externalLink?.trim() || null,
      genres: { set: input.genreIds.map((id) => ({ id })) },
      tags: { set: input.tagIds.map((id) => ({ id })) },
    },
  });
}

/**
 * Merge source novel into target: move reviews, reading links, genres/tags,
 * reading statuses and featured slots, then delete the source novel.
 * Reviews from the same user on both novels keep only the target's review.
 */
export async function mergeNovels(
  sourceNovelId: string,
  targetNovelId: string
): Promise<void> {
  if (sourceNovelId === targetNovelId) {
    throw new Error("Cannot merge a novel into itself.");
  }

  const [source, target] = await Promise.all([
    db.novel.findUnique({
      where: { id: sourceNovelId },
      include: { genres: true, tags: true },
    }),
    db.novel.findUnique({ where: { id: targetNovelId } }),
  ]);

  if (!source) throw new Error("Source novel not found.");
  if (!target) throw new Error("Target novel not found.");

  await db.$transaction(async (tx) => {
    const conflictingReviews = await tx.review.findMany({
      where: { novelId: sourceNovelId },
      select: { id: true, userId: true },
    });

    for (const review of conflictingReviews) {
      const targetHasReview = await tx.review.findUnique({
        where: { novelId_userId: { novelId: targetNovelId, userId: review.userId } },
        select: { id: true },
      });
      if (targetHasReview) {
        // Duplicate reviewer: drop the source review to avoid a unique
        // constraint violation on (novelId, userId).
        await tx.review.delete({ where: { id: review.id } });
      } else {
        await tx.review.update({
          where: { id: review.id },
          data: { novelId: targetNovelId },
        });
      }
    }

    await tx.readingLink.updateMany({
      where: { novelId: sourceNovelId },
      data: { novelId: targetNovelId },
    });

    const conflictingStatuses = await tx.novelReadingStatus.findMany({
      where: { novelId: sourceNovelId },
      select: { userId: true, status: true },
    });
    for (const status of conflictingStatuses) {
      await tx.novelReadingStatus.upsert({
        where: {
          userId_novelId: { userId: status.userId, novelId: targetNovelId },
        },
        create: {
          userId: status.userId,
          novelId: targetNovelId,
          status: status.status,
        },
        update: {},
      });
    }
    await tx.novelReadingStatus.deleteMany({ where: { novelId: sourceNovelId } });

    await tx.featuredNovel.updateMany({
      where: { novelId: sourceNovelId },
      data: { novelId: targetNovelId },
    });

    await tx.reviewDraft.updateMany({
      where: { novelId: sourceNovelId },
      data: { novelId: targetNovelId },
    });

    const genreIds = source.genres.map((g) => ({ id: g.id }));
    const tagIds = source.tags.map((t) => ({ id: t.id }));
    if (genreIds.length > 0 || tagIds.length > 0) {
      await tx.novel.update({
        where: { id: targetNovelId },
        data: {
          ...(genreIds.length > 0 ? { genres: { connect: genreIds } } : {}),
          ...(tagIds.length > 0 ? { tags: { connect: tagIds } } : {}),
        },
      });
    }

    await tx.novel.delete({ where: { id: sourceNovelId } });
  });
}

export async function adminDeleteNovel(novelId: string): Promise<void> {
  const novel = await db.novel.findUnique({
    where: { id: novelId },
    include: { _count: { select: { reviews: true } } },
  });

  if (!novel) throw new Error("Novel not found.");
  if (novel._count.reviews > 0) {
    throw new Error("Cannot delete a novel that has reviews.");
  }

  await db.novel.delete({ where: { id: novelId } });
}

export async function getAdminGenres(): Promise<AdminGenreSummary[]> {
  const genres = await db.genre.findMany({ orderBy: { name: "asc" } });

  return Promise.all(
    genres.map(async (genre) => ({
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
      novelCount: await db.novel.count({
        where: { genres: { some: { id: genre.id } } },
      }),
    }))
  );
}

export async function adminCreateGenre(name: string, slug?: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Genre name is required.");

  const finalSlug = slugify(slug?.trim() || trimmed);
  if (!finalSlug) throw new Error("Genre slug is required.");

  return db.genre.create({
    data: { name: trimmed, slug: finalSlug },
  });
}

export async function adminUpdateGenre(
  genreId: string,
  name: string,
  slug?: string
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Genre name is required.");

  const finalSlug = slugify(slug?.trim() || trimmed);
  if (!finalSlug) throw new Error("Genre slug is required.");

  return db.genre.update({
    where: { id: genreId },
    data: { name: trimmed, slug: finalSlug },
  });
}

export async function adminDeleteGenre(genreId: string): Promise<void> {
  const count = await db.novel.count({
    where: { genres: { some: { id: genreId } } },
  });

  if (count > 0) {
    throw new Error("Cannot delete a genre that is assigned to novels.");
  }

  await db.genre.delete({ where: { id: genreId } });
}

export async function getAdminTags(): Promise<AdminTagSummary[]> {
  const tags = await db.tag.findMany({ orderBy: { name: "asc" } });

  return Promise.all(
    tags.map(async (tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      kind: tag.kind,
      novelCount: await db.novel.count({
        where: { tags: { some: { id: tag.id } } },
      }),
    }))
  );
}

export async function adminCreateTag(
  name: string,
  slug?: string,
  kind: TagKind = "TROPE"
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required.");

  const finalSlug = slugify(slug?.trim() || trimmed);
  if (!finalSlug) throw new Error("Tag slug is required.");

  return db.tag.create({
    data: { name: trimmed, slug: finalSlug, kind },
  });
}

export async function adminUpdateTag(
  tagId: string,
  name: string,
  slug?: string,
  kind?: TagKind
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required.");

  const finalSlug = slugify(slug?.trim() || trimmed);
  if (!finalSlug) throw new Error("Tag slug is required.");

  return db.tag.update({
    where: { id: tagId },
    data: {
      name: trimmed,
      slug: finalSlug,
      ...(kind ? { kind } : {}),
    },
  });
}

export async function adminDeleteTag(tagId: string): Promise<void> {
  const count = await db.novel.count({
    where: { tags: { some: { id: tagId } } },
  });

  if (count > 0) {
    throw new Error("Cannot delete a tag that is assigned to novels.");
  }

  await db.tag.delete({ where: { id: tagId } });
}
