import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectSequenceRecommendationsForReplay, collectAllConversationRecommendationsForReplay } from "./conversation-context";
import type { MoonieRecommendation } from "@/types/moonie";

function rec(id: string, title: string): MoonieRecommendation {
  return {
    novelId: id,
    title,
    author: "Author",
    genres: ["fantasy"],
    reason: "test",
    confidence: "high",
    sourceStatus: "verified",
  };
}

describe("collectSequenceRecommendationsForReplay", () => {
  it("collects distinct recommendations across multiple batches in order", () => {
    const batch1 = [rec("a", "A"), rec("b", "B"), rec("c", "C"), rec("d", "D"), rec("e", "E")];
    const batch2 = [rec("f", "F"), rec("g", "G"), rec("h", "H"), rec("i", "I"), rec("j", "J")];
    const batch3 = [rec("k", "K"), rec("l", "L"), rec("m", "M")];

    const messages = [
      { role: "user" as const, content: "Show me fantasy picks" },
      {
        role: "assistant" as const,
        content: "Here are some picks.",
        meta: { recommendations: batch1 },
      },
      { role: "user" as const, content: "more like that" },
      {
        role: "assistant" as const,
        content: "More picks.",
        meta: { recommendations: batch2 },
      },
      { role: "user" as const, content: "show more" },
      {
        role: "assistant" as const,
        content: "Final batch.",
        meta: { recommendations: batch3 },
      },
    ];

    const replayed = collectSequenceRecommendationsForReplay(messages);
    assert.equal(replayed.length, 13);
    assert.deepEqual(
      replayed.map((entry) => entry.novelId),
      ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"]
    );
  });

  it("deduplicates by novel id within the sequence", () => {
    const messages = [
      { role: "user" as const, content: "cozy romance" },
      {
        role: "assistant" as const,
        content: "First batch.",
        meta: { recommendations: [rec("a", "A"), rec("b", "B")] },
      },
      { role: "user" as const, content: "show more" },
      {
        role: "assistant" as const,
        content: "Repeat.",
        meta: { recommendations: [rec("b", "B again"), rec("c", "C")] },
      },
    ];

    const replayed = collectSequenceRecommendationsForReplay(messages);
    assert.deepEqual(
      replayed.map((entry) => entry.novelId),
      ["a", "b", "c"]
    );
  });

  it("hydrates nested-only legacy replay rows without top-level recommendations", () => {
    const batch = [rec("a", "A"), rec("b", "B"), rec("c", "C")];
    const messages = [
      { role: "user" as const, content: "Recommend cultivation without harem" },
      {
        role: "assistant" as const,
        content: "First picks.",
        meta: { recommendations: batch },
      },
      { role: "user" as const, content: "Show those recommendations again" },
      {
        role: "assistant" as const,
        content: "Here are all 3 verified recommendations from this request again.",
        meta: {
          intent: "REFINE",
          responseKind: "recommendations",
          response: {
            reply: "Here are all 3 verified recommendations from this request again.",
            recommendations: batch,
            responseKind: "recommendations",
            analyticsIntent: "REFINE",
          },
        },
      },
    ];

    const replayed = collectSequenceRecommendationsForReplay(messages);
    assert.deepEqual(
      replayed.map((entry) => entry.novelId),
      ["a", "b", "c"]
    );
  });
});

describe("collectAllConversationRecommendationsForReplay", () => {
  it("collects every prior batch in first-seen order across topic changes", () => {
    const batch1 = [rec("a", "A"), rec("b", "B")];
    const batch2 = [rec("c", "C"), rec("d", "D")];

    const messages = [
      { role: "user" as const, content: "Recommend found family fantasy" },
      {
        role: "assistant" as const,
        content: "First batch.",
        meta: { recommendations: batch1 },
      },
      { role: "user" as const, content: "Show me short completed novels" },
      {
        role: "assistant" as const,
        content: "No matches.",
        meta: { response: { state: "no_results" } },
      },
      { role: "user" as const, content: "Show all previous recommendations again" },
    ];

    const all = collectAllConversationRecommendationsForReplay(messages);
    assert.deepEqual(all.map((entry) => entry.novelId), ["a", "b"]);
  });
});
