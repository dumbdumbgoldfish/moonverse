import {
  messageReferencesActiveNovel,
  normalizeLookupConfirmationMessage,
  resolveOrdinalIndex,
} from "@/lib/moonie/intent";
import type {
  MoonieCompareRow,
  MoonieLookupSession,
  MoonieRecommendation,
  MoonieReviewerResult,
  MoonieReviewerReviewSession,
  MoonieReviewerSession,
} from "@/types/moonie";
import {
  messageReferencesActiveReviewer,
  pickReviewerByOrdinal,
  resolveReviewerOrdinalFromMessage,
} from "@/lib/moonie/reviewer-intent";
import {
  messageReferencesReviewerReviewSession,
  pickReviewerReviewByOrdinal,
  resolveReviewerReviewFollowUpTarget,
  resolveReviewerReviewOrdinalFromMessage,
} from "@/lib/moonie/reviewer-review-intent";

export interface MoonieConversationContext {
  priorRecommendations: MoonieRecommendation[];
  priorCompareRows: MoonieCompareRow[];
  activeNovelId: string | null;
  activeNovelTitle: string | null;
  lastUserMessage: string | null;
  lookupSession: MoonieLookupSession | null;
  rejectedNovelIds: string[];
  reviewerSession: MoonieReviewerSession | null;
  activeReviewerId: string | null;
  activeReviewerUsername: string | null;
  activeReviewerDisplayName: string | null;
  reviewerReviewSession: MoonieReviewerReviewSession | null;
}

interface StoredMessage {
  role: string;
  content: string;
  meta?: unknown;
}

interface FocusedNovel {
  novelId: string;
  title: string;
}

function recommendationsFromMeta(meta: unknown): MoonieRecommendation[] {
  if (!meta || typeof meta !== "object") return [];
  const recs = (meta as { recommendations?: MoonieRecommendation[] })
    .recommendations;
  return Array.isArray(recs) ? recs : [];
}

function compareRowsFromMeta(meta: unknown): MoonieCompareRow[] {
  if (!meta || typeof meta !== "object") return [];
  const compare = (meta as { compare?: { rows?: MoonieCompareRow[] } }).compare;
  return Array.isArray(compare?.rows) ? compare.rows : [];
}

function lookupSessionFromMeta(meta: unknown): MoonieLookupSession | null {
  if (!meta || typeof meta !== "object") return null;
  const session = (meta as { lookupSession?: MoonieLookupSession }).lookupSession;
  if (!session || !Array.isArray(session.candidates)) return null;
  return session;
}

function novelOverviewFromMeta(meta: unknown): FocusedNovel | null {
  if (!meta || typeof meta !== "object") return null;
  const overview = (
    meta as { novelOverview?: { novelId: string; title: string } }
  ).novelOverview;
  if (!overview?.novelId) return null;
  return { novelId: overview.novelId, title: overview.title };
}

function pickRecommendation(
  recommendations: MoonieRecommendation[],
  ordinal: number
): FocusedNovel | null {
  if (recommendations.length === 0) return null;
  const index =
    ordinal === -1
      ? recommendations.length - 1
      : Math.min(Math.max(ordinal, 0), recommendations.length - 1);
  const pick = recommendations[index];
  return pick ? { novelId: pick.novelId, title: pick.title } : null;
}

function pickLookupCandidate(
  session: MoonieLookupSession,
  ordinal: number
): FocusedNovel | null {
  if (session.candidates.length === 0) return null;
  const index =
    ordinal === -1
      ? session.candidates.length - 1
      : Math.min(Math.max(ordinal, 0), session.candidates.length - 1);
  const pick = session.candidates[index];
  return pick ? { novelId: pick.novelId, title: pick.title } : null;
}

function confirmedLookupNovel(session: MoonieLookupSession | null): FocusedNovel | null {
  if (!session?.confirmedNovelId) return null;
  const match =
    session.candidates.find((c) => c.novelId === session.confirmedNovelId) ??
    null;
  if (match) {
    return { novelId: match.novelId, title: match.title };
  }
  return { novelId: session.confirmedNovelId, title: session.query };
}

