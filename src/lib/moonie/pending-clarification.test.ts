import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  latestPendingClarification,
  pendingClarificationFromMeta,
} from "./pending-clarification";
import {
  buildPersistedAssistantMeta,
  hydrateStoredAssistantMeta,
} from "./persist-assistant-turn";

describe("compare_titles pending clarification", () => {
  it("hydrates compare_titles from stored assistant meta without rewriting history", () => {
    const persisted = buildPersistedAssistantMeta({
      reply: "Name two or three novels to compare.",
      recommendations: [],
      responseKind: "compare",
      consumesQuota: false,
      pendingClarification: {
        kind: "compare_titles",
        unresolvedTitles: ["The Road to forever"],
        resolvedNovelIds: ["novel-kept"],
      },
    });

    const hydrated = hydrateStoredAssistantMeta(
      persisted as Record<string, unknown>
    );
    assert.equal(hydrated.pendingClarification?.kind, "compare_titles");
    if (hydrated.pendingClarification?.kind !== "compare_titles") {
      throw new Error("expected compare_titles");
    }
    assert.deepEqual(hydrated.pendingClarification.unresolvedTitles, [
      "The Road to forever",
    ]);
    assert.deepEqual(hydrated.pendingClarification.resolvedNovelIds, [
      "novel-kept",
    ]);

    const fromMeta = pendingClarificationFromMeta(persisted);
    assert.equal(fromMeta?.kind, "compare_titles");
    assert.deepEqual(
      latestPendingClarification([
        { role: "user" },
        { role: "assistant", meta: persisted },
      ]),
      fromMeta
    );
  });

  it("hydrates review_preference from stored assistant meta", () => {
    const persisted = buildPersistedAssistantMeta({
      reply: "What are you in the mood to read?",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      pendingClarification: {
        kind: "review_preference",
        count: 5,
      },
    });
    const hydrated = hydrateStoredAssistantMeta(
      persisted as Record<string, unknown>
    );
    assert.equal(hydrated.pendingClarification?.kind, "review_preference");
    if (hydrated.pendingClarification?.kind !== "review_preference") {
      throw new Error("expected review_preference");
    }
    assert.equal(hydrated.pendingClarification.count, 5);
  });

  it("does not leak pending compare from another conversation", () => {
    assert.equal(latestPendingClarification([]), null);
    assert.equal(
      latestPendingClarification([
        { role: "assistant", meta: { responseKind: "chat" } },
      ]),
      null
    );
  });
});
