import { db } from "@/lib/db";
import type { AdminCommentSummary } from "@/types/admin";

export async function getAdminComments(
  query?: string
): Promise<AdminCommentSummary[]> {
  const q = query?.trim();

  const comments = await db.comment.findMany({
    where: q
      ? { body: { contains: q, mode: "insensitive" } }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true, displayName: true } },
      review: { select: { id: true, title: true } },
    },
  });

  return comments.map((comment) => ({
    id: comment.id,
    body: comment.body,
    reviewId: comment.review.id,
    reviewTitle: comment.review.title,
    authorUsername: comment.user.username,
    authorDisplayName: comment.user.displayName,
    parentCommentId: comment.parentCommentId,
    createdAt: comment.createdAt.toISOString(),
  }));
}

export async function adminDeleteComment(commentId: string): Promise<void> {
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { reviewId: true, parentCommentId: true },
  });

  if (!comment) throw new Error("Comment not found.");

  await db.$transaction(async (tx) => {
    if (!comment.parentCommentId) {
      await tx.comment.deleteMany({
        where: { parentCommentId: commentId },
      });
    }

    await tx.comment.delete({ where: { id: commentId } });

    const count = await tx.comment.count({
      where: { reviewId: comment.reviewId },
    });

    await tx.review.update({
      where: { id: comment.reviewId },
      data: { commentCount: count },
    });
  });
}
