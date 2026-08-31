import type { MoonieSpoilerMode } from "@/types/moonie";
import type {
  MoonieCommunityInsight,
  MoonieNovelOverview,
  MoonieRecommendation,
} from "@/types/moonie";

export const MOONIE_SPOILER_STORAGE_KEY = "mv-moonie-spoiler-mode";
export const DEFAULT_SPOILER_MODE: MoonieSpoilerMode = "none";

export const SPOILER_MODE_LABELS: Record<MoonieSpoilerMode, string> = {
  none: "No spoilers",
  light: "Light spoilers",
  full: "Full discussion",
};

export function normalizeSpoilerMode(
  value: string | null | undefined
): MoonieSpoilerMode {
  if (value === "light" || value === "full") return value;
  return "none";
}

const spoilerModeListeners = new Set<() => void>();

function notifySpoilerModeListeners() {
  for (const listener of spoilerModeListeners) {
    listener();
  }
}

export function readStoredSpoilerMode(): MoonieSpoilerMode {
  if (typeof window === "undefined") return DEFAULT_SPOILER_MODE;
  try {
    return normalizeSpoilerMode(
      localStorage.getItem(MOONIE_SPOILER_STORAGE_KEY)
    );
  } catch {
    return DEFAULT_SPOILER_MODE;
  }
}

export function getStoredSpoilerModeServerSnapshot(): MoonieSpoilerMode {
  return DEFAULT_SPOILER_MODE;
}

export function subscribeStoredSpoilerMode(onStoreChange: () => void): () => void {
  spoilerModeListeners.add(onStoreChange);

  function onStorage(event: StorageEvent) {
    if (event.key !== null && event.key !== MOONIE_SPOILER_STORAGE_KEY) {
      return;
    }
    onStoreChange();
  }

  if (typeof window !== "undefined") {
    try {
      window.addEventListener("storage", onStorage);
    } catch {
      // Storage subscription is optional when the browser API is unavailable.
    }
  }

  return () => {
    spoilerModeListeners.delete(onStoreChange);
    if (typeof window !== "undefined") {
      try {
        window.removeEventListener("storage", onStorage);
      } catch {
        // ignore
      }
    }
  };
}

export function writeStoredSpoilerMode(mode: MoonieSpoilerMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MOONIE_SPOILER_STORAGE_KEY, mode);
    notifySpoilerModeListeners();
  } catch {
    // ignore quota errors
  }
}

export function cycleSpoilerMode(current: MoonieSpoilerMode): MoonieSpoilerMode {
  if (current === "none") return "light";
  if (current === "light") return "full";
  return "none";
}

export const SPOILER_MARKED_REVIEW_LABEL = "Spoiler-marked review";

const MODE_ONLY_EXACT_RE = [
  /^(?:no spoilers?|spoiler[- ]?free|keep it spoiler[- ]?free|without spoilers?|spoiler[- ]?safe|no plot spoilers?)$/i,
  /^(?:please\s+)?(?:keep|stay)\s+it\s+spoiler[- ]?free$/i,
  /^(?:light spoilers?(?:\s+only)?|mild spoilers?)$/i,
  /^light spoilers?\s+only$/i,
  /^(?:full discussion|full spoilers?|discuss everything)$/i,
] as const;

