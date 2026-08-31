import type { CommentItem } from "@/types/review";
import { patchCommunityReviewClientState } from "@/lib/community-review-client-state";
import { invalidateCommunityReviewCache } from "@/lib/community-review-prefetch";

export type CommunityReviewSyncDetail = {
  reviewId: string;
  likeCount?: number;
  liked?: boolean;
  commentCount?: number;
  comment?: CommentItem;
  savedFolderIds?: string[];
  saveCount?: number;
};

const EVENT = "mv:community-review-sync";

export function publishCommunityReviewSync(detail: CommunityReviewSyncDetail) {
  if (typeof window === "undefined") return;
  invalidateCommunityReviewCache(detail.reviewId);
  patchCommunityReviewClientState(detail);
  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent(EVENT, { detail }));
  });
}

export function subscribeCommunityReviewSync(
  handler: (detail: CommunityReviewSyncDetail) => void
) {
  const listener = (event: Event) => {
    handler((event as CustomEvent<CommunityReviewSyncDetail>).detail);
  };
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
