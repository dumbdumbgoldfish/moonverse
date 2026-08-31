import type { CommunityReviewModalData } from "@/lib/community-review-modal.types";
import { applyCommunityReviewClientState } from "@/lib/community-review-client-state";

const TTL_MS = 60_000;
const cache = new Map<
  string,
  { expires: number; promise: Promise<CommunityReviewModalData | null> }
>();

function isFresh(entry: { expires: number }) {
  return entry.expires > Date.now();
}

export function getPrefetchedCommunityReview(
  reviewId: string
): Promise<CommunityReviewModalData | null> | null {
  const entry = cache.get(reviewId);
  if (!entry || !isFresh(entry)) return null;
  return entry.promise;
}

export function invalidateCommunityReviewCache(reviewId: string): void {
  cache.delete(reviewId);
}

export function prefetchCommunityReview(reviewId: string): void {
  if (!reviewId || typeof window === "undefined") return;
  const existing = cache.get(reviewId);
  if (existing && isFresh(existing)) return;

  const promise = fetch(`/api/community/reviews/${reviewId}`, {
    credentials: "same-origin",
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const payload = (await response.json()) as CommunityReviewModalData;
      return applyCommunityReviewClientState(payload);
    })
    .catch(() => null);

  cache.set(reviewId, { expires: Date.now() + TTL_MS, promise });
}

export function loadCommunityReviewCached(
  reviewId: string
): Promise<CommunityReviewModalData | null> {
  const cached = getPrefetchedCommunityReview(reviewId);
  if (cached) return cached;

  const promise = fetch(`/api/community/reviews/${reviewId}`, {
    credentials: "same-origin",
  }).then(async (response) => {
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(body?.error ?? "Unable to load review.");
    }
    return applyCommunityReviewClientState(
      (await response.json()) as CommunityReviewModalData
    );
  }).catch((error: unknown) => {
    if (error instanceof Error) throw error;
    throw new Error("Unable to load review.");
  });

  cache.set(reviewId, { expires: Date.now() + TTL_MS, promise });
  return promise;
}
