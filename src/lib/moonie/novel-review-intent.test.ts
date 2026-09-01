import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isWhoReviewedActiveNovelQuestion,
  resolveNovelScopedReviewRequest,
} from "@/lib/moonie/novel-review-intent";
import {
  buildScopedNovelReviewWhere,
  mapReviewRowToRankedReview,
} from "@/lib/moonie/review-retrieval";

describe("novel-review-intent", () => {
  it("parses highest-rated review for a titled novel", () => {
    const request = resolveNovelScopedReviewRequest(
      "highest rated review for A Will Eternal"
    );
    assert.ok(request);
    assert.equal(request?.kind, "ranked");
    assert.equal(request?.metric, "review_rating");
    assert.equal(request?.count, 1);
    assert.equal(request?.novelQuery, "A Will Eternal");
  });

  it("parses most recent and most liked review requests", () => {
    const recent = resolveNovelScopedReviewRequest(
      "most recent review of Fixture Novel"
    );
    assert.equal(recent?.metric, "review_recent");
    assert.equal(recent?.kind, "ranked");

    const liked = resolveNovelScopedReviewRequest(
      "most liked review for Fixture Novel"
    );
    assert.equal(liked?.metric, "review_helpful");
    assert.equal(liked?.kind, "ranked");
  });

  it("parses spoiler-free review lists and who reviewed questions", () => {
    const spoilerFree = resolveNovelScopedReviewRequest(
      "spoiler-free reviews for Fixture Novel"
    );
    assert.equal(spoilerFree?.kind, "spoiler_free_list");
    assert.equal(spoilerFree?.spoilerFreeOnly, true);

    assert.equal(isWhoReviewedActiveNovelQuestion("who reviewed it?"), true);
    const who = resolveNovelScopedReviewRequest("who reviewed Fixture Novel");
    assert.equal(who?.kind, "who_reviewed");
  });

  it("parses counted review list requests", () => {
    const two = resolveNovelScopedReviewRequest(
      "Give me two reviews of Fixture Novel"
    );
    assert.equal(two?.kind, "list");
    assert.equal(two?.count, 2);
    assert.equal(two?.novelQuery, "Fixture Novel");
    assert.equal(two?.explicitCountRequest, true);
  });

  it("does not mark metric-ranked plural lists as explicit counted requests", () => {
    const recent = resolveNovelScopedReviewRequest(
      "most recent reviews of Fixture Novel"
    );
    assert.equal(recent?.kind, "list");
    assert.notEqual(recent?.explicitCountRequest, true);
  });
});

describe("review-retrieval", () => {
  it("filters spoiler reviews in spoiler-safe mode", () => {
    const where = buildScopedNovelReviewWhere({
      novelId: "novel-1",
      spoilerMode: "none",
    });
    assert.equal(where.containsSpoilers, false);

    const spoilerRow = {
      id: "rev-1",
      title: "Spoiler title",
      body: "Spoiler body",
      rating: 5,
      containsSpoilers: true,
      likeCount: 3,
      commentCount: 1,
      novel: { id: "novel-1", title: "Fixture Novel" },
      user: { displayName: "Reader", username: "reader1" },
    };
    const spoilerMapped = mapReviewRowToRankedReview(spoilerRow, "none");
    assert.ok(spoilerMapped);
    assert.match(spoilerMapped?.excerpt ?? "", /spoilers/i);

    const mapped = mapReviewRowToRankedReview(
      { ...spoilerRow, containsSpoilers: false },
      "none"
    );
    assert.ok(mapped);
    assert.equal(mapped?.likeCount, 3);
    assert.equal(mapped?.commentCount, 1);
  });
});
