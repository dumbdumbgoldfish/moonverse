function normalizeTaskText(message: string): string {
  return message
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u2032`´]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type MoonieCatalogueEntity = "reviews" | "novels";

export type MoonieRankingMetric =
  | "review_rating"
  | "review_helpful"
  | "review_recent"
  | "novel_review_count"
  | "novel_average_rating";

export type MoonieCatalogueTaskKind =
  | "top_reviews"
  | "salon_reviews"
  | "for_you_shelf_reviews"
  | "most_reviewed_novel"
  | "highest_rated_novels";

export interface MoonieCatalogueTask {
  kind: MoonieCatalogueTaskKind;
  entity: MoonieCatalogueEntity;
  metric: MoonieRankingMetric | null;
  count: number;
  amongThese: boolean;
  needsRankingClarification: boolean;
}

const NUMBER_WORDS: Record<string, number> = {
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

const AMONG_THESE_RE =
  /\b(?:among|between|of these|from these|in this list|these picks|these results|these recommendations|already shown|you showed)\b/i;

const TOP_REVIEWS_RE =
  /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:the\s+)?(?:top|best)\s+(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:novel\s+)?reviews?\s*[?.!]*$/i;

const MOST_REVIEWED_NOVEL_RE =
  /^(?:what|which)\s+novel\s+has\s+the\s+most\s+reviews?\s*[?.!]*$/i;

const MOST_REVIEWED_NOVELS_RE =
  /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:the\s+)?(?:top\s+\d{1,2}\s+)?novels?\s+with\s+the\s+most\s+reviews?\s*[?.!]*$/i;

const HIGHEST_RATED_NOVELS_RE =
  /^(?:(?:give|get|show)(?:\s+me)?\s+)?(?:the\s+)?(?:top\s+\d{1,2}\s+)?highest[- ]rated\s+novels?\s*[?.!]*$/i;

const REVIEW_RANK_RATING_RE =
  /^(?:(?:rank(?:ed)?|sort(?:ed)?)\s+(?:them|reviews?)?\s+)?(?:by\s+)?(?:highest[- ]?rated|rating|most\s+highly\s+rated)\s*[?.!]*$/i;

const REVIEW_RANK_RECENT_RE =
  /^(?:(?:rank(?:ed)?|sort(?:ed)?)\s+(?:them|reviews?)?\s+)?(?:by\s+)?(?:most\s+recent|newest|latest|recency)\s*[?.!]*$/i;

const REVIEW_RANK_HELPFUL_RE =
  /^(?:(?:rank(?:ed)?|sort(?:ed)?)\s+(?:them|reviews?)?\s+)?(?:by\s+)?(?:most\s+helpful|helpfulness|likes|most\s+liked)\s*[?.!]*$/i;

const SALON_REVIEW_RECOMMEND_RE =
  /\b(?:spoiler[- ]aware|moonverse\s+salon|(?:the\s+)?salon)\b/i;

const FOR_YOU_SHELF_REVIEWS_RE = /\bfor you shelves?\b/i;

function parseCountToken(token: string | undefined, fallback: number): number {
  if (!token) return fallback;
  const word = NUMBER_WORDS[token.toLowerCase()];
  if (word) return Math.min(20, Math.max(1, word));
  const parsed = Number.parseInt(token, 10);
  if (Number.isFinite(parsed)) return Math.min(20, Math.max(1, parsed));
  return fallback;
}

function stripAmongThese(text: string): string {
  return text
    .replace(
      /\s+(?:among|between|of|from)\s+(?:these|this\s+list|these\s+picks|these\s+results|these\s+recommendations)\b/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function messageRestrictsToReferencedSet(message: string): boolean {
  return AMONG_THESE_RE.test(normalizeTaskText(message));
}

export function resolveReviewRankingMetric(
  message: string
): Extract<
  MoonieRankingMetric,
  "review_rating" | "review_helpful" | "review_recent"
> | null {
  const text = normalizeTaskText(message);
  if (REVIEW_RANK_HELPFUL_RE.test(text)) return "review_helpful";
  if (REVIEW_RANK_RECENT_RE.test(text)) return "review_recent";
  if (REVIEW_RANK_RATING_RE.test(text)) return "review_rating";
  return null;
}

export function resolveCatalogueTask(
  message: string
): MoonieCatalogueTask | null {
  const text = normalizeTaskText(message);
  if (!text) return null;

  const amongThese = messageRestrictsToReferencedSet(text);
  const core = amongThese ? stripAmongThese(text) : text;

  const topReviews = core.match(TOP_REVIEWS_RE);
  if (topReviews) {
    const count = parseCountToken(topReviews[1], 5);
    return {
      kind: "top_reviews",
      entity: "reviews",
      metric: null,
      count,
      amongThese,
      needsRankingClarification: true,
    };
  }

  if (
    SALON_REVIEW_RECOMMEND_RE.test(core) &&
    /\breviews?\b/i.test(core) &&
    /\b(recommend|suggest|show|find|match|binge)\b/i.test(core)
  ) {
    return {
      kind: "salon_reviews",
      entity: "reviews",
      metric: null,
      count: 5,
      amongThese,
      needsRankingClarification: false,
    };
  }

  if (
    FOR_YOU_SHELF_REVIEWS_RE.test(core) &&
    /\breviews?\b/i.test(core) &&
    /\b(recommend|match|suggest|show)\b/i.test(core)
  ) {
    return {
      kind: "for_you_shelf_reviews",
      entity: "reviews",
      metric: null,
      count: 5,
      amongThese,
      needsRankingClarification: false,
    };
  }

  if (MOST_REVIEWED_NOVEL_RE.test(core) || MOST_REVIEWED_NOVELS_RE.test(core)) {
    return {
      kind: "most_reviewed_novel",
      entity: "novels",
      metric: "novel_review_count",
      count: 1,
      amongThese,
      needsRankingClarification: false,
    };
  }

  if (HIGHEST_RATED_NOVELS_RE.test(core)) {
    const countMatch = core.match(/\btop\s+(\d{1,2})\b/i);
    return {
      kind: "highest_rated_novels",
      entity: "novels",
      metric: "novel_average_rating",
      count: parseCountToken(countMatch?.[1], 5),
      amongThese,
      needsRankingClarification: false,
    };
  }

  return null;
}

export function isCatalogueTaskMessage(message: string): boolean {
  return resolveCatalogueTask(message) != null;
}

export function isTopReviewsRequest(message: string): boolean {
  return resolveCatalogueTask(message)?.kind === "top_reviews";
}

export function isSalonReviewsRequest(message: string): boolean {
  return resolveCatalogueTask(message)?.kind === "salon_reviews";
}

export function isForYouShelfReviewsRequest(message: string): boolean {
  return resolveCatalogueTask(message)?.kind === "for_you_shelf_reviews";
}

export function isMostReviewedNovelRequest(message: string): boolean {
  return resolveCatalogueTask(message)?.kind === "most_reviewed_novel";
}

export function isHighestRatedNovelsRequest(message: string): boolean {
  return resolveCatalogueTask(message)?.kind === "highest_rated_novels";
}
