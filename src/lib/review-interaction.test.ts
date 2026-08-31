import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyCommunityReviewClientState,
  patchCommunityReviewClientState,
} from "@/lib/community-review-client-state";
import type { CommunityReviewModalData } from "@/lib/community-review-modal.types";

function sampleModalData(): CommunityReviewModalData {
  return {
    review: {
      id: "review-1",
      userId: "author-1",
      novelId: "novel-1",
      title: "Sample review",
      body: "Body",
      excerpt: "Excerpt",
      rating: 4,
      tags: [],
      genres: [],
      containsSpoilers: false,
      likeCount: 1,
      commentCount: 0,
      saveCount: 0,
      shareCount: 0,
      createdAt: "2026-06-26T00:00:00.000Z",
      novelTitle: "Novel",
      novelAuthor: "Author",
      coverUrl: "",
      reviewerName: "Reviewer",
      reviewerUsername: "reviewer",
      reviewerAvatar: "R",
      reviewerAvatarUrl: undefined,
    },
    comments: [],
    reviewerStats: {
      reviewCount: 1,
      averageRating: 4,
      topGenre: "Romance",
    },
    isLoggedIn: true,
    isOwner: false,
    initialLiked: false,
    initialFollowing: false,
    folders: [],
    savedFolderIds: [],
  };
}

describe("community review client state", () => {
  it("merges feed interaction patches into modal payload", () => {
    patchCommunityReviewClientState({
      reviewId: "review-1",
      liked: true,
      likeCount: 2,
      savedFolderIds: ["folder-a"],
      saveCount: 1,
    });

    const merged = applyCommunityReviewClientState(sampleModalData());
    assert.equal(merged.initialLiked, true);
    assert.equal(merged.review.likeCount, 2);
    assert.equal(merged.review.saveCount, 1);
    assert.deepEqual(merged.savedFolderIds, ["folder-a"]);
  });
});
