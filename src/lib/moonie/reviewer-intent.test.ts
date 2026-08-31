import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPublicSalonReviewRequest,
  isReviewerAuthoredReviewsMessage,
} from "./reviewer-intent";

const SALON_BINGE_PROMPT =
  "Recommend spoiler-aware novel reviews from the MoonVerse salon that match what I might binge next.";

describe("salon review vs authored-reviewer phrasing", () => {
  it("does not treat the salon binge chip as a named-reviewer ask", () => {
    assert.equal(isPublicSalonReviewRequest(SALON_BINGE_PROMPT), true);
    assert.equal(isReviewerAuthoredReviewsMessage(SALON_BINGE_PROMPT), false);
  });

  it("still recognizes authored reviews for a person", () => {
    assert.equal(isReviewerAuthoredReviewsMessage("show me their reviews"), true);
    assert.equal(
      isReviewerAuthoredReviewsMessage("reviews from @ezraink76"),
      true
    );
    assert.equal(
      isReviewerAuthoredReviewsMessage("give me all of @mirascroll70 reviews"),
      true
    );
    assert.equal(isPublicSalonReviewRequest("show me their reviews"), false);
  });
});
