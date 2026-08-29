import { genreLabel } from "@/lib/genres";
import { LOGIN_GATED_SORTS, type ReviewSort } from "@/types/review";

export const DISCOVER_LAYOUTS = ["comfortable", "compact", "covers"] as const;
export type DiscoverLayout = (typeof DISCOVER_LAYOUTS)[number];

export const DEFAULT_DISCOVER_LAYOUT: DiscoverLayout = "comfortable";
export const DISCOVER_LAYOUT_STORAGE_KEY = "moonverse:discover-layout";
export const SALON_FIRST_VISIT_KEY = "moonverse:salon-visited";

export type DiscoverTab = "reviews" | "profiles";

export const DISCOVER_SORT_OPTIONS: {
  value: ReviewSort;
  label: string;
  group: "everyone" | "for-you";
}[] = [
  { value: "trending", label: "Trending", group: "everyone" },
  { value: "latest", label: "Latest", group: "everyone" },
  { value: "highest-rated", label: "Highest rated", group: "everyone" },
  { value: "most-discussed", label: "Most discussed", group: "everyone" },
  { value: "most-saved", label: "Most saved", group: "everyone" },
  { value: "most-shared", label: "Most shared", group: "everyone" },
  { value: "for-you", label: "Personal recommendation", group: "for-you" },
  { value: "following", label: "Following", group: "for-you" },
  { value: "from-saves", label: "Because you saved", group: "for-you" },
  { value: "hidden-gems", label: "Hidden gems", group: "for-you" },
];

const GATED_SORT_SET = new Set<ReviewSort>(LOGIN_GATED_SORTS);

export function isGatedDiscoverSort(sort: ReviewSort): boolean {
  return GATED_SORT_SET.has(sort);
}

export function discoverSortLabel(sort: ReviewSort): string {
  return DISCOVER_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Trending";
}

export function parseDiscoverLayout(
  value: string | null | undefined
): DiscoverLayout {
  if (value && (DISCOVER_LAYOUTS as readonly string[]).includes(value)) {
    return value as DiscoverLayout;
  }
  return DEFAULT_DISCOVER_LAYOUT;
}

export function readStoredDiscoverLayout(): DiscoverLayout {
  if (typeof window === "undefined") return DEFAULT_DISCOVER_LAYOUT;
  try {
    const stored = localStorage.getItem(DISCOVER_LAYOUT_STORAGE_KEY);
    if (stored) {
      return parseDiscoverLayout(stored);
    }
    const visited = localStorage.getItem(SALON_FIRST_VISIT_KEY);
    if (!visited) {
      return DEFAULT_DISCOVER_LAYOUT;
    }
    return DEFAULT_DISCOVER_LAYOUT;
  } catch {
    return DEFAULT_DISCOVER_LAYOUT;
  }
}

export function markSalonVisited(): void {
  try {
    localStorage.setItem(SALON_FIRST_VISIT_KEY, "1");
  } catch {
    // Ignore storage failures.
  }
}

export function storeDiscoverLayout(layout: DiscoverLayout): void {
  try {
    localStorage.setItem(DISCOVER_LAYOUT_STORAGE_KEY, layout);
  } catch {
    // Private mode / quota: layout still works for the session via URL/state.
  }
}

export interface DiscoverShelfInput {
  sort: ReviewSort;
  tab: DiscoverTab;
  query: string;
  genreSlug: string | null;
  tagNames: string[];
  spoilerFree: boolean;
  hasOfficialLink: boolean;
}

