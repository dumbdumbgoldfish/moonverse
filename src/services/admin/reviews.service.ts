import { ContentModerationStatus, Prisma } from "@prisma/client";
import { ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-styles";
import { db } from "@/lib/db";
import type { AdminListPage, AdminReviewSummary } from "@/types/admin";

export interface AdminReviewFilters {
  query?: string;
  rating?: number;
  moderationStatus?: ContentModerationStatus;
}

function buildReviewWhere(filters: AdminReviewFilters): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = {};

  if (filters.rating) {
    where.rating = filters.rating;
  }

  if (filters.moderationStatus) {
    where.moderationStatus = filters.moderationStatus;
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { novel: { title: { contains: q, mode: "insensitive" } } },
      { user: { username: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

export async function getAdminReviews(
  filters: AdminReviewFilters = {},
  page = 1,
  pageSize = ADMIN_LIST_PAGE_SIZE
): Promise<AdminListPage<AdminReviewSummary>> {
  const where = buildReviewWhere(filters);
  const safePage = Math.max(1, page);
  const [total, reviews] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { username: true } },
        novel: { select: { title: true } },
      },
    }),
  ]);

  return {
    items: reviews.map((review) => ({
      id: review.id,
      title: review.title,
      rating: review.rating,
      novelTitle: review.novel.title,
      reviewerUsername: review.user.username,
      likeCount: review.likeCount,
      commentCount: review.commentCount,
      saveCount: review.saveCount,
      shareCount: review.shareCount,
      moderationStatus: review.moderationStatus,
      createdAt: review.createdAt.toISOString(),
    })),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminReviewById(
  reviewId: string
): Promise<(AdminReviewSummary & { body: string }) | null> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: {
      user: { select: { username: true } },
      novel: { select: { title: true } },
    },
  });

  if (!review) return null;

  return {
    id: review.id,
    title: review.title,
    body: review.body,
    rating: review.rating,
    novelTitle: review.novel.title,
    reviewerUsername: review.user.username,
    likeCount: review.likeCount,
    commentCount: review.commentCount,
    saveCount: review.saveCount,
    shareCount: review.shareCount,
    moderationStatus: review.moderationStatus,
    createdAt: review.createdAt.toISOString(),
  };
}

export async function adminDeleteReview(reviewId: string): Promise<void> {
  await db.review.delete({ where: { id: reviewId } });
}

export async function adminSetReviewModerationStatus(
  reviewId: string,
  moderationStatus: ContentModerationStatus
): Promise<void> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true },
  });
  if (!review) throw new Error("Review not found.");

  await db.review.update({
    where: { id: reviewId },
    data: { moderationStatus },
  });
}
