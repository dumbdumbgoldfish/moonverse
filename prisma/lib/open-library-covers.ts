import type { SeedCatalogEntry } from "./novel-catalog";

const USER_AGENT = "MoonVerse/1.0 (educational; moonverse-seed)";

/**
 * Verified real cover URLs for popular web novels.
 * Prefer publisher CDNs (Wuxiaworld) and Wikimedia where available.
 */
const CURATED_COVERS: Record<string, string> = {
  "reverend insanity":
    "https://upload.wikimedia.org/wikipedia/en/3/36/Reverend_Insanity.webp",
  "i shall seal the heavens":
    "https://cdn.wuxiaworld.com/images/covers/issth.webp",
  "a will eternal": "https://cdn.wuxiaworld.com/images/covers/awe.webp",
  "renegade immortal": "https://cdn.wuxiaworld.com/images/covers/rge.webp",
  "coiling dragon": "https://cdn.wuxiaworld.com/images/covers/cd.webp",
  "desolate era": "https://cdn.wuxiaworld.com/images/covers/de.webp",
  "martial world": "https://cdn.wuxiaworld.com/images/covers/mw.webp",
  "against the gods": "https://cdn.wuxiaworld.com/images/covers/atg.webp",
  "battle through the heavens":
    "https://cdn.wuxiaworld.com/images/covers/btth.webp",
  "perfect world": "https://cdn.wuxiaworld.com/images/covers/pw.webp",
  "wu dong qian kun": "https://cdn.wuxiaworld.com/images/covers/wdqk.webp",
  "spirit realm": "https://cdn.wuxiaworld.com/images/covers/sr.webp",
  "skyfire avenue": "https://cdn.wuxiaworld.com/images/covers/sfl.webp",
  "sovereign of the three realms":
    "https://cdn.wuxiaworld.com/images/covers/sotr.webp",
  "lord of the mysteries":
    "https://upload.wikimedia.org/wikipedia/en/e/e4/Lord_of_Mysteries_web_serial_cover.jpg",
  "lord of mysteries":
    "https://upload.wikimedia.org/wikipedia/en/e/e4/Lord_of_Mysteries_web_serial_cover.jpg",
};

interface OpenLibraryCoverDoc {
  title?: string;
  cover_i?: number;
}

interface OpenLibraryCoverResponse {
  docs?: OpenLibraryCoverDoc[];
}

function needsCoverLookup(coverUrl: string | null | undefined): boolean {
  if (!coverUrl) return true;
  return coverUrl.includes("picsum.photos");
}

function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export { normalizeTitleKey };

/** Hosts we accept as real cover sources (not placeholder art). */
export function isTrustedCoverUrl(
  coverUrl: string,
  _opts?: { title?: string; royalRoadUrl?: string | null }
): boolean {
  void _opts;
  try {
    const host = new URL(coverUrl).hostname.toLowerCase();
    return (
      host.includes("openlibrary.org") ||
      host.includes("wuxiaworld.com") ||
      host.includes("wikimedia.org") ||
      host.includes("wikipedia.org") ||
      host.includes("royalroadcdn.com") ||
      host.includes("royalroad.com") ||
      host.endsWith("amazonaws.com") ||
      host.includes("googleusercontent.com")
    );
  } catch {
    return false;
  }
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripCacheBuster(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("wuxiaworld.com")) {
      parsed.search = "";
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

function titlesLooselyMatch(expected: string, candidate: string): boolean {
  const a = normalizeTitleKey(expected);
  const b = normalizeTitleKey(candidate);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return a.length >= 8 || b.length >= 8;
  const aWords = new Set(a.split(" ").filter((w) => w.length > 2));
  const bWords = b.split(" ").filter((w) => w.length > 2);
  if (aWords.size === 0) return false;
  const overlap = bWords.filter((w) => aWords.has(w)).length;
  return overlap / aWords.size >= 0.7;
}

async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(pageUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html",
      },
      redirect: "follow",
    });
    if (!response.ok) return null;

    const html = await response.text();
    const match =
      html.match(
        /property=["']og:image["']\s+content=["']([^"']+)["']/i
      ) ||
      html.match(
        /content=["']([^"']+)["']\s+property=["']og:image["']/i
      );

    const imageUrl = match?.[1]?.trim();
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) return null;
    return stripCacheBuster(imageUrl);
  } catch {
    return null;
  }
}

