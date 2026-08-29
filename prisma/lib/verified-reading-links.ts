/**
 * Verified official reading links only.
 *
 * Rules:
 * - Never invent or guess URLs
 * - Never auto-add NovelUpdates / Open Library / Goodreads
 * - Only OFFICIAL publisher platforms from the allowlist
 * - If nothing verified exists, return []
 */

import { inferPlatformFromUrl } from "../../src/lib/reading-platforms";
import { normalizeReadingUrl } from "../../src/lib/normalize-url";

const ww = (slug: string) => `https://www.wuxiaworld.com/novel/${slug}`;
const wn = (bookId: string) => `https://www.webnovel.com/book/${bookId}`;
const rr = (id: number, slug: string) =>
  `https://www.royalroad.com/fiction/${id}/${slug}`;

/**
 * Title → verified official publisher URLs.
 * Keys must be passed through normalizeTitleKey (no apostrophes).
 * Only entries with known real listing paths / book IDs already used in MoonVerse.
 * Multiple sources are allowed when the same novel is genuinely published on each.
 */
const VERIFIED_OFFICIAL_BY_TITLE: Record<string, string[]> = {
  // Wuxiaworld (confirmed via existing catalog / publisher CDN covers)
  "coiling dragon": [ww("coiling-dragon")],
  "desolate era": [ww("desolate-era")],
  "stellar transformations": [ww("stellar-transformations")],
  "i shall seal the heavens": [ww("i-shall-seal-the-heavens")],
  "a will eternal": [ww("a-will-eternal")],
  "renegade immortal": [ww("renegade-immortal")],
  "martial world": [ww("martial-world")],
  "against the gods": [ww("against-the-gods")],
  "battle through the heavens": [ww("battle-through-the-heavens")],
  "perfect world": [ww("perfect-world")],
  "wu dong qian kun": [ww("wu-dong-qian-kun")],
  "spirit realm": [ww("spirit-realm")],
  "skyfire avenue": [ww("skyfire-avenue")],
  "sovereign of the three realms": [ww("sovereign-of-the-three-realms")],

  // Webnovel (book IDs already present in translated-cn catalog)
  "the kings avatar": [wn("the-king-s-avatar_203739")],
  "martial god asura": [wn("martial-god-asura_860891")],

  // Royal Road (fiction IDs from english-web-novels catalog)
  "mother of learning": [rr(21220, "mother-of-learning")],
  "the wandering inn": [rr(8503, "the-wandering-inn")],
  "dungeon crawler carl": [rr(4009, "dungeon-crawler-carl")],
  "he who fights with monsters": [rr(42183, "he-who-fights-with-monsters")],
  "azarinth healer": [rr(26356, "azarinth-healer")],
  "beware of chicken": [rr(50358, "beware-of-chicken")],
  "defiance of the fall": [rr(39408, "defiance-of-the-fall")],
  "the primal hunter": [rr(36019, "the-primal-hunter")],
};

function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** True when the URL maps to an OFFICIAL allowlisted publisher (not community indexes). */
export function isOfficialReadingUrl(url: string): boolean {
  const inferred = inferPlatformFromUrl(url);
  return inferred?.category === "OFFICIAL";
}

/**
 * Keep only unique official publisher URLs.
 * Drops NovelUpdates, Open Library, Goodreads and any unknown / pirate hosts.
 */
export function filterOfficialReadingUrls(urls: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const raw of urls) {
    const url = raw?.trim();
    if (!url) continue;
    if (!isOfficialReadingUrl(url)) continue;
    const normalized = normalizeReadingUrl(url);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(url);
  }

  return out;
}

/**
 * Resolve reading links for a novel:
 * 1) curated verified multi-source map (highest trust)
 * 2) plus any candidate URLs that are already official publisher links
 *
 * Returns [] when nothing verified exists: never invents placeholders.
 */
export function resolveVerifiedReadingUrls(
  title: string,
  candidateUrls: Array<string | null | undefined> = []
): string[] {
  const curated = VERIFIED_OFFICIAL_BY_TITLE[normalizeTitleKey(title)] ?? [];
  return filterOfficialReadingUrls([...curated, ...candidateUrls]);
}

/** Preferred primary CTA URL (first official), or null. */
export function primaryOfficialReadingUrl(
  title: string,
  candidateUrls: Array<string | null | undefined> = []
): string | null {
  return resolveVerifiedReadingUrls(title, candidateUrls)[0] ?? null;
}
