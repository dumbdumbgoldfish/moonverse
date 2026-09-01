import {
  normalizeLookupQueryText,
  normalizeLookupTitle,
  isUsableNovelQuery,
} from "@/lib/moonie/intent";
import type { NovelReviewRankingMetric } from "@/lib/moonie/review-retrieval";

export type NovelScopedReviewRequestKind =
  | "list"
  | "ranked"
  | "who_reviewed"
  | "spoiler_free_list"
  | "review_link"
  | "review_links";

export interface NovelScopedReviewRequest {
  kind: NovelScopedReviewRequestKind;
  novelQuery: string | null;
  metric: NovelReviewRankingMetric | null;
  count: number;
  spoilerFreeOnly: boolean;
  usesActiveNovelContext: boolean;
  /** True for "give me N reviews of X" — scoped cards only, no aggregate block. */
  explicitCountRequest?: boolean;
}

const WHO_REVIEWED_ACTIVE_RE =
  /^who\s+reviewed\s+(?:it|this(?:\s+novel)?|that(?:\s+novel)?)\s*[?.!]*$/i;

const WHO_REVIEWED_TITLE_RE =
  /^who\s+reviewed\s+(.+?)\s*$/i;

const SPOILER_FREE_REVIEWS_RE =
  /^(?:(?:give|get|show)(?:\s+me)?\s+)?spoiler[- ]free\s+reviews?\s+(?:for|of)\s+(.+?)\s*$/i;

const SINGULAR_REVIEW_LINK_RE =
  /^(?:(?:give|get|send|show)(?:\s+me)?\s+)?(?:the\s+)?review\s+link\s+(?:for|of)\s+(.+?)\s*$/i;

const PLURAL_REVIEW_LINKS_RE =
  /^(?:(?:give|get|send|show)(?:\s+me)?\s+)?review\s+links?\s+(?:for|of)\s+(.+?)\s*$/i;

const COUNTED_REVIEWS_RE =
  /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:the\s+)?(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+reviews?\s+(?:for|of)\s+(.+?)\s*$/i;

const RANKED_REVIEW_PATTERNS: Array<{
  metric: NovelReviewRankingMetric;
  pattern: RegExp;
}> = [
  {
    metric: "review_oldest",
    pattern:
      /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:the\s+)?(?:oldest|earliest|first[- ]published)\s+review\s+(?:for|of)\s+(.+?)\s*$/i,
  },
  {
    metric: "review_rating",
    pattern:
      /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:(?:the\s+)?(?:top\s+\d{1,2}\s+)?)?(?:(?:highest|top|best)[- ]rated)\s+reviews?\s+(?:for|of)\s+(.+?)\s*$/i,
  },
  {
    metric: "review_rating",
    pattern:
      /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:(?:the\s+)?)?(?:(?:highest|top|best)[- ]rated)\s+review\s+(?:for|of)\s+(.+?)\s*$/i,
  },
  {
    metric: "review_recent",
    pattern:
      /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:(?:the\s+)?)?(?:(?:most\s+recent|latest|newest))\s+reviews?\s+(?:for|of)\s+(.+?)\s*$/i,
  },
  {
    metric: "review_recent",
    pattern:
      /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:(?:the\s+)?)?(?:(?:most\s+recent|latest|newest))\s+review\s+(?:for|of)\s+(.+?)\s*$/i,
  },
  {
    metric: "review_helpful",
    pattern:
      /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:(?:the\s+)?)?(?:(?:most\s+liked|most\s+helpful|top\s+liked))\s+reviews?\s+(?:for|of)\s+(.+?)\s*$/i,
  },
  {
    metric: "review_helpful",
    pattern:
      /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:(?:the\s+)?)?(?:(?:most\s+liked|most\s+helpful|top\s+liked))\s+review\s+(?:for|of)\s+(.+?)\s*$/i,
  },
];

const TOP_COUNTED_REVIEWS_RE =
  /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:the\s+)?top\s+(\d{1,2})\s+reviews?\s+(?:for|of)\s+(.+?)\s*$/i;

