import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fallbackCoverUrl } from "./open-library";
import { getEnglishWebCatalog, type EnglishWebNovel } from "./english-web-novels";
import {
  getTranslatedCnCatalog,
  type TranslatedCnNovel,
  type TranslationSource,
} from "./translated-cn-novels";
import {
  primaryOfficialReadingUrl,
  resolveVerifiedReadingUrls,
} from "./verified-reading-links";

export type CatalogOrigin = "translated-cn" | "royal-road" | "open-library";

export interface SeedCatalogEntry {
  title: string;
  author: string;
  genreSlug: string;
  secondaryGenreSlug?: string;
  tagSlugs: string[];
  coverUrl: string | null;
  /** Prefer an official publisher URL when available; may be empty. */
  externalLink: string;
  /**
   * Verified OFFICIAL publisher reading URLs only.
   * Never includes NovelUpdates / Open Library / guessed links.
   * Empty when no verified official source exists.
   */
  readingUrls?: string[];
  origin: CatalogOrigin;
  source?: TranslationSource;
}

export interface RealWorldCatalogFile {
  version: number;
  generatedAt: string;
  sources: string[];
  novels: SeedCatalogEntry[];
}

export const REAL_WORLD_CATALOG_PATH = join(process.cwd(), "prisma/data/real-world-catalog.json");

export function translatedCnToCatalogEntry(novel: TranslatedCnNovel): SeedCatalogEntry {
  const candidates = [novel.externalLink, ...(novel.extraLinks ?? [])];
  const readingUrls = resolveVerifiedReadingUrls(novel.title, candidates);
  const externalLink = primaryOfficialReadingUrl(novel.title, candidates) ?? "";

  return {
    title: novel.title,
    author: novel.author,
    genreSlug: novel.genreSlug,
    secondaryGenreSlug: novel.secondaryGenreSlug,
    tagSlugs: [...new Set([...novel.tagSlugs, "translated-cn", "chinese-original"])],
    coverUrl: fallbackCoverUrl(`cn-${novel.title}`),
    externalLink,
    readingUrls,
    origin: "translated-cn",
    source: novel.source,
  };
}

export function englishWebToCatalogEntry(novel: EnglishWebNovel): SeedCatalogEntry {
  const readingUrls = resolveVerifiedReadingUrls(novel.title, [novel.externalLink]);
  return {
    title: novel.title,
    author: novel.author,
    genreSlug: novel.genreSlug,
    secondaryGenreSlug: novel.secondaryGenreSlug,
    tagSlugs: [...new Set([...novel.tagSlugs, "english-original", "royal-road"])],
    coverUrl: fallbackCoverUrl(`rr-${novel.title}`),
    externalLink: readingUrls[0] ?? novel.externalLink,
    readingUrls,
    origin: "royal-road",
  };
}

export function buildTranslatedCnCatalog(): SeedCatalogEntry[] {
  return getTranslatedCnCatalog().map(translatedCnToCatalogEntry);
}

export function buildEnglishWebCatalog(): SeedCatalogEntry[] {
  return getEnglishWebCatalog().map(englishWebToCatalogEntry);
}

/** Curated real-world web novel metadata (CN translations + Royal Road originals) */
export function buildRealWorldCatalog(): SeedCatalogEntry[] {
  return mergeCatalogEntries(buildTranslatedCnCatalog(), buildEnglishWebCatalog());
}

export function loadRealWorldCatalogFromFile(): SeedCatalogEntry[] | null {
  try {
    const raw = readFileSync(REAL_WORLD_CATALOG_PATH, "utf8");
    const parsed = JSON.parse(raw) as RealWorldCatalogFile;
    if (!Array.isArray(parsed.novels) || parsed.novels.length === 0) {
      return null;
    }
    // Re-resolve official links so stale NovelUpdates entries in the JSON are not imported.
    return parsed.novels.map((novel) => {
      const readingUrls = resolveVerifiedReadingUrls(novel.title, [
        novel.externalLink,
        ...(novel.readingUrls ?? []),
      ]);
      return {
        ...novel,
        readingUrls,
        externalLink: readingUrls[0] ?? "",
      };
    });
  } catch {
    return null;
  }
}

export function exportRealWorldCatalogFile(): RealWorldCatalogFile {
  const novels = buildRealWorldCatalog();
  const payload: RealWorldCatalogFile = {
    version: 2,
    generatedAt: new Date().toISOString(),
    sources: ["wuxiaworld", "webnovel", "royalroad", "openlibrary-covers"],
    novels,
  };

  mkdirSync(dirname(REAL_WORLD_CATALOG_PATH), { recursive: true });
  writeFileSync(REAL_WORLD_CATALOG_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

export function mergeCatalogEntries(
  primary: SeedCatalogEntry[],
  secondary: SeedCatalogEntry[]
): SeedCatalogEntry[] {
  const seen = new Set<string>();
  const merged: SeedCatalogEntry[] = [];

  for (const entry of [...primary, ...secondary]) {
    const key = entry.title.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(entry);
  }

  return merged;
}
