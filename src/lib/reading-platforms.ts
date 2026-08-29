import type { ReadingLinkCategory } from "@/types/reading-link";
import { normalizeReadingUrl } from "@/lib/normalize-url";

export interface ReadingPlatformMeta {
  slug: string;
  label: string;
  category: ReadingLinkCategory;
  /** Hostname fragments used to infer platform from a URL. */
  hosts: string[];
}

/**
 * Allowlist of legitimate reading platforms MoonVerse may link to.
 * Anything not on this list (and especially anything on the blocklist) is rejected.
 */
export const READING_PLATFORMS: ReadingPlatformMeta[] = [
  // Official publishers & retailers
  { slug: "webnovel", label: "WebNovel", category: "OFFICIAL", hosts: ["webnovel.com"] },
  { slug: "wuxiaworld", label: "Wuxiaworld", category: "OFFICIAL", hosts: ["wuxiaworld.com"] },
  { slug: "tapas", label: "Tapas", category: "OFFICIAL", hosts: ["tapas.io"] },
  { slug: "radish", label: "Radish", category: "OFFICIAL", hosts: ["radishfiction.com"] },
  { slug: "yonder", label: "Yonder", category: "OFFICIAL", hosts: ["yonderstory.com"] },
  { slug: "kakao-page", label: "KakaoPage", category: "OFFICIAL", hosts: ["page.kakao.com", "kakaopage.com"] },
  { slug: "kakao-webtoon", label: "Kakao Webtoon", category: "OFFICIAL", hosts: ["webtoon.kakao.com", "kakaowebtoon.com"] },
  { slug: "naver-series", label: "Naver Series", category: "OFFICIAL", hosts: ["series.naver.com"] },
  { slug: "munpia", label: "Munpia", category: "OFFICIAL", hosts: ["munpia.com"] },
  { slug: "qidian", label: "Qidian", category: "OFFICIAL", hosts: ["qidian.com"] },
  { slug: "jjwxc", label: "JJWXC", category: "OFFICIAL", hosts: ["jjwxc.net"] },
  { slug: "shueisha", label: "Shueisha", category: "OFFICIAL", hosts: ["shueisha.co.jp", "jumpbookstore.com"] },
  { slug: "alphapolis", label: "AlphaPolis", category: "OFFICIAL", hosts: ["alphapolis.co.jp"] },
  { slug: "syosetu", label: "Syosetu", category: "OFFICIAL", hosts: ["syosetu.com", "ncode.syosetu.com"] },
  { slug: "pixiv-novel", label: "Pixiv Novel", category: "OFFICIAL", hosts: ["pixiv.net"] },
  { slug: "bookwalker", label: "BookWalker", category: "OFFICIAL", hosts: ["bookwalker.jp", "bookwalker.com"] },
  { slug: "kindle", label: "Kindle", category: "OFFICIAL", hosts: ["amazon.com", "amzn.to", "amazon.co.uk", "amazon.co.jp"] },
  { slug: "google-play-books", label: "Google Play Books", category: "OFFICIAL", hosts: ["play.google.com"] },
  { slug: "apple-books", label: "Apple Books", category: "OFFICIAL", hosts: ["books.apple.com"] },
  { slug: "kobo", label: "Kobo", category: "OFFICIAL", hosts: ["kobo.com"] },
  { slug: "barnes-noble", label: "Barnes & Noble Nook", category: "OFFICIAL", hosts: ["barnesandnoble.com"] },
  { slug: "j-novel-club", label: "J-Novel Club", category: "OFFICIAL", hosts: ["j-novel.club"] },
  { slug: "seven-seas", label: "Seven Seas", category: "OFFICIAL", hosts: ["sevenseasentertainment.com"] },
  { slug: "yen-press", label: "Yen Press", category: "OFFICIAL", hosts: ["yenpress.com"] },
  { slug: "viz", label: "Viz", category: "OFFICIAL", hosts: ["viz.com"] },
  { slug: "tappytoon", label: "Tappytoon", category: "OFFICIAL", hosts: ["tappytoon.com"] },
  { slug: "manta", label: "Manta", category: "OFFICIAL", hosts: ["manta.net"] },
  { slug: "pocket-comics", label: "Pocket Comics", category: "OFFICIAL", hosts: ["pocketcomics.com"] },
  { slug: "lezhin", label: "Lezhin Comics", category: "OFFICIAL", hosts: ["lezhinus.com", "lezhin.com"] },
  { slug: "volarenovels", label: "Volare Novels", category: "OFFICIAL", hosts: ["volarenovels.com"] },
  // Legitimate free publishing platforms (authors publish here)
  { slug: "royal-road", label: "Royal Road", category: "OFFICIAL", hosts: ["royalroad.com"] },
  { slug: "scribble-hub", label: "Scribble Hub", category: "OFFICIAL", hosts: ["scribblehub.com"] },
  { slug: "wattpad", label: "Wattpad", category: "OFFICIAL", hosts: ["wattpad.com"] },
  { slug: "archive-of-our-own", label: "Archive of Our Own", category: "OFFICIAL", hosts: ["archiveofourown.org", "ao3.org"] },

  // Community databases / directories
  { slug: "novelupdates", label: "NovelUpdates", category: "COMMUNITY", hosts: ["novelupdates.com"] },
  { slug: "mangaupdates", label: "MangaUpdates", category: "COMMUNITY", hosts: ["mangaupdates.com"] },
  { slug: "goodreads", label: "Goodreads", category: "COMMUNITY", hosts: ["goodreads.com"] },
  { slug: "the-storygraph", label: "The StoryGraph", category: "COMMUNITY", hosts: ["thestorygraph.com"] },
  { slug: "anime-planet", label: "Anime-Planet", category: "COMMUNITY", hosts: ["anime-planet.com"] },
  { slug: "open-library", label: "Open Library", category: "COMMUNITY", hosts: ["openlibrary.org"] },

  // Verified fan-translation hosts (only when actively maintained & legitimate)
  // Add only verified translator sites; generic scraping hosts are not permitted.
];

