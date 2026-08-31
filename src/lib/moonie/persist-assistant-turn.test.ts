import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MoonieRecommendResponse } from "@/types/moonie";
import {
  buildPersistedAssistantMeta,
  pickStoredMoonieMetaField,
} from "./persist-assistant-turn";

function sampleRecommendations(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    novelId: `novel-${index + 1}`,
    title: `Novel ${index + 1}`,
    author: "Author",
    reason: "Verified reason.",
    genres: ["Fantasy"],
    tags: ["slice-of-life"],
    confidence: "high" as const,
    matchPercent: 90,
    sourceStatus: "verified" as const,
    availableOn: [],
  }));
}

describe("persist assistant turn meta", () => {
  it("stores display fields at the top level for quota and non-quota replies", () => {
    const result: MoonieRecommendResponse = {
      reply: "Here are all 16 verified recommendations from this request again.",
      recommendations: sampleRecommendations(16),
      responseKind: "recommendations",
      consumesQuota: false,
      analyticsIntent: "recommendation_replay",
    };

    const meta = buildPersistedAssistantMeta(result, "turn-1") as Record<
      string,
      unknown
    >;

    assert.equal(
      (meta.recommendations as { novelId: string }[]).length,
      16
    );
    assert.equal(meta.responseKind, "recommendations");
    assert.equal(meta.analyticsIntent, "recommendation_replay");
    assert.equal(meta.clientTurnId, "turn-1");
    assert.equal(meta.state, undefined);
    assert.ok(meta.response);
  });

  it("stores no_results state at the top level for history reload", () => {
    const result: MoonieRecommendResponse = {
      reply: "I could not find any MoonVerse novels that match completed, short length.",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      state: "no_results",
      emptyReason: "unknown_status",
      analyticsIntent: "RECOMMEND",
    };

    const meta = buildPersistedAssistantMeta(result) as Record<string, unknown>;
    assert.equal(meta.state, "no_results");
    assert.equal(meta.emptyReason, "unknown_status");
    assert.equal(
      (meta.response as { state?: string }).state,
      "no_results"
    );
  });

  it("hydrates legacy nested-only replay rows", () => {
    const recommendations = sampleRecommendations(16);
    const legacyMeta = {
      responseKind: "recommendations",
      clientTurnId: "legacy-turn",
      response: {
        reply: "Replay",
        recommendations,
        responseKind: "recommendations",
        consumesQuota: false,
      },
    };

    assert.deepEqual(
      pickStoredMoonieMetaField(legacyMeta, "recommendations"),
      recommendations
    );
    assert.equal(
      pickStoredMoonieMetaField(legacyMeta, "responseKind"),
      "recommendations"
    );
  });
});
