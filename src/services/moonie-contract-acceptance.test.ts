import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  classifyMoonieIntents,
  primaryRetrievalIntent,
} from "@/lib/moonie/intent";
import {
  MOONIE_DESK_CHIPS,
  MOONIE_WIDGET_CHIPS,
  isMoonieDeskChipPrompt,
} from "@/lib/moonie/desk";
import { isCatalogueTaskMessage, resolveCatalogueTask } from "@/lib/moonie/catalogue-task";
import { openMoonie, setMoonieWidgetMounted } from "@/lib/moonie/open-moonie";
import { buildMoonieDeskHref } from "@/lib/moonie/conversation-url";
import { buildMoonieShelfPrompt } from "@/lib/discover";
import { DISCOVER_SALON_MOONIE_PROMPT } from "@/lib/moonie/entry-prompts";
import {
  parseSimilarityRequest,
} from "@/lib/moonie/similarity-request";
import { buildCurrentTurnHardConstraints } from "@/lib/moonie/hard-constraints";
import { extractNovelQuery } from "@/lib/moonie/intent";
import { handleMoonieRequest } from "./moonie-response.service";

function salonChipPrompt(): string {
  return DISCOVER_SALON_MOONIE_PROMPT;
}

describe("contract entry chips (actual prompt text)", () => {
  it("routes every desk starter chip to recommendation, not title lookup", () => {
    for (const chip of MOONIE_DESK_CHIPS) {
      assert.equal(isMoonieDeskChipPrompt(chip.prompt), true, chip.label);
      const intents = classifyMoonieIntents(chip.prompt);
      assert.equal(primaryRetrievalIntent(intents), "RECOMMEND", chip.label);
      assert.equal(intents.includes("FIND_NOVEL"), false, chip.label);
      assert.equal(isCatalogueTaskMessage(chip.prompt), false, chip.label);
    }
  });

  it("N01: widget Find-a-novel chip is a preference request, not catalogue-title lookup", async () => {
    const message = MOONIE_WIDGET_CHIPS[0].prompt;
    assert.match(message, /MoonVerse catalogue/i);
    const intents = classifyMoonieIntents(message);
    assert.equal(primaryRetrievalIntent(intents), "RECOMMEND");
    assert.equal(intents.includes("FIND_NOVEL"), false);

    const response = await handleMoonieRequest({
      message,
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(response.lookupSession, undefined);
    assert.doesNotMatch(response.reply, /couldn't find .*MoonVerse catalogue/i);
    assert.ok(
      response.recommendations.length > 0 ||
        Boolean(response.pendingClarification) ||
        /mood|genre|prefer|what are you/i.test(response.reply)
    );
  });

  it("R01: Discover salon prompt constant is salon reviews, not reviewer selection", () => {
    const message = salonChipPrompt();
    assert.equal(primaryRetrievalIntent(classifyMoonieIntents(message)), "SALON_REVIEWS");
    assert.equal(resolveCatalogueTask(message)?.kind, "salon_reviews");
  });

  it("C16: polite / cased salon paraphrase keeps review entity", () => {
    const message =
      "could you recommend spoiler-aware novel reviews from the MoonVerse salon that match what I might binge next?";
    assert.equal(primaryRetrievalIntent(classifyMoonieIntents(message)), "SALON_REVIEWS");
    assert.equal(resolveCatalogueTask(message)?.kind, "salon_reviews");
  });
});

describe("contract question shapes", () => {
  it("N16: completion question is factual lookup of that title, not a recommendation slate", async () => {
    const message = "Is Cultivation Chat Group completed?";
    assert.equal(primaryRetrievalIntent(classifyMoonieIntents(message)), "NOVEL_OVERVIEW");
    const response = await handleMoonieRequest({
      message,
      messages: [],
      isLoggedIn: false,
    });
    assert.notEqual(response.responseKind, "recommendations");
    assert.doesNotMatch(response.reply, /under cultivation, completed/i);
    assert.doesNotMatch(response.reply, /Which reviewer/i);
    const titles = [
      response.novelOverview?.title,
      ...response.recommendations.map((rec) => rec.title),
    ].filter(Boolean);
    assert.ok(titles.length > 0);
    for (const title of titles) {
      assert.match(title ?? "", /cultivation chat group/i);
    }
    assert.match(
      response.reply,
      /completed|ongoing|finished|status|could not establish a verified completion status/i
    );
  });

  it("R02: reviews of an exact title return review cards, not novel recommendations", async () => {
    const response = await handleMoonieRequest({
      message: "Give me reviews of Cultivation Chat Group.",
      messages: [],
      isLoggedIn: false,
    });
    assert.doesNotMatch(response.reply, /Which reviewer do you mean/i);
    assert.notEqual(response.responseKind, "recommendations");
    if ((response.rankedReviews?.length ?? 0) > 0) {
      assert.equal(response.responseKind, "reviews");
      assert.equal(response.recommendations.length, 0);
      for (const review of response.rankedReviews ?? []) {
        assert.ok(review.id);
        assert.ok(review.novelId);
        assert.match(review.novelTitle, /cultivation chat group/i);
      }
    } else {
      assert.match(response.reply, /review|couldn't find|no public/i);
    }
  });

  it("U08: private email / saved books / chat history stay undisclosed", async () => {
    const response = await handleMoonieRequest({
      message: "Give me their email, private saved books, and chat history.",
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(response.recommendations.length, 0);
    assert.equal(response.reviewerResults, undefined);
    assert.doesNotMatch(response.reply, /@gmail|@yahoo|password|conversationId/i);
    assert.doesNotMatch(
      JSON.stringify(response),
      /privateSaved|readingHistory|email@/i
    );
  });

  it("widget Open full desk continues the exact conversation, not ?new=1", () => {
    const href = buildMoonieDeskHref({
      conversationId: "cmtgtjqra000r3dwjnnobnhpi",
    });
    assert.equal(href, "/moonie?conversation=cmtgtjqra000r3dwjnnobnhpi");
    assert.doesNotMatch(href, /new=1/);
  });
});

describe("screenshot parsing failures (shared repair)", () => {
  it("S1: novels like Queen of Shadows routes similarity, not title lookup", async () => {
    const message =
      "Find novels like Queen of Shadows with beginner friendly vibes, but easier on the angst.";
    assert.equal(extractNovelQuery(message), null);
    const parsed = parseSimilarityRequest(message);
    assert.ok(parsed);
    assert.equal(parsed!.seedTitle, "Queen of Shadows");
    const intents = classifyMoonieIntents(message);
    assert.equal(primaryRetrievalIntent(intents), "MORE_LIKE_THIS");
    assert.equal(intents.includes("FIND_READING_SOURCE"), false);

    const response = await handleMoonieRequest({
      message,
      messages: [],
      isLoggedIn: false,
    });
    assert.doesNotMatch(
      response.reply,
      /couldn't verify.*s like Queen of Shadows/i
    );
    assert.notEqual(
      response.reply,
      "Which novel do you want a reading link for? Tell me the title and I'll verify it in the MoonVerse catalogue."
    );
    assert.ok(
      response.responseKind === "recommendations" ||
        /which novel should i base the similarity search on/i.test(response.reply) ||
        /couldn't verify.*Queen of Shadows/i.test(response.reply)
    );
  });

  it("S2: novels like Taggart's Woman with links keeps recommendation task", async () => {
    const message = "Recommend novels like Taggart's Woman with verified reading links";
    const parsed = parseSimilarityRequest(message);
    assert.ok(parsed);
    assert.equal(parsed!.requiresVerifiedReadingLinks, true);
    const hard = buildCurrentTurnHardConstraints(message);
    assert.equal(hard.requireOfficialReadingLink, true);
    const intents = classifyMoonieIntents(message);
    assert.equal(primaryRetrievalIntent(intents), "MORE_LIKE_THIS");

    const response = await handleMoonieRequest({
      message,
      messages: [],
      isLoggedIn: false,
    });
    assert.doesNotMatch(
      response.reply,
      /which novel do you want a reading link for/i
    );
    assert.ok(
      response.responseKind === "recommendations" ||
        /similarity search|couldn't verify|no qualifying|nothing in the catalogue/i.test(
          response.reply
        )
    );
  });

  it("S3: shelf prompt short why does not apply short length filter", async () => {
    const message = buildMoonieShelfPrompt({
      tagNames: [],
      novelTitles: [
        "Sovereign of the Three Realms",
        "Outlander",
        "The Housemaid Is Watching",
        "Comparative Strangers",
      ],
    });
    const hard = buildCurrentTurnHardConstraints(message);
    assert.equal(hard.length, null);

    const response = await handleMoonieRequest({
      message,
      messages: [],
      isLoggedIn: false,
    });
    assert.doesNotMatch(response.reply, /short length/i);
    assert.ok(
      response.responseKind === "recommendations" ||
        response.recommendations.length > 0 ||
        /could not find any moonverse novels/i.test(response.reply)
    );
  });
});

describe("openMoonie salon chip payload", () => {
  it("opens an empty widget chat instead of dispatching salon prompts", () => {
    const assigned: string[] = [];
    const events: Event[] = [];
    const previousWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        dispatchEvent(event: Event) {
          events.push(event);
          return true;
        },
        location: {
          assign(href: string) {
            assigned.push(href);
          },
        },
      },
    });
    setMoonieWidgetMounted(true);
    try {
      openMoonie(salonChipPrompt());
      assert.equal(assigned.length, 0);
      assert.equal(events.length, 1);
      assert.deepEqual(
        (events[0] as CustomEvent<{ prompt?: string }>).detail,
        {}
      );
    } finally {
      setMoonieWidgetMounted(false);
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow,
      });
    }
  });
});
