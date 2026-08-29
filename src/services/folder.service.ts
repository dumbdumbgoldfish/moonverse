import { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { FOLDER_REVIEWS_PAGE_SIZE } from "@/lib/folder-reviews";
import {
  excerpt,
  getInitials,
  resolveCoverUrl,
} from "@/lib/review-utils";
import { validateFolderName } from "@/lib/validation";
import { createNotification } from "@/services/notification.service";
import type { ReadingListShelfNovel } from "@/types/discovery";
import type {
  CreateFolderInput,
  FolderDetail,
  FolderListItem,
  UpdateFolderInput,
} from "@/types/folder";
import type { ReviewListItem } from "@/types/review";
import {
  READING_LIST_SHELF_INITIAL_BATCH,
  READING_LIST_SHELF_PAGE_SIZE,
} from "@/lib/reading-list-shelf";

export { READING_LIST_SHELF_INITIAL_BATCH, READING_LIST_SHELF_PAGE_SIZE };

export const shelfNovelInclude = {
  genres: { select: { name: true } },
  tags: { select: { name: true } },
  reviews: { select: { rating: true } },
  readingLinks: {
    where: {
      active: true,
      moderationStatus: "APPROVED",
      isOfficial: true,
    },
    take: 1,
    select: { id: true },
  },
} as const;

type ShelfNovelRecord = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  synopsis: string | null;
  publicationStatus: string | null;
  genres: { name: string }[];
  tags: { name: string }[];
  reviews: { rating: number }[];
  readingLinks: { id: string }[];
};

export function dedupeFolderEntriesToShelfNovels(
  entries: Array<{ review: { novelId: string; novel: ShelfNovelRecord } }>,
  offset: number,
  limit: number,
  rawCountHint?: number
): { novels: ReadingListShelfNovel[]; hasMore: boolean } {
  const seen = new Set<string>();
  const deduped: ReadingListShelfNovel[] = [];

  for (const entry of entries) {
    const novelId = entry.review.novelId;
    if (seen.has(novelId)) continue;
    seen.add(novelId);
    deduped.push(mapNovelToShelfNovel(entry.review.novel));
  }

  const hasMore =
    deduped.length > offset + limit ||
    (typeof rawCountHint === "number" && rawCountHint > entries.length);

  return {
    novels: deduped.slice(offset, offset + limit),
    hasMore,
  };
}

function formatPublicationStatus(status: string) {
  const normalized = status.trim();
  if (!normalized) return undefined;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

function mapNovelToShelfNovel(novel: ShelfNovelRecord): ReadingListShelfNovel {
  const reviewCount = novel.reviews.length;
  const averageRating =
    reviewCount > 0
      ? novel.reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviewCount
      : null;
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const label of [
    ...novel.genres.map((genre) => genre.name),
    ...novel.tags
      .map((tag) => tag.name)
      .filter((name) => !/spoiler/i.test(name)),
  ]) {
    const key = label.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    tags.push(label);
    if (tags.length >= 3) break;
  }

  const synopsis = novel.synopsis?.trim();

  return {
    novelId: novel.id,
    title: novel.title,
    author: novel.author?.trim() || "Unknown",
    coverUrl: resolveCoverUrl(novel.coverUrl),
    averageRating,
    reviewCount,
    primaryGenre: novel.genres[0]?.name,
    publicationStatus: novel.publicationStatus
      ? formatPublicationStatus(novel.publicationStatus)
      : undefined,
    synopsisExcerpt: synopsis ? excerpt(synopsis, 140) : undefined,
    hasOfficialLink: novel.readingLinks.length > 0,
    tags,
  };
}

const reviewInFolderInclude = {
  user: {
    select: {
      id: true,
      displayName: true,
      username: true,
    },
  },
  novel: {
    include: {
      genres: true,
      tags: true,
    },
  },
} satisfies Prisma.ReviewInclude;

type ReviewInFolder = Prisma.ReviewGetPayload<{
  include: typeof reviewInFolderInclude;
}>;

function mapReviewToListItem(review: ReviewInFolder): ReviewListItem {
  const novelTags = review.novel.tags
    .map((t) => t.name)
    .filter((name) => !/spoiler/i.test(name));
  const tags = review.containsSpoilers
    ? ["Spoilers", ...novelTags]
    : novelTags;

  return {
    id: review.id,
    title: review.title,
    excerpt: excerpt(review.body, 280),
    body: review.body,
    rating: review.rating,
    containsSpoilers: review.containsSpoilers,
    likeCount: review.likeCount,
    commentCount: review.commentCount,
    saveCount: review.saveCount,
    shareCount: review.shareCount,
    novelId: review.novel.id,
    novelTitle: review.novel.title,
    novelAuthor: review.novel.author ?? "Unknown",
    coverUrl: resolveCoverUrl(review.novel.coverUrl),
    reviewerName: review.user.displayName,
    reviewerUsername: review.user.username,
    reviewerAvatar: getInitials(review.user.displayName),
    genres: review.novel.genres.map((g) => g.name),
    tags,
    createdAt: review.createdAt.toISOString(),
  };
}

