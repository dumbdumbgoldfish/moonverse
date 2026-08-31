import type { Prisma } from "@prisma/client";
import type {
  MoonieRecommendResponse,
  MoonieResponseState,
  MoonieSpoilerMode,
} from "@/types/moonie";
import {
  DEFAULT_SPOILER_MODE,
  sanitizeStoredRankedReviewsForMode,
} from "@/lib/moonie/spoiler-mode";

export function pickStoredMoonieMetaField<T>(
  meta: Record<string, unknown>,
  key: string
): T | undefined {
  const direct = meta[key];
  if (direct !== undefined) return direct as T;
  const nested =
    meta.response && typeof meta.response === "object"
      ? (meta.response as Record<string, unknown>)
      : null;
  if (nested && nested[key] !== undefined) {
    return nested[key] as T;
  }
  return undefined;
}

/** Restore assistant display fields from persisted meta, including legacy nested-only rows. */
export function hydrateStoredAssistantMeta(
  meta: Record<string, unknown>
): {
  recommendations: import("@/types/moonie").MoonieRecommendation[] | undefined;
  responseKind: import("@/types/moonie").MoonieResponseKind | undefined;
  analyticsIntent: string | undefined;
  novelOverview: import("@/types/moonie").MoonieNovelOverview | undefined;
  novelReviewGroups:
    | import("@/types/moonie").MoonieNovelReviewGroup[]
    | undefined;
  compare: import("@/types/moonie").MoonieCompareResult | undefined;
  lookupSession: import("@/types/moonie").MoonieLookupSession | undefined;
  interpretedPreferences:
    | import("@/types/moonie").MoonieInterpretedPreferences
    | undefined;
  reviewerResults: import("@/types/moonie").MoonieReviewerResult[] | undefined;
  reviewerSession: import("@/types/moonie").MoonieReviewerSession | undefined;
  reviewerOverview:
    | import("@/types/moonie").MoonieReviewerOverview
    | undefined;
  reviewerGroupOverview:
    | import("@/types/moonie").MoonieReviewerGroupOverview
    | undefined;
  reviewerReviewSession:
    | import("@/types/moonie").MoonieReviewerReviewSession
    | undefined;
  seriesInfo: import("@/types/moonie").MoonieSeriesInfo | undefined;
  followUpQuestion: string | undefined;
  state: MoonieResponseState | undefined;
  emptyReason: import("@/types/moonie").MoonieEmptyReason | undefined;
  pendingClarification:
    | import("@/types/moonie").MooniePendingClarification
    | undefined;
  rankedReviews: import("@/types/moonie").MoonieRankedReview[] | undefined;
  catalogueStat: import("@/types/moonie").MoonieCatalogueStat | undefined;
  rankingMetric: import("@/types/moonie").MoonieRankingMetric | undefined;
  requestedCount: number | undefined;
} {
  const analyticsIntent =
    typeof pickStoredMoonieMetaField<string>(meta, "analyticsIntent") === "string"
      ? pickStoredMoonieMetaField<string>(meta, "analyticsIntent")
      : typeof meta.intent === "string"
        ? meta.intent
        : undefined;
  const spoilerMode =
    pickStoredMoonieMetaField<MoonieSpoilerMode>(meta, "spoilerMode") ??
    DEFAULT_SPOILER_MODE;
  const rankedReviews = sanitizeStoredRankedReviewsForMode(
    pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieRankedReview[]
    >(meta, "rankedReviews"),
    spoilerMode
  );

  return {
    recommendations: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieRecommendation[]
    >(meta, "recommendations"),
    responseKind: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieResponseKind
    >(meta, "responseKind"),
    analyticsIntent,
    novelOverview: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieNovelOverview
    >(meta, "novelOverview"),
    novelReviewGroups: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieNovelReviewGroup[]
    >(meta, "novelReviewGroups"),
    compare: pickStoredMoonieMetaField<import("@/types/moonie").MoonieCompareResult>(
      meta,
      "compare"
    ),
    lookupSession: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieLookupSession
    >(meta, "lookupSession"),
    interpretedPreferences: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieInterpretedPreferences
    >(meta, "interpretedPreferences"),
    reviewerResults: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieReviewerResult[]
    >(meta, "reviewerResults"),
    reviewerSession: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieReviewerSession
    >(meta, "reviewerSession"),
    reviewerOverview: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieReviewerOverview
    >(meta, "reviewerOverview"),
    reviewerGroupOverview: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieReviewerGroupOverview
    >(meta, "reviewerGroupOverview"),
    reviewerReviewSession: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieReviewerReviewSession
    >(meta, "reviewerReviewSession"),
    seriesInfo: pickStoredMoonieMetaField<import("@/types/moonie").MoonieSeriesInfo>(
      meta,
      "seriesInfo"
    ),
    followUpQuestion:
      typeof pickStoredMoonieMetaField<string>(meta, "followUpQuestion") ===
      "string"
        ? pickStoredMoonieMetaField<string>(meta, "followUpQuestion")
        : undefined,
    state: pickStoredMoonieMetaField<MoonieResponseState>(meta, "state"),
    emptyReason: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieEmptyReason
    >(meta, "emptyReason"),
    pendingClarification: pickStoredMoonieMetaField<
      import("@/types/moonie").MooniePendingClarification
    >(meta, "pendingClarification"),
    rankedReviews,
    catalogueStat: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieCatalogueStat
    >(meta, "catalogueStat"),
    rankingMetric: pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieRankingMetric
    >(meta, "rankingMetric"),
    requestedCount: pickStoredMoonieMetaField<number>(meta, "requestedCount"),
  };
}

/** Structured assistant fields persisted for desk history restoration. */
export function buildPersistedAssistantMeta(
  result: MoonieRecommendResponse,
  clientTurnId?: string
): Prisma.InputJsonValue {
  return {
    recommendations: result.recommendations,
    interpretedPreferences: result.interpretedPreferences,
    novelOverview: result.novelOverview,
    novelReviewGroups: result.novelReviewGroups,
    compare: result.compare,
    responseKind: result.responseKind,
    spoilerMode: result.spoilerMode,
    lookupSession: result.lookupSession,
    reviewerResults: result.reviewerResults,
    reviewerSession: result.reviewerSession,
    reviewerOverview: result.reviewerOverview,
    reviewerGroupOverview: result.reviewerGroupOverview,
    reviewerReviewSession: result.reviewerReviewSession,
    seriesInfo: result.seriesInfo,
    analyticsIntent: result.analyticsIntent,
    followUpQuestion: result.followUpQuestion,
    state: result.state,
    emptyReason: result.emptyReason,
    pendingClarification: result.pendingClarification,
    rankedReviews: result.rankedReviews,
    catalogueStat: result.catalogueStat,
    rankingMetric: result.rankingMetric,
    requestedCount: result.requestedCount,
    clientTurnId,
    response: result,
  } as unknown as Prisma.InputJsonValue;
}