function lastReferencedRecommendation(
  messages: StoredMessage[],
  recommendations: MoonieRecommendation[]
): FocusedNovel | null {
  if (recommendations.length === 0) return null;

  let recIntroIndex = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (
      messages[i]?.role === "assistant" &&
      recommendationsFromMeta(messages[i]?.meta).length > 0
    ) {
      recIntroIndex = i;
      break;
    }
  }

  let focused: FocusedNovel | null = null;

  for (let i = Math.max(0, recIntroIndex + 1); i < messages.length; i += 1) {
    const entry = messages[i];
    if (entry.role !== "user") continue;

    const ordinal = resolveOrdinalIndex(entry.content);
    if (ordinal != null) {
      const pick = pickRecommendation(recommendations, ordinal);
      if (pick) focused = pick;
      continue;
    }

    if (
      messageReferencesActiveNovel(entry.content) &&
      /\b(looks good|sounds good|interested|pick|choose|go with)\b/i.test(
        entry.content
      ) &&
      focused
    ) {
      continue;
    }
  }

  return focused;
}

function lastSelectedLookupCandidate(
  messages: StoredMessage[],
  session: MoonieLookupSession | null
): FocusedNovel | null {
  if (!session || session.candidates.length === 0) return null;

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const entry = messages[i];
    if (entry.role !== "user") continue;

    const ordinal = resolveOrdinalIndex(entry.content);
    if (ordinal != null) {
      const pick = pickLookupCandidate(session, ordinal);
      if (pick) return pick;
    }

    const named = normalizeLookupConfirmationMessage(entry.content).match(
      /^this one\s*[—\-:]\s*(.+)$/i
    );
    if (named?.[1]) {
      const title = named[1].trim().toLowerCase();
      const match = session.candidates.find(
        (c) => c.title.toLowerCase() === title
      );
      if (match) {
        return { novelId: match.novelId, title: match.title };
      }
    }
  }

  if (session.mode === "confirmed" && session.candidates[0]) {
    return {
      novelId: session.candidates[0].novelId,
      title: session.candidates[0].title,
    };
  }

  return null;
}

function reviewerSessionFromMeta(meta: unknown): MoonieReviewerSession | null {
  if (!meta || typeof meta !== "object") return null;
  const session = (meta as { reviewerSession?: MoonieReviewerSession })
    .reviewerSession;
  if (!session || !Array.isArray(session.reviewers)) return null;
  return session;
}

function reviewerResultsFromMeta(meta: unknown): MoonieReviewerResult[] {
  if (!meta || typeof meta !== "object") return [];
  const results = (meta as { reviewerResults?: MoonieReviewerResult[] })
    .reviewerResults;
  return Array.isArray(results) ? results : [];
}

function reviewerOverviewFromMeta(
  meta: unknown
): { id: string; username: string; displayName: string } | null {
  if (!meta || typeof meta !== "object") return null;
  const overview = (
    meta as {
      reviewerOverview?: {
        id: string;
        username: string;
        displayName: string;
      };
    }
  ).reviewerOverview;
  if (!overview?.id) return null;
  return overview;
}

function buildReviewerSessionFromMeta(meta: unknown): MoonieReviewerSession | null {
  const session = reviewerSessionFromMeta(meta);
  if (session) return session;
  const results = reviewerResultsFromMeta(meta);
  if (results.length === 0) return null;
  return {
    reviewers: results,
    rankBy: "reviews",
    queryType: "ranking",
    activeReviewerId: reviewerOverviewFromMeta(meta)?.id ?? null,
  };
}

function reviewerReviewSessionFromMeta(
  meta: unknown
): MoonieReviewerReviewSession | null {
  if (!meta || typeof meta !== "object") return null;
  const session = (meta as { reviewerReviewSession?: MoonieReviewerReviewSession })
    .reviewerReviewSession;
  if (!session || !Array.isArray(session.reviews)) return null;
  return session;
}

function buildReviewerReviewSessionFromMeta(
  meta: unknown
): MoonieReviewerReviewSession | null {
  const session = reviewerReviewSessionFromMeta(meta);
  if (session) return session;

  if (!meta || typeof meta !== "object") return null;

  const overview = (
    meta as {
      reviewerOverview?: {
        id: string;
        displayName: string;
        emphasizeAuthoredReviews?: boolean;
        recentReviews?: Array<{
          id: string;
          title: string;
          rating: number;
          novelId: string;
          novelTitle: string;
        }>;
      };
    }
  ).reviewerOverview;

  if (!overview?.emphasizeAuthoredReviews || !overview.recentReviews?.length) {
    return null;
  }

  return {
    reviewerId: overview.id,
    reviewerDisplayName: overview.displayName,
    reviews: overview.recentReviews.map((review, order) => ({
      reviewId: review.id,
      reviewTitle: review.title,
      novelId: review.novelId,
      novelTitle: review.novelTitle,
      rating: review.rating,
      order,
    })),
    activeReviewIndex: null,
  };
}

