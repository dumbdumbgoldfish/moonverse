import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MOONIE_DESK_CHIPS, isMoonieDeskChipPrompt } from "./desk";
import {
  extractNovelQuery,
  isBareCatalogueTitleQuery,
  isBareCommunityConsensusRequestWithoutNovel,
  isBareReviewRequestWithoutNovel,
  isMoonieGeneratedFollowUpQuestion,
  isNonTitleLookupPhrase,
  isUseSavedPreferencesRequest,
  isVagueContinuationRequest,
  normalizeLookupQueryText,
  primaryRetrievalIntent,
  classifyMoonieIntents,
  resolveNovelContextFollowUpIntent,
} from "./intent";
import { scoreTitleMatch } from "@/lib/search";
import { isVerifiedSeriesDiscoveryRequest } from "./series-intent";

describe("non-title lookup phrases", () => {
  it("never extracts catalogue titles from modifier-only follow-ups", () => {
    for (const message of [
      "find verified reading links",
      "show me reviews",
      "summarise what readers think",
      "tell me more",
      "and?",
    ]) {
      assert.equal(isNonTitleLookupPhrase(message), true, message);
      assert.equal(extractNovelQuery(message), null, message);
    }
  });

  it("detects bare review and community asks", () => {
    assert.equal(isBareReviewRequestWithoutNovel("show me reviews"), true);
    assert.equal(
      isBareCommunityConsensusRequestWithoutNovel(
        "summarise what MoonVerse readers think"
      ),
      true
    );
    assert.equal(isVagueContinuationRequest("tell me more"), true);
    assert.equal(isVagueContinuationRequest("and?"), true);
  });
});

describe("active novel context follow-ups", () => {
  it("resolves reading links and reader consensus without title drift", () => {
    assert.equal(
      resolveNovelContextFollowUpIntent("find verified reading links"),
      "FIND_READING_SOURCE"
    );
    assert.equal(
      resolveNovelContextFollowUpIntent("summarise what readers think"),
      "NOVEL_REVIEWS"
    );
    assert.equal(
      resolveNovelContextFollowUpIntent("show me reviews"),
      "NOVEL_REVIEWS"
    );
  });

  it("overrides false find-title intents when a novel is active", () => {
    const intents = classifyMoonieIntents("find verified reading links", {
      hasActiveNovel: true,
    });
    assert.equal(primaryRetrievalIntent(intents), "FIND_READING_SOURCE");
  });
});

describe("verified series discovery", () => {
  it("detects the smoke-test phrase without fuzzy title extraction", () => {
    assert.equal(
      isVerifiedSeriesDiscoveryRequest("find a novel with verified series data"),
      true
    );
    assert.equal(
      extractNovelQuery("find a novel with verified series data"),
      null
    );
  });
});

describe("bare catalogue titles and follow-up chips", () => {
  it("treats bare titles as lookup, not recommendation discovery", () => {
    assert.equal(isBareCatalogueTitleQuery("Cultivation Chat Group"), true);
    const intents = classifyMoonieIntents("Cultivation Chat Group", {
      recentMessages: [
        {
          role: "assistant",
          content:
            "Which novel do you want a reading link for? Tell me the title and I'll verify it in the MoonVerse catalogue.",
        },
      ],
    });
    assert.equal(primaryRetrievalIntent(intents), "FIND_READING_SOURCE");
    assert.equal(intents.includes("RECOMMEND"), false);
  });

  it("does not catalogue-search Moonie follow-up chips", () => {
    const message =
      "Should I stick to completed novels, or are ongoing stories fine?";
    assert.equal(isMoonieGeneratedFollowUpQuestion(message), true);
    assert.equal(isNonTitleLookupPhrase(message), true);
    const intents = classifyMoonieIntents(message, {
      hasPriorRecommendations: true,
      hasConversationPrefs: true,
    });
    assert.equal(intents.includes("RECOMMEND"), false);
    assert.ok(intents.includes("REFINE") || intents.includes("CHAT"));
  });

  it("does not treat greetings as bare catalogue titles", () => {
    for (const message of ["hi", "hey", "thanks", "ok", "it"]) {
      assert.equal(isBareCatalogueTitleQuery(message), false, message);
      const intents = classifyMoonieIntents(message, {});
      assert.equal(intents.includes("FIND_NOVEL"), false, message);
    }
  });

  it("routes saved-preference asks to recommendations, not catalogue lookup", () => {
    for (const message of [
      "use my preferences",
      "use my taste profile",
      "based on my preferences",
    ]) {
      assert.equal(isUseSavedPreferencesRequest(message), true, message);
      assert.equal(isBareCatalogueTitleQuery(message), false, message);
      assert.equal(isNonTitleLookupPhrase(message), true, message);
      const intents = classifyMoonieIntents(message, {});
      assert.equal(primaryRetrievalIntent(intents), "RECOMMEND", message);
      assert.equal(intents.includes("FIND_NOVEL"), false, message);
    }
  });

  it("treats recommendation asks as discovery, not title lookup", () => {
    for (const message of [
      "any recommendation?",
      "any recommendations?",
      "what should I read?",
    ]) {
      const intents = classifyMoonieIntents(message, {});
      assert.equal(primaryRetrievalIntent(intents), "RECOMMEND", message);
      assert.equal(intents.includes("FIND_NOVEL"), false, message);
    }
  });

  it("routes desk vibe chips to recommendations, not catalogue lookup", () => {
    for (const chip of MOONIE_DESK_CHIPS) {
      for (const message of [chip.prompt, chip.label]) {
        assert.equal(isMoonieDeskChipPrompt(message), true, message);
        assert.equal(isBareCatalogueTitleQuery(message), false, message);
        const intents = classifyMoonieIntents(message, {});
        assert.equal(primaryRetrievalIntent(intents), "RECOMMEND", message);
        assert.equal(intents.includes("FIND_NOVEL"), false, message);
      }
    }
  });
});

describe("reviewer details follow-up", () => {
  it("routes bare show-details after a ranking list to reviewer overview", () => {
    const intents = classifyMoonieIntents("show details", {
      hasPriorReviewerResults: true,
    });
    assert.equal(intents.includes("REVIEWER_OVERVIEW"), true);
    assert.equal(intents.includes("CHAT"), false);
  });

  it("does not treat reviewer asks as novel title lookups", () => {
    for (const message of [
      "all information about top 3 reviewer",
      "@harutostory14",
      "their all information",
    ]) {
      assert.equal(isBareCatalogueTitleQuery(message), false, message);
      const intents = classifyMoonieIntents(message, {
        hasPriorReviewerResults: true,
      });
      assert.equal(intents.includes("FIND_NOVEL"), false, message);
    }
    assert.equal(
      classifyMoonieIntents("@harutostory14", {
        hasPriorReviewerResults: true,
      }).includes("REVIEWER_OVERVIEW"),
      true
    );
  });
});

describe("lookup title abbreviations", () => {
  it("expands gp to group for catalogue title matching", () => {
    const expanded = normalizeLookupQueryText("Cultivation chat gp");
    assert.equal(expanded, "Cultivation chat group");
    assert.equal(scoreTitleMatch("Cultivation Chat Group", expanded), 100);
  });

  it("expands grp to group case-insensitively", () => {
    assert.equal(
      normalizeLookupQueryText("Cultivation Chat Grp"),
      "Cultivation Chat group"
    );
  });
});