export function discoverShelfCopy(input: DiscoverShelfInput): {
  kicker: string;
  title: string;
  blurb: string;
} {
  if (input.tab === "profiles") {
    return {
      kicker: "People",
      title: input.query.trim()
        ? `Reviewers matching “${input.query.trim()}”`
        : "Readers worth following",
      blurb: "Find reviewers whose taste you want in your circle.",
    };
  }

  const genreName = input.genreSlug ? genreLabel(input.genreSlug) : null;
  const query = input.query.trim();
  const tropes = input.tagNames.slice(0, 3);

  if (query) {
    return {
      kicker: "Search",
      title: `Results for “${query}”`,
      blurb: "Reviews, titles, and reviewers that match what you typed.",
    };
  }

  if (genreName && tropes.length > 0) {
    return {
      kicker: genreName,
      title: `${genreName} with ${tropes.join(", ")}`,
      blurb: shelfBlurb(input.sort, input.spoilerFree, input.hasOfficialLink),
    };
  }

  if (genreName) {
    return {
      kicker: "Genre shelf",
      title: `${genreName} shelf`,
      blurb: shelfBlurb(input.sort, input.spoilerFree, input.hasOfficialLink),
    };
  }

  if (tropes.length > 0) {
    return {
      kicker: "Tropes",
      title: tropes.length === 1 ? `${tropes[0]} stories` : tropes.join(" · "),
      blurb: shelfBlurb(input.sort, input.spoilerFree, input.hasOfficialLink),
    };
  }

  if (input.spoilerFree) {
    return {
      kicker: "Spoiler-free",
      title: "Safe to browse",
      blurb: "Reviews marked spoiler-free, ranked for this shelf.",
    };
  }

  if (input.hasOfficialLink) {
    return {
      kicker: "Where to read",
      title: "Officially linked stories",
      blurb: "Works with a verified or official reading link.",
    };
  }

  return {
    kicker: "Browse",
    title: defaultShelfTitle(input.sort),
    blurb: shelfBlurb(input.sort, false, false),
  };
}

function defaultShelfTitle(sort: ReviewSort): string {
  switch (sort) {
    case "latest":
      return "Fresh from the community";
    case "for-you":
      return "Picked for your taste";
    case "following":
      return "From people you follow";
    case "from-saves":
      return "Because you saved similar";
    case "hidden-gems":
      return "Quietly loved";
    case "highest-rated":
      return "Highest rated this season";
    case "most-discussed":
      return "What readers are arguing about";
    case "most-saved":
      return "Saved to the most shelves";
    case "most-shared":
      return "Passed from reader to reader";
    case "trending":
    default:
      return "What’s catching fire";
  }
}

function shelfBlurb(
  sort: ReviewSort,
  spoilerFree: boolean,
  hasOfficialLink: boolean
): string {
  const extras = [
    spoilerFree ? "spoiler-free" : null,
    hasOfficialLink ? "with official links" : null,
  ].filter(Boolean);
  const suffix = extras.length ? ` ${extras.join(", ")}.` : ".";
  switch (sort) {
    case "latest":
      return `Newest community reviews${suffix}`;
    case "for-you":
      return `Ranked from your saves, likes, and follows${suffix}`;
    case "following":
      return `Latest from reviewers in your circle${suffix}`;
    case "from-saves":
      return `Close to stories you already kept${suffix}`;
    case "hidden-gems":
      return `Strong reviews that have not gone loud yet${suffix}`;
    default:
      return `Community reviews, ranked for this shelf${suffix}`;
  }
}

export function buildMoonieShelfPrompt(input: {
  genreName?: string | null;
  tagNames: string[];
  novelTitles: string[];
}): string {
  const titles = input.novelTitles.filter(Boolean).slice(0, 4);
  const parts = ["Recommend a next read from the MoonVerse catalog."];
  if (input.genreName) {
    parts.push(`Stay close to ${input.genreName}.`);
  }
  if (input.tagNames.length > 0) {
    parts.push(`Lean into ${input.tagNames.slice(0, 3).join(", ")}.`);
  }
  if (titles.length > 0) {
    parts.push(`Nearby on this shelf: ${titles.join("; ")}.`);
  }
  parts.push("Name in-catalog titles only, with a short why.");
  return parts.join(" ");
}

export function buildMoonieSimilarPrompt(novelTitle: string, author: string): string {
  return `Recommend novels similar to “${novelTitle}” by ${author}. Stay in the MoonVerse catalog and give a short why.`;
}