function mapFolderToListItem(
  folder: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    isFeatured?: boolean;
    createdAt: Date;
    _count: { reviews: number };
  }
): FolderListItem {
  return {
    id: folder.id,
    name: folder.name,
    description: folder.description,
    isPublic: folder.isPublic,
    isFeatured: folder.isFeatured ?? false,
    reviewCount: folder._count.reviews,
    createdAt: folder.createdAt.toISOString(),
  };
}

export async function getFoldersByUser(userId: string): Promise<FolderListItem[]> {
  const folders = await db.folder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { reviews: true } },
    },
  });

  return folders.map(mapFolderToListItem);
}

export async function getPublicFolderById(
  folderId: string
): Promise<FolderDetail | null> {
  const folder = await db.folder.findUnique({
    where: { id: folderId },
    include: {
      _count: { select: { reviews: true } },
      reviews: {
        orderBy: { addedAt: "desc" },
        take: FOLDER_REVIEWS_PAGE_SIZE,
        include: {
          review: {
            include: reviewInFolderInclude,
          },
        },
      },
    },
  });

  if (!folder?.isPublic) return null;

  return {
    ...mapFolderToListItem(folder),
    userId: folder.userId,
    canManage: false,
    reviews: folder.reviews.map((entry) => mapReviewToListItem(entry.review)),
    hasMoreReviews: folder._count.reviews > FOLDER_REVIEWS_PAGE_SIZE,
  };
}

export async function getFolderById(
  folderId: string,
  userId: string
): Promise<FolderDetail | null> {
  const folder = await db.folder.findUnique({
    where: { id: folderId },
    include: {
      _count: { select: { reviews: true } },
      reviews: {
        orderBy: { addedAt: "desc" },
        take: FOLDER_REVIEWS_PAGE_SIZE,
        include: {
          review: {
            include: reviewInFolderInclude,
          },
        },
      },
    },
  });

  if (!folder) return null;

  const isOwner = folder.userId === userId;
  if (!folder.isPublic && !isOwner) {
    return null;
  }

  return {
    ...mapFolderToListItem(folder),
    userId: folder.userId,
    canManage: isOwner,
    reviews: folder.reviews.map((entry) => mapReviewToListItem(entry.review)),
    hasMoreReviews: folder._count.reviews > FOLDER_REVIEWS_PAGE_SIZE,
  };
}

export async function getFolderReviewsPage(
  folderId: string,
  viewerId: string | undefined,
  offset: number,
  limit: number
): Promise<{ reviews: ReviewListItem[]; hasMore: boolean } | null> {
  const folder = await db.folder.findUnique({
    where: { id: folderId },
    select: {
      userId: true,
      isPublic: true,
      _count: { select: { reviews: true } },
    },
  });

  if (!folder) return null;
  if (!folder.isPublic && folder.userId !== viewerId) return null;

  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.min(Math.max(1, limit), FOLDER_REVIEWS_PAGE_SIZE);

  const entries = await db.folderReview.findMany({
    where: { folderId },
    orderBy: { addedAt: "desc" },
    skip: safeOffset,
    take: safeLimit + 1,
    include: {
      review: {
        include: reviewInFolderInclude,
      },
    },
  });

  const hasMore = entries.length > safeLimit;
  const page = entries.slice(0, safeLimit);

  return {
    reviews: page.map((entry) => mapReviewToListItem(entry.review)),
    hasMore,
  };
}

export async function createFolder(
  userId: string,
  data: CreateFolderInput
): Promise<FolderListItem> {
  const name = data.name.trim();
  const nameError = validateFolderName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  const folder = await db.folder.create({
    data: {
      userId,
      name,
      description: data.description?.trim() || null,
      isPublic: data.isPublic ?? false,
    },
    include: {
      _count: { select: { reviews: true } },
    },
  });

  return mapFolderToListItem(folder);
}

export async function updateFolder(
  folderId: string,
  userId: string,
  data: UpdateFolderInput
): Promise<FolderListItem> {
  const existing = await db.folder.findFirst({
    where: { id: folderId, userId },
  });

  if (!existing) {
    throw new Error("Folder not found or you do not have permission to edit it.");
  }

  if (data.name !== undefined) {
    const nameError = validateFolderName(data.name);
    if (nameError) {
      throw new Error(nameError);
    }
  }

  const folder = await db.folder.update({
    where: { id: folderId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),
      ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
    },
    include: {
      _count: { select: { reviews: true } },
    },
  });

  return mapFolderToListItem(folder);
}

