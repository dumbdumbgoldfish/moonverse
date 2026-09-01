import {
  isReviewAuthorFollowUpMessage,
  normalizeLookupQueryText,
  resolveOrdinalIndex,
} from "@/lib/moonie/intent";

export { isReviewAuthorFollowUpMessage } from "@/lib/moonie/intent";
import {
  buildRankedReviewSessionFromMeta,
  type MoonieRankedReviewSession,
} from "@/lib/moonie/ranked-review-context";
import { pickStoredMoonieMetaField } from "@/lib/moonie/persist-assistant-turn";
import type {
  MoonieRankedReview,
  MoonieRecommendation,
  MoonieReviewerResult,
  MoonieReviewerSession,
} from "@/types/moonie";

export type MoonieFollowUpResultKind =
  | "recommendation_list"
  | "review_list"
  | "single_review"
  | "reviewer"
  | "novel_lookup";

export interface MoonieTypedTurnResult {
  kind: MoonieFollowUpResultKind;
  messageIndex: number;
  recommendations?: MoonieRecommendation[];
  rankedReviewSession?: MoonieRankedReviewSession | null;
  singleReview?: MoonieRankedReview | null;
  reviewerSession?: MoonieReviewerSession | null;
  activeReviewer?: MoonieReviewerResult | null;
}

export interface MoonieTypedConversationContext {
  lastRecommendationList: MoonieTypedTurnResult | null;
  lastReviewList: MoonieTypedTurnResult | null;
  lastSingleReview: MoonieTypedTurnResult | null;
  lastReviewer: MoonieTypedTurnResult | null;
  /** Most recent assistant result of any kind (for debugging / recency). */
  lastResult: MoonieTypedTurnResult | null;
}

interface StoredMessage {
  role: string;
  content: string;
  meta?: unknown;
}

function asStoredMetaRecord(meta: unknown): Record<string, unknown> | null {
  if (!meta || typeof meta !== "object") return null;
  return meta as Record<string, unknown>;
}

function recommendationsFromMeta(meta: unknown): MoonieRecommendation[] {
  const record = asStoredMetaRecord(meta);
  if (!record) return [];
  const recs = pickStoredMoonieMetaField<MoonieRecommendation[]>(
    record,
    "recommendations"
  );
  return Array.isArray(recs) ? recs : [];
}

function rankedReviewsFromMeta(meta: unknown): MoonieRankedReview[] {
  const record = asStoredMetaRecord(meta);
  if (!record) return [];
  const reviews = pickStoredMoonieMetaField<MoonieRankedReview[]>(
    record,
    "rankedReviews"
  );
  return Array.isArray(reviews) ? reviews : [];
}

function reviewerSessionFromMeta(meta: unknown): MoonieReviewerSession | null {
  const record = asStoredMetaRecord(meta);
  if (!record) return null;
  const session = pickStoredMoonieMetaField<MoonieReviewerSession>(
    record,
    "reviewerSession"
  );
  if (!session || !Array.isArray(session.reviewers)) return null;
  return session;
}

function reviewerResultsFromMeta(meta: unknown): MoonieReviewerResult[] {
  const record = asStoredMetaRecord(meta);
  if (!record) return [];
  const results = pickStoredMoonieMetaField<MoonieReviewerResult[]>(
    record,
    "reviewerResults"
  );
  return Array.isArray(results) ? results : [];
}

function novelOverviewFromStoredMeta(meta: unknown): boolean {
  const record = asStoredMetaRecord(meta);
  if (!record) return false;
  const overview = pickStoredMoonieMetaField<{ novelId?: string }>(
    record,
    "novelOverview"
  );
  return Boolean(overview?.novelId);
}

function lookupContextSuppressedFromMeta(meta: unknown): boolean {
  const record = asStoredMetaRecord(meta);
  if (!record) return false;
  return Boolean(
    pickStoredMoonieMetaField<boolean>(record, "lookupContextSuppressed")
  );
}

/**
 * Stale active-novel focus is invalid after an explicit lookup could not resolve
 * a title, until a later assistant turn re-establishes a novel overview.
 */
export function isNovelLookupContextSuppressed(
  messages: StoredMessage[]
): boolean {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const entry = messages[i];
    if (entry.role !== "assistant") continue;
    if (lookupContextSuppressedFromMeta(entry.meta)) return true;
    if (novelOverviewFromStoredMeta(entry.meta)) return false;
    const session = pickStoredMoonieMetaField<{ confirmedNovelId?: string }>(
      asStoredMetaRecord(entry.meta) ?? {},
      "lookupSession"
    );
    if (session?.confirmedNovelId) return false;
  }
  return false;
}

