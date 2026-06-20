import { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  excerpt,
  getInitials,
  resolveCoverUrl,
} from "@/lib/review-utils";
import { validateFolderName } from "@/lib/validation";
import { createNotification } from "@/services/notification.service";
import type {
  CreateFolderInput,
  FolderDetail,
  FolderListItem,
  UpdateFolderInput,
} from "@/types/folder";
import type { ReviewListItem } from "@/types/review";

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
  return {
    id: review.id,
    title: review.title,
    excerpt: excerpt(review.body),
    rating: review.rating,
    likeCount: review.likeCount,
    novelId: review.novel.id,
    novelTitle: review.novel.title,
    novelAuthor: review.novel.author ?? "Unknown",
    coverUrl: resolveCoverUrl(review.novel.coverUrl),
    reviewerName: review.user.displayName,
    reviewerUsername: review.user.username,
    reviewerAvatar: getInitials(review.user.displayName),
    genres: review.novel.genres.map((g) => g.name),
    createdAt: review.createdAt.toISOString(),
  };
}

function mapFolderToListItem(
  folder: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    createdAt: Date;
    _count: { reviews: number };
  }
): FolderListItem {
  return {
    id: folder.id,
    name: folder.name,
    description: folder.description,
    isPublic: folder.isPublic,
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
      select: { displayName: true, username: true },
    });

    const saverLabel = saver?.displayName ?? "Someone";
    await createNotification({
      userId: review.userId,
      type: NotificationType.REVIEW_SAVED,
      message: `Your review was saved to ${folder.name} by ${saverLabel}`,
      link: `/reviews/${reviewId}`,
    });
  }

  return { added: true, saveCount: updatedReview.saveCount };
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
