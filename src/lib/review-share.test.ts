import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildReviewCanonicalUrl,
  buildReviewSharePayload,
  nextReviewSaveCountForMembershipChange,
} from "@/lib/review-share";

describe("review share payload", () => {
  it("builds an absolute canonical review URL in text and url fields", () => {
    const payload = buildReviewSharePayload(
      "review-abc",
      "A casual reader's notes",
      "http://localhost:3000"
    );
    assert.equal(payload.url, "http://localhost:3000/reviews/review-abc");
    assert.match(payload.text, /http:\/\/localhost:3000\/reviews\/review-abc$/);
    assert.match(payload.text, /A casual reader's notes/);
  });

  it("builds canonical URLs without a page path", () => {
    assert.equal(
      buildReviewCanonicalUrl("review-abc", "https://moonverse.example"),
      "https://moonverse.example/reviews/review-abc"
    );
  });
});

describe("review save count semantics", () => {
  it("increments per membership added, not only first save", () => {
    assert.equal(
      nextReviewSaveCountForMembershipChange(1, 2, 2),
      3
    );
    assert.equal(
      nextReviewSaveCountForMembershipChange(2, 1, 3),
      2
    );
    assert.equal(
      nextReviewSaveCountForMembershipChange(0, 1, 4),
      5
    );
  });
});
