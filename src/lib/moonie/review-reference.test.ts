import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAmbiguousPluralNovelReviewClarification,
  isAmbiguousPluralNovelReviewReference,
  isPluralNovelReviewReference,
  resolveLatestDisplayedNovelBatch,
} from "@/lib/moonie/review-reference";
import { extractReviewNovelQuery } from "@/lib/moonie/intent";

describe("review reference resolution", () => {
  it("does not treat pronouns as catalogue titles", () => {
    assert.equal(
      extractReviewNovelQuery("give me reviews of these novels"),
      null
    );
    assert.equal(
      extractReviewNovelQuery("give me reviews of that novels"),
      null
    );
  });

  it("detects plural batch review references", () => {
    assert.equal(
      isPluralNovelReviewReference("give me reviews of these novels"),
      true
    );
    assert.equal(
      isPluralNovelReviewReference("show me their reviews for these novels"),
      true
    );
  });

  it("detects ambiguous singular-plural phrasing", () => {
    assert.equal(
      isAmbiguousPluralNovelReviewReference("give me reviews of that novels"),
      true
    );
  });

  it("resolves the latest displayed recommendation batch only", () => {
    const batch = resolveLatestDisplayedNovelBatch([
      {
        role: "assistant",
        content: "older",
        meta: {
          recommendations: [
            {
              novelId: "old-1",
              title: "Old One",
              reason: "Match",
              genres: ["Fantasy"],
              confidence: "high",
              sourceStatus: "verified",
              availableOn: [],
            },
          ],
        },
      },
      {
        role: "assistant",
        content: "latest",
        meta: {
          recommendations: [
            {
              novelId: "new-1",
              title: "Alpha",
              reason: "Match",
              genres: ["Fantasy"],
              confidence: "high",
              sourceStatus: "verified",
              availableOn: [],
            },
            {
              novelId: "new-2",
              title: "Beta",
              reason: "Match",
              genres: ["Fantasy"],
              confidence: "high",
              sourceStatus: "verified",
              availableOn: [],
            },
          ],
        },
      },
    ]);
    assert.deepEqual(batch.map((rec) => rec.novelId), ["new-1", "new-2"]);
  });

  it("builds clarification referencing shown titles", () => {
    const text = buildAmbiguousPluralNovelReviewClarification([
      {
        novelId: "a",
        title: "Alpha",
        reason: "Match",
        genres: ["Fantasy"],
        confidence: "high",
        sourceStatus: "verified",
        availableOn: [],
      },
      {
        novelId: "b",
        title: "Beta",
        reason: "Match",
        genres: ["Fantasy"],
        confidence: "high",
        sourceStatus: "verified",
        availableOn: [],
      },
    ]);
    assert.match(text, /Alpha/);
    assert.match(text, /Beta/);
  });
});