function resolveNovelFromReviewerReviewSession(options: {
  message?: string;
  session: MoonieReviewerReviewSession | null;
}): FocusedNovel | null {
  const { message, session } = options;
  if (!session?.reviews.length || !message) return null;
  if (!messageReferencesReviewerReviewSession(message)) return null;
  if (resolveReviewerReviewFollowUpTarget(message) === "review") return null;

  const ordinal = resolveReviewerReviewOrdinalFromMessage(message);
  if (ordinal == null) return null;

  const entry = pickReviewerReviewByOrdinal(session.reviews, ordinal);
  if (!entry?.novelId) return null;

  return { novelId: entry.novelId, title: entry.novelTitle };
}

function lastReferencedReviewer(
  messages: StoredMessage[],
  session: MoonieReviewerSession | null
): MoonieReviewerResult | null {
  if (!session || session.reviewers.length === 0) return null;

  let rankingIntroIndex = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (
      messages[i]?.role === "assistant" &&
      reviewerResultsFromMeta(messages[i]?.meta).length > 0
    ) {
      rankingIntroIndex = i;
      break;
    }
  }

  let focused: MoonieReviewerResult | null = null;

  for (let i = Math.max(0, rankingIntroIndex + 1); i < messages.length; i += 1) {
    const entry = messages[i];
    if (entry.role === "user") {
      const ordinal = resolveReviewerOrdinalFromMessage(entry.content);
      if (ordinal != null) {
        const pick = pickReviewerByOrdinal(session.reviewers, ordinal);
        if (pick) focused = pick;
      }
      continue;
    }
    if (entry.role === "assistant") {
      const overview = reviewerOverviewFromMeta(entry.meta);
      if (overview) {
        focused =
          session.reviewers.find((reviewer) => reviewer.id === overview.id) ??
          ({
            id: overview.id,
            username: overview.username,
            displayName: overview.displayName,
            avatarInitials: overview.displayName.slice(0, 2).toUpperCase(),
            reviewCount: 0,
            followerCount: 0,
          } satisfies MoonieReviewerResult);
      }
    }
  }

  if (session.activeReviewerId) {
    const active = session.reviewers.find(
      (reviewer) => reviewer.id === session.activeReviewerId
    );
    if (active) return active;
  }

  return focused;
}

export function resolveActiveReviewer(options: {
  messages: StoredMessage[];
  reviewerSession: MoonieReviewerSession | null;
  currentMessage?: string;
}): MoonieReviewerResult | null {
  const { messages, reviewerSession, currentMessage } = options;
  if (!reviewerSession || reviewerSession.reviewers.length === 0) {
    return null;
  }

  let active = lastReferencedReviewer(messages, reviewerSession);

  if (currentMessage) {
    const ordinal = resolveReviewerOrdinalFromMessage(currentMessage);
    if (ordinal != null) {
      active =
        pickReviewerByOrdinal(reviewerSession.reviewers, ordinal) ?? active;
    } else if (messageReferencesActiveReviewer(currentMessage) && active) {
      // Keep focused reviewer for pronoun follow-ups.
    }
  }

  return active;
}

function latestOverviewNovel(messages: StoredMessage[]): FocusedNovel | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role !== "assistant") continue;
    const overview = novelOverviewFromMeta(messages[i]?.meta);
    if (overview) return overview;
  }
  return null;
}