/** User declined a spoiler-mode switch — do not parse as a positive mode command. */
export function isSpoilerModeNegationMessage(message: string): boolean {
  const text = message.trim().toLowerCase().replace(/[.!?]+$/g, "");
  if (!text) return false;
  return (
    /\b(?:don't|do not|never|not)\s+(?:switch|enable|use|go)\s+(?:to\s+)?(?:full|light)(?:\s+discussion|\s+spoilers?)?\b/i.test(
      text
    ) ||
    /\bno\s+full\s+(?:discussion|spoilers?)\b/i.test(text) ||
    (/\b(?:stay|keep)\s+spoiler[- ]?safe\b/i.test(text) &&
      /\b(?:don't|do not|never|not)\b/i.test(text))
  );
}

/** Questions about spoiler modes — never change preference. */
export function isSpoilerModeQuestion(message: string): boolean {
  const text = message.trim().toLowerCase();
  if (!/\b(?:spoiler|discussion)\b/i.test(text)) return false;
  return (
    /^(?:what|which|how|should|can|could|would|is|are|do|does)\b/.test(text) ||
    text.endsWith("?")
  );
}

/** Parse spoiler preference embedded in a mixed task message. */
export function parseSpoilerPreferenceFromMixedMessage(
  message: string
): MoonieSpoilerMode | null {
  const text = message.trim().toLowerCase();
  if (
    /\bwithout spoilers?\b/i.test(text) ||
    /\bspoiler[- ]?free\b/i.test(text) ||
    /\bno spoilers?\b/i.test(text)
  ) {
    return "none";
  }
  if (
    /\blight spoilers?\s+only\b/i.test(text) ||
    /\b(?:only|just)\s+light spoilers?\b/i.test(text)
  ) {
    return "light";
  }
  if (
    /\bfull discussion\b/i.test(text) &&
    !/\b(?:don't|do not|never|not)\b/i.test(text)
  ) {
    return "full";
  }
  return null;
}

/** Parse an unambiguous spoiler-mode command from natural language. */
export function parseSpoilerModeFromMessage(
  message: string
): MoonieSpoilerMode | null {
  const text = message.trim().toLowerCase().replace(/[.!?]+$/g, "");
  if (!text) return null;

  if (isSpoilerModeNegationMessage(message) || isSpoilerModeQuestion(message)) {
    return null;
  }

  for (const pattern of MODE_ONLY_EXACT_RE) {
    if (pattern.test(text)) {
      if (pattern.source.includes("full")) return "full";
      if (pattern.source.includes("light")) return "light";
      return "none";
    }
  }

  if (/\b(?:please\s+)?(?:keep|stay)\s+it\s+spoiler[- ]?free\b/i.test(text)) {
    return "none";
  }

  if (
    /^(?:light spoilers?(?:\s+only)?|mild spoilers?)$/i.test(text) ||
    /\blight spoilers?\s+only\b/i.test(text)
  ) {
    return "light";
  }

  if (/^(?:full discussion|full spoilers?|discuss everything)$/i.test(text)) {
    return "full";
  }

  return parseSpoilerPreferenceFromMixedMessage(message);
}

/** True when the message only sets spoiler shield preference — not a catalogue title. */
export function isSpoilerModeOnlyMessage(message: string): boolean {
  const parsed = parseSpoilerModeFromMessage(message);
  if (!parsed) return false;

  const text = message.trim();
  if (
    /\b(?:recommend|suggest|show me|find|compare|tell me about|reviews? for|give me)\b/i.test(
      text
    )
  ) {
    return false;
  }

  const normalized = text.toLowerCase().replace(/[.!?]+$/g, "");
  if (MODE_ONLY_EXACT_RE.some((pattern) => pattern.test(normalized))) {
    return true;
  }
  if (/^(?:please\s+)?(?:keep|stay)\s+it\s+spoiler[- ]?free$/i.test(normalized)) {
    return true;
  }

  const stripped = normalized
    .replace(
      /\b(?:no spoilers?|spoiler[- ]?free|without spoilers?|light spoilers?(?:\s+only)?|full discussion|please|keep it spoiler[- ]?free)\b/g,
      ""
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return stripped.length === 0;
}

export function sanitizeReviewTitleForMode(options: {
  title: string;
  containsSpoilers: boolean;
  mode: MoonieSpoilerMode;
}): string {
  if (!options.containsSpoilers || options.mode === "full") {
    return options.title;
  }
  return SPOILER_MARKED_REVIEW_LABEL;
}

export function sanitizeReviewExcerpt(options: {
  title: string;
  body: string;
  containsSpoilers: boolean;
  mode: MoonieSpoilerMode;
  maxLength?: number;
}): string | null {
  const max = options.maxLength ?? 180;
  const { mode, containsSpoilers, body } = options;

  if (mode === "none") {
    if (containsSpoilers) return null;
    const trimmed = body.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, max) + (trimmed.length > max ? "…" : "");
  }

  if (mode === "light") {
    if (containsSpoilers) {
      return `${SPOILER_MARKED_REVIEW_LABEL} — open the novel page for details`;
    }
    const trimmed = body.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, max) + (trimmed.length > max ? "…" : "");
  }

  const trimmed = body.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max * 1.5) + (trimmed.length > max * 1.5 ? "…" : "");
}

function previewLooksUnsafeForStoredCommunity(
  preview: MoonieCommunityInsight["previews"][number],
  mode: MoonieSpoilerMode
): boolean {
  if (mode === "full") return false;
  if (preview.title === SPOILER_MARKED_REVIEW_LABEL) return false;
  if (/spoiler-marked review/i.test(preview.excerpt)) return false;
  if (
    preview.title.length > 0 &&
    preview.excerpt.includes(preview.title) &&
    preview.title.length > 12
  ) {
    return true;
  }
  return false;
}

/** Stored consensus cannot be re-verified under stricter modes without a DB refresh. */
function shouldWithholdStoredConsensus(mode: MoonieSpoilerMode): boolean {
  return mode !== "full";
}

function excerptLooksLikeUnverifiedSpoilerContent(excerpt: string): boolean {
  const text = excerpt.trim();
  if (!text) return false;
  if (/spoiler-marked review/i.test(text)) return true;
  return /\b(dies|killed|death|twist|ending|villain wins|spoiler)\b/i.test(text);
}

export function sanitizeCommunityInsightForMode(
  community: MoonieCommunityInsight | null | undefined,
  mode: MoonieSpoilerMode,
  options?: { unverifiedStoredFallback?: boolean }
): MoonieCommunityInsight | null {
  if (!community) return null;
  if (mode === "full") return community;

  const failClosedStored = options?.unverifiedStoredFallback === true;

  const previews = community.previews
    .map((preview) => {
      if (preview.title === SPOILER_MARKED_REVIEW_LABEL && mode === "none") {
        return null;
      }
      const unsafe = failClosedStored
        ? Boolean(preview.excerpt.trim() || preview.title.trim())
        : previewLooksUnsafeForStoredCommunity(preview, mode) ||
          excerptLooksLikeUnverifiedSpoilerContent(preview.excerpt) ||
          excerptLooksLikeUnverifiedSpoilerContent(preview.title);
      if (unsafe) {
        if (mode === "none") return null;
        return {
          ...preview,
          title: SPOILER_MARKED_REVIEW_LABEL,
          excerpt: `${SPOILER_MARKED_REVIEW_LABEL} — open the novel page for details`,
        };
      }
      return preview;
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  const consensus = shouldWithholdStoredConsensus(mode) ? null : community.consensus;

  return {
    ...community,
    previews,
    consensus,
    praised: shouldWithholdStoredConsensus(mode) ? [] : community.praised,
    criticised: shouldWithholdStoredConsensus(mode) ? [] : community.criticised,
    mixed: shouldWithholdStoredConsensus(mode) ? [] : community.mixed,
    divisive: shouldWithholdStoredConsensus(mode) ? [] : community.divisive,
  };
}

export function sanitizeNovelOverviewForMode(
  overview: MoonieNovelOverview | null | undefined,
  mode: MoonieSpoilerMode
): MoonieNovelOverview | undefined {
  if (!overview) return undefined;
  if (mode === "full" || !overview.community) return overview;
  const community = sanitizeCommunityInsightForMode(overview.community, mode);
  return { ...overview, community };
}

export function sanitizeRecommendationsForSpoilerMode(
  recommendations: MoonieRecommendation[],
  mode: MoonieSpoilerMode
): MoonieRecommendation[] {
  if (mode === "full") return recommendations;
  return recommendations.map((rec) => {
    if (!rec.community) return rec;
    return {
      ...rec,
      community: sanitizeCommunityInsightForMode(rec.community, mode),
    };
  });
}

/** Whether a completed response should update client spoiler storage. */
export function shouldSyncClientSpoilerModeFromResponse(options: {
  reply: string;
  serverMode: MoonieSpoilerMode;
  modeAtSend: MoonieSpoilerMode;
  modeNow: MoonieSpoilerMode;
}): boolean {
  if (/spoiler shield set to/i.test(options.reply)) return true;
  if (options.modeNow !== options.modeAtSend) return false;
  return options.serverMode !== options.modeAtSend;
}

export function spoilerConstraintForOpenAI(mode: MoonieSpoilerMode): string {
  if (mode === "none") {
    return "Do not reveal plot spoilers, twists, deaths, or major story outcomes. Keep discussion to premise, tone, tags, and community ratings only.";
  }
  if (mode === "light") {
    return "Avoid major plot spoilers. You may mention broad themes and early-setup details only.";
  }
  return "The user opted into full discussion. You may discuss plot details when grounded in catalogue or review data.";
}

export function shouldOfferSpoilerModeSwitch(message: string): boolean {
  return /\b(spoiler|plot twist|ending|who dies|what happens)\b/i.test(message);
}

const STORED_SPOILER_PLACEHOLDER =
  "Spoiler-marked review — open the novel page for details.";

/** Re-sanitize spoiler-marked review payloads when restoring desk history. */
export function sanitizeStoredRankedReviewsForMode(
  reviews: import("@/types/moonie").MoonieRankedReview[] | undefined,
  mode: MoonieSpoilerMode
): import("@/types/moonie").MoonieRankedReview[] | undefined {
  if (!reviews?.length) return reviews;
  return reviews.map((review) => {
    if (!review.containsSpoilers || mode === "full") {
      return review;
    }
    const excerpt =
      sanitizeReviewExcerpt({
        title: review.title,
        body: review.excerpt,
        containsSpoilers: review.containsSpoilers,
        mode,
        maxLength: 500,
      }) ?? STORED_SPOILER_PLACEHOLDER;
    return {
      ...review,
      title: sanitizeReviewTitleForMode({
        title: review.title,
        containsSpoilers: review.containsSpoilers,
        mode,
      }),
      excerpt,
    };
  });
}
