import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MOONIE_DESK_CHIPS,
  MOONIE_WIDGET_CHIPS,
  isMoonieDeskChipPrompt,
  isMoonieGenericDiscoveryPrompt,
} from "./desk";
import {
  extractCompareTitles,
  extractNovelQuery,
  isBareCatalogueTitleQuery,
  isBareReadingLinkRequest,
  isNonCatalogueTitleQuery,
  isBareCommunityConsensusRequestWithoutNovel,
  isBareReviewRequestWithoutNovel,
  isCataloguePreferenceDescription,
  isMoonieGeneratedFollowUpQuestion,
  isNonTitleLookupPhrase,
  isUseSavedPreferencesRequest,
  isVagueContinuationRequest,
  normalizeLookupQueryText,
  primaryRetrievalIntent,
  classifyMoonieIntents,
  enumerateCompareTitleParses,
  isExplicitNonCompareTaskChange,
  preferCompareTitleParse,
  resolveNovelContextFollowUpIntent,
} from "./intent";
import { MOONIE_QUICK_PROMPTS } from "@/lib/moonie/constants";
import { scoreTitleMatch } from "@/lib/search";
import { isVerifiedSeriesDiscoveryRequest } from "./series-intent";
import { handleMoonieRequest } from "@/services/moonie-response.service";

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
  it("treats named completion questions as lookup, not cultivation recommendations", () => {
    const message = "Is Cultivation Chat Group completed?";
    assert.equal(extractNovelQuery(message), "Cultivation Chat Group");
    const intents = classifyMoonieIntents(message, {});
    assert.equal(primaryRetrievalIntent(intents), "NOVEL_OVERVIEW");
    assert.equal(intents.includes("RECOMMEND"), false);
  });

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

  it("does not treat widget starter payloads as catalogue titles", () => {
    const findNovel = MOONIE_WIDGET_CHIPS[0];
    assert.equal(isMoonieGenericDiscoveryPrompt(findNovel.prompt), true);
    assert.equal(extractNovelQuery(findNovel.prompt), null);
    assert.equal(isNonCatalogueTitleQuery("in the MoonVerse catalogue"), true);
    const findIntents = classifyMoonieIntents(findNovel.prompt, {});
    assert.equal(primaryRetrievalIntent(findIntents), "RECOMMEND");
    assert.equal(findIntents.includes("FIND_NOVEL"), false);

    const where = MOONIE_WIDGET_CHIPS[1];
    assert.equal(extractNovelQuery(where.prompt), null);
    assert.equal(isBareReadingLinkRequest(where.prompt), true);
    const whereIntents = classifyMoonieIntents(where.prompt, {});
    assert.equal(primaryRetrievalIntent(whereIntents), "FIND_READING_SOURCE");

    const compare = MOONIE_WIDGET_CHIPS[2];
    assert.deepEqual(extractCompareTitles(compare.prompt), []);
    const compareIntents = classifyMoonieIntents(compare.prompt, {});
    assert.equal(primaryRetrievalIntent(compareIntents), "COMPARE");
    assert.equal(compareIntents.includes("RECOMMEND"), false);
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

  it("routes product quick prompts to recommendations, not title lookup", () => {
    for (const message of MOONIE_QUICK_PROMPTS) {
      assert.equal(isCataloguePreferenceDescription(message), true, message);
      assert.equal(isBareCatalogueTitleQuery(message), false, message);
      const intents = classifyMoonieIntents(message, {});
      assert.equal(primaryRetrievalIntent(intents), "RECOMMEND", message);
      assert.equal(intents.includes("FIND_NOVEL"), false, message);
    }
  });

  it("routes ordinal reviewer follow-up after a ranking list", async () => {
    const ranking = await handleMoonieRequest({
      message: "recommend top 5 reviewer",
      messages: [],
      isLoggedIn: false,
    });
    assert.ok((ranking.reviewerResults?.length ?? 0) >= 2);
    assert.match(ranking.reply, /ranked by published review count/i);

    const followUp = await handleMoonieRequest({
      message: "which reviewer is top 1",
      messages: [
        { role: "user", content: "recommend top 5 reviewer" },
        {
          role: "assistant",
          content: ranking.reply,
          meta: {
            reviewerResults: ranking.reviewerResults,
            reviewerSession: ranking.reviewerSession,
          },
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(followUp.reviewerOverview?.username, ranking.reviewerResults?.[0]?.username);
    assert.equal(
      followUp.reviewerOverview?.reviewCount,
      ranking.reviewerResults?.[0]?.reviewCount
    );
    assert.doesNotMatch(followUp.reply, /catalogue pick|novel discovery on MoonVerse/i);
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

describe("pending compare title answers", () => {
  const pending = { kind: "compare_titles" as const };
  const titleAnswer = "The Road to forever and cultivation chat gp";

  it("routes a title-only compare answer to COMPARE, not FIND_NOVEL", () => {
    const intents = classifyMoonieIntents(titleAnswer, {
      pendingClarification: pending,
    });
    assert.equal(primaryRetrievalIntent(intents), "COMPARE");
    assert.equal(intents.includes("FIND_NOVEL"), false);
    assert.equal(isBareCatalogueTitleQuery(titleAnswer), true);
  });

  it("keeps an explicit Compare prefix on COMPARE", () => {
    const message = "Compare The road to forever and Cultivation Chat Group";
    const intents = classifyMoonieIntents(message, {
      pendingClarification: pending,
    });
    assert.equal(primaryRetrievalIntent(intents), "COMPARE");
    assert.deepEqual(extractCompareTitles(message).map((title) => title.toLowerCase()), [
      "the road to forever",
      "cultivation chat group",
    ]);
  });

  it("does not treat a new empty chat as a pending compare", () => {
    const intents = classifyMoonieIntents(titleAnswer, {});
    assert.equal(primaryRetrievalIntent(intents), "FIND_NOVEL");
    assert.equal(intents.includes("COMPARE"), false);
  });

  it("yields to an explicit Where-to-read task change", () => {
    const message = "Where can I read it?";
    assert.equal(isExplicitNonCompareTaskChange(message, ["FIND_READING_SOURCE"]), true);
    const intents = classifyMoonieIntents(message, {
      pendingClarification: pending,
    });
    assert.equal(primaryRetrievalIntent(intents), "FIND_READING_SOURCE");
    assert.equal(intents.includes("COMPARE"), false);
  });

  it("enumerates and-splits and the unsplit genuine title", () => {
    const parses = enumerateCompareTitleParses("Pride and Prejudice");
    assert.ok(parses.some((parse) => parse.length === 1 && /pride and prejudice/i.test(parse[0]!)));
    assert.ok(parses.some((parse) => parse.length === 2));
    assert.ok(
      preferCompareTitleParse(
        { resolvedCount: 1, titleCount: 1 },
        { resolvedCount: 0, titleCount: 2 }
      ) < 0
    );
    assert.ok(
      preferCompareTitleParse(
        { resolvedCount: 2, titleCount: 2 },
        { resolvedCount: 1, titleCount: 1 }
      ) < 0
    );
  });
});
