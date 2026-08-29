export const RANKING_WEIGHTS = {
  semantic: 0.4,
  structured: 0.25,
  quality: 0.15,
  history: 0.1,
  diversity: 0.1,
} as const;

export interface ScoreBreakdown {
  semantic: number;
  structured: number;
  quality: number;
  history: number;
  diversity: number;
}

export interface RankingSignals {
  semantic: number;
  structured: number;
  quality: number;
  history: number;
  diversity: number;
}

/** Cosine similarity for equal-length embedding vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function overlapScore(haystack: string[], needles: string[]): number {
  if (needles.length === 0) return 0;
  const set = new Set(haystack.map((value) => value.trim().toLowerCase()));
  let hits = 0;
  for (const needle of needles) {
    const n = needle.trim().toLowerCase();
    if (!n) continue;
    if (set.has(n)) hits += 1;
    else if ([...set].some((h) => h.includes(n) || n.includes(h))) hits += 0.6;
  }
  return Math.min(1, hits / needles.length);
}

/**
 * Bayesian weighted rating so a single 5-star review cannot dominate.
 * WR = (v / (v + m)) * R + (m / (v + m)) * C
 */
export function bayesianQuality(
  averageRating: number | null,
  reviewCount: number,
  catalogueMean = 3.6,
  minimumVotes = 8
): number {
  if (!averageRating || reviewCount <= 0) return 0;
  const v = reviewCount;
  const m = minimumVotes;
  const weighted =
    (v / (v + m)) * averageRating + (m / (v + m)) * catalogueMean;
  return Math.max(0, Math.min(1, weighted / 5));
}

export function combineRankingScore(signals: RankingSignals): {
  score: number;
  breakdown: ScoreBreakdown;
} {
  const breakdown: ScoreBreakdown = {
    semantic: signals.semantic * RANKING_WEIGHTS.semantic,
    structured: signals.structured * RANKING_WEIGHTS.structured,
    quality: signals.quality * RANKING_WEIGHTS.quality,
    history: signals.history * RANKING_WEIGHTS.history,
    diversity: signals.diversity * RANKING_WEIGHTS.diversity,
  };
  const score =
    breakdown.semantic +
    breakdown.structured +
    breakdown.quality +
    breakdown.history +
    breakdown.diversity;
  return { score, breakdown };
}

export function matchPercent(score: number): number {
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

export function parseEmbedding(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number => typeof item === "number");
}

/** Deterministic bag-of-tokens embedding for title/metadata cosine (not a neural model). */
export function lexicalHashEmbedding(text: string, dimensions = 32): number[] {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
  const vector = new Array(dimensions).fill(0);
  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i += 1) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
    }
    vector[hash % dimensions] += 1;
  }
  const mag = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return mag === 0 ? vector : vector.map((value) => value / mag);
}
