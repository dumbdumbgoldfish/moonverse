import { ContentModerationStatus, Prisma } from "@prisma/client";
import { ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-styles";
import { db } from "@/lib/db";
import type { AdminCommentSummary, AdminListPage } from "@/types/admin";

export interface AdminCommentFilters {
  query?: string;
  moderationStatus?: ContentModerationStatus;
}

export async function getAdminComments(
  filters: AdminCommentFilters | string = {},
  page = 1,
  pageSize = ADMIN_LIST_PAGE_SIZE
): Promise<AdminListPage<AdminCommentSummary>> {
  const normalized: AdminCommentFilters =
    typeof filters === "string" ? { query: filters } : filters;
  const q = normalized.query?.trim();

  const where: Prisma.CommentWhereInput = {
    ...(q ? { body: { contains: q, mode: "insensitive" } } : {}),
    ...(normalized.moderationStatus
      ? { moderationStatus: normalized.moderationStatus }
      : {}),
  };

  const safePage = Math.max(1, page);
  const [total, comments] = await Promise.all([
    db.comment.count({ where }),
    db.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { username: true, displayName: true } },
        review: { select: { id: true, title: true } },
      },
    }),
  ]);

  return {
    items: comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      reviewId: comment.review.id,
      reviewTitle: comment.review.title,
      authorUsername: comment.user.username,
      authorDisplayName: comment.user.displayName,
      parentCommentId: comment.parentCommentId,
      moderationStatus: comment.moderationStatus,
      createdAt: comment.createdAt.toISOString(),
    })),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
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

export async function adminSetCommentModerationStatus(
  commentId: string,
  moderationStatus: ContentModerationStatus
): Promise<void> {
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (!comment) throw new Error("Comment not found.");

  await db.comment.update({
    where: { id: commentId },
    data: { moderationStatus },
  });
}
