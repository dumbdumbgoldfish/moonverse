import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  collectPriorRecommendedNovelIds,
  resolveSimilarNovelTargetId,
} from "./conversation-context";
import type { MoonieRecommendation } from "@/types/moonie";

describe("collectPriorRecommendedNovelIds", () => {
  it("hydrates nested legacy recommendation rows", () => {
    const recs: MoonieRecommendation[] = [
      {
        novelId: "nested-1",
        title: "Nested",
        author: "A",
        genres: ["Fantasy"],
        reason: "test",
        confidence: "high",
        sourceStatus: "verified",
      },
    ];
    const ids = collectPriorRecommendedNovelIds([
      {
        role: "assistant",
        content: "replay",
        meta: { response: { recommendations: recs } },
      },
    ]);
    assert.deepEqual(ids, ["nested-1"]);
  });
});

describe("resolveSimilarNovelTargetId", () => {
  it("prefers the explicitly clicked card over older conversation context", () => {
    assert.equal(resolveSimilarNovelTargetId("novel-b", "novel-a"), "novel-b");
  });

  it("does not substitute conversation context for an explicit invalid target", () => {
    assert.equal(resolveSimilarNovelTargetId("missing-novel", "novel-a"), "missing-novel");
  });

  it("falls back to conversation context only without an explicit target", () => {
    assert.equal(resolveSimilarNovelTargetId(undefined, "novel-a"), "novel-a");
  });

  it("does not fall back when more-like-this forbids context", () => {
    assert.equal(
      resolveSimilarNovelTargetId(undefined, "novel-a", {
        allowContextFallback: false,
      }),
      null
    );
  });
});
