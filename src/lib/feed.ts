export type HomeFeedTab = "for-you" | "following" | "trending" | "latest";

export function parseHomeFeedTab(
  value: string | undefined | null
): HomeFeedTab {
  if (
    value === "for-you" ||
    value === "following" ||
    value === "trending" ||
    value === "latest"
  ) {
    return value;
  }
  return "for-you";
}

export const FEED_PAGE_SIZE = 10;

/**
 * Interleave so the same reviewer is not consecutive when alternatives exist.
 * Preserves relative order as much as possible.
 * Pass `previousReviewerId` when appending a page so the seam stays diversified.
 */
export function diversifyByReviewer<
  T extends { id: string; reviewerId?: string | null },
>(items: T[], previousReviewerId?: string | null): T[] {
  if (items.length === 0) return items;
  if (items.length === 1) return items;

  const queue = [...items];
  const result: T[] = [];
  let lastReviewer: string | null = previousReviewerId ?? null;

  while (queue.length > 0) {
    let pickIndex = 0;
    if (lastReviewer) {
      const alt = queue.findIndex(
        (item) => (item.reviewerId ?? item.id) !== lastReviewer
      );
      if (alt >= 0) pickIndex = alt;
    }
    const [next] = queue.splice(pickIndex, 1);
    result.push(next);
    lastReviewer = next.reviewerId ?? next.id;
  }

  return result;
}
