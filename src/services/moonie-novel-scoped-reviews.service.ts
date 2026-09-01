import { db } from "@/lib/db";
import { getInitials } from "@/lib/review-utils";
import {
  buildScopedNovelReviewWhere,
  mapReviewRowToRankedReview,
  novelReviewMetricLabel,
  NOVEL_SCOPED_REVIEW_SELECT,
  orderReviewsByMetric,
  type NovelReviewRankingMetric,
} from "@/lib/moonie/review-retrieval";
import {
  identifyNovels,
  resolveExactLookupNovelIds,
} from "@/services/moonie-identification.service";
import { buildNovelBundle } from "@/services/moonie-novel-lookup.service";
import { getUserByUsername } from "@/services/user.service";
import type {
  MoonieLookupSession,
  MoonieNovelOverview,
  MoonieRankedReview,
  MoonieRecommendResponse,
  MoonieReviewerResult,
  MoonieSpoilerMode,
} from "@/types/moonie";

const DEFAULT_LIST_COUNT = 10;

function formatReviewLink(reviewId: string): string {
  return `[Read full review](/reviews/${reviewId})`;
}

export function novelOverviewForScopedReviewResponse(options: {
  overview?: MoonieNovelOverview | null;
  explicitCountRequest?: boolean;
}): MoonieNovelOverview | undefined {
  if (options.explicitCountRequest) return undefined;
  return options.overview ?? undefined;
}

function buildWhoReviewedReply(options: {
  title: string;
  reviewers: Array<{ displayName: string; username?: string | null }>;
  totalPublicReviews?: number | null;
  sampledCount?: number;
}): string {
  if (options.reviewers.length === 0) {
    return `No public MoonVerse reviewers have posted reviews for **${options.title}** yet.`;
  }

  const totalPublic = options.totalPublicReviews ?? null;
  const sampled = options.sampledCount ?? options.reviewers.length;
  const totalNote =
    totalPublic != null && totalPublic > sampled
      ? ` (${sampled} shown from ${totalPublic} public review${totalPublic === 1 ? "" : "s"})`
      : "";

  return `${options.reviewers.length} unique MoonVerse reviewer${options.reviewers.length === 1 ? "" : "s"} reviewed **${options.title}**${totalNote}.`;
}

async function buildReviewerResultsFromRankedReviews(
  rankedReviews: MoonieRankedReview[]
): Promise<MoonieReviewerResult[]> {
  const seen = new Map<string, MoonieRankedReview>();
  for (const review of rankedReviews) {
    const key = review.reviewerUsername ?? review.reviewerName;
    if (!seen.has(key)) seen.set(key, review);
  }

  const results: MoonieReviewerResult[] = [];
  for (const review of seen.values()) {
    const username = review.reviewerUsername?.trim();
    if (username) {
      const profile = await getUserByUsername(username);
      if (profile) {
        results.push({
          id: profile.id,
          displayName: profile.displayName,
          username: profile.username,
          avatarInitials: getInitials(profile.displayName),
          avatarUrl: profile.avatarUrl,
          reviewCount: profile.reviewCount,
          followerCount: profile.followerCount,
        });
        continue;
      }
    }
    results.push({
      id: review.id,
      displayName: review.reviewerName,
      username: username ?? review.reviewerName,
      avatarInitials: getInitials(review.reviewerName),
      reviewCount: 0,
      followerCount: 0,
    });
  }
  return results;
}

export async function fetchNovelScopedReviews(options: {
  novelId: string;
  metric: NovelReviewRankingMetric;
  count: number;
  spoilerMode: MoonieSpoilerMode;
  spoilerFreeOnly?: boolean;
}): Promise<MoonieRankedReview[]> {
  const reviews = await db.review.findMany({
    where: buildScopedNovelReviewWhere({
      novelId: options.novelId,
      spoilerMode: options.spoilerMode,
      spoilerFreeOnly: options.spoilerFreeOnly,
    }),
    orderBy: orderReviewsByMetric(options.metric),
    take: options.count,
    select: NOVEL_SCOPED_REVIEW_SELECT,
  });

  return reviews
    .map((review) => mapReviewRowToRankedReview(review, options.spoilerMode))
    .filter((review): review is MoonieRankedReview => review != null);
}