function messageExplicitlyReferencesReview(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim().toLowerCase();
  if (/\b(this|that|the)\s+review\b/.test(text)) return true;
  if (/\b(first|second|third|last|\d+(?:st|nd|rd|th)?)\s+review\b/.test(text)) {
    return true;
  }
  return false;
}

/** A newer recommendation list blocks review-author ordinals without an explicit review reference. */
export function reviewAuthorFollowUpSupersededByRecommendations(
  message: string,
  typed: MoonieTypedConversationContext
): boolean {
  const rec = typed.lastRecommendationList;
  const review = typed.lastReviewList;
  if (!rec?.recommendations?.length) return false;
  if (!review?.rankedReviewSession) return false;
  if (rec.messageIndex <= review.messageIndex) return false;
  if (messageExplicitlyReferencesReview(message)) return false;
  return isReviewAuthorFollowUpMessage(message);
}

export function resolveNovelAuthorFromRecentRecommendations(options: {
  message: string;
  typed: MoonieTypedConversationContext;
}): {
  title: string | null;
  author: string | null;
  missingContext: boolean;
  clarification: string | null;
} {
  const { message, typed } = options;
  const recs = typed.lastRecommendationList?.recommendations ?? [];
  if (recs.length === 0) {
    return {
      title: null,
      author: null,
      missingContext: true,
      clarification: null,
    };
  }

  const ordinal = resolveOrdinalIndex(message);
  if (ordinal == null) {
    return {
      title: null,
      author: null,
      missingContext: true,
      clarification:
        "Which novel do you mean? Say **first novel**, **second novel**, or name the title.",
    };
  }

  const index =
    ordinal === -1
      ? recs.length - 1
      : Math.min(Math.max(ordinal, 0), recs.length - 1);
  const rec = recs[index];
  if (!rec) {
    return {
      title: null,
      author: null,
      missingContext: true,
      clarification: null,
    };
  }

  const author = rec.author?.trim() ?? null;
  if (!author) {
    return {
      title: rec.title,
      author: null,
      missingContext: false,
      clarification: `I don't have a verified author listing for **${rec.title}** on MoonVerse.`,
    };
  }

  return {
    title: rec.title,
    author,
    missingContext: false,
    clarification: null,
  };
}

export function resolveRecommendationOrdinalNovel(options: {
  message: string;
  typed: MoonieTypedConversationContext;
}): { novelId: string; title: string } | null {
  const { message, typed } = options;
  const recs = typed.lastRecommendationList?.recommendations ?? [];
  if (recs.length === 0) return null;

  const ordinal = resolveOrdinalIndex(message);
  if (ordinal == null) return null;

  const index =
    ordinal === -1
      ? recs.length - 1
      : Math.min(Math.max(ordinal, 0), recs.length - 1);
  const rec = recs[index];
  if (!rec?.novelId) return null;

  return { novelId: rec.novelId, title: rec.title };
}

export function isNovelOrdinalFollowUpMessage(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim().toLowerCase();
  if (isReviewAuthorFollowUpMessage(message)) return false;
  if (resolveOrdinalIndex(message) == null) return false;
  if (/\bnovel\b/.test(text) || /\b(book|title|pick)\b/.test(text)) return true;
  if (/^tell me\s+(?:more\s+)?about\b/.test(text)) return true;
  return /\b(?:first|second|third|last)\s+one\b/.test(text);
}

export function buildTypedConversationContext(
  messages: StoredMessage[]
): MoonieTypedConversationContext {
  let lastRecommendationList: MoonieTypedTurnResult | null = null;
  let lastReviewList: MoonieTypedTurnResult | null = null;
  let lastSingleReview: MoonieTypedTurnResult | null = null;
  let lastReviewer: MoonieTypedTurnResult | null = null;
  let lastResult: MoonieTypedTurnResult | null = null;

  for (let i = 0; i < messages.length; i += 1) {
    const entry = messages[i];
    if (entry.role !== "assistant") continue;
    const meta = entry.meta;

    const recommendations = recommendationsFromMeta(meta);
    const rankedReviews = rankedReviewsFromMeta(meta);
    const reviewerSession = reviewerSessionFromMeta(meta);
    const reviewerResults = reviewerResultsFromMeta(meta);

    if (recommendations.length > 0) {
      const turn: MoonieTypedTurnResult = {
        kind: "recommendation_list",
        messageIndex: i,
        recommendations,
      };
      lastRecommendationList = turn;
      lastResult = turn;
    }

    if (rankedReviews.length > 0) {
      const session = buildRankedReviewSessionFromMeta(meta);
      if (rankedReviews.length === 1) {
        const turn: MoonieTypedTurnResult = {
          kind: "single_review",
          messageIndex: i,
          rankedReviewSession: session,
          singleReview: rankedReviews[0]!,
        };
        lastSingleReview = turn;
        lastReviewList = {
          kind: "review_list",
          messageIndex: i,
          rankedReviewSession: session,
        };
        lastResult = turn;
      } else {
        const turn: MoonieTypedTurnResult = {
          kind: "review_list",
          messageIndex: i,
          rankedReviewSession: session,
        };
        lastReviewList = turn;
        lastResult = turn;
      }
    }

    if (reviewerSession?.reviewers.length || reviewerResults.length > 0) {
      const session =
        reviewerSession ??
        ({
          reviewers: reviewerResults,
          rankBy: "reviews",
          queryType: "lookup",
        } satisfies MoonieReviewerSession);
      const turn: MoonieTypedTurnResult = {
        kind: "reviewer",
        messageIndex: i,
        reviewerSession: session,
        activeReviewer:
          reviewerResults[0] ??
          session.reviewers.find((r) => r.id === session.activeReviewerId) ??
          session.reviewers[0] ??
          null,
      };
      lastReviewer = turn;
      lastResult = turn;
    }
  }

  return {
    lastRecommendationList,
    lastReviewList,
    lastSingleReview,
    lastReviewer,
    lastResult,
  };
}