/** Owner toggle for their own public folders, or an admin toggling any folder. */
export async function toggleFolderFeatured(
  folderId: string,
  userId: string,
  isFeatured: boolean,
  isAdmin = false
): Promise<void> {
  const folder = await db.folder.findUnique({ where: { id: folderId } });
  if (!folder) throw new Error("Folder not found.");

  if (!isAdmin) {
    if (folder.userId !== userId) {
      throw new Error("You do not have permission to feature this list.");
    }
    if (!folder.isPublic) {
      throw new Error("Only public reading lists can be featured.");
    }
  }

  await db.folder.update({ where: { id: folderId }, data: { isFeatured } });
}

export interface FeaturedFolderItem extends FolderListItem {
  ownerUsername: string;
  ownerDisplayName: string;
}

export async function getFeaturedFolders(limit = 24): Promise<FeaturedFolderItem[]> {
  const folders = await db.folder.findMany({
    where: { isFeatured: true, isPublic: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      _count: { select: { reviews: true } },
      user: { select: { username: true, displayName: true } },
    },
  });

  return folders.map((folder) => ({
    ...mapFolderToListItem(folder),
    ownerUsername: folder.user.username,
    ownerDisplayName: folder.user.displayName,
  }));
}

export interface AdminFolderRow {
  id: string;
  name: string;
  isFeatured: boolean;
  isPublic: boolean;
  reviewCount: number;
  ownerUsername: string;
  ownerDisplayName: string;
  updatedAt: string;
}

export async function listPublicFoldersForAdmin(
  limit = 80
): Promise<AdminFolderRow[]> {
  const folders = await db.folder.findMany({
    where: { isPublic: true },
    orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: {
      _count: { select: { reviews: true } },
      user: { select: { username: true, displayName: true } },
    },
  });

  return folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    isFeatured: folder.isFeatured,
    isPublic: folder.isPublic,
    reviewCount: folder._count.reviews,
    ownerUsername: folder.user.username,
    ownerDisplayName: folder.user.displayName,
    updatedAt: folder.updatedAt.toISOString(),
  }));
}

export async function deleteFolder(folderId: string, userId: string): Promise<void> {
  const folder = await db.folder.findFirst({
    where: { id: folderId, userId },
    include: {
      reviews: { select: { reviewId: true } },
    },
  });

  if (!folder) {
    throw new Error("Folder not found or you do not have permission to delete it.");
  }

  await db.$transaction(async (tx) => {
    if (folder.reviews.length > 0) {
      await Promise.all(
        folder.reviews.map((entry) =>
          tx.review.update({
            where: { id: entry.reviewId },
            data: { saveCount: { decrement: 1 } },
          })
        )
      );
    }

    await tx.folder.delete({ where: { id: folderId } });
  });
}

export async function addReviewToFolder(
  folderId: string,
  reviewId: string,
  userId: string
): Promise<{ added: boolean; saveCount: number }> {
  const folder = await db.folder.findFirst({
    where: { id: folderId, userId },
    select: { id: true, name: true },
  });

  if (!folder) {
    throw new Error("Folder not found or you do not have permission to add reviews.");
  }

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      title: true,
      userId: true,
      novelId: true,
      novel: { select: { title: true, coverUrl: true } },
    },
  });

  if (!review) {
    throw new Error("Review not found.");
  }

  const existing = await db.folderReview.findUnique({
    where: {
      folderId_reviewId: { folderId, reviewId },
    },
  });

  if (existing) {
    const current = await db.review.findUnique({
      where: { id: reviewId },
      select: { saveCount: true },
    });
    return { added: false, saveCount: current?.saveCount ?? 0 };
  }

  const updatedReview = await db.$transaction(async (tx) => {
    await tx.folderReview.create({
      data: { folderId, reviewId },
    });

    return tx.review.update({
      where: { id: reviewId },
      data: { saveCount: { increment: 1 } },
      select: { saveCount: true, userId: true },
    });
  });

  if (review.userId !== userId) {
    const saver = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
      },
    });

    const saverLabel = saver?.displayName ?? "Someone";
    await createNotification({
      userId: review.userId,
      type: NotificationType.REVIEW_SAVED,
      message: `Your review was saved to ${folder.name} by ${saverLabel}`,
      link: `/reviews/${reviewId}`,
      actorId: saver?.id,
      metadata: {
        actorDisplayName: saver?.displayName,
        actorUsername: saver?.username,
        actorAvatarUrl: saver?.avatarUrl,
        reviewId,
        reviewTitle: review.title,
        novelId: review.novelId,
        novelTitle: review.novel.title,
        coverUrl: review.novel.coverUrl,
        folderName: folder.name,
      },
    });
  }

  return { added: true, saveCount: updatedReview.saveCount };
}