export async function buildNovelScopedReviewsResponse(options: {
  novelId: string;
  title: string;
  overview?: MoonieNovelOverview | null;
  metric: NovelReviewRankingMetric;
  count: number;
  spoilerMode: MoonieSpoilerMode;
  spoilerFreeOnly?: boolean;
  whoReviewed?: boolean;
  lookupSession?: MoonieLookupSession;
  explicitCountRequest?: boolean;
}): Promise<MoonieRecommendResponse> {
  const rankedReviews = await fetchNovelScopedReviews({
    novelId: options.novelId,
    metric: options.metric,
    count: options.count,
    spoilerMode: options.spoilerMode,
    spoilerFreeOnly: options.spoilerFreeOnly,
  });
  const includeNovelOverview = novelOverviewForScopedReviewResponse({
    overview: options.overview,
    explicitCountRequest: options.explicitCountRequest,
  });

  if (rankedReviews.length === 0) {
    const spoilerNote = options.spoilerFreeOnly
      ? " spoiler-free"
      : options.spoilerMode === "none"
        ? " spoiler-free"
        : "";
    return {
      reply: `I could not find public${spoilerNote} MoonVerse reviews for **${options.title}**.`,
      recommendations: [],
      responseKind: "reviews",
      state: "no_results",
      emptyReason: "no_matches",
      rankedReviews: [],
      rankingMetric: options.metric,
      requestedCount: options.count,
      novelOverview: includeNovelOverview,
      explicitCountedReviews: options.explicitCountRequest ?? false,
      lookupSession: options.lookupSession,
      consumesQuota: true,
      spoilerMode: options.spoilerMode,
      analyticsIntent: "novel_reviews",
    };
  }

  let reply: string;
  if (options.whoReviewed) {
    const reviewerResults = await buildReviewerResultsFromRankedReviews(
      rankedReviews
    );
    reply = buildWhoReviewedReply({
      title: options.title,
      reviewers: reviewerResults.map((reviewer) => ({
        displayName: reviewer.displayName,
        username: reviewer.username,
      })),
      totalPublicReviews: options.overview?.community?.reviewCount ?? null,
      sampledCount: reviewerResults.length,
    });
    return {
      reply,
      recommendations: [],
      responseKind: "chat",
      reviewerResults,
      explicitCountedReviews: true,
      lookupSession: options.lookupSession,
      consumesQuota: true,
      spoilerMode: options.spoilerMode,
      analyticsIntent: "novel_reviews",
    };
  } else if (options.spoilerFreeOnly) {
    reply = `Here are ${rankedReviews.length} spoiler-free public review${rankedReviews.length === 1 ? "" : "s"} for **${options.title}**.`;
  } else if (options.count === 1) {
    const top = rankedReviews[0]!;
    reply = [
      `The ${novelReviewMetricLabel(options.metric)} public review for **${options.title}** is **${top.title}** by **${top.reviewerName}** · ★${top.rating}.`,
      formatReviewLink(top.id),
    ].join("\n\n");
  } else {
    reply = `Here are ${rankedReviews.length} public review${rankedReviews.length === 1 ? "" : "s"} for **${options.title}**, ranked by ${novelReviewMetricLabel(options.metric)}.`;
  }

  return {
    reply,
    recommendations: [],
    responseKind: "reviews",
    rankedReviews,
    rankingMetric: options.metric,
    requestedCount: options.count,
    novelOverview: includeNovelOverview,
    explicitCountedReviews: options.explicitCountRequest ?? false,
    lookupSession: options.lookupSession,
    consumesQuota: true,
    spoilerMode: options.spoilerMode,
    analyticsIntent: "novel_reviews",
  };
}

export async function buildNovelReviewsListResponse(options: {
  novelId: string;
  title: string;
  overview?: MoonieNovelOverview | null;
  spoilerMode: MoonieSpoilerMode;
  lookupSession?: MoonieLookupSession;
  metric?: NovelReviewRankingMetric;
  count?: number;
}): Promise<MoonieRecommendResponse> {
  const metric = options.metric ?? "review_recent";
  const count = options.count ?? DEFAULT_LIST_COUNT;
  const overview = options.overview ?? null;
  const reviewCount = overview?.community?.reviewCount ?? null;

  const rankedReviews = await fetchNovelScopedReviews({
    novelId: options.novelId,
    metric,
    count,
    spoilerMode: options.spoilerMode,
  });

  if (rankedReviews.length === 0) {
    return {
      reply: `There aren't any public MoonVerse reviews for **${options.title}** yet.`,
      recommendations: [],
      responseKind: "reviews",
      state: "no_results",
      emptyReason: "no_matches",
      rankedReviews: [],
      rankingMetric: metric,
      requestedCount: count,
      novelOverview: overview ?? undefined,
      lookupSession: options.lookupSession,
      consumesQuota: true,
      spoilerMode: options.spoilerMode,
      analyticsIntent: "novel_reviews",
    };
  }

  const ratingSuffix =
    overview?.community?.averageRating != null
      ? ` · ${overview.community.averageRating.toFixed(1)} average`
      : "";
  const totalSuffix =
    reviewCount != null && reviewCount > rankedReviews.length
      ? ` (showing ${rankedReviews.length} of ${reviewCount})`
      : "";

  return {
    reply: `Here are ${rankedReviews.length} public MoonVerse review${rankedReviews.length === 1 ? "" : "s"} for **${options.title}**${ratingSuffix}${totalSuffix}.`,
    recommendations: [],
    responseKind: "reviews",
    rankedReviews,
    rankingMetric: metric,
    requestedCount: count,
    novelOverview: overview ?? undefined,
    lookupSession: options.lookupSession,
    consumesQuota: true,
    spoilerMode: options.spoilerMode,
    analyticsIntent: "novel_reviews",
  };
}

