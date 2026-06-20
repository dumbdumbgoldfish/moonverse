import { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { getInitials } from "@/lib/review-utils";
import { validateCommentBody } from "@/lib/validation";
import { createNotification } from "@/services/notification.service";
import type { CommentItem } from "@/types/review";

const commentInclude = {
  user: {
    select: {
      id: true,
      displayName: true,
    },
  },
} as const;

type CommentWithUser = {
  id: string;
  reviewId: string;
  userId: string;
  parentCommentId: string | null;
  body: string;
  createdAt: Date;
  user: { id: string; displayName: string };
};

function mapComment(comment: CommentWithUser): CommentItem {
  return {
    id: comment.id,
    reviewId: comment.reviewId,
    userId: comment.userId,
    authorName: comment.user.displayName,
    authorAvatar: getInitials(comment.user.displayName),
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    parentCommentId: comment.parentCommentId ?? undefined,
    replies: [],
  };
}

export async function getCommentsByReviewId(
  reviewId: string
): Promise<CommentItem[]> {
  const comments = await db.comment.findMany({
    where: { reviewId },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });

  const mapped = comments.map(mapComment);
  const topLevel = mapped.filter((c) => !c.parentCommentId);

  for (const comment of topLevel) {
    comment.replies = mapped.filter((c) => c.parentCommentId === comment.id);
  }

  return topLevel;
}

export interface CreateCommentInput {
  reviewId: string;
  userId: string;
  body: string;
  parentCommentId?: string;
}

export async function createComment(
  input: CreateCommentInput
): Promise<CommentItem> {
  const body = input.body.trim();
  const bodyError = validateCommentBody(body);
  if (bodyError) {
    throw new Error(bodyError);
  }

  const review = await db.review.findUnique({
    where: { id: input.reviewId },
    select: { id: true, userId: true, title: true },
  });

  if (!review) {
    throw new Error("Review not found.");
  }

  let parentComment: CommentWithUser | null = null;

  if (input.parentCommentId) {
    parentComment = await db.comment.findUnique({
      where: { id: input.parentCommentId },
      include: commentInclude,
    });

    if (!parentComment || parentComment.reviewId !== input.reviewId) {
      throw new Error("Parent comment not found.");
    }

    if (parentComment.parentCommentId) {
      throw new Error("Replies are limited to one level.");
    }
  }

  const commenter = await db.user.findUnique({
    where: { id: input.userId },
    select: { displayName: true },
  });

  const comment = await db.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: {
        reviewId: input.reviewId,
        userId: input.userId,
        body,
        parentCommentId: input.parentCommentId,
      },
      include: commentInclude,
    });

    await tx.review.update({
      where: { id: input.reviewId },
      data: { commentCount: { increment: 1 } },
    });

    return created;
  });

  if (!input.parentCommentId) {
    if (review.userId !== input.userId) {
      await createNotification({
        userId: review.userId,
        type: NotificationType.COMMENT_ON_REVIEW,
        message: `${commenter?.displayName ?? "Someone"} commented on your review "${review.title}"`,
        link: `/reviews/${input.reviewId}#comments`,
      });
    }
  } else if (parentComment && parentComment.userId !== input.userId) {
    await createNotification({
      userId: parentComment.userId,
      type: NotificationType.COMMENT_REPLY,
      message: `${commenter?.displayName ?? "Someone"} replied to your comment`,
      link: `/reviews/${input.reviewId}#comments`,
    });
  }

  return mapComment(comment);
}

export async function userOwnsComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });
  return comment?.userId === userId;
}

export async function deleteComment(
  commentId: string,
  userId: string
): Promise<void> {
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      reviewId: true,
      _count: { select: { replies: true } },
    },
  });

  if (!comment) {
    throw new Error("Comment not found.");
  }

  if (comment.userId !== userId) {
    throw new Error("You can only delete your own comments.");
  }

  const decrementBy = 1 + comment._count.replies;

  await db.$transaction(async (tx) => {
    await tx.comment.delete({ where: { id: commentId } });
    await tx.review.update({
      where: { id: comment.reviewId },
      data: { commentCount: { decrement: decrementBy } },
    });
  });
}
