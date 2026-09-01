import type { MoonieInterpretedPreferences } from "@/types/moonie";

export interface MooniePersonalizationSettings {
  useSavedNovels: boolean;
  useSavedReviews: boolean;
  useReadingList: boolean;
  useLikes: boolean;
  useFollowedReviewers: boolean;
  useSearchHistory: boolean;
}

export const DEFAULT_PERSONALIZATION_SETTINGS: MooniePersonalizationSettings = {
  useSavedNovels: true,
  useSavedReviews: true,
  useReadingList: true,
  useLikes: true,
  useFollowedReviewers: true,
  useSearchHistory: true,
};

export interface MoonieSessionPreferences {
  genres?: string[];
  tags?: string[];
  mood?: string[];
  excludedTags?: string[];
  status?: string | null;
  language?: string | null;
  length?: string | null;
}

const SESSION_PREFS_KEY = "mv-moonie-session-prefs";

export function readSessionPreferences(): MoonieSessionPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MoonieSessionPreferences;
  } catch {
    return null;
  }
}

export function writeSessionPreferences(
  prefs: MoonieSessionPreferences | null
): void {
  if (typeof window === "undefined") return;
  if (!prefs || Object.keys(prefs).length === 0) {
    sessionStorage.removeItem(SESSION_PREFS_KEY);
  } else {
    sessionStorage.setItem(SESSION_PREFS_KEY, JSON.stringify(prefs));
  }
  window.dispatchEvent(new Event("mv-moonie-session-prefs-change"));
}

export function clearSessionPreferences(): void {
  writeSessionPreferences(null);
}

export function mergeSessionWithLongTermPrefs(options: {
  longTerm: MoonieInterpretedPreferences;
  session?: MoonieSessionPreferences | null;
}): MoonieInterpretedPreferences {
  const session = options.session;
  if (!session) return options.longTerm;

  return {
    genres: [...new Set([...options.longTerm.genres, ...(session.genres ?? [])])],
    tags: [...new Set([...options.longTerm.tags, ...(session.tags ?? [])])],
    mood: [...new Set([...options.longTerm.mood, ...(session.mood ?? [])])],
    excludedTags: [
      ...new Set([
        ...options.longTerm.excludedTags,
        ...(session.excludedTags ?? []),
      ]),
    ],
    status: session.status ?? options.longTerm.status,
    language: session.language ?? options.longTerm.language,
    length: session.length ?? options.longTerm.length,
    influencedBy: options.longTerm.influencedBy,
  };
}

export function extractSessionPreferencesFromMessage(
  message: string
): MoonieSessionPreferences | null {
  const lower = message.toLowerCase();
  const prefs: MoonieSessionPreferences = {};

  if (/\b(completed only|finished only)\b/i.test(message)) {
    prefs.status = "completed";
  }
  if (/\b(low romance|less romance|no romance)\b/i.test(lower)) {
    prefs.excludedTags = [...(prefs.excludedTags ?? []), "romance"];
  }
  if (/\b(psychological|dark fantasy|slow.?burn)\b/i.test(lower)) {
    const tag = lower.includes("psychological")
      ? "psychological"
      : lower.includes("slow")
        ? "slow-burn"
        : "dark";
    prefs.tags = [...(prefs.tags ?? []), tag];
  }
  if (/\b(tonight|this search|this turn|for now|right now|this chat)\b/i.test(lower)) {
    if (/\bromance\b/i.test(lower)) {
      prefs.tags = ["romance"];
    }
    if (/\bdark(er)?\b/i.test(lower)) {
      prefs.mood = ["dark"];
    }
  }

  return Object.keys(prefs).length > 0 ? prefs : null;
}

export function shouldOfferRememberPreference(
  message: string,
  extracted?: Partial<MoonieInterpretedPreferences> | null
): boolean {
  if (!extracted) return false;
  const hasNew =
    (extracted.excludedTags?.length ?? 0) > 0 ||
    (extracted.tags?.length ?? 0) > 0 ||
    (extracted.genres?.length ?? 0) > 0;
  if (!hasNew) return false;
  return /\b(dislike|avoid|don't like|hate|usually prefer|generally|always want|never want)\b/i.test(
    message
  );
}

const REMEMBER_PROMPT_DISMISSED_KEY = "mv-moonie-remember-prompt-dismissed";

export function isRememberPromptDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(REMEMBER_PROMPT_DISMISSED_KEY) === "1";
}

export function dismissRememberPrompt(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(REMEMBER_PROMPT_DISMISSED_KEY, "1");
}

export function formatSessionPreferenceSummary(
  prefs: MoonieSessionPreferences | null | undefined
): string | null {
  if (!prefs) return null;
  const parts: string[] = [];

  if (prefs.status === "completed") parts.push("Completed only");
  if (prefs.status === "ongoing") parts.push("Ongoing only");

  for (const tag of prefs.tags ?? []) {
    if (/romance/i.test(tag) && prefs.excludedTags?.some((t) => /romance/i.test(t))) {
      continue;
    }
    parts.push(tag.replace(/-/g, " "));
  }

  for (const mood of prefs.mood ?? []) {
    parts.push(mood.replace(/-/g, " "));
  }

  for (const genre of prefs.genres ?? []) {
    parts.push(genre.replace(/-/g, " "));
  }

  for (const tag of prefs.excludedTags ?? []) {
    if (/romance/i.test(tag)) parts.push("Low romance");
    else parts.push(`No ${tag.replace(/-/g, " ")}`);
  }

  if (prefs.language) parts.push(prefs.language);

  if (parts.length === 0) return null;
  return [...new Set(parts)].slice(0, 5).join(" · ");
}

export function mergeSessionPreferencePatch(
  current: MoonieSessionPreferences | null,
  patch: MoonieSessionPreferences
): MoonieSessionPreferences {
  return {
    genres: [...new Set([...(current?.genres ?? []), ...(patch.genres ?? [])])],
    tags: [...new Set([...(current?.tags ?? []), ...(patch.tags ?? [])])],
    mood: [...new Set([...(current?.mood ?? []), ...(patch.mood ?? [])])],
    excludedTags: [
      ...new Set([...(current?.excludedTags ?? []), ...(patch.excludedTags ?? [])]),
    ],
    status: patch.status ?? current?.status ?? null,
    language: patch.language ?? current?.language ?? null,
    length: patch.length ?? current?.length ?? null,
  };
}

export const NEGATIVE_FEEDBACK_REASONS = [
  "Too much romance",
  "Wrong genre",
  "Already read",
  "Too long",
  "Not dark enough",
  "Too slow",
] as const;

export type NegativeFeedbackReason = (typeof NEGATIVE_FEEDBACK_REASONS)[number];
