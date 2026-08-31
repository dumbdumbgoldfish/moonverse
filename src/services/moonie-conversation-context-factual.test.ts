import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildConversationContext,
  collectPriorRecommendedNovelIds,
  parseConversationNovelExclusionRequest,
  resolveActiveNovel,
} from "@/lib/moonie/conversation-context";
import {
  buildCurrentTurnHardConstraints,
  novelMatchesHardConstraints,
} from "@/lib/moonie/hard-constraints";
import { labelsMatch } from "@/lib/moonie/label-match";
import {
  extractPreferencesFromMessage,
  mergeConversationPreferences,
} from "@/lib/moonie/preferences";
import { demoRecommendation } from "@/lib/moonie/demo-acceptance-fixtures";
import { handleMoonieRequest } from "./moonie-response.service";

function rec(id: string, title: string, genres: string[] = ["Fantasy"]) {
  return demoRecommendation(id, title, genres);
}

describe("prior recommendation id hydration", () => {
  it("collects ids from nested legacy assistant meta", () => {
    const batch = [rec("a", "Alpha"), rec("b", "Beta"), rec("c", "Gamma")];
    const messages = [
      { role: "user", content: "Recommend fantasy" },
      {
        role: "assistant",
        content: "Replay",
        meta: {
          response: {
            recommendations: batch,
          },
        },
      },
    ];
    assert.deepEqual(collectPriorRecommendedNovelIds(messages), ["a", "b", "c"]);
  });
});

describe("active novel resolution", () => {
  it("anchors the second recommendation for ordinal follow-ups", () => {
    const batch = [
      rec("n1", "First Fantasy"),
      rec("n2", "Second Fantasy"),
      rec("n3", "Third Fantasy"),
    ];
    const messages = [
      { role: "user", content: "Recommend three fantasy novels" },
      {
        role: "assistant",
        content: "Here are three picks.",
        meta: { recommendations: batch },
      },
      { role: "user", content: "tell me about the second one" },
    ];

    const active = resolveActiveNovel({
      messages,
      priorRecommendations: batch,
      lookupSession: null,
      currentMessage: "tell me about the second one",
    });
    assert.equal(active?.novelId, "n2");
    assert.match(active?.title ?? "", /second fantasy/i);
  });

  it("keeps pronoun focus after an ordinal pick", () => {
    const batch = [rec("n1", "First"), rec("n2", "Second"), rec("n3", "Third")];
    const messages = [
      { role: "user", content: "Recommend fantasy" },
      {
        role: "assistant",
        content: "Picks",
        meta: { recommendations: batch },
      },
      { role: "user", content: "the second one" },
      {
        role: "assistant",
        content: "Overview",
        meta: {
          novelOverview: { novelId: "n2", title: "Second" },
        },
      },
    ];

    const context = buildConversationContext(messages, {
      currentMessage: "is it completed?",
    });
    assert.equal(context.activeNovelId, "n2");
  });

  it("isolates parallel conversations with different active novels", () => {
    const convA = [
      { role: "user", content: "Recommend fantasy" },
      {
        role: "assistant",
        content: "A",
        meta: {
          recommendations: [rec("a1", "Alpha"), rec("a2", "Beta")],
        },
      },
      { role: "user", content: "the second one" },
    ];
    const convB = [
      { role: "user", content: "Recommend romance" },
      {
        role: "assistant",
        content: "B",
        meta: {
          recommendations: [
            rec("b1", "Rose", ["Romance"]),
            rec("b2", "Petals", ["Romance"]),
          ],
        },
      },
      { role: "user", content: "the first one" },
    ];

    const activeA = resolveActiveNovel({
      messages: convA,
      priorRecommendations: [
        rec("a1", "Alpha"),
        rec("a2", "Beta"),
      ],
      lookupSession: null,
      currentMessage: "the second one",
    });
    const activeB = resolveActiveNovel({
      messages: convB,
      priorRecommendations: [
        rec("b1", "Rose", ["Romance"]),
        rec("b2", "Petals", ["Romance"]),
      ],
      lookupSession: null,
      currentMessage: "the first one",
    });

    assert.equal(activeA?.novelId, "a2");
    assert.equal(activeB?.novelId, "b1");
  });

  it("does not inherit active novel on a fresh empty chat", () => {
    const context = buildConversationContext([], {
      currentMessage: "is it completed?",
    });
    assert.equal(context.activeNovelId, null);
    assert.equal(context.priorRecommendations.length, 0);
  });
});

