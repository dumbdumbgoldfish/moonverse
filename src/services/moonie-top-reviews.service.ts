import { db } from "@/lib/db";
import {
  buildCatalogueReviewWhere,
  mapReviewRowToRankedReview,
  NOVEL_SCOPED_REVIEW_SELECT,
  orderReviewsByMetric,
} from "@/lib/moonie/review-retrieval";
import type {
  MooniePendingClarification,
  MoonieRankedReview,
  MoonieRankingMetric,
  MoonieRecommendResponse,
  MoonieSpoilerMode,
} from "@/types/moonie";

function orderByMetric(
  metric: Extract<
    MoonieRankingMetric,
    "review_rating" | "review_helpful" | "review_recent"
  >
) {
  return orderReviewsByMetric(metric);
}

function metricLabel(
  metric: Extract<
    MoonieRankingMetric,
    "review_rating" | "review_helpful" | "review_recent"
  >
): string {
  if (metric === "review_rating") return "highest rated";
  if (metric === "review_helpful") return "most helpful";
  return "most recent";
}

export function buildTopReviewsRankingClarification(options: {
  count: number;
  amongThese: boolean;
}): MoonieRecommendResponse {
  const pending: MooniePendingClarification = {
    kind: "review_ranking",
    count: options.count,
    amongThese: options.amongThese,
  };
  return {
    reply: options.amongThese
      ? `I can show the top ${options.count} public reviews among the novels already in this thread. How should I rank them: highest rated, most recent, or most helpful?`
      : `I can show the top ${options.count} public MoonVerse reviews. How should I rank them: highest rated, most recent, or most helpful?`,
    recommendations: [],
    responseKind: "chat",
    pendingClarification: pending,
    requestedCount: options.count,
    rankingMetric: null,
    quickPrompts: ["Highest rated", "Most recent", "Most helpful"],
    consumesQuota: false,
    analyticsIntent: "top_reviews",
  };
}

export async function buildTopReviewsResponse(options: {
  count: number;
  metric: Extract<
    MoonieRankingMetric,
    "review_rating" | "review_helpful" | "review_recent"
  >;
  amongNovelIds?: string[];
  amongThese: boolean;
  spoilerMode: MoonieSpoilerMode;
}): Promise<MoonieRecommendResponse> {
  const reviews = await db.review.findMany({
    where: {
      ...buildCatalogueReviewWhere(options.spoilerMode),
      ...(options.amongNovelIds?.length
        ? { novelId: { in: options.amongNovelIds } }
        : {}),
    },
    orderBy: orderByMetric(options.metric),
    take: options.count,
    select: NOVEL_SCOPED_REVIEW_SELECT,
  });

  if (reviews.length === 0) {
    return {
      reply: options.amongThese
        ? "None of the novels already shown in this thread have public MoonVerse reviews yet."
        : "I could not find public MoonVerse reviews to rank.",
      recommendations: [],
      responseKind: "reviews",
      state: "no_results",
      emptyReason: "no_matches",
      rankingMetric: options.metric,
      requestedCount: options.count,
      rankedReviews: [],
      consumesQuota: true,
      spoilerMode: options.spoilerMode,
      analyticsIntent: "top_reviews",
    };
  }

  const rankedReviews: MoonieRankedReview[] = reviews
    .map((review) => mapReviewRowToRankedReview(review, options.spoilerMode))
    .filter((review): review is MoonieRankedReview => review != null);

  const scope = options.amongThese
    ? " among the novels already shown in this thread"
    : "";

  return {
    reply: `Here are the top ${rankedReviews.length} public MoonVerse reviews${scope}, ranked by ${metricLabel(options.metric)}.`,
    recommendations: [],
    responseKind: "reviews",
    rankedReviews,
    rankingMetric: options.metric,
    requestedCount: options.count,
    consumesQuota: true,
    spoilerMode: options.spoilerMode,
    analyticsIntent: "top_reviews",
  };
}