export function resolveActiveNovel(options: {
  messages: StoredMessage[];
  priorRecommendations: MoonieRecommendation[];
  lookupSession: MoonieLookupSession | null;
  reviewerReviewSession?: MoonieReviewerReviewSession | null;
  contextNovelId?: string | null;
  contextNovelTitle?: string | null;
  currentMessage?: string;
}): FocusedNovel | null {
  const {
    messages,
    priorRecommendations,
    lookupSession,
    reviewerReviewSession,
    contextNovelId,
    contextNovelTitle,
    currentMessage,
  } = options;

  const fromReviewerReviews = resolveNovelFromReviewerReviewSession({
    message: currentMessage,
    session: reviewerReviewSession ?? null,
  });
  if (fromReviewerReviews) return fromReviewerReviews;

  const confirmed = confirmedLookupNovel(lookupSession);
  const pinned =
    contextNovelId != null
      ? {
          novelId: contextNovelId,
          title: contextNovelTitle ?? "Current novel",
        }
      : null;
  const lookupPick = lastSelectedLookupCandidate(messages, lookupSession);
  const referenced = lastReferencedRecommendation(
    messages,
    priorRecommendations
  );
  const overview = latestOverviewNovel(messages);
  const fallbackFirst = priorRecommendations[0]
    ? {
        novelId: priorRecommendations[0].novelId,
        title: priorRecommendations[0].title,
      }
    : null;

  let active =
    pinned ??
    lookupPick ??
    overview ??
    confirmed ??
    referenced ??
    fallbackFirst;

  if (currentMessage) {
    const ordinal = resolveOrdinalIndex(currentMessage);
    if (ordinal != null) {
      if (lookupSession && lookupSession.candidates.length > 0) {
        active = pickLookupCandidate(lookupSession, ordinal) ?? active;
      } else if (priorRecommendations.length > 0) {
        active = pickRecommendation(priorRecommendations, ordinal) ?? active;
      }
    } else if (messageReferencesActiveNovel(currentMessage)) {
      // Keep the best prior focus; do not reset to the first recommendation.
    }
  }

  return active;
}

export function buildConversationContext(
  messages: StoredMessage[],
  options?: {
    contextNovelId?: string | null;
    contextNovelTitle?: string | null;
    currentMessage?: string;
  }
): MoonieConversationContext {
  let priorRecommendations: MoonieRecommendation[] = [];
  let priorCompareRows: MoonieCompareRow[] = [];
  let lookupSession: MoonieLookupSession | null = null;
  let reviewerSession: MoonieReviewerSession | null = null;
  let reviewerReviewSession: MoonieReviewerReviewSession | null = null;

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const entry = messages[i];
    if (entry.role !== "assistant") continue;
    const recs = recommendationsFromMeta(entry.meta);
    const compareRows = compareRowsFromMeta(entry.meta);
    if (recs.length > 0 && priorRecommendations.length === 0) {
      priorRecommendations = recs;
    }
    if (compareRows.length > 0 && priorCompareRows.length === 0) {
      priorCompareRows = compareRows;
    }
    if (!lookupSession) {
      lookupSession = lookupSessionFromMeta(entry.meta);
    }
    if (!reviewerSession) {
      reviewerSession = buildReviewerSessionFromMeta(entry.meta);
    }
    if (!reviewerReviewSession) {
      reviewerReviewSession = buildReviewerReviewSessionFromMeta(entry.meta);
    }
    if (
      priorRecommendations.length > 0 &&
      priorCompareRows.length > 0 &&
      lookupSession &&
      reviewerSession &&
      reviewerReviewSession
    ) {
      break;
    }
  }

  const lastUser =
    [...messages].reverse().find((entry) => entry.role === "user")?.content ??
    null;

  const active = resolveActiveNovel({
    messages,
    priorRecommendations,
    lookupSession,
    reviewerReviewSession,
    contextNovelId: options?.contextNovelId,
    contextNovelTitle: options?.contextNovelTitle,
    currentMessage: options?.currentMessage,
  });

  const activeReviewer = resolveActiveReviewer({
    messages,
    reviewerSession,
    currentMessage: options?.currentMessage,
  });

  return {
    priorRecommendations,
    priorCompareRows,
    activeNovelId: active?.novelId ?? null,
    activeNovelTitle: active?.title ?? null,
    lastUserMessage: lastUser,
    lookupSession,
    rejectedNovelIds: lookupSession?.rejectedNovelIds ?? [],
    reviewerSession,
    activeReviewerId: activeReviewer?.id ?? null,
    activeReviewerUsername: activeReviewer?.username ?? null,
    activeReviewerDisplayName: activeReviewer?.displayName ?? null,
    reviewerReviewSession,
  };
}
