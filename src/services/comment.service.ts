import { ContentModerationStatus, NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { checkContentModeration } from "@/lib/moderation";
import { getInitials } from "@/lib/review-utils";
import { validateCommentBody } from "@/lib/validation";
import { createNotification } from "@/services/notification.service";
import type { CommentItem } from "@/types/review";

const commentInclude = {
  user: {
    select: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
    },
  },
} as const;

type CommentWithUser = {
  id: string;
  reviewId: string;
  userId: string;
  parentCommentId: string | null;
  body: string;
  containsSpoilers: boolean;
  moderationStatus: ContentModerationStatus;
  createdAt: Date;
  likeCount: number;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
};

function mapComment(
  comment: CommentWithUser,
  likedByMe = false
): CommentItem {
  return {
    id: comment.id,
    reviewId: comment.reviewId,
    userId: comment.userId,
    authorName: comment.user.displayName,
    authorUsername: comment.user.username,
    authorAvatar: getInitials(comment.user.displayName),
    authorAvatarUrl: comment.user.avatarUrl ?? undefined,
    body: comment.body,
    containsSpoilers: comment.containsSpoilers,
    moderationStatus: comment.moderationStatus,
    createdAt: comment.createdAt.toISOString(),
    parentCommentId: comment.parentCommentId ?? undefined,
    likeCount: comment.likeCount,
    likedByMe,
    replies: [],
  };
}

export async function getCommentsByReviewId(
  reviewId: string,
  viewerId?: string
): Promise<CommentItem[]> {
  const comments = await db.comment.findMany({
    where: {
      reviewId,
      moderationStatus: { not: ContentModerationStatus.HIDDEN },
    },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });

  const likedIds = new Set<string>();
  if (viewerId && comments.length > 0) {
    const likes = await db.commentLike.findMany({
      where: {
        userId: viewerId,
        commentId: { in: comments.map((comment) => comment.id) },
      },
      select: { commentId: true },
    });
    for (const like of likes) likedIds.add(like.commentId);
  }

  const mapped = comments.map((comment) =>
    mapComment(comment, likedIds.has(comment.id))
  );
  const topLevel = mapped.filter((comment) => !comment.parentCommentId);

  for (const comment of topLevel) {
    comment.replies = mapped.filter(
      (candidate) => candidate.parentCommentId === comment.id
    );
  }

  return topLevel;
}

export interface CreateCommentInput {
  reviewId: string;
  userId: string;
  body: string;
  parentCommentId?: string;
  containsSpoilers?: boolean;
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
    select: {
      id: true,
      userId: true,
      title: true,
      novelId: true,
      novel: { select: { title: true, coverUrl: true } },
    },
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
    select: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
    },
  });

  const { status: moderationStatus } = checkContentModeration(body);

  const comment = await db.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: {
        reviewId: input.reviewId,
        userId: input.userId,
        body,
        parentCommentId: input.parentCommentId,
        containsSpoilers: Boolean(input.containsSpoilers),
        moderationStatus,
      },
      include: commentInclude,
    });

    await tx.review.update({
      where: { id: input.reviewId },
      data: { commentCount: { increment: 1 } },
    });

    return created;
  });

  const notificationMetadata = {
    actorDisplayName: commenter?.displayName,
    actorUsername: commenter?.username,
    actorAvatarUrl: commenter?.avatarUrl,
    reviewId: review.id,
    reviewTitle: review.title,
    novelId: review.novelId,
    novelTitle: review.novel.title,
    coverUrl: review.novel.coverUrl,
    snippet: body.slice(0, 120),
    commentId: comment.id,
  };

  if (!input.parentCommentId) {
    if (review.userId !== input.userId) {
      await createNotification({
        userId: review.userId,
        type: NotificationType.COMMENT_ON_REVIEW,
        message: `${commenter?.displayName ?? "Someone"} commented on your review "${review.title}"`,
        link: `/reviews/${input.reviewId}#comment-${comment.id}`,
        actorId: commenter?.id,
        metadata: notificationMetadata,
      });
    }
  } else if (parentComment && parentComment.userId !== input.userId) {
    await createNotification({
      userId: parentComment.userId,
      type: NotificationType.COMMENT_REPLY,
      message: `${commenter?.displayName ?? "Someone"} replied to your comment`,
      link: `/reviews/${input.reviewId}#comment-${comment.id}`,
      actorId: commenter?.id,
      metadata: notificationMetadata,
    });
  }

  return mapComment(comment, false);
}

export async function updateComment(
  commentId: string,
  userId: string,
  body: string
): Promise<CommentItem> {
  const nextBody = body.trim();
  const bodyError = validateCommentBody(nextBody);
  if (bodyError) {
    throw new Error(bodyError);
  }

  const existing = await db.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!existing) {
    throw new Error("Comment not found.");
  }
  if (existing.userId !== userId) {
    throw new Error("You can only edit your own comments.");
  }

  const { status: moderationStatus } = checkContentModeration(nextBody);
  const updated = await db.comment.update({
    where: { id: commentId },
    data: { body: nextBody, moderationStatus },
    include: commentInclude,
  });

  return mapComment(updated);
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
): Promise<{ decrementBy: number }> {
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

  return { decrementBy };
}

export async function toggleCommentLike(
  userId: string,
  commentId: string
): Promise<{ liked: boolean; likeCount: number }> {
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });

  if (!comment) {
    throw new Error("Comment not found.");
  }

  const existing = await db.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (existing) {
    const updated = await db.$transaction(async (tx) => {
      await tx.commentLike.delete({
        where: { userId_commentId: { userId, commentId } },
      });
      return tx.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
    });
    return { liked: false, likeCount: Math.max(0, updated.likeCount) };
  }

  const updated = await db.$transaction(async (tx) => {
    await tx.commentLike.create({
      data: { userId, commentId },
    });
    return tx.comment.update({
      where: { id: commentId },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });
  });

  return { liked: true, likeCount: updated.likeCount };
}