describe("conversation preference carry-over", () => {
  it("persists remove romance across turns", () => {
    const prefs = mergeConversationPreferences([
      { role: "user", content: "Recommend fantasy and romance novels" },
      { role: "assistant", content: "Here are picks." },
      { role: "user", content: "remove romance" },
    ]);
    assert.equal(prefs.genres.includes("romance"), false);
    assert.ok(prefs.excludedTags.some((tag) => labelsMatch(tag, "romance")));
    assert.ok(prefs.genres.some((genre) => labelsMatch(genre, "fantasy")));
  });

  it("applies only completed this time on follow-up", () => {
    const prefs = mergeConversationPreferences([
      { role: "user", content: "Recommend fantasy novels" },
      { role: "assistant", content: "Picks" },
      { role: "user", content: "only completed novels this time" },
    ]);
    assert.equal(prefs.status, "completed");
  });

  it("parses do-not-recommend-again against prior cards", () => {
    const batch = [rec("x1", "Moonlit Arena"), rec("x2", "Other Title")];
    const excluded = parseConversationNovelExclusionRequest(
      "do not recommend Moonlit Arena again",
      batch
    );
    assert.equal(excluded, "x1");
  });
});

describe("long conversation stability", () => {
  it("keeps the focused novel through a 12-turn thread", () => {
    const batch = [
      rec("l1", "Lead Novel"),
      rec("l2", "Middle Novel"),
      rec("l3", "Tail Novel"),
    ];
    const messages: Array<{ role: string; content: string; meta?: unknown }> = [
      { role: "user", content: "Recommend three fantasy novels" },
      {
        role: "assistant",
        content: "Batch",
        meta: { recommendations: batch },
      },
    ];

    const turns = [
      "the second one",
      "what genre is it?",
      "show me more fantasy",
      "only completed novels this time",
      "remove romance",
      "the second one",
      "is it completed?",
    ];

    for (const turn of turns) {
      messages.push({ role: "user", content: turn });
      messages.push({
        role: "assistant",
        content: "ack",
        meta:
          turn === "the second one"
            ? { novelOverview: { novelId: "l2", title: "Middle Novel" } }
            : {},
      });
    }

    const context = buildConversationContext(messages, {
      currentMessage: "who reviewed it?",
    });
    assert.equal(context.activeNovelId, "l2");
  });
});

describe("recommendation follow-up integration", () => {
  it("resolves the second fantasy novel for tell-me-about follow-up", async () => {
    const seedMessage = "Recommend me three fantasy novels";
    const seed = await handleMoonieRequest({
      message: seedMessage,
      messages: [],
      isLoggedIn: false,
    });
    if (seed.recommendations.length < 2) return;

    const second = seed.recommendations[1]!;
    const response = await handleMoonieRequest({
      message: "tell me about the second one",
      messages: [
        { role: "user", content: seedMessage },
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(response.novelOverview?.novelId, second.novelId);
    assert.match(response.novelOverview?.title ?? "", new RegExp(second.title, "i"));
  });

  it("excludes a named novel on do-not-recommend-again follow-up", async () => {
    const seedMessage = "Recommend fantasy novels";
    const seed = await handleMoonieRequest({
      message: seedMessage,
      messages: [],
      isLoggedIn: false,
    });
    if (seed.recommendations.length === 0) return;

    const target = seed.recommendations[0]!;
    const response = await handleMoonieRequest({
      message: `do not recommend ${target.title} again`,
      messages: [
        { role: "user", content: seedMessage },
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
      ],
      isLoggedIn: false,
    });

    const again = await handleMoonieRequest({
      message: "Recommend more fantasy novels",
      messages: [
        { role: "user", content: seedMessage },
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
        { role: "user", content: `do not recommend ${target.title} again` },
        { role: "assistant", content: response.reply },
      ],
      isLoggedIn: false,
    });

    if (again.recommendations.length > 0) {
      assert.ok(
        !again.recommendations.some((rec) => rec.novelId === target.novelId)
      );
    }
  });

  it("applies completed follow-up constraints to new recommendations", async () => {
    const seedMessage = "Recommend fantasy novels";
    const seed = await handleMoonieRequest({
      message: seedMessage,
      messages: [],
      isLoggedIn: false,
    });
    if (seed.recommendations.length === 0) return;

    const hard = buildCurrentTurnHardConstraints("only completed novels this time");
    const followUp = await handleMoonieRequest({
      message: "only completed novels this time",
      messages: [
        { role: "user", content: seedMessage },
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
      ],
      isLoggedIn: false,
    });

    if (followUp.recommendations.length === 0) return;
    for (const recommendation of followUp.recommendations) {
      assert.equal(
        novelMatchesHardConstraints(
          {
            genres: recommendation.genres,
            tags: recommendation.tags ?? [],
            publicationStatus: recommendation.publicationStatus,
          },
          hard
        ),
        true
      );
    }
  });
});
