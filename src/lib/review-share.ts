/**
 * Review `saveCount` is the denormalized total of `FolderReview` rows for that
 * review (every folder membership by any user). It is not unique savers or the
 * viewer's folder count. Each add/remove of one membership adjusts the counter
 * by one on the server; client optimism must mirror that delta.
 */
export function nextReviewSaveCountForMembershipChange(
  previousMembershipCount: number,
  nextMembershipCount: number,
  previousSaveCount: number
): number {
  const delta = nextMembershipCount - previousMembershipCount;
  return Math.max(0, previousSaveCount + delta);
}

export function buildReviewCanonicalUrl(reviewId: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/reviews/${reviewId}`;
}

export function buildReviewSharePayload(
  reviewId: string,
  reviewTitle: string,
  origin?: string
): { url: string; title: string; text: string } {
  const url = buildReviewCanonicalUrl(reviewId, origin);
  const title = reviewTitle.trim() || "MoonVerse review";
  const text = `Check out this review on MoonVerse: ${title}\n${url}`;
  return { url, title, text };
}