/**
 * Known pirate / mirror / illegal aggregation hosts.
 * Any URL matching these fragments is rejected even if somehow passed in.
 */
export const BLOCKED_READING_HOSTS: string[] = [
  "webnovelpub",
  "lightnovelworld",
  "novelbin",
  "novelhall",
  "novelfull",
  "readlightnovel",
  "mtlnovel",
  "wuxiaworld.site",
  "wuxiaworldsite",
  "readnovelfull",
  "novelonlinefull",
  "freewebnovel",
  "lightnovelpub",
  "novelpub",
  "fanmtl",
  "novelmania",
  "lnovel",
  "1stkissnovel",
  "allnovel",
  "boxnovel",
  "libread",
  "novelnext",
  "ranobes",
  "novelight",
];

const platformBySlug = new Map(READING_PLATFORMS.map((p) => [p.slug, p]));

export const READING_LINK_GROUP_LABELS: Record<ReadingLinkCategory, string> = {
  OFFICIAL: "Official publishers",
  COMMUNITY: "Community databases",
  FAN_TRANSLATION: "Fan translation",
};

export function getPlatformMeta(slug: string): ReadingPlatformMeta | undefined {
  return platformBySlug.get(slug);
}

export function getPlatformLabel(slug: string): string {
  return (
    platformBySlug.get(slug)?.label ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function isBlockedReadingHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  return BLOCKED_READING_HOSTS.some(
    (fragment) => host === fragment || host.includes(fragment) || host.endsWith(`.${fragment}`)
  );
}

export function inferPlatformFromUrl(url: string): {
  platform: string;
  category: ReadingLinkCategory;
  label: string;
} | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();

    if (isBlockedReadingHost(host)) {
      return null;
    }

    for (const meta of READING_PLATFORMS) {
      if (meta.hosts.some((fragment) => host === fragment || host.endsWith(`.${fragment}`) || host.includes(fragment))) {
        return { platform: meta.slug, category: meta.category, label: meta.label };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export interface ReadingLinkSeed {
  platform: string;
  url: string;
  normalizedUrl: string;
  category: ReadingLinkCategory;
  country?: string;
  language?: string;
  active?: boolean;
  moderationStatus?: "APPROVED" | "PENDING" | "NEEDS_REVIEW" | "REJECTED";
  isOfficial?: boolean;
  isVerified?: boolean;
  label?: string;
}

/** Build a single reading-link row from a catalog URL (rejects unknown & pirate hosts). */
export function buildReadingLinksFromExternalUrl(
  externalLink: string,
  options?: { language?: string; country?: string }
): ReadingLinkSeed[] {
  return buildReadingLinksFromUrls([externalLink], options);
}

/**
 * Build unique reading-link rows from one or more legitimate URLs.
 * Deduplicates by normalized URL (not platform) so Kindle US + Kindle UK both keep.
 * Pass `officialOnly: true` to drop community indexes (NovelUpdates, Open Library, etc.).
 */
export function buildReadingLinksFromUrls(
  urls: string[],
  options?: { language?: string; country?: string; officialOnly?: boolean }
): ReadingLinkSeed[] {
  const byNormalized = new Map<string, ReadingLinkSeed>();

  for (const raw of urls) {
    const url = raw?.trim();
    if (!url) continue;

    const normalizedUrl = normalizeReadingUrl(url);
    if (!normalizedUrl) continue;

    const inferred = inferPlatformFromUrl(url);
    if (!inferred) continue;
    if (options?.officialOnly && inferred.category !== "OFFICIAL") continue;

    if (!byNormalized.has(normalizedUrl)) {
      byNormalized.set(normalizedUrl, {
        platform: inferred.platform,
        url,
        normalizedUrl,
        category: inferred.category,
        language: options?.language,
        country: options?.country,
        active: true,
        moderationStatus: "APPROVED",
        isOfficial: inferred.category === "OFFICIAL",
        isVerified: true,
        label: inferred.label,
      });
    }
  }

  return Array.from(byNormalized.values());
}

/** Prefer an official publisher link for primary CTAs. */
export function pickPrimaryReadingLink<T extends { category: ReadingLinkCategory }>(
  links: T[]
): T | undefined {
  return (
    links.find((l) => l.category === "OFFICIAL") ??
    links.find((l) => l.category === "FAN_TRANSLATION") ??
    links.find((l) => l.category === "COMMUNITY") ??
    links[0]
  );
}
