import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acceptPolishedReason,
  acceptPolishedSummary,
  mergePolishedConfidence,
  sanitizePolishedReason,
} from "./polish-safety";

describe("polish-safety", () => {
  it("sanitizes low-fit strong wording", () => {
    assert.match(
      sanitizePolishedReason("A strong match for fantasy.", 20),
      /modest/i
    );
  });

  it("accepts safe summaries and rejects catalogue absence claims", () => {
    assert.equal(
      acceptPolishedSummary("Three cozy fantasy picks.", "Grounded summary."),
      "Three cozy fantasy picks."
    );
    assert.equal(
      acceptPolishedSummary(
        "The catalogue has no completed fantasy novels.",
        "Grounded summary."
      ),
      "Grounded summary."
    );
  });

  it("accepts safe reasons and rejects guest personalization claims", () => {
    assert.equal(
      acceptPolishedReason(
        "Fits your fantasy interest.",
        "Grounded reason.",
        50,
        []
      ),
      "Fits your fantasy interest."
    );
    assert.equal(
      acceptPolishedReason(
        "Based on your saved novels.",
        "Grounded reason.",
        50,
        []
      ),
      "Grounded reason."
    );
  });

  it("merges confidence with match-percent ceiling", () => {
    assert.equal(mergePolishedConfidence("high", "low", 25, 10), "low");
    assert.equal(mergePolishedConfidence("high", "low", 45, 10), "medium");
  });
});