const BARE_COUNTED_REVIEWS_RE =
  /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:the\s+)?(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+reviews?\s*[?.!]*$/i;

const WORD_COUNTS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

function parseReviewCountToken(token: string): number {
  const parsed = Number.parseInt(token, 10);
  if (!Number.isNaN(parsed)) {
    return Math.min(20, Math.max(1, parsed));
  }
  return WORD_COUNTS[token.toLowerCase()] ?? 1;
}

function parseNovelQuery(candidate: string): string | null {
  const normalized = normalizeLookupTitle(candidate.trim());
  if (!normalized || !isUsableNovelQuery(normalized)) return null;
  return normalized;
}

export function isWhoReviewedActiveNovelQuestion(message: string): boolean {
  return WHO_REVIEWED_ACTIVE_RE.test(normalizeLookupQueryText(message).trim());
}

export function resolveNovelScopedReviewRequest(
  message: string
): NovelScopedReviewRequest | null {
  const text = normalizeLookupQueryText(message).trim();
  if (!text) return null;

  if (WHO_REVIEWED_ACTIVE_RE.test(text)) {
    return {
      kind: "who_reviewed",
      novelQuery: null,
      metric: "review_recent",
      count: 25,
      spoilerFreeOnly: false,
      usesActiveNovelContext: true,
    };
  }

  const whoReviewed = text.match(WHO_REVIEWED_TITLE_RE);
  if (whoReviewed?.[1]) {
    const novelQuery = parseNovelQuery(whoReviewed[1]);
    if (!novelQuery) return null;
    return {
      kind: "who_reviewed",
      novelQuery,
      metric: "review_recent",
      count: 25,
      spoilerFreeOnly: false,
      usesActiveNovelContext: false,
    };
  }

  const singularLink = text.match(SINGULAR_REVIEW_LINK_RE);
  if (singularLink?.[1]) {
    const novelQuery = parseNovelQuery(singularLink[1]);
    if (!novelQuery) return null;
    return {
      kind: "review_link",
      novelQuery,
      metric: "review_recent",
      count: 10,
      spoilerFreeOnly: false,
      usesActiveNovelContext: false,
    };
  }

  const pluralLinks = text.match(PLURAL_REVIEW_LINKS_RE);
  if (pluralLinks?.[1]) {
    const novelQuery = parseNovelQuery(pluralLinks[1]);
    if (!novelQuery) return null;
    return {
      kind: "review_links",
      novelQuery,
      metric: "review_recent",
      count: 10,
      spoilerFreeOnly: false,
      usesActiveNovelContext: false,
    };
  }

  const spoilerFree = text.match(SPOILER_FREE_REVIEWS_RE);
  if (spoilerFree?.[1]) {
    const novelQuery = parseNovelQuery(spoilerFree[1]);
    if (!novelQuery) return null;
    return {
      kind: "spoiler_free_list",
      novelQuery,
      metric: "review_recent",
      count: 10,
      spoilerFreeOnly: true,
      usesActiveNovelContext: false,
    };
  }

  const counted = text.match(COUNTED_REVIEWS_RE);
  if (counted?.[1] && counted[2]) {
    const novelQuery = parseNovelQuery(counted[2]);
    if (!novelQuery) return null;
    return {
      kind: "list",
      novelQuery,
      metric: "review_recent",
      count: parseReviewCountToken(counted[1]),
      spoilerFreeOnly: false,
      usesActiveNovelContext: false,
      explicitCountRequest: true,
    };
  }

  const topCounted = text.match(TOP_COUNTED_REVIEWS_RE);
  if (topCounted?.[1] && topCounted[2]) {
    const novelQuery = parseNovelQuery(topCounted[2]);
    if (!novelQuery) return null;
    const count = Math.min(20, Math.max(1, Number.parseInt(topCounted[1], 10)));
    return {
      kind: "list",
      novelQuery,
      metric: "review_recent",
      count,
      spoilerFreeOnly: false,
      usesActiveNovelContext: false,
      explicitCountRequest: true,
    };
  }

  for (const entry of RANKED_REVIEW_PATTERNS) {
    const match = text.match(entry.pattern);
    if (!match?.[1]) continue;
    const novelQuery = parseNovelQuery(match[1]);
    if (!novelQuery) continue;
    const plural = /\breviews\b/i.test(text);
    return {
      kind: plural ? "list" : "ranked",
      novelQuery,
      metric: entry.metric,
      count: plural ? 10 : 1,
      spoilerFreeOnly: false,
      usesActiveNovelContext: false,
    };
  }

  const bareCounted = text.match(BARE_COUNTED_REVIEWS_RE);
  if (bareCounted?.[1]) {
    return {
      kind: "list",
      novelQuery: null,
      metric: "review_recent",
      count: parseReviewCountToken(bareCounted[1]),
      spoilerFreeOnly: false,
      usesActiveNovelContext: true,
      explicitCountRequest: true,
    };
  }

  return null;
}
