import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyMoonieIntents, primaryRetrievalIntent } from "@/lib/moonie/intent";
import {
  MOONIE_INTEGRATION_SEED_MESSAGE,
} from "@/lib/moonie/demo-acceptance-fixtures";
import {
  sanitizeCommunityInsightForMode,
} from "@/lib/moonie/spoiler-mode";
import { handleMoonieRequest } from "./moonie-response.service";

const rec = (
  id: string,
  title: string,
  matchPercent: number,
  averageRating?: number
) => ({
  novelId: id,
  title,
  author: "Author",
  reason: "Fixture reason.",
  genres: ["Fantasy"],
  tags: ["slice-of-life"],
  confidence: "high" as const,
  matchPercent,
  averageRating,
  sourceStatus: "verified" as const,
  availableOn: [],
});

describe("replay spoiler consensus fallback", () => {
  const spoilerBody = "The hero dies at the end and the villain wins.";

  it("withholds unverified raw consensus in none and light modes", () => {
    const stored = {
      averageRating: 4.5,
      reviewCount: 1,
      previews: [
        {
          id: "p1",
          title: "The hero dies and everyone loses",
          excerpt: spoilerBody,
          rating: 5,
          reviewerName: "Reader",
        },
      ],
      consensus: spoilerBody,
    };

    const none = sanitizeCommunityInsightForMode(stored, "none");
    assert.equal(none?.consensus, null);
    assert.equal(none?.previews.length, 0);

    const light = sanitizeCommunityInsightForMode(stored, "light");
    assert.equal(light?.consensus, null);
    assert.match(light?.previews[0]?.excerpt ?? "", /Spoiler-marked review/i);
    assert.doesNotMatch(light?.previews[0]?.excerpt ?? "", /hero dies/i);
  });

  it("re-sanitizes fresh replay without leaking raw consensus", async () => {
    const leaky = {
      ...rec("replay-fixture", "Replay Fixture", 90, 4),
      community: {
        averageRating: 4.5,
        reviewCount: 1,
        previews: [
          {
            id: "preview-1",
            title: "The hero dies and everyone loses",
            excerpt: spoilerBody,
            rating: 5,
            reviewerName: "Reader",
          },
        ],
        consensus: spoilerBody,
      },
    };

    const replay = await handleMoonieRequest({
      message: "Show all previous recommendations again",
      messages: [
        {
          role: "assistant",
          content: "Earlier recommendations",
          meta: { recommendations: [leaky] },
        },
      ],
      isLoggedIn: false,
      spoilerMode: "none",
    });

    assert.equal(replay.recommendations[0]?.novelId, "replay-fixture");
    assert.equal(replay.recommendations[0]?.community?.consensus, null);
    const blob = JSON.stringify(replay.recommendations[0]?.community ?? {});
    assert.doesNotMatch(blob, /hero dies/i);
  });
});

describe("task and target resolution repairs", () => {
  it("routes tell me about a known novel title to novel overview", async () => {
    const intents = classifyMoonieIntents("tell me about Culpa Tuya");
    assert.equal(intents.includes("REVIEWER_OVERVIEW"), false);
    assert.ok(
      intents.includes("NOVEL_OVERVIEW") || intents.includes("FIND_NOVEL")
    );

    const response = await handleMoonieRequest({
      message: "tell me about Culpa Tuya",
      messages: [],
      isLoggedIn: false,
    });
    assert.doesNotMatch(response.reply, /couldn't find a MoonVerse reviewer/i);
    assert.ok(
      response.novelOverview?.title === "Culpa Tuya" ||
        response.lookupSession?.candidates.some((c) => c.title === "Culpa Tuya")
    );
  });

  it("routes tell me more about the first one to the first shown recommendation", async () => {
    const seed = await handleMoonieRequest({
      message: MOONIE_INTEGRATION_SEED_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });
    assert.ok(seed.recommendations.length >= 2);

    const response = await handleMoonieRequest({
      message: "tell me more about the first one",
      messages: [
        { role: "user", content: MOONIE_INTEGRATION_SEED_MESSAGE },
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(response.analyticsIntent, "novel_overview");
    assert.equal(
      response.novelOverview?.novelId,
      seed.recommendations[0]!.novelId
    );
    assert.doesNotMatch(response.reply, /Which reviewer/i);
    assert.doesNotMatch(response.reply, /couldn't verify "first one"/i);
  });

  it("answers what is this novel about from active thread context", async () => {
    const seed = await handleMoonieRequest({
      message: MOONIE_INTEGRATION_SEED_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });
    assert.ok(seed.recommendations[0]);

    const response = await handleMoonieRequest({
      message: "what is this novel about?",
      messages: [
        { role: "user", content: MOONIE_INTEGRATION_SEED_MESSAGE },
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(response.novelOverview?.novelId, seed.recommendations[0]!.novelId);
    assert.doesNotMatch(response.reply, /couldn't verify/i);
  });

  it("routes username review phrasing variants to reviewer overview", async () => {
    for (const message of [
      "show me ezraink76 reviews",
      "show me @ezraink76 reviews",
      "give me all of @ezraink76 reviews",
      "show me all of @ezraink76 reviews",
    ]) {
      const intents = classifyMoonieIntents(message);
      assert.equal(primaryRetrievalIntent(intents), "REVIEWER_OVERVIEW", message);

      const response = await handleMoonieRequest({
        message,
        messages: [],
        isLoggedIn: false,
      });
      assert.equal(response.reviewerOverview?.username, "ezraink76", message);
    }
  });

  it("returns scoped no-match for unknown reviewer review asks", async () => {
    const response = await handleMoonieRequest({
      message: "show me TotallyFakeReviewerAcceptanceFixture reviews",
      messages: [],
      isLoggedIn: false,
    });
    assert.match(
      response.reply,
      /couldn't find a MoonVerse reviewer matching/i
    );
    assert.doesNotMatch(
      response.reply,
      /novel discovery on MoonVerse/i
    );
  });

  it("ranks catalogue best-match asks instead of title lookup", async () => {
    const response = await handleMoonieRequest({
      message: "What is the best match for fantasy?",
      messages: [],
      isLoggedIn: false,
    });
    assert.doesNotMatch(response.reply, /couldn't verify "best match for fantasy"/i);
    if (response.recommendations.length === 1) {
      assert.match(response.reply, /shortlist/i);
    }
  });

  it("compares the first two cards from the referenced recommendation list", async () => {
    const seed = await handleMoonieRequest({
      message: MOONIE_INTEGRATION_SEED_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });
    assert.ok(seed.recommendations.length >= 2);

    const response = await handleMoonieRequest({
      message: "compare the first two",
      messages: [
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(response.analyticsIntent, "compare");
    assert.ok((response.compare?.rows?.length ?? 0) >= 2);
    const titles = response.compare?.rows?.map((row) => row.title) ?? [];
    assert.ok(titles.includes(seed.recommendations[0]!.title));
    assert.ok(titles.includes(seed.recommendations[1]!.title));
    assert.equal(
      titles.includes(seed.recommendations[2]?.title ?? ""),
      seed.recommendations.length > 2 ? false : titles.length <= 2
    );
  });
});
