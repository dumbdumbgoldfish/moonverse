import { normalizeConversationalInput, resolveOrdinalIndex } from "@/lib/moonie/intent";
import type { MoonieReviewerResult, MoonieReviewerSession } from "@/types/moonie";

function normalizeReviewerText(message: string): string {
  return normalizeConversationalInput(message).replace(
    /\breviwer(s?)\b/gi,
    "reviewer$1"
  );
}

const REVIEWER_RANKING_RE =
  /\b(?:(?:give\s+me\s+)?(?:(?:top|best)\s+\d{1,2}\s+|most\s+followed\s+|popular\s+)reviewers?|who\s+are\s+(?:the\s+)?(?:top|best)\s+reviewers?|best\s+reviewers?\s+on\s+moonverse)\b/i;

const REVIEWER_LOOKUP_RE =
  /\b(?:find|look\s+up|search\s+for)\s+(?:(?:a|the)\s+)?(?:reviewer|user|member)\s+(?:(?:name|named|called)\s+)?(.+?)\s*$/i;

const REVIEWER_CONTINUATION_RE =
  /^(?:how|what)\s+about\s+(.+?)\s*$/i;

const COMMUNITY_PEOPLE_RE =
  /\b(?:most\s+followed|popular)\s+(?:reviewers?|users?|members?|people)\b/i;

const REVIEWER_OVERVIEW_RE =
  /\b(?:(?:all\s+)?(?:information|info|details?)\s+about|tell\s+me\s+(?:more\s+)?about|(?:more|show)\s+(?:information|info|details?)\s+(?:about|for|on)|show\s+me\s+details?\s+of|who\s+is)\b/i;

