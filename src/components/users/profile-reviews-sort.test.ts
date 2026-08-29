import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sortProfileReviews } from "./profile-reviews-sort";
import type { ReviewListItem } from "@/types/review";

function review(id: string, createdAt: string): ReviewListItem {
  return {
    id,
    title: id,
    excerpt: "",
    body: "",
    rating: 5,
    containsSpoilers: false,
    likeCount: 0,
    commentCount: 0,
    saveCount: 0,
    shareCount: 0,
    novelId: "novel-1",
    novelTitle: "Novel",
    novelAuthor: "Author",
    coverUrl: "",
    reviewerName: "Reviewer",
    reviewerUsername: "reviewer",
    reviewerAvatar: "",
    genres: [],
    tags: [],
    createdAt,
  };
}

describe("sortProfileReviews", () => {
  it("sorts newest first by default", () => {
    const sorted = sortProfileReviews(
      [
        review("a", "2026-01-01T00:00:00.000Z"),
        review("b", "2026-03-01T00:00:00.000Z"),
        review("c", "2026-02-01T00:00:00.000Z"),
      ],
      "newest"
    );
    assert.deepEqual(
      sorted.map((item) => item.id),
      ["b", "c", "a"]
    );
  });

  it("sorts oldest first when requested", () => {
    const sorted = sortProfileReviews(
      [
        review("a", "2026-01-01T00:00:00.000Z"),
        review("b", "2026-03-01T00:00:00.000Z"),
      ],
      "oldest"
    );
    assert.deepEqual(
      sorted.map((item) => item.id),
      ["a", "b"]
    );
  });
});
