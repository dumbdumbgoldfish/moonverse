import type { Rng } from "./rng";

/**
 * Skew timestamps toward recent days so admin line charts show growth,
 * while still spreading activity across the full window.
 */
export function qaActivityTimestamp(rng: Rng, maxDaysAgo = 180): Date {
  const biased = rng.next() ** 0.48;
  const daysBack = Math.floor(biased * maxDaysAgo);
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysBack);
  date.setUTCHours(rng.int(6, 23), rng.int(0, 59), rng.int(0, 59), 0);
  return date;
}

/** Pick index with weights (higher weight = more likely). */
export function weightedPick<T>(rng: Rng, items: T[], weights: number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng.next() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function reviewerWeight(existingReviewCount: number): number {
  if (existingReviewCount === 0) return 0.35;
  if (existingReviewCount <= 2) return 1;
  if (existingReviewCount <= 6) return 2.2;
  if (existingReviewCount <= 12) return 3.5;
  return 5;
}