export function reviewAuthorFollowUpClarification(): string {
  return "I don't have a review list to refer to yet. Ask me for reviews of a novel first, or name the review you mean.";
}

export function resolveReviewAuthorFromTypedContext(options: {
  message: string;
  typed: MoonieTypedConversationContext;
}): {
  review: MoonieRankedReview | null;
  ambiguous: boolean;
  missingContext: boolean;
} {
  const { message, typed } = options;
  const text = normalizeLookupQueryText(message).trim().toLowerCase();

  if (reviewAuthorFollowUpSupersededByRecommendations(message, typed)) {
    return { review: null, ambiguous: false, missingContext: true };
  }

  const reviewListTurn = typed.lastReviewList;
  const singleTurn = typed.lastSingleReview;
  const recTurn = typed.lastRecommendationList;

  let reviewList: MoonieRankedReviewSession | null = null;

  if (/\b(this|that|the)\s+review\b/.test(text)) {
    if (
      singleTurn?.singleReview &&
      singleTurn.messageIndex >= (reviewListTurn?.messageIndex ?? -1)
    ) {
      return {
        review: singleTurn.singleReview,
        ambiguous: false,
        missingContext: false,
      };
    }
  }

  if (
    reviewListTurn?.rankedReviewSession &&
    recTurn &&
    recTurn.messageIndex > reviewListTurn.messageIndex &&
    !messageExplicitlyReferencesReview(message)
  ) {
    reviewList = null;
  } else if (reviewListTurn?.rankedReviewSession) {
    reviewList = reviewListTurn.rankedReviewSession;
  } else if (singleTurn?.rankedReviewSession) {
    reviewList = singleTurn.rankedReviewSession;
  }

  const reviews = reviewList?.reviews ?? [];

  if (reviews.length === 0) {
    return { review: null, ambiguous: false, missingContext: true };
  }

  const numbered = text.match(/\b(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+review\b/);
  if (numbered?.[1]) {
    const index = Math.max(0, Number.parseInt(numbered[1], 10) - 1);
    return {
      review: reviews[Math.min(index, reviews.length - 1)] ?? null,
      ambiguous: false,
      missingContext: false,
    };
  }

  const ordinal = resolveOrdinalIndex(message);
  if (
    ordinal != null &&
    (/\b(first|second|third|last)\s+one\b/.test(text) ||
      /\b(this|that)\s+one\b/.test(text) ||
      /\breview/.test(text))
  ) {
    const index =
      ordinal === -1
        ? reviews.length - 1
        : Math.min(Math.max(ordinal, 0), reviews.length - 1);
    return {
      review: reviews[index] ?? null,
      ambiguous: false,
      missingContext: false,
    };
  }

  if (/\b(this|that|the)\s+review\b/.test(text)) {
    if (reviews.length === 1) {
      return { review: reviews[0]!, ambiguous: false, missingContext: false };
    }
    return { review: null, ambiguous: true, missingContext: false };
  }

  if (reviews.length === 1 && isReviewAuthorFollowUpMessage(message)) {
    return { review: reviews[0]!, ambiguous: false, missingContext: false };
  }

  return { review: null, ambiguous: false, missingContext: true };
}

/** Recommendations from the most recent recommendation-list turn only. */
export function recentRecommendationList(
  typed: MoonieTypedConversationContext
): MoonieRecommendation[] {
  return typed.lastRecommendationList?.recommendations ?? [];
}
