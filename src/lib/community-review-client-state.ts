import type { CommunityReviewModalData } from "@/lib/community-review-modal.types";
import type { CommunityReviewSyncDetail } from "@/lib/community-feed-sync";

const patches = new Map<string, CommunityReviewSyncDetail>();

export function patchCommunityReviewClientState(
  detail: CommunityReviewSyncDetail
): void {
  const existing = patches.get(detail.reviewId);
  patches.set(detail.reviewId, { ...existing, ...detail, reviewId: detail.reviewId });
}

export function clearCommunityReviewClientState(reviewId: string): void {
  patches.delete(reviewId);
}

export function applyCommunityReviewClientState(
  data: CommunityReviewModalData
): CommunityReviewModalData {
  const patch = patches.get(data.review.id);
  if (!patch) return data;

  return {
    ...data,
    initialLiked: patch.liked ?? data.initialLiked,
    savedFolderIds: patch.savedFolderIds ?? data.savedFolderIds,
    review: {
      ...data.review,
      likeCount: patch.likeCount ?? data.review.likeCount,
      commentCount: patch.commentCount ?? data.review.commentCount,
      saveCount: patch.saveCount ?? data.review.saveCount,
    },
  };
}
