import { genreBrowseHref } from "@/lib/genres";

export const LANDING_GENRE_DOOR_SLUGS = [
  "fantasy",
  "xianxia",
  "comedy",
  "action",
  "sci-fi",
  "litrpg",
  "cultivation",
] as const;

export const LANDING_SLOW_BURN_SLUG = "slow-burn";

export const LANDING_GENRE_BLURBS: Record<string, string> = {
  fantasy: "Courts, magic, and worlds that refuse to stay small.",
  xianxia: "Immortals, sects, and the climb past mortal limits.",
  comedy: "Banter, chaos, and the joke that lands on chapter sixty.",
  action: "Fights, stakes, and pages that refuse to sit still.",
  "sci-fi": "Future tech, strange worlds, and ideas that bite back.",
  litrpg: "Stats, skills, and stories that play by game rules.",
  cultivation: "Power earned one realm at a time.",
  "slow-burn": "Feelings that take the long way home.",
};

export const LANDING_SLOW_BURN_HREF = "/search?tags=slow-burn&type=works";

export function landingGenreHref(slug: string): string {
  return slug === LANDING_SLOW_BURN_SLUG
    ? LANDING_SLOW_BURN_HREF
    : genreBrowseHref(slug);
}

export function landingGenreBlurb(slug: string): string {
  return LANDING_GENRE_BLURBS[slug] ?? "Open this door and see what is on the shelf.";
}

export function formatShelfCount(titles: number, reviews: number): string {
  const titlePart = titles === 1 ? "1 title" : `${Math.max(0, titles)} titles`;
  if (reviews <= 0) return titlePart;
  const reviewPart = reviews === 1 ? "1 review" : `${reviews} reviews`;
  return `${titlePart} · ${reviewPart}`;
}

export function normalizeNovelTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function scoreLandingDoorFace(input: {
  missingCover: boolean;
  reviewCount: number;
  readingLinkCount: number;
  curated: boolean;
}): number {
  return (
    (input.curated ? 200 : 0) +
    (input.readingLinkCount > 0 ? 80 : 0) +
    (input.missingCover ? 0 : 10) +
    Math.min(Math.max(0, input.reviewCount), 30)
  );
}

/** Close-night faces must be curated web novels or titles with a verified reading link. */
export function isCloseNightShelfCandidate(input: {
  curated: boolean;
  readingLinkCount: number;
}): boolean {
  return input.curated || input.readingLinkCount > 0;
}
