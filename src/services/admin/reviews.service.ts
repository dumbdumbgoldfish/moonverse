import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { AdminReviewSummary } from "@/types/admin";

export interface AdminReviewFilters {
  query?: string;
  rating?: number;
}

function buildReviewWhere(filters: AdminReviewFilters): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = {};

  if (filters.rating) {
    where.rating = filters.rating;
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
  filters: AdminReviewFilters = {}
): Promise<AdminReviewSummary[]> {
  const reviews = await db.review.findMany({
    where: buildReviewWhere(filters),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true } },
      novel: { select: { title: true } },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    title: review.title,
    rating: review.rating,
    novelTitle: review.novel.title,
    reviewerUsername: review.user.username,
    likeCount: review.likeCount,
    commentCount: review.commentCount,
    saveCount: review.saveCount,
    shareCount: review.shareCount,
    createdAt: review.createdAt.toISOString(),
  }));
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
    createdAt: review.createdAt.toISOString(),
  };
}

export async function adminDeleteReview(reviewId: string): Promise<void> {
  await db.review.delete({ where: { id: reviewId } });
}