const REVIEWER_AUTHORED_REVIEWS_RE =
  /\b(?:(?:show|see|view|give)\s+(?:me\s+)?(?:all\s+)?(?:of\s+)?@([\w][\w.-]+)\s+reviews?|(?:show|see|view)\s+(?:me\s+)?(?:all\s+)?their\s+reviews|reviews?\s+(?:by|from)\s+(?:@[\w.-]+|them|him|her|this\s+reviewer|that\s+reviewer|the\s+reviewer)|reviews?\s+they wrote|reviews?\s+they(?:'ve| have) written|what\s+have\s+they\s+reviewed)\b/i;

const REVIEWER_FOLDER_RE =
  /\b(?:(?:show|see|view|give)\s+(?:me\s+)?(?:all\s+)?(?:of\s+)?@([\w][\w.-]+)\s+(?:saved\s+)?(?:folder|folders)|(?:their|his|her)\s+(?:saved\s+)?(?:folder|folders)|saved\s+folders?\s+(?:for|from|by)\s+@?[\w][\w.-]+)\b/i;

const PUBLIC_SALON_REVIEW_RE =
  /\b(?:spoiler[- ]aware|moonverse\s+salon|(?:the\s+)?salon)\b/i;

const NAMED_REVIEWER_AUTHORED_REVIEWS_RE =
  /\b(?:show|see|view)\s+(?:me\s+)?(?:all\s+)?(@?[\w][\w\s.'’-]{0,60}?)['’]s\s+reviews?\s*[?.!]*$/i;

const NAMED_REVIEWER_REVIEWS_RE =
  /\b(?:show|see|view)\s+(?:me\s+)?(@?[\w][\w.-]+)\s+reviews?\s*[?.!]*$/i;

const REVIEWER_REFERENCE_RE =
  /\b(?:(?:the\s+)?(?:first|second|third|last|\d+(?:st|nd|rd)?|top\s+\d+|number\s+\d+)\s+reviewer|reviewer\s+\d+|(?:first|second|third)\s+one|top\s+\d+\s+reviewer)\b/i;

const NAMED_REVIEWER_RE =
  /\b(?:tell\s+me\s+about|who\s+is|show\s+me\s+details?\s+of)\s+(@?[\w][\w.-]*|[A-Z][\w\s'’.-]{1,60})\s*$/i;

const REVIEWER_DETAILS_FOLLOW_UP_RE =
  /^(?:show\s+(?:me\s+)?(?:more\s+)?(?:details?|info(?:rmation)?)|(?:more|tell\s+me)\s+(?:details?|info(?:rmation)?)|details?)\s*[?.!]*$/i;

/** Bare continuation after a reviewer ranking/list (e.g. "show details"). */
export function isReviewerDetailsFollowUpMessage(message: string): boolean {
  return REVIEWER_DETAILS_FOLLOW_UP_RE.test(
    normalizeReviewerText(message).toLowerCase()
  );
}

export function extractAtUsernameQuery(message: string): string | null {
  const text = normalizeReviewerText(message).trim();
  const bare = text.match(/^@([\w][\w.-]*)\s*$/i);
  if (bare?.[1]) return bare[1];
  const authored = text.match(
    /^(?:show|see|view|give)\s+(?:me\s+)?(?:all\s+)?(?:of\s+)?@([\w][\w.-]+)\s+reviews?\s*[?.!]*$/i
  );
  if (authored?.[1]) return authored[1];
  const folder = text.match(
    /^(?:show|see|view|give)\s+(?:me\s+)?(?:all\s+)?(?:of\s+)?@([\w][\w.-]+)\s+(?:saved\s+)?folders?\s*[?.!]*$/i
  );
  return folder?.[1] ?? null;
}

function isLikelyReviewerUsername(candidate: string): boolean {
  const trimmed = candidate.trim().replace(/^@/, "");
  if (!trimmed || trimmed.length < 2) return false;
  return /^[\w][\w.-]*$/i.test(trimmed);
}

/** Plural / group pronouns referring to the current reviewer result set. */
export function messageReferencesReviewerGroup(message: string): boolean {
  const text = normalizeReviewerText(message).toLowerCase();
  if (!text) return false;
  if (resolveReviewerOrdinalFromMessage(message) != null) return false;
  if (REVIEWER_REFERENCE_RE.test(text)) return false;
  if (extractNamedReviewerQuery(message)) return false;
  if (extractReviewerLookupQuery(message)) return false;

  if (/\bshow\s+(?:me\s+)?(?:their|the)\s+(?:information|info|details?|profiles?)\b/.test(text)) {
    return true;
  }
  if (/\bgive\s+me\s+their\s+(?:information|info|details?|profiles?)\b/.test(text)) {
    return true;
  }
  if (/\bshow\s+their\s+details?\b/.test(text)) return true;
  if (/\btheir\s+(?:all\s+)?(?:information|info|details?)\b/.test(text)) {
    return true;
  }
  if (/\btell\s+me\s+about\s+them\b/.test(text)) return true;
  if (/\bmore\s+about\s+these\s+reviewers?\b/.test(text)) return true;
  if (/\b(?:about|on)\s+these\s+reviewers?\b/.test(text)) return true;
  if (/\bthese\s+reviewers?\b/.test(text) && /\b(?:info|information|details?|profile)\b/.test(text)) {
    return true;
  }
  if (
    /\b(?:their|the)\s+(?:information|info|details?|profiles?)\b/.test(text) &&
    !/\bnovel\b/.test(text)
  ) {
    return true;
  }
  if (/\babout\s+them\b/.test(text) && !/\bnovel\b/.test(text)) return true;

  return false;
}

export function isReviewerGroupOverviewMessage(message: string): boolean {
  return messageReferencesReviewerGroup(message);
}

/** List/ranking ask (top N reviewers), not ordinal selection of one row. */
export function isReviewerListRequest(message: string): boolean {
  const text = normalizeReviewerText(message).toLowerCase();
  if (!text) return false;
  if (/\breviewers\b/.test(text)) return true;
  if (REVIEWER_RANKING_RE.test(text)) return true;
  if (COMMUNITY_PEOPLE_RE.test(text)) return true;
  if (
    /\b(?:give|show)\s+(?:me\s+)?(?:all\s+)?top\s+\d{1,2}\s+reviewers?\b/.test(
      text
    )
  ) {
    return true;
  }
  if (
    /\btop\s+\d{1,2}\s+reviewers?\b/.test(text) &&
    /\b(?:information|info|details?|profiles?)\b/.test(text)
  ) {
    return true;
  }
  if (
    /\bgive\s+me\s+(?:all\s+)?top\s+\d{1,2}\s+reviewers?\b/.test(text)
  ) {
    return true;
  }
  return false;
}

/** Ordinal selection from a reviewer ranking ("who is top 1", "the 10th reviewer"). */
export function isReviewerOrdinalQuestion(message: string): boolean {
  const text = normalizeReviewerText(message).toLowerCase();
  if (!text) return false;
  if (isReviewerListRequest(message)) return false;
  if (!/\breviewer/.test(text)) return false;
  if (
    /\b(?:which|who)\s+(?:reviewer\s+)?is\s+(?:the\s+)?(?:top|first|number)\s+\d{1,2}\b/.test(
      text
    )
  ) {
    return true;
  }
  if (
    /\b(?:which|who)\s+is\s+(?:the\s+)?(?:top|first)\s+(?:one|\d{1,2})\s+reviewer/.test(
      text
    )
  ) {
    return true;
  }
  if (
    /\b(?:the\s+)?\d{1,2}(?:st|nd|rd|th)?\s+reviewer\b/.test(text) &&
    /\b(?:which|who|what)\b/.test(text)
  ) {
    return true;
  }
  if (resolveReviewerOrdinalFromMessage(message) != null) {
    return /\b(?:which|who|what|number)\b/.test(text);
  }
  return false;
}

export function isReviewerFolderRequest(message: string): boolean {
  const text = normalizeReviewerText(message).toLowerCase();
  if (!text) return false;
  if (!/\b(?:folder|folders|reading list)\b/.test(text)) return false;
  return REVIEWER_FOLDER_RE.test(text) || extractAtUsernameQuery(message) != null;
}

/** True when the user is asking for a new reviewer ranking list. */
export function isReviewerRankingMessage(message: string): boolean {
  const text = normalizeReviewerText(message);
  if (!text) return false;
  if (isReviewerOrdinalQuestion(message)) return false;
  if (isReviewerFolderRequest(message)) return false;
  if (isReviewerAuthoredReviewsMessage(text)) return false;
  if (REVIEWER_RANKING_RE.test(text)) return true;
  if (COMMUNITY_PEOPLE_RE.test(text)) return true;
  if (/\bwho\s+are\s+(?:the\s+)?(?:top|best)\s+(?:reviewers?|users?)\b/i.test(text)) {
    return true;
  }
  return false;
}

/** @deprecated Use isReviewerRankingMessage for ranking-specific checks. */
export function isReviewerDiscoveryMessage(message: string): boolean {
  return isReviewerRankingMessage(message);
}

export function isReviewerOverviewMessage(message: string): boolean {
  const text = normalizeReviewerText(message).toLowerCase();
  if (!text) return false;
  if (isReviewerFolderRequest(message)) return true;
  if (isReviewerOrdinalQuestion(message)) return true;
  if (isReviewerListRequest(message) && isReviewerRankingMessage(text)) {
    return false;
  }
  if (isReviewerAuthoredReviewsMessage(text)) return false;
  if (extractAtUsernameQuery(message)) return true;
  const named = extractNamedReviewerQuery(message);
  if (named && isLikelyReviewerUsername(named)) return true;
  if (REVIEWER_OVERVIEW_RE.test(text) && /\breviewer\b/i.test(text)) {
    return true;
  }
  if (
    REVIEWER_REFERENCE_RE.test(text) &&
    /\breviewer\b/i.test(text) &&
    /\b(information|info|details?|about|more)\b/i.test(text)
  ) {
    return true;
  }
  if (/\bwho\s+is\s+@?[\w][\w.-]+\b/i.test(text)) return true;
  return false;
}

export function isReviewerAuthoredReviewsMessage(message: string): boolean {
  const text = normalizeReviewerText(message).toLowerCase();
  if (isPublicSalonReviewRequest(message)) return false;
  return (
    REVIEWER_AUTHORED_REVIEWS_RE.test(text) ||
    NAMED_REVIEWER_AUTHORED_REVIEWS_RE.test(text) ||
    NAMED_REVIEWER_REVIEWS_RE.test(text)
  );
}

/**
 * Salon / spoiler-aware public-review asks. Not a named-reviewer lookup.
 * Example: the Discover/salon Ask Moonie chip.
 */
export function isPublicSalonReviewRequest(message: string): boolean {
  const text = normalizeReviewerText(message);
  if (!text) return false;
  if (extractAtUsernameQuery(message)) return false;
  if (extractNamedReviewerQuery(message)) return false;
  if (!/\breviews?\b/i.test(text)) return false;
  if (!PUBLIC_SALON_REVIEW_RE.test(text)) return false;
  return /\b(recommend|suggest|show|find|match|binge)\b/i.test(text);
}

export function messageReferencesActiveReviewer(message: string): boolean {
  const text = normalizeReviewerText(message).toLowerCase();
  if (!text) return false;
  if (messageReferencesReviewerGroup(message)) return false;
  if (/\b(this reviewer|that reviewer|the reviewer)\b/.test(text)) return true;
  if (isReviewerAuthoredReviewsMessage(text)) return true;
  if (
    /\b(them|their|they|him|her)\b/.test(text) &&
    /\b(review|profile|information|info|details?|follow)\b/.test(text)
  ) {
    return true;
  }
  return false;
}

/** True when the user is asking about reviewers/users, not novels. */
export function isCommunityPeopleQuery(message: string): boolean {
  const text = normalizeReviewerText(message);
  if (!text) return false;
  if (isReviewerRankingMessage(text)) return true;
  if (isReviewerOverviewMessage(text)) return true;
  if (extractReviewerLookupQuery(text)) return true;
  return false;
}

export function extractReviewerLookupQuery(message: string): string | null {
  const text = normalizeReviewerText(message);
  const continuation = text.match(REVIEWER_CONTINUATION_RE);
  const continuationCandidate = continuation?.[1]
    ?.trim()
    .replace(/[?.!]+$/, "");
  if (continuationCandidate && continuationCandidate.length >= 2) {
    return continuationCandidate;
  }
  const match = text.match(REVIEWER_LOOKUP_RE);
  const candidate = match?.[1]?.trim().replace(/[?.!]+$/, "");
  if (!candidate || candidate.length < 2) return null;
  return candidate;
}

export function extractNamedReviewerQuery(message: string): string | null {
  const atUsername = extractAtUsernameQuery(message);
  if (atUsername) return atUsername;

  const text = normalizeReviewerText(message);
  const usernameReviews = text.match(NAMED_REVIEWER_REVIEWS_RE);
  if (usernameReviews?.[1]) {
    return usernameReviews[1].trim().replace(/^@/, "");
  }
  const authoredReviews = text.match(NAMED_REVIEWER_AUTHORED_REVIEWS_RE);
  if (authoredReviews?.[1]) {
    return authoredReviews[1].trim().replace(/^@/, "");
  }
  const who = text.match(/\bwho\s+is\s+(@?[\w][\w.-]+)\s*$/i);
  if (who?.[1]) return who[1].replace(/^@/, "");
  const match = text.match(NAMED_REVIEWER_RE);
  const candidate = match?.[1]?.trim().replace(/[?.!]+$/, "");
  if (!candidate || candidate.length < 2) return null;
  if (/^moonie$/i.test(candidate)) return null;
  if (/\b(novel|book|story)\b/i.test(text) && !/\breviewer\b/i.test(text)) {
    return null;
  }
  if (!isLikelyReviewerUsername(candidate)) return null;
  return candidate.replace(/^@/, "");
}

export function resolveReviewerOrdinalFromMessage(message: string): number | null {
  if (isReviewerListRequest(message)) return null;

  const text = normalizeReviewerText(message).toLowerCase();
  const reviewerIsTop = text.match(/\breviewer\s+is\s+(?:the\s+)?top\s+(\d{1,2})\b/);
  if (reviewerIsTop?.[1]) {
    return Math.max(0, Number.parseInt(reviewerIsTop[1], 10) - 1);
  }
  const whoIsTop = text.match(
    /\b(?:which|who)\s+(?:reviewer\s+)?is\s+(?:the\s+)?top\s+(\d{1,2})\b/
  );
  if (whoIsTop?.[1]) {
    return Math.max(0, Number.parseInt(whoIsTop[1], 10) - 1);
  }
  const nthReviewer = text.match(/\b(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)\s+reviewer\b/);
  if (nthReviewer?.[1]) {
    return Math.max(0, Number.parseInt(nthReviewer[1], 10) - 1);
  }
  const topMatch = text.match(/\btop\s+(\d{1,2})\s+reviewer\b/);
  if (topMatch?.[1] && !/\breviewers\b/.test(text)) {
    return Math.max(0, Number.parseInt(topMatch[1], 10) - 1);
  }
  const reviewerMatch = text.match(/\breviewer\s+(\d{1,2})\b/);
  if (reviewerMatch?.[1]) {
    return Math.max(0, Number.parseInt(reviewerMatch[1], 10) - 1);
  }
  const numberMatch = text.match(/\bnumber\s+(\d{1,2})\b/);
  if (numberMatch?.[1]) {
    return Math.max(0, Number.parseInt(numberMatch[1], 10) - 1);
  }
  if (!/\breviewer\b/i.test(text)) return null;
  return resolveOrdinalIndex(message);
}

export function extractReviewerResultLimit(
  message: string,
  defaultLimit = 10
): number {
  const text = normalizeReviewerText(message);
  const match = text.match(/\b(?:top|best)\s+(\d{1,2})\b/i);
  if (match?.[1]) {
    return Math.min(20, Math.max(1, Number.parseInt(match[1], 10)));
  }
  return defaultLimit;
}

export type MoonieReviewerRankBy = "reviews" | "followers";

export function resolveReviewerRankBy(message: string): MoonieReviewerRankBy {
  const text = normalizeReviewerText(message).toLowerCase();
  if (/\b(?:most\s+followed|popular)\b/.test(text)) {
    return "followers";
  }
  return "reviews";
}

export function pickReviewerByOrdinal(
  reviewers: MoonieReviewerResult[],
  ordinal: number
): MoonieReviewerResult | null {
  if (reviewers.length === 0) return null;
  const index =
    ordinal === -1
      ? reviewers.length - 1
      : Math.min(Math.max(ordinal, 0), reviewers.length - 1);
  return reviewers[index] ?? null;
}

export function resolveTargetReviewerFromSession(options: {
  message: string;
  session: MoonieReviewerSession | null;
  activeReviewerId?: string | null;
}): MoonieReviewerResult | null {
  const { message, session, activeReviewerId } = options;
  if (!session || session.reviewers.length === 0) return null;

  const ordinal = resolveReviewerOrdinalFromMessage(message);
  if (ordinal != null) {
    return pickReviewerByOrdinal(session.reviewers, ordinal);
  }

  if (messageReferencesActiveReviewer(message)) {
    const resolvedActiveId =
      activeReviewerId ?? session.activeReviewerId ?? null;
    if (resolvedActiveId) {
      return (
        session.reviewers.find((reviewer) => reviewer.id === resolvedActiveId) ??
        null
      );
    }
  }

  if (messageReferencesReviewerGroup(message)) {
    return null;
  }

  if (isReviewerDetailsFollowUpMessage(message)) {
    if (activeReviewerId) {
      return (
        session.reviewers.find((reviewer) => reviewer.id === activeReviewerId) ??
        session.reviewers[0] ??
        null
      );
    }
    return session.reviewers[0] ?? null;
  }

  return null;
}