function extractWuxiaworldSlug(entry: SeedCatalogEntry): string | null {
  const urls = [entry.externalLink, ...(entry.readingUrls ?? [])];
  for (const url of urls) {
    const match = url.match(/wuxiaworld\.com\/novel\/([^/?#]+)/i);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractRoyalRoadUrl(entry: SeedCatalogEntry): string | null {
  const urls = [entry.externalLink, ...(entry.readingUrls ?? [])];
  for (const url of urls) {
    if (/royalroad\.com\/fiction\//i.test(url)) return url;
  }
  return null;
}

export async function searchWuxiaworldCover(
  title: string,
  slugHint?: string | null
): Promise<string | null> {
  const slug = slugHint || slugifyTitle(title);
  if (!slug) return null;
  return fetchOgImage(`https://www.wuxiaworld.com/novel/${slug}`);
}

export async function searchRoyalRoadCover(
  fictionUrl: string
): Promise<string | null> {
  return fetchOgImage(fictionUrl);
}

export async function searchWikipediaCover(title: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { "User-Agent": USER_AGENT } }
    );
    if (!response.ok) return null;

    const data = (await response.json()) as {
      title?: string;
      description?: string;
      extract?: string;
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
    };

    const blob = `${data.description ?? ""} ${data.extract ?? ""}`.toLowerCase();
    const looksLikeNovel =
      /(novel|web serial|web novel|xianxia|light novel|cultivation)/.test(blob) ||
      titlesLooselyMatch(title, data.title ?? "");

    if (!looksLikeNovel) return null;

    return data.originalimage?.source || data.thumbnail?.source || null;
  } catch {
    return null;
  }
}

export async function searchOpenLibraryCover(
  title: string,
  author: string
): Promise<string | null> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("title", title.slice(0, 120));
  if (author.trim()) url.searchParams.set("author", author.slice(0, 80));
  url.searchParams.set("limit", "5");
  url.searchParams.set("fields", "title,cover_i");

  try {
    const response = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as OpenLibraryCoverResponse;
    const match = (data.docs ?? []).find(
      (doc) => doc.cover_i && titlesLooselyMatch(title, doc.title ?? "")
    );
    if (!match?.cover_i) return null;

    return `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`;
  } catch {
    return null;
  }
}

export async function resolveNovelCoverUrl(
  title: string,
  author: string,
  options?: {
    externalLink?: string;
    readingUrls?: string[];
  }
): Promise<string | null> {
  const curated = CURATED_COVERS[normalizeTitleKey(title)];
  if (curated) return curated;

  const entry: SeedCatalogEntry = {
    title,
    author,
    genreSlug: "fantasy",
    tagSlugs: [],
    coverUrl: null,
    externalLink: options?.externalLink ?? "",
    readingUrls: options?.readingUrls,
    origin: "translated-cn",
  };

  const wwSlug = extractWuxiaworldSlug(entry);
  const wwCover = await searchWuxiaworldCover(title, wwSlug);
  if (wwCover?.includes("cdn.wuxiaworld.com")) return wwCover;

  // Popular CN titles often live on Wuxiaworld even when our link is NovelUpdates.
  if (!wwSlug) {
    const slugCover = await searchWuxiaworldCover(title);
    if (slugCover?.includes("cdn.wuxiaworld.com")) return slugCover;
  }

  const rrUrl = extractRoyalRoadUrl(entry);
  if (rrUrl) {
    const rrCover = await searchRoyalRoadCover(rrUrl);
    if (rrCover) return rrCover;
  }

  const wikiCover = await searchWikipediaCover(title);
  if (wikiCover) return wikiCover;

  return searchOpenLibraryCover(title, author);
}

export interface EnrichCoversOptions {
  /** Max lookups per seed run (rate limiting) */
  limit?: number;
  delayMs?: number;
}

export async function enrichCatalogCovers(
  entries: SeedCatalogEntry[],
  options: EnrichCoversOptions = {}
): Promise<SeedCatalogEntry[]> {
  const limit = options.limit ?? 180;
  const delayMs = options.delayMs ?? 180;
  let resolved = 0;

  const enriched: SeedCatalogEntry[] = [];

  for (const entry of entries) {
    if (resolved >= limit || !needsCoverLookup(entry.coverUrl)) {
      enriched.push(entry);
      continue;
    }

    const coverUrl = await resolveNovelCoverUrl(entry.title, entry.author, {
      externalLink: entry.externalLink,
      readingUrls: entry.readingUrls,
    });
    resolved += 1;

    enriched.push({
      ...entry,
      coverUrl: coverUrl ?? entry.coverUrl,
    });

    await new Promise((r) => setTimeout(r, delayMs));
  }

  return enriched;
}