/** Save a review into the user's Library folder (create it if needed). */
export async function saveReviewToLibrary(
  reviewId: string,
  userId: string
): Promise<{ added: boolean; folderId: string; folderName: string; saveCount: number }> {
  const folders = await getFoldersByUser(userId);
  const library =
    folders.find((folder) => folder.name.toLowerCase() === "library") ??
    folders[0] ??
    (await createFolder(userId, {
      name: "Library",
      description: "Stories you want to keep",
      isPublic: false,
    }));

  const result = await addReviewToFolder(library.id, reviewId, userId);
  return {
    added: result.added,
    folderId: library.id,
    folderName: library.name,
    saveCount: result.saveCount,
  };
}

export async function removeReviewFromFolder(
  folderId: string,
  reviewId: string,
  userId: string
): Promise<{ removed: boolean; saveCount: number }> {
  const folder = await db.folder.findFirst({
    where: { id: folderId, userId },
    select: { id: true },
  });

  if (!folder) {
    throw new Error("Folder not found or you do not have permission to remove reviews.");
  }

  const existing = await db.folderReview.findUnique({
    where: {
      folderId_reviewId: { folderId, reviewId },
    },
  });

  if (!existing) {
    const current = await db.review.findUnique({
      where: { id: reviewId },
      select: { saveCount: true },
    });
    return { removed: false, saveCount: current?.saveCount ?? 0 };
  }

  const updatedReview = await db.$transaction(async (tx) => {
    await tx.folderReview.delete({
      where: {
        folderId_reviewId: { folderId, reviewId },
      },
    });

    const review = await tx.review.findUnique({
      where: { id: reviewId },
      select: { saveCount: true },
    });

    const nextSaveCount = Math.max(0, (review?.saveCount ?? 1) - 1);

    return tx.review.update({
      where: { id: reviewId },
      data: { saveCount: nextSaveCount },
      select: { saveCount: true },
    });
  });

  return { removed: true, saveCount: updatedReview.saveCount };
}

export async function getReviewSavedFolderIds(
  reviewId: string,
  userId: string
): Promise<string[]> {
  const entries = await db.folderReview.findMany({
    where: {
      reviewId,
      folder: { userId },
    },
    select: { folderId: true },
  });

  return entries.map((entry) => entry.folderId);
}

/** Batch folder membership for feed cards. */
export async function getSavedFolderIdsByReviewIds(
  reviewIds: string[],
  userId: string
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (reviewIds.length === 0) return result;

  const entries = await db.folderReview.findMany({
    where: {
      reviewId: { in: reviewIds },
      folder: { userId },
    },
    select: { reviewId: true, folderId: true },
  });

  for (const entry of entries) {
    const list = result.get(entry.reviewId) ?? [];
    list.push(entry.folderId);
    result.set(entry.reviewId, list);
  }

  return result;
}

export async function getReadingListShelfNovelsPage(
  folderId: string,
  viewerId: string | undefined,
  offset: number,
  limit: number
): Promise<{ novels: ReadingListShelfNovel[]; hasMore: boolean } | null> {
  const folder = await db.folder.findUnique({
    where: { id: folderId },
    select: {
      userId: true,
      isPublic: true,
      _count: { select: { reviews: true } },
    },
  });

  if (!folder) return null;
  if (!folder.isPublic && folder.userId !== viewerId) return null;

  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.min(Math.max(1, limit), 32);
  const targetCount = safeOffset + safeLimit + 1;
  const batchSize = 80;

  let rawSkip = 0;
  let hasMoreRaw = folder._count.reviews > 0;
  const seen = new Set<string>();
  const deduped: ReadingListShelfNovel[] = [];

  while (deduped.length < targetCount && hasMoreRaw) {
    const entries = await db.folderReview.findMany({
      where: { folderId },
      orderBy: { addedAt: "desc" },
      skip: rawSkip,
      take: batchSize,
      include: {
        review: {
          include: {
            novel: {
              include: shelfNovelInclude,
            },
          },
        },
      },
    });

    if (entries.length === 0) {
      hasMoreRaw = false;
      break;
    }

    rawSkip += entries.length;
    if (entries.length < batchSize) {
      hasMoreRaw = false;
    }

    for (const entry of entries) {
      const novelId = entry.review.novelId;
      if (seen.has(novelId)) continue;
      seen.add(novelId);
      deduped.push(mapNovelToShelfNovel(entry.review.novel));
      if (deduped.length >= targetCount) break;
    }
  }

  const hasMore = deduped.length > safeOffset + safeLimit || hasMoreRaw;

  return {
    novels: deduped.slice(safeOffset, safeOffset + safeLimit),
    hasMore,
  };
}
