import { genreLabel, WEB_NOVEL_GENRES } from "@/lib/genres";
import { WEB_NOVEL_TAGS } from "@/lib/tags";
import {
  SEARCH_RESULT_TYPES,
  SEARCH_SORTS,
  type SearchResultType,
  type SearchSort,
} from "@/types/search";

export const SEARCH_RECENT_GUEST_SCOPE = "guest";
export const SEARCH_RECENT_KEY_PREFIX = "moonverse:search-recent:";
/** Legacy unscoped key from before per-account storage. */
export const SEARCH_RECENT_KEY = "moonverse:search-recent";
export const SEARCH_RECENT_CHANGE_EVENT = "moonverse:search-recent-change";
export const SEARCH_RECENT_LIMIT = 8;
export const SEARCH_MIN_QUERY_LENGTH = 2;

export function getSearchRecentScope(userId?: string | null): string {
  const cleaned = userId?.trim();
  return cleaned ? cleaned : SEARCH_RECENT_GUEST_SCOPE;
}

export function searchRecentStorageKey(scope?: string | null): string {
  return `${SEARCH_RECENT_KEY_PREFIX}${getSearchRecentScope(scope)}`;
}

function purgeLegacySearchRecentStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SEARCH_RECENT_KEY);
  } catch {
    // ignore
  }
}

function migrateLegacyToGuestIfNeeded(): void {
  if (typeof window === "undefined") return;
  try {
    const legacyRaw = window.localStorage.getItem(SEARCH_RECENT_KEY);
    if (!legacyRaw) return;
    const guestKey = searchRecentStorageKey(SEARCH_RECENT_GUEST_SCOPE);
    if (!window.localStorage.getItem(guestKey)) {
      window.localStorage.setItem(guestKey, legacyRaw);
    }
    window.localStorage.removeItem(SEARCH_RECENT_KEY);
  } catch {
    // ignore
  }
}

function prepareSearchRecentStorage(scope?: string | null): string {
  const resolvedScope = getSearchRecentScope(scope);
  if (resolvedScope === SEARCH_RECENT_GUEST_SCOPE) {
    migrateLegacyToGuestIfNeeded();
  } else {
    purgeLegacySearchRecentStorage();
  }
  return searchRecentStorageKey(resolvedScope);
}

/** `/search` with a query, or `/search` when the box is empty: never `?q=`. */
export function searchHref(query: string): string {
  const q = query.trim();
  return q ? `/search?q=${encodeURIComponent(q)}` : "/search";
}

export type SearchFacets = {
  genre: string | null;
  tags: string[];
  handle: string | null;
  author: string | null;
  quoted: string | null;
};

export function searchInterpretationLabels(
  facets: SearchFacets,
  query: string
): { key: string; label: string }[] {
  const chips: { key: string; label: string }[] = [];
  if (facets.quoted) {
    chips.push({ key: "quoted", label: `Exact “${facets.quoted}”` });
  }
  if (facets.author) {
    chips.push({ key: "author", label: `Author ${facets.author}` });
  }
  if (facets.handle) {
    chips.push({ key: "handle", label: `@${facets.handle}` });
  }
  if (facets.genre) {
    chips.push({
      key: "genre",
      label: `Genre: ${facetLabel(facets.genre, "genre")}`,
    });
  }
  for (const tag of facets.tags) {
    chips.push({
      key: `tag:${tag}`,
      label: `Trope: ${facetLabel(tag, "tag")}`,
    });
  }
  if (chips.length === 0 && query.trim()) {
    chips.push({ key: "text", label: "Title, author, alias, and catalog text" });
  }
  return chips;
}

export type RecentSearch = {
  query: string;
  coverUrl?: string;
  novelId?: string;
};

