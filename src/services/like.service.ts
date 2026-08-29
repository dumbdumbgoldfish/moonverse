import { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { createNotification } from "@/services/notification.service";

export async function isLikedByUser(
  userId: string,
  reviewId: string
): Promise<boolean> {
  const like = await db.like.findUnique({
    where: {
      userId_reviewId: { userId, reviewId },
    },
  });
  return !!like;
}

export async function toggleLike(
  userId: string,
  reviewId: string
): Promise<{ liked: boolean; likeCount: number }> {
  const existing = await db.like.findUnique({
    where: {
      userId_reviewId: { userId, reviewId },
    },
  });

  if (existing) {
    const review = await db.$transaction(async (tx) => {
      await tx.like.delete({
        where: { userId_reviewId: { userId, reviewId } },
      });
      return tx.review.update({
        where: { id: reviewId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
    });

    return { liked: false, likeCount: review.likeCount };
  }

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      userId: true,
      title: true,
      novelId: true,
      novel: { select: { title: true, coverUrl: true } },
    },
  });

  if (!review) {
    throw new Error("Review not found.");
  }

  const updated = await db.$transaction(async (tx) => {
    await tx.like.create({
      data: { userId, reviewId },
    });
    return tx.review.update({
      where: { id: reviewId },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });
  });

  if (review.userId !== userId) {
    const liker = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true, username: true, avatarUrl: true },
    });

    await createNotification({
      userId: review.userId,
      type: NotificationType.REVIEW_LIKE,
      message: `${liker?.displayName ?? "Someone"} liked your review "${review.title}"`,
      link: `/reviews/${reviewId}`,
      actorId: liker?.id,
      metadata: {
        actorDisplayName: liker?.displayName,
        actorUsername: liker?.username,
        actorAvatarUrl: liker?.avatarUrl,
        reviewId,
        reviewTitle: review.title,
        novelId: review.novelId,
        novelTitle: review.novel.title,
        coverUrl: review.novel.coverUrl,
      },
    });
  }

  return { liked: true, likeCount: updated.likeCount };
}

export async function incrementShareCount(reviewId: string): Promise<number> {
  const review = await db.review.update({
    where: { id: reviewId },
    data: { shareCount: { increment: 1 } },
    select: { shareCount: true },
  });
  return review.shareCount;
}
