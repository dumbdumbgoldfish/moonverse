import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  reviewBodyNeedsPreviewClamp,
  shouldCollapseReviewBody,
} from "@/lib/review-body";

describe("reviewBodyNeedsPreviewClamp", () => {
  it("detects long structured reviews before client measurement", () => {
    const body = [
      "Opening paragraph with enough words to establish tone.",
      "READING DIFFICULTY FELT MODERATE TO ME.",
      "What worked for me:",
      "- First point",
      "- Second point",
      "- Third point",
      "What dragged or disappointed:",
      "- Another point",
      "- And another",
    ].join("\n\n");

    assert.equal(reviewBodyNeedsPreviewClamp(body), true);
  });

  it("does not clamp short reviews", () => {
    assert.equal(reviewBodyNeedsPreviewClamp("Short review body."), false);
  });

  it("uses a lower threshold than full collapse heuristics", () => {
    const medium = "word ".repeat(130).trim();
    assert.equal(reviewBodyNeedsPreviewClamp(medium), true);
    assert.equal(shouldCollapseReviewBody(medium), false);
  });
});
