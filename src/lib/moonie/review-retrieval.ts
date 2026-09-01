import { ContentModerationStatus, type Prisma } from "@prisma/client";
import {
  sanitizeReviewExcerpt,
  sanitizeReviewTitleForMode,
} from "@/lib/moonie/spoiler-mode";
import type {
  MoonieRankedReview,
  MoonieRankingMetric,
  MoonieSpoilerMode,
} from "@/types/moonie";

export const PUBLIC_OK_REVIEW_WHERE = {
  moderationStatus: ContentModerationStatus.OK,
} as const;

export type NovelReviewRankingMetric = Extract<
  MoonieRankingMetric,
  "review_rating" | "review_helpful" | "review_recent" | "review_oldest"
>;

export function buildScopedNovelReviewWhere(options: {
  novelId: string;
  spoilerMode: MoonieSpoilerMode;
  spoilerFreeOnly?: boolean;
}): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = {
    novelId: options.novelId,
    ...PUBLIC_OK_REVIEW_WHERE,
  };

  if (options.spoilerFreeOnly || options.spoilerMode === "none") {
    where.containsSpoilers = false;
  }

  return where;
}

export function buildCatalogueReviewWhere(
  spoilerMode: MoonieSpoilerMode
): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = { ...PUBLIC_OK_REVIEW_WHERE };
  if (spoilerMode === "none") {
    where.containsSpoilers = false;
  }
  return where;
}

export function orderReviewsByMetric(
  metric: NovelReviewRankingMetric
): Prisma.ReviewOrderByWithRelationInput[] {
  if (metric === "review_rating") {
    return [{ rating: "desc" }, { likeCount: "desc" }, { createdAt: "desc" }];
  }
  if (metric === "review_helpful") {
    return [{ likeCount: "desc" }, { createdAt: "desc" }];
  }
  if (metric === "review_oldest") {
    return [{ createdAt: "asc" }, { id: "asc" }];
  }
  return [{ createdAt: "desc" }];
}

export function novelReviewMetricLabel(metric: NovelReviewRankingMetric): string {
  if (metric === "review_rating") return "highest rated";
  if (metric === "review_helpful") return "most liked";
  if (metric === "review_oldest") return "oldest";
  return "most recent";
}

type ReviewRow = {
  id: string;
  title: string;
  body: string;
  rating: number;
  containsSpoilers: boolean;
  likeCount: number;
  commentCount: number;
  novel: { id: string; title: string };
  user: { displayName: string | null; username: string | null };
};

export function mapReviewRowToRankedReview(
  review: ReviewRow,
  spoilerMode: MoonieSpoilerMode
): MoonieRankedReview | null {
  const excerpt =
    sanitizeReviewExcerpt({
      title: review.title,
      body: review.body,
      containsSpoilers: review.containsSpoilers,
      mode: spoilerMode,
    }) ??
    (review.containsSpoilers
      ? "This review is marked as containing spoilers."
      : "");

  if (!excerpt && spoilerMode === "none" && review.containsSpoilers) {
    return null;
  }

  return {
    id: review.id,
    title: sanitizeReviewTitleForMode({
      title: review.title,
      containsSpoilers: review.containsSpoilers,
      mode: spoilerMode,
    }),
    excerpt,
    rating: review.rating,
    reviewerName:
      review.user.displayName?.trim() || review.user.username || "Reader",
    reviewerUsername: review.user.username,
    novelId: review.novel.id,
    novelTitle: review.novel.title,
    containsSpoilers: review.containsSpoilers,
    likeCount: review.likeCount,
    commentCount: review.commentCount,
  };
}

export const NOVEL_SCOPED_REVIEW_SELECT = {
  id: true,
  title: true,
  body: true,
  rating: true,
  containsSpoilers: true,
  likeCount: true,
  commentCount: true,
  novel: { select: { id: true, title: true } },
  user: { select: { displayName: true, username: true } },
} as const;
