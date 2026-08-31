import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { db } from "@/lib/db";
import {
  hydrateStoredAssistantMeta,
  pickStoredMoonieMetaField,
} from "./persist-assistant-turn";

describe("stored Moonie history hydration", () => {
  it("restores nested-only replay rows without top-level recommendations", () => {
    const recommendations = Array.from({ length: 16 }, (_, index) => ({
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

    const legacyMeta = {
      intent: "REFINE",
      responseKind: "recommendations",
      clientTurnId: "legacy-turn",
      response: {
        reply: "Here are all 16 verified recommendations from this request again.",
        recommendations,
        responseKind: "recommendations",
        consumesQuota: false,
        analyticsIntent: "REFINE",
      },
    };

    assert.equal(
      "recommendations" in legacyMeta,
      false,
      "legacy rows omit top-level recommendations"
    );

    const hydrated = hydrateStoredAssistantMeta(legacyMeta);
    assert.equal(hydrated.recommendations?.length, 16);
    assert.equal(hydrated.responseKind, "recommendations");
    assert.equal(hydrated.analyticsIntent, "REFINE");
    assert.deepEqual(
      hydrated.recommendations?.map((rec) => rec.novelId),
      recommendations.map((rec) => rec.novelId)
    );
  });

  it("restores nested-only no_results state for history reload", () => {
    const legacyMeta = {
      responseKind: "chat",
      response: {
        reply: "I could not find any MoonVerse novels that match completed, short length.",
        responseKind: "chat",
        state: "no_results",
        emptyReason: "unknown_status",
        recommendations: [],
      },
    };

    const hydrated = hydrateStoredAssistantMeta(legacyMeta);
    assert.equal(hydrated.state, "no_results");
    assert.equal(hydrated.emptyReason, "unknown_status");
    assert.equal(hydrated.recommendations?.length ?? 0, 0);
  });

  it("hydrates a real replay row from the database when present", async () => {
    const message = await db.moonieMessage.findFirst({
      where: {
        role: "assistant",
        content: { startsWith: "Here are all 16 verified recommendations" },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!message?.meta || typeof message.meta !== "object") {
      return;
    }

    const meta = message.meta as Record<string, unknown>;
    const hydrated = hydrateStoredAssistantMeta(meta);
    assert.equal(hydrated.recommendations?.length, 16);
    assert.equal(hydrated.responseKind, "recommendations");
    assert.ok(
      hydrated.recommendations?.every((rec) => typeof rec.novelId === "string")
    );
    const picked = pickStoredMoonieMetaField<
      import("@/types/moonie").MoonieRecommendation[]
    >(meta, "recommendations");
    assert.equal(picked?.length, 16);
  });
});
