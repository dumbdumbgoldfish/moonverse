import { WEB_NOVEL_GENRES } from "../genres";
import { parseSearchQuery } from "../search";
import { extractPreferencesFromMessage } from "./preferences";
import type {
  MoonieInterpretedPreferences,
  MoonieRecommendation,
} from "../../types/moonie";

function keywordSearchHref(query: string): string {
  const q = query.trim();
  return q ? `/search?q=${encodeURIComponent(q)}` : "/search";
}

export const MOONIE_CONSTRAINT =
  "Moonie only ranks novels already in the MoonVerse catalogue. Moonie never writes reviews.";

export const MOONIE_DESK_CHIPS = [
  {
    label: "Something cosy",
    prompt:
      "A comforting found-family or slice-of-life story with a hopeful ending.",
  },
  {
    label: "Dark but hopeful",
    prompt: "Give me something dark but hopeful.",
  },
  {
    label: "Completed GL",
    prompt: "I want a completed GL romance with a strong female lead.",
  },
  {
    label: "No harem",
    prompt: "Recommend a cultivation novel without harem.",
  },
  {
    label: "Fast-paced escape",
    prompt: "I want an intense, fast-paced novel.",
  },
  {
    label: "Surprise me",
    prompt:
      "Surprise me with something outside my usual genres but still a good match.",
  },
] as const;

function normalizeDeskChipText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[.!?…]+$/, "")
    .trim()
    .toLowerCase();
}

const MOONIE_DESK_CHIP_TEXT = new Set(
  MOONIE_DESK_CHIPS.flatMap((chip) => [
    normalizeDeskChipText(chip.label),
    normalizeDeskChipText(chip.prompt),
  ]),
);

/** Desk / empty-state vibe chips must route to recommendations, not catalogue lookup. */
export function isMoonieDeskChipPrompt(message: string): boolean {
  return MOONIE_DESK_CHIP_TEXT.has(normalizeDeskChipText(message));
}

/** Short helper + curated chips for the floating widget panel only. */
export const MOONIE_WIDGET_HELPER = "Ask for a novel, link, or review";

export const MOONIE_WIDGET_CHIPS = [
  {
    label: "Find a novel",
    prompt: "Help me find a novel in the MoonVerse catalogue.",
  },
  {
    label: "Where to read",
    prompt: "Where can I read it?",
  },
  {
    label: "Compare novels",
    prompt: "Compare two novels from the catalogue.",
  },
  {
    label: "Surprise me",
    prompt:
      "Surprise me with something outside my usual genres but still a good match.",
  },
] as const;

const MOONIE_GENERIC_DISCOVERY_TEXT = new Set(
  [
    MOONIE_WIDGET_CHIPS[0],
    MOONIE_WIDGET_CHIPS[3],
    {
      label: "Find a novel",
      prompt: "Help me find a novel.",
    },
    {
      label: "Find a novel",
      prompt: "Help me find a novel in the catalogue.",
    },
  ].flatMap((chip) => [
    normalizeDeskChipText(chip.label),
    normalizeDeskChipText(chip.prompt),
  ])
);

/**
 * Widget/desk starters that ask for discovery, not a catalogue title.
 * "Where to read" and "Compare novels" are not included.
 */
export function isMoonieGenericDiscoveryPrompt(message: string): boolean {
  if (isMoonieDeskChipPrompt(message)) return true;
  return MOONIE_GENERIC_DISCOVERY_TEXT.has(normalizeDeskChipText(message));
}

export function resolveGenreSlug(value: string): string | null {
  const needle = value.trim().toLowerCase();
  if (!needle) return null;
  const match = WEB_NOVEL_GENRES.find(
    (genre) =>
      genre.slug === needle || genre.name.toLowerCase() === needle
  );
  return match?.slug ?? null;
}

const CONVERSATIONAL_DISCOVERY_RE =
  /\b(recommend(?:ation)?s?|suggest|discover|surprise me|what should i read|pick(?:s)? for me|want to read|in the mood|show me|give me|find me|looking for|i want|i need)\b/i;
const SIMILARITY_REQUEST_RE = /\b(similar to|something like|more like)\b/i;

/**
 * Translate a Moonie request only when Search can represent it honestly.
 * Saved/session preferences are intentionally excluded: Search URL facets
 * come solely from the current user message.
 */
export function compareDiscoveryHref(userQuery?: string): string | null {
  const query = userQuery?.trim();
  if (!query) return null;

  if (SIMILARITY_REQUEST_RE.test(query)) return null;
  const parsed = parseSearchQuery(query);
  const explicit = extractPreferencesFromMessage(query);
  const hasExplicitPreference =
    explicit.genres.length > 0 ||
    explicit.tags.length > 0 ||
    Boolean(explicit.status || explicit.language || explicit.length) ||
    explicit.mood.length > 0 ||
    explicit.excludedTags.length > 0;
  const hasUnsupportedConstraint =
    Boolean(explicit.status || explicit.language || explicit.length) ||
    explicit.mood.length > 0 ||
    explicit.excludedTags.length > 0;
  const hasAlternativeFacets =
    /\bor\b/i.test(query) &&
    explicit.genres.length + explicit.tags.length > 1;
  if (hasUnsupportedConstraint || hasAlternativeFacets) return null;

  if (parsed.genreSlug || parsed.tagSlugs.length > 0) {
    const params = new URLSearchParams();
    if (parsed.genreSlug) params.set("genre", parsed.genreSlug);
    if (parsed.tagSlugs.length) params.set("tags", parsed.tagSlugs.join(","));
    params.set("type", "works");
    return `/search?${params.toString()}`;
  }

  if (hasExplicitPreference || CONVERSATIONAL_DISCOVERY_RE.test(query)) {
    return null;
  }

  return keywordSearchHref(query);
}

export function compareDiscoveryCtaLabel(href: string): string {
  const params = new URL(href, "https://moonverse.local").searchParams;
  return params.has("q") ? "Search this title" : "Open these filters in Search";
}

export function tasteUsedLabels(
  prefs?: MoonieInterpretedPreferences | null
): string[] {
  if (!prefs) return [];
  return [
    ...prefs.genres,
    ...prefs.tags,
    ...prefs.mood,
    prefs.status,
    prefs.length,
  ].filter((value): value is string => Boolean(value && value.trim()));
}

export function slateDiversityLine(
  recommendations: MoonieRecommendation[],
  hiddenCount = 0
): string {
  const titles = recommendations.length;
  const genres = new Set(
    recommendations.flatMap((item) => item.genres).filter(Boolean)
  );
  const parts = [
    `${titles} ${titles === 1 ? "title" : "titles"}`,
    `${genres.size} ${genres.size === 1 ? "genre" : "genres"}`,
    "0 invented titles",
  ];
  if (hiddenCount > 0) {
    parts.push(
      `${hiddenCount} marked not for me stay hidden`
    );
  }
  return parts.join(" · ");
}

export function previousUserContent(
  messages: { role: string; content: string }[],
  index: number
): string {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") return messages[i].content;
  }
  return "";
}
