import type {
  MoonieInterpretedPreferences,
  MoonieRecommendation,
} from "@/types/moonie";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function setOverlap(haystack: string[], needles: string[]): number {
  if (needles.length === 0) return 1;
  const set = new Set(haystack.map(normalize));
  let hits = 0;
  for (const needle of needles) {
    const n = normalize(needle);
    if (set.has(n) || [...set].some((h) => h.includes(n) || n.includes(h))) {
      hits += 1;
    }
  }
  return hits / needles.length;
}

/** Preference match for one recommendation (0–1). */
export function recommendationRelevance(
  rec: MoonieRecommendation,
  prefs: MoonieInterpretedPreferences
): number {
  const genreScore = setOverlap(rec.genres, prefs.genres);
  const tagNeedles = [...prefs.tags, ...prefs.mood];
  const tagScore =
    tagNeedles.length === 0 ? 1 : setOverlap(rec.tags ?? [], tagNeedles);
  if (prefs.genres.length === 0 && tagNeedles.length === 0) {
    return rec.novelId ? 1 : 0;
  }
  if (prefs.genres.length > 0 && tagNeedles.length > 0) {
    return genreScore * 0.6 + tagScore * 0.4;
  }
  if (prefs.genres.length > 0) return genreScore;
  return tagScore;
}

/** Mean relevance across a recommendation list. */
export function meanRelevance(
  recommendations: MoonieRecommendation[],
  prefs: MoonieInterpretedPreferences
): number {
  if (recommendations.length === 0) return 0;
  const total = recommendations.reduce(
    (sum, rec) => sum + recommendationRelevance(rec, prefs),
    0
  );
  return total / recommendations.length;
}

/**
 * Unsupported-title rate: share of recommendations whose novelId is not in
 * the allowlist (catalogue IDs). Target for grounded Moonie: 0.
 */
export function unsupportedTitleRate(
  recommendations: MoonieRecommendation[],
  catalogueIds: ReadonlySet<string>
): number {
  if (recommendations.length === 0) return 0;
  const bad = recommendations.filter((r) => !catalogueIds.has(r.novelId));
  return bad.length / recommendations.length;
}

/** Keep only recommendations whose novelId is in the allowlist. */
export function filterToAllowlist<T extends { novelId: string }>(
  recommendations: T[],
  allowedIds: ReadonlySet<string>
): T[] {
  return recommendations.filter((r) => allowedIds.has(r.novelId));
}

/** Jaccard similarity of two ID sets (consistency across repeated runs). */
export function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  let intersection = 0;
  for (const id of setA) {
    if (setB.has(id)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Mean pairwise Jaccard across repeated recommendation ID lists. */
export function meanConsistency(runs: string[][]): number {
  if (runs.length < 2) return 1;
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < runs.length; i += 1) {
    for (let j = i + 1; j < runs.length; j += 1) {
      total += jaccardSimilarity(runs[i], runs[j]);
      pairs += 1;
    }
  }
  return pairs === 0 ? 1 : total / pairs;
}

/**
 * Diversity: unique titles / total titles across a batch of recommendations.
 * Higher is more diverse (less repetition of the same popular titles).
 */
export function diversityRatio(allNovelIds: string[]): number {
  if (allNovelIds.length === 0) return 0;
  return new Set(allNovelIds).size / allNovelIds.length;
}

/** Share of lists where the top recommendation is the same novel. */
export function topOneConcentration(topIds: string[]): number {
  if (topIds.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const id of topIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  let max = 0;
  for (const n of counts.values()) max = Math.max(max, n);
  return max / topIds.length;
}

export function roundMetric(value: number, digits = 3): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/**
 * Share of reasons that mention a field present on the candidate
 * (title, genre, tag, status, or author). Ungrounded prose scores 0.
 */
export function explanationGroundingRate(
  recommendations: Array<{
    title: string;
    author?: string | null;
    genres: string[];
    tags?: string[];
    publicationStatus?: string | null;
    reason: string;
    reasons?: string[];
  }>
): number {
  if (recommendations.length === 0) return 1;
  let grounded = 0;
  for (const rec of recommendations) {
    const text = [rec.reason, ...(rec.reasons ?? [])].join(" ").toLowerCase();
    const fields = [
      rec.title,
      rec.author ?? "",
      rec.publicationStatus ?? "",
      ...rec.genres,
      ...(rec.tags ?? []),
    ]
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 2);
    if (fields.some((field) => text.includes(field))) grounded += 1;
  }
  return grounded / recommendations.length;
}