export interface ParsedSearchQuery {
  raw: string;
  text: string;
  quoted: string | null;
  handle: string | null;
  author: string | null;
  genreSlug: string | null;
  tagSlugs: string[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueSlugs(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

export function parseSearchType(
  value: string | null | undefined
): SearchResultType {
  if (value === "profiles") return "people";
  if (value && (SEARCH_RESULT_TYPES as readonly string[]).includes(value)) {
    return value as SearchResultType;
  }
  return "all";
}

export function parseSearchSort(value: string | null | undefined): SearchSort {
  if (value && (SEARCH_SORTS as readonly string[]).includes(value)) {
    return value as SearchSort;
  }
  return "relevance";
}

export function tagSlugFromInput(value: string): string | null {
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

export function parseTagSlugs(tags?: string, legacyTag?: string): string[] {
  const fromTags = (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const merged = [...fromTags];
  const legacy = legacyTag?.trim();
  if (legacy && !merged.includes(legacy)) merged.push(legacy);
  return uniqueSlugs(
    merged.map((value) => tagSlugFromInput(value) ?? value).slice(0, 3)
  );
}

export function parseSearchQuery(rawInput: string): ParsedSearchQuery {
  let rest = rawInput.trim();
  let quoted: string | null = null;
  let handle: string | null = null;
  let author: string | null = null;

  const quotedMatch = rest.match(/"([^"]+)"|'([^']+)'/);
  if (quotedMatch) {
    quoted = (quotedMatch[1] || quotedMatch[2] || "").trim() || null;
    rest = rest.replace(quotedMatch[0], " ").trim();
  }

  const handleMatch = rest.match(/@([a-zA-Z0-9_]{2,30})/);
  if (handleMatch) {
    handle = handleMatch[1] ?? null;
    rest = rest.replace(handleMatch[0], " ").trim();
  }

  const byMatch = rest.match(/\bby\s+([^,]+)$/i);
  if (byMatch?.[1]) {
    const maybeAuthor = byMatch[1].trim();
    if (maybeAuthor.length >= 2 && maybeAuthor.length <= 60) {
      author = maybeAuthor;
      rest = rest.slice(0, byMatch.index).trim();
    }
  }

  const { rest: leftover, genreSlug, tagSlugs } = extractCatalogFacets(rest);

  return {
    raw: rawInput.trim(),
    text: leftover,
    quoted,
    handle,
    author,
    genreSlug,
    tagSlugs,
  };
}

function extractCatalogFacets(text: string): {
  rest: string;
  genreSlug: string | null;
  tagSlugs: string[];
} {
  let rest = text;
  let genreSlug: string | null = null;
  const tagSlugs: string[] = [];

  const catalog: { kind: "genre" | "tag"; slug: string; needles: string[] }[] = [
    ...WEB_NOVEL_GENRES.map((genre) => ({
      kind: "genre" as const,
      slug: genre.slug,
      needles: [genre.name, genre.slug.replace(/-/g, " ")],
    })),
    ...WEB_NOVEL_TAGS.map((tag) => ({
      kind: "tag" as const,
      slug: tag.slug,
      needles: [tag.name, tag.slug.replace(/-/g, " ")],
    })),
  ].sort(
    (a, b) =>
      Math.max(...b.needles.map((n) => n.length)) -
      Math.max(...a.needles.map((n) => n.length))
  );

  for (const item of catalog) {
    for (const needle of item.needles) {
      if (needle.trim().length < 3) continue;
      const re = new RegExp(`(?:^|\\s)${escapeRegExp(needle)}(?=\\s|$)`, "i");
      if (!re.test(rest)) continue;
      rest = rest.replace(re, " ");
      if (item.kind === "genre" && !genreSlug) genreSlug = item.slug;
      if (item.kind === "tag") tagSlugs.push(item.slug);
      break;
    }
  }

  return {
    rest: rest.replace(/\s+/g, " ").trim(),
    genreSlug,
    tagSlugs: uniqueSlugs(tagSlugs).slice(0, 3),
  };
}

export function searchLexicalQuery(parsed: ParsedSearchQuery): string {
  return (parsed.quoted || parsed.text || parsed.author || parsed.handle || "").trim();
}

export function hasSearchIntent(
  parsed: ParsedSearchQuery,
  urlGenre?: string | null,
  urlTags?: string[]
): boolean {
  return Boolean(
    parsed.raw ||
      parsed.quoted ||
      parsed.handle ||
      parsed.author ||
      parsed.genreSlug ||
      parsed.tagSlugs.length ||
      urlGenre ||
      (urlTags && urlTags.length)
  );
}

export function trigramSimilarity(a: string, b: string): number {
  const left = trigrams(a);
  const right = trigrams(b);
  if (left.size === 0 || right.size === 0) return 0;
  let overlap = 0;
  for (const gram of left) {
    if (right.has(gram)) overlap += 1;
  }
  return overlap / (left.size + right.size - overlap);
}

function trigrams(value: string): Set<string> {
  const padded = `  ${value.toLowerCase().replace(/\s+/g, " ").trim()} `;
  const grams = new Set<string>();
  for (let i = 0; i < padded.length - 2; i += 1) {
    grams.add(padded.slice(i, i + 3));
  }
  return grams;
}

export function scoreTitleMatch(title: string, query: string): number {
  const t = title.trim().toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 55;
  return Math.round(trigramSimilarity(t, q) * 45);
}

export function notifyRecentSearchChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SEARCH_RECENT_CHANGE_EVENT));
}

function writeRecentSearchEntries(
  entries: RecentSearch[],
  scope?: string | null
): boolean {
  try {
    const storageKey = prepareSearchRecentStorage(scope);
    localStorage.setItem(storageKey, JSON.stringify(entries));
    notifyRecentSearchChange();
    return true;
  } catch {
    return false;
  }
}

export function readRecentSearchEntries(scope?: string | null): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const storageKey = prepareSearchRecentStorage(scope);
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return parseRecentSearches(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function parseRecentSearches(raw: unknown): RecentSearch[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const entries: RecentSearch[] = [];
  for (const item of raw) {
    let entry: RecentSearch | null = null;
    if (typeof item === "string") {
      const query = item.trim();
      if (query) entry = { query };
    } else if (item && typeof item === "object" && "query" in item) {
      const query = String((item as { query?: unknown }).query ?? "").trim();
      if (!query) continue;
      const coverUrl =
        typeof (item as { coverUrl?: unknown }).coverUrl === "string"
          ? (item as { coverUrl: string }).coverUrl
          : undefined;
      const novelId =
        typeof (item as { novelId?: unknown }).novelId === "string"
          ? (item as { novelId: string }).novelId
          : undefined;
      entry = { query, coverUrl, novelId };
    }
    if (!entry) continue;
    const key = entry.query.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(entry);
    if (entries.length >= SEARCH_RECENT_LIMIT) break;
  }
  return entries;
}

export function readRecentSearches(scope?: string | null): string[] {
  return readRecentSearchEntries(scope).map((entry) => entry.query);
}

export function rememberSearch(
  query: string,
  preview?: { coverUrl?: string; novelId?: string },
  scope?: string | null
): boolean {
  const cleaned = query.trim();
  if (cleaned.length < SEARCH_MIN_QUERY_LENGTH) return false;
  const rest = readRecentSearchEntries(scope).filter(
    (item) => item.query.toLowerCase() !== cleaned.toLowerCase()
  );
  const next: RecentSearch[] = [
    {
      query: cleaned,
      coverUrl: preview?.coverUrl,
      novelId: preview?.novelId,
    },
    ...rest,
  ].slice(0, SEARCH_RECENT_LIMIT);
  return writeRecentSearchEntries(next, scope);
}

export function forgetSearch(query: string, scope?: string | null): boolean {
  const cleaned = query.trim().toLowerCase();
  if (!cleaned) return false;
  const next = readRecentSearchEntries(scope).filter(
    (item) => item.query.toLowerCase() !== cleaned
  );
  return writeRecentSearchEntries(next, scope);
}

export function clearRecentSearches(scope?: string | null): boolean {
  try {
    const storageKey = prepareSearchRecentStorage(scope);
    localStorage.removeItem(storageKey);
    notifyRecentSearchChange();
    return true;
  } catch {
    return false;
  }
}

export type SearchPagingKind = "works" | "reviews" | "people" | "lists";

export function searchPagingKind(
  type: SearchResultType,
  totals: { works: number; reviews: number; people: number; lists: number }
): SearchPagingKind {
  if (type !== "all") return type;
  if (totals.works > 0) return "works";
  if (totals.reviews > 0) return "reviews";
  if (totals.people > 0) return "people";
  return "lists";
}

/** Compact group size: ~1–2 screenfuls, fewer cards on smaller viewports. */
export function searchPageSize(kind: SearchPagingKind, width: number): number {
  if (kind === "reviews") return width >= 1024 ? 4 : width >= 640 ? 2 : 1;
  if (kind === "people" || kind === "lists") return width >= 1024 ? 4 : 2;
  return width >= 1024 ? 6 : width >= 640 ? 4 : 2;
}

/** Larger batch for scrollable search results (API max 24). */
export function searchBatchSize(kind: SearchPagingKind, width: number): number {
  return Math.min(24, searchPageSize(kind, width) + 6);
}

export function parseSearchPage(value: string | null | undefined): number {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

export function searchTypeLabel(type: SearchResultType): string {
  switch (type) {
    case "works":
      return "Works";
    case "reviews":
      return "Reviews";
    case "people":
      return "People";
    case "lists":
      return "Lists";
    default:
      return "All";
  }
}

export function searchSortLabel(sort: SearchSort): string {
  switch (sort) {
    case "most-reviewed":
      return "Most reviewed";
    case "highest-rated":
      return "Highest rated";
    case "recent":
      return "Recently reviewed";
    default:
      return "Relevance";
  }
}

export function facetLabel(slug: string, kind: "genre" | "tag"): string {
  if (kind === "genre") return genreLabel(slug);
  return (
    WEB_NOVEL_TAGS.find((tag) => tag.slug === slug)?.name ??
    slug.replace(/-/g, " ")
  );
}

const RELATED_STARTERS = [
  "slow burn",
  "found family",
  "enemies to lovers",
  "cultivation",
  "villainess",
  "isekai",
] as const;

/** Query chips for empty dropdown / search landing. */
export function starterSearchQueries(): string[] {
  return [...RELATED_STARTERS];
}

/** Related searches derived from the current query and hit metadata. */
export function relatedSearchSuggestions(
  query: string,
  works: { author: string; genres: string[]; tags: string[] }[],
  didYouMean?: string | null
): string[] {
  const q = query.trim();
  const seen = new Set<string>([q.toLowerCase()]);
  const out: string[] = [];

  const push = (value: string) => {
    const cleaned = value.replace(/\s+/g, " ").trim();
    if (cleaned.length < 3) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(cleaned);
  };

  if (didYouMean) push(didYouMean);
  for (const work of works.slice(0, 4)) {
    if (work.genres[0] && q) push(`${q} ${work.genres[0]}`);
    if (work.tags[0] && q) push(`${q} ${work.tags[0]}`);
    if (work.author) push(`by ${work.author}`);
  }
  for (const starter of RELATED_STARTERS) {
    if (q && !q.toLowerCase().includes(starter)) push(`${q} ${starter}`);
  }
  return out.slice(0, 6);
}

export function splitHighlight(text: string, query: string): { text: string; match: boolean }[] {
  const q = query.trim();
  if (!q || q.length < 2) return [{ text, match: false }];
  const token = q.split(/\s+/).sort((a, b) => b.length - a.length)[0] ?? q;
  if (token.length < 2) return [{ text, match: false }];
  const re = new RegExp(`(${escapeRegExp(token)})`, "ig");
  return text.split(re).filter(Boolean).map((part) => ({
    text: part,
    match: part.toLowerCase() === token.toLowerCase(),
  }));
}
