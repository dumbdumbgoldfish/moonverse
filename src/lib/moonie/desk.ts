import { WEB_NOVEL_GENRES } from "../genres";
import { WEB_NOVEL_TAGS } from "../tags";
import type {
  MoonieInterpretedPreferences,
  MoonieRecommendation,
} from "../../types/moonie";

function keywordSearchHref(query: string): string {
  const q = query.trim();
  return q ? `/search?q=${encodeURIComponent(q)}` : "/search";
}

function tagSlugFromLabel(value: string): string | null {
  const needle = value.trim().toLowerCase();
  if (!needle) return null;
  const match = WEB_NOVEL_TAGS.find(
    (tag) =>
      tag.slug === needle ||
      tag.name.toLowerCase() === needle ||
      tag.slug.replace(/-/g, " ") === needle
  );
  return match?.slug ?? null;
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

export function resolveGenreSlug(value: string): string | null {
  const needle = value.trim().toLowerCase();
  if (!needle) return null;
  const match = WEB_NOVEL_GENRES.find(
    (genre) =>
      genre.slug === needle || genre.name.toLowerCase() === needle
  );
  return match?.slug ?? null;
}

export function compareDiscoveryHref(
  prefs?: MoonieInterpretedPreferences | null,
  userQuery?: string
): string {
  const genre = (prefs?.genres ?? [])
    .map(resolveGenreSlug)
    .find((slug): slug is string => Boolean(slug));
  const tags = (prefs?.tags ?? [])
    .map((tag) => tagSlugFromLabel(tag))
    .filter((slug): slug is string => Boolean(slug))
    .slice(0, 3);

  const params = new URLSearchParams();
  const q = userQuery?.trim();
  if (genre) params.set("genre", genre);
  if (tags.length) params.set("tags", tags.join(","));
  if (q) params.set("q", q);
  if (params.toString()) {
    if (genre || tags.length) {
      params.set("type", "works");
    }
    return `/search?${params.toString()}`;
  }
  return keywordSearchHref(userQuery ?? "");
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
