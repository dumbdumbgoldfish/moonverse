import { slugify } from "@/lib/slugify";

export const TAG_NAME_MIN = 2;
export const TAG_NAME_MAX = 64;
export const TAG_FUZZY_THRESHOLD = 0.82;

export interface TagCandidate {
  id: string;
  name: string;
  slug?: string;
}

export type TagMatchType = "exact" | "slug" | "compact" | "fuzzy";

export interface SimilarTagMatch {
  tag: TagCandidate;
  score: number;
  matchType: TagMatchType;
}

export interface TagSimilarityResult {
  normalizedName: string;
  compactKey: string;
  slug: string;
  exactMatch: SimilarTagMatch | null;
  slugMatch: SimilarTagMatch | null;
  compactMatch: SimilarTagMatch | null;
  fuzzyMatches: SimilarTagMatch[];
}

export type TagSuggestionBlockCode =
  | "INVALID"
  | "EXACT_EXISTS"
  | "SLUG_EXISTS"
  | "COMPACT_EXISTS"
  | "PENDING_DUPLICATE"
  | "GLOBAL_PENDING";

export function normalizeTagName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function tagSlug(value: string): string {
  return slugify(normalizeTagName(value));
}

export function tagCompactKey(value: string): string {
  return tagSlug(value).replace(/-/g, "");
}

export function validateTagNameInput(raw: string): string | null {
  const normalized = normalizeTagName(raw);

  if (!normalized) {
    return "Enter a tag name before suggesting.";
  }

  if (normalized.length < TAG_NAME_MIN) {
    return `Tag names must be at least ${TAG_NAME_MIN} characters.`;
  }

  if (normalized.length > TAG_NAME_MAX) {
    return `Tag names must be ${TAG_NAME_MAX} characters or fewer.`;
  }

  if (/spoiler/i.test(normalized)) {
    return "Spoiler-related tags are not allowed in the catalogue.";
  }

  if (!/[a-zA-Z0-9]/.test(normalized)) {
    return "Tag names must include at least one letter or number.";
  }

  if (/^[\s\W_]+$/.test(normalized)) {
    return "Tag names cannot be punctuation only.";
  }

  return null;
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

export function similarityScore(a: string, b: string): number {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (!left || !right) return 0;
  if (left === right) return 1;
  const distance = levenshteinDistance(left, right);
  const maxLen = Math.max(left.length, right.length);
  return maxLen === 0 ? 0 : 1 - distance / maxLen;
}

function toCandidate(tag: TagCandidate): TagCandidate & { slug: string; compactKey: string } {
  const slug = tag.slug ?? tagSlug(tag.name);
  return {
    ...tag,
    slug,
    compactKey: slug.replace(/-/g, ""),
  };
}

export function findSimilarTags(
  rawInput: string,
  candidates: TagCandidate[],
  options?: { fuzzyThreshold?: number; fuzzyLimit?: number }
): TagSimilarityResult {
  const normalizedName = normalizeTagName(rawInput);
  const slug = tagSlug(normalizedName);
  const compactKey = slug.replace(/-/g, "");
  const fuzzyThreshold = options?.fuzzyThreshold ?? TAG_FUZZY_THRESHOLD;
  const fuzzyLimit = options?.fuzzyLimit ?? 5;

  const normalizedLower = normalizedName.toLowerCase();
  let exactMatch: SimilarTagMatch | null = null;
  let slugMatch: SimilarTagMatch | null = null;
  let compactMatch: SimilarTagMatch | null = null;
  const fuzzyMatches: SimilarTagMatch[] = [];

  for (const candidate of candidates) {
    const enriched = toCandidate(candidate);

    if (enriched.name.toLowerCase() === normalizedLower) {
      exactMatch = { tag: candidate, score: 1, matchType: "exact" };
      continue;
    }

    if (enriched.slug === slug && slug) {
      slugMatch = { tag: candidate, score: 1, matchType: "slug" };
      continue;
    }

    if (enriched.compactKey === compactKey && compactKey) {
      compactMatch = { tag: candidate, score: 1, matchType: "compact" };
      continue;
    }

    const compactScore = similarityScore(compactKey, enriched.compactKey);
    const nameScore = similarityScore(normalizedLower, enriched.name.toLowerCase());
    const score = Math.max(compactScore, nameScore);

    if (score >= fuzzyThreshold) {
      fuzzyMatches.push({ tag: candidate, score, matchType: "fuzzy" });
    }
  }

  fuzzyMatches.sort((a, b) => b.score - a.score);

  return {
    normalizedName,
    compactKey,
    slug,
    exactMatch,
    slugMatch,
    compactMatch,
    fuzzyMatches: fuzzyMatches.slice(0, fuzzyLimit),
  };
}

export function getBlockingCanonicalMatch(
  result: TagSimilarityResult
): SimilarTagMatch | null {
  return result.exactMatch ?? result.slugMatch ?? result.compactMatch;
}

export function getAdvisoryMatches(result: TagSimilarityResult): SimilarTagMatch[] {
  const blocking = getBlockingCanonicalMatch(result);
  const seen = new Set<string>();
  const matches: SimilarTagMatch[] = [];

  for (const match of result.fuzzyMatches) {
    if (blocking && match.tag.id === blocking.tag.id) continue;
    if (seen.has(match.tag.id)) continue;
    seen.add(match.tag.id);
    matches.push(match);
  }

  if (blocking && blocking.matchType === "fuzzy") {
    return matches;
  }

  return matches;
}