function confirmedLookupSessionForNovel(options: {
  novelId: string;
  novelTitle: string;
}): MoonieLookupSession {
  return {
    mode: "confirmed",
    query: options.novelTitle,
    candidates: [
      {
        novelId: options.novelId,
        title: options.novelTitle,
        canonicalTitle: options.novelTitle,
        confidence: "high",
        confidenceScore: 1,
        evidence: [],
        genres: [],
        tags: [],
        reason: "Resolved for scoped review retrieval.",
      },
    ],
    confirmedNovelId: options.novelId,
    rejectedNovelIds: [],
    pendingIntent: "NOVEL_REVIEWS",
  };
}

export type ScopedNovelResolution =
  | {
      kind: "resolved";
      novelId: string;
      title: string;
      overview: MoonieNovelOverview;
      lookupSession: MoonieLookupSession;
    }
  | { kind: "clarification"; response: MoonieRecommendResponse }
  | { kind: "no_match"; response: MoonieRecommendResponse };

export async function resolveNovelForScopedReviewRequest(options: {
  novelQuery: string;
  userId?: string;
  spoilerMode: MoonieSpoilerMode;
}): Promise<ScopedNovelResolution> {
  const exactIds = await resolveExactLookupNovelIds(options.novelQuery);
  if (exactIds.length === 1) {
    const bundle = await buildNovelBundle({
      novelId: exactIds[0]!,
      userId: options.userId,
      spoilerMode: options.spoilerMode,
      reason: "Exact catalogue match for review request.",
    });
    if (!bundle.overview) {
      return {
        kind: "no_match",
        response: {
          reply: `I couldn't find **${options.novelQuery}** in the MoonVerse catalogue.`,
          recommendations: [],
          responseKind: "chat",
          consumesQuota: true,
          spoilerMode: options.spoilerMode,
        },
      };
    }
    return {
      kind: "resolved",
      novelId: bundle.overview.novelId,
      title: bundle.overview.title,
      overview: bundle.overview,
      lookupSession: confirmedLookupSessionForNovel({
        novelId: bundle.overview.novelId,
        novelTitle: bundle.overview.title,
      }),
    };
  }

  const identification = await identifyNovels({
    query: options.novelQuery,
    userId: options.userId,
    spoilerMode: options.spoilerMode,
    explicitTitleLookup: true,
    preferRawTitleQuery: true,
    pendingIntent: "NOVEL_REVIEWS",
  });

  if (identification.mode === "high_confidence" && identification.overview) {
    return {
      kind: "resolved",
      novelId: identification.overview.novelId,
      title: identification.overview.title,
      overview: identification.overview,
      lookupSession: {
        ...identification.session,
        mode: "confirmed",
        confirmedNovelId: identification.overview.novelId,
        pendingIntent: "NOVEL_REVIEWS",
      },
    };
  }

  if (
    identification.mode === "clarification" ||
    identification.mode === "partial_memory"
  ) {
    return {
      kind: "clarification",
      response: {
        reply: identification.reply,
        recommendations: [],
        lookupSession: identification.session,
        responseKind:
          identification.candidates.length > 0 ? "novel_bundle" : "chat",
        followUpQuestion: identification.followUpQuestion,
        consumesQuota: true,
        spoilerMode: options.spoilerMode,
      },
    };
  }

  return {
    kind: "no_match",
    response: {
      reply: identification.reply,
      recommendations: [],
      lookupSession: identification.session,
      responseKind: "chat",
      followUpQuestion: identification.followUpQuestion,
      consumesQuota: identification.consumesQuota ?? false,
      spoilerMode: options.spoilerMode,
    },
  };
}
