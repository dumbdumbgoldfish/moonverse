import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyMoonieIntents } from "@/lib/moonie/intent";
import {
  MOONIE_INTEGRATION_SEED_MESSAGE,
} from "@/lib/moonie/demo-acceptance-fixtures";
import { handleMoonieRequest } from "./moonie-response.service";

const REVIEWER_REQUESTS = [
  "find a reviwer name yue",
  "find a reviewer named Yue",
  "show me Yue's reviews",
] as const;

describe("Moonie reviewer request dispatch", () => {
  for (const message of REVIEWER_REQUESTS) {
    it(`keeps "${message}" on the reviewer response path`, async () => {
      const intents = classifyMoonieIntents(message);
      assert.equal(intents.includes("FIND_NOVEL"), false);
      if (message.startsWith("show me")) {
        assert.equal(intents.includes("REVIEWER_OVERVIEW"), true);
      } else {
        assert.equal(intents.includes("FIND_REVIEWERS"), true);
      }

      const response = await handleMoonieRequest({
        message,
        messages: [],
        isLoggedIn: false,
      });

      assert.equal(response.lookupSession, undefined);
      const hasReviewerPayload = Boolean(
        response.reviewerOverview || response.reviewerResults
      );
      if (!hasReviewerPayload) {
        assert.match(response.reply, /couldn't find a MoonVerse reviewer/i);
      }
      if (
        message === "show me Yue's reviews" &&
        response.reviewerOverview &&
        response.reviewerOverview.recentReviews.length === 0
      ) {
        assert.match(response.reply, /hasn't published any public reviews/i);
      }
    });
  }

  it("returns a reviewer-specific no-match for named authored reviews", async () => {
    const response = await handleMoonieRequest({
      message: "show me NoSuchReviewerDispatchFixture's reviews",
      messages: [],
      isLoggedIn: false,
    });

    assert.equal(response.lookupSession, undefined);
    assert.equal(response.reviewerOverview, undefined);
    assert.match(
      response.reply,
      /couldn't find a MoonVerse reviewer matching "NoSuchReviewerDispatchFixture"/i
    );
  });

  it("does not force an ambiguous bare find request into reviewer lookup", () => {
    const intents = classifyMoonieIntents("find Yue");
    assert.equal(intents.includes("FIND_REVIEWERS"), false);
    assert.equal(intents.includes("REVIEWER_OVERVIEW"), false);
  });

  it("routes how-about follow-ups into reviewer lookup after a prior list", async () => {
    const intents = classifyMoonieIntents("how about pan", {
      hasPriorReviewerResults: true,
    });
    assert.equal(intents.includes("FIND_REVIEWERS"), true);
    assert.equal(intents.includes("FIND_NOVEL"), false);

    const response = await handleMoonieRequest({
      message: "how about pan",
      messages: [
        {
          role: "assistant",
          content: "Here are reviewers matching yue.",
          meta: {
            reviewerResults: [
              {
                id: "yue-1",
                displayName: "Yuexian",
                username: "yuexian",
                avatarInitials: "YX",
                reviewCount: 3,
                followerCount: 1,
              },
            ],
            reviewerSession: {
              reviewers: [
                {
                  id: "yue-1",
                  displayName: "Yuexian",
                  username: "yuexian",
                  avatarInitials: "YX",
                  reviewCount: 3,
                  followerCount: 1,
                },
              ],
              rankBy: "reviews",
              queryType: "lookup",
            },
          },
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(response.lookupSession, undefined);
    assert.ok(response.reviewerOverview || response.reviewerResults);
    assert.doesNotMatch(
      response.reply,
      /search novels, reviews, links, and recommendations/i
    );
  });
});

describe("Moonie constraint-relaxation dispatch", () => {
  const priorMessages = [
    {
      role: "user",
      content:
        "Show me completed found family or slice-of-life novels",
    },
    {
      role: "assistant",
      content:
        "I could not find any MoonVerse novels that match found family or slice-of-life, completed.",
    },
  ];

  for (const message of [
    "Same request, but drop the strictest constraint.",
    "Drop one constraint",
  ]) {
    it(`keeps "${message}" on contextual recommendation refinement`, async () => {
      const intents = classifyMoonieIntents(message, {
        hasConversationPrefs: true,
        recentMessages: priorMessages,
      });
      assert.equal(intents.includes("FIND_NOVEL"), false);
      assert.equal(intents.includes("REFINE"), true);

      const response = await handleMoonieRequest({
        message,
        messages: priorMessages,
        isLoggedIn: false,
      });

      assert.equal(response.lookupSession, undefined);
      assert.equal(response.responseKind, "chat");
      assert.match(response.reply, /which (?:criterion|constraint)/i);
      assert.match(response.reply, /completed/i);
      assert.match(response.reply, /found family|slice-of-life/i);
      assert.doesNotMatch(response.reply, /short length|long length/i);
      assert.ok((response.quickPrompts?.length ?? 0) >= 2);
      for (const prompt of response.quickPrompts ?? []) {
        assert.doesNotMatch(prompt, /short|long length|quick read/i);
      }
    });
  }
});

describe("Moonie review and similarity dispatch", () => {
  const priorRecommendation = {
    novelId: "stale-context-novel",
    title: "Stale Context Novel",
    author: "Author",
    reason: "Saved taste match.",
    genres: ["Fantasy"],
    tags: ["found family"],
    confidence: "high" as const,
    matchPercent: 88,
    sourceStatus: "verified" as const,
    availableOn: [],
  };

  it("clarifies bare show me novel reviews instead of recommending novels", async () => {
    const intents = classifyMoonieIntents("Show me novel reviews", {
      hasPriorRecommendations: true,
      recentMessages: [
        {
          role: "assistant",
          content: "Earlier picks",
        },
      ],
    });
    assert.equal(intents.includes("NOVEL_REVIEWS"), true);
    assert.equal(intents.includes("RECOMMEND"), false);

    const response = await handleMoonieRequest({
      message: "Show me novel reviews",
      messages: [
        {
          role: "assistant",
          content: "I found a few matches based on what you asked for.",
          meta: { recommendations: [priorRecommendation] },
        },
      ],
      isLoggedIn: true,
    });

    assert.equal(response.lookupSession, undefined);
    assert.equal(response.recommendations.length, 0);
    assert.equal(response.responseKind, "chat");
    assert.match(response.reply, /which novel would you like to see reviews for/i);
    assert.doesNotMatch(response.reply, /couldn't verify/i);
  });

  it("routes the card more-like-this action through similarity, not title lookup", async () => {
    const seed = await handleMoonieRequest({
      message: MOONIE_INTEGRATION_SEED_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });
    const clickedId = seed.recommendations[0]?.novelId;
    assert.ok(clickedId);

    const response = await handleMoonieRequest({
      message: "More like this novel, refined to my taste.",
      messages: [
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
      ],
      similarToNovelId: clickedId,
      isLoggedIn: false,
    });

    assert.equal(response.lookupSession, undefined);
    assert.doesNotMatch(response.reply, /couldn't verify/i);
    assert.equal(response.responseKind, "recommendations");
    assert.ok(response.recommendations.length > 0);
    assert.notEqual(response.recommendations[0]?.novelId, clickedId);
  });

  it("repeating more-like-this with explicit id never falls back to literal lookup", async () => {
    const seed = await handleMoonieRequest({
      message: MOONIE_INTEGRATION_SEED_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });
    const explicitId = seed.recommendations[0]?.novelId;
    assert.ok(explicitId);

    const first = await handleMoonieRequest({
      message: "More like this novel, refined to my taste.",
      messages: [
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
      ],
      similarToNovelId: explicitId,
      isLoggedIn: false,
    });
    assert.doesNotMatch(first.reply, /couldn't verify/i);

    const second = await handleMoonieRequest({
      message: "More like this novel, refined to my taste.",
      messages: [
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
      ],
      similarToNovelId: explicitId,
      isLoggedIn: false,
    });
    assert.doesNotMatch(second.reply, /couldn't verify/i);
    assert.equal(second.lookupSession, undefined);
  });

  it("prefers clicked novel id over stale active conversation context", async () => {
    const seed = await handleMoonieRequest({
      message: MOONIE_INTEGRATION_SEED_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });
    const clickedId = seed.recommendations[0]?.novelId;
    assert.ok(clickedId);

    const response = await handleMoonieRequest({
      message: "More like this novel, refined to my taste.",
      messages: [
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
        {
          role: "assistant",
          content: "Other thread",
          meta: { recommendations: [priorRecommendation] },
        },
      ],
      similarToNovelId: clickedId,
      isLoggedIn: false,
    });

    assert.doesNotMatch(response.reply, /couldn't verify/i);
    assert.notEqual(
      response.recommendations[0]?.novelId,
      priorRecommendation.novelId
    );
  });

  it("asks which novel to base similarity on when the action has no source", async () => {
    const response = await handleMoonieRequest({
      message: "More like this novel, refined to my taste.",
      messages: [
        {
          role: "assistant",
          content: "Earlier picks",
          meta: { recommendations: [priorRecommendation] },
        },
      ],
      isLoggedIn: true,
    });

    assert.equal(response.lookupSession, undefined);
    assert.equal(response.recommendations.length, 0);
    assert.match(
      response.reply,
      /which novel should i base the similarity search on/i
    );
    assert.doesNotMatch(response.reply, /couldn't verify/i);
  });

  it("acknowledges spoiler mode commands instead of catalogue lookup", async () => {
    for (const message of [
      "no spoilers",
      "please keep it spoiler-free",
      "light spoilers only",
      "full discussion",
    ]) {
      const response = await handleMoonieRequest({
        message,
        messages: [],
        isLoggedIn: true,
      });
      assert.equal(response.lookupSession, undefined);
      assert.doesNotMatch(response.reply, /couldn't verify/i);
      assert.match(response.reply, /spoiler shield set to/i);
    }
  });

  it("keeps spoiler shield on negated mode switches", async () => {
    const response = await handleMoonieRequest({
      message: "don't switch to full discussion",
      messages: [],
      isLoggedIn: true,
      spoilerMode: "none",
    });
    assert.equal(response.spoilerMode, "none");
    assert.match(response.reply, /keep spoiler shield/i);
    assert.equal(response.recommendations.length, 0);
    assert.doesNotMatch(response.reply, /spoiler shield set to/i);
  });

  it("applies spoiler preference on mixed recommendation asks", async () => {
    const response = await handleMoonieRequest({
      message: "Recommend fantasy novels without spoilers",
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(response.spoilerMode, "none");
    assert.doesNotMatch(response.reply, /spoiler shield set to/i);
    assert.ok(
      response.recommendations.length > 0 ||
        /could not find|no .*match/i.test(response.reply)
    );
  });

  it("re-sanitizes replayed cards under a stricter spoiler mode", async () => {
    const spoilerTitle = "The hero dies and everyone loses";
    const spoilerBody = "The hero dies at the end and the villain wins.";
    const priorRecommendation = {
      novelId: "replay-spoiler-fixture",
      title: "Replay Fixture",
      author: "Author",
      reason: "Fixture reason.",
      genres: ["Fantasy"],
      tags: ["slice-of-life"],
      confidence: "high" as const,
      matchPercent: 90,
      sourceStatus: "verified" as const,
      availableOn: [],
      community: {
        averageRating: 4.5,
        reviewCount: 1,
        previews: [
          {
            id: "preview-1",
            title: spoilerTitle,
            excerpt: `${spoilerTitle} ${spoilerBody}`,
            rating: 5,
            reviewerName: "Reader",
          },
        ],
        consensus: `Spoiler-marked review ${spoilerBody}`,
      },
    };

    const replay = await handleMoonieRequest({
      message: "Show all previous recommendations again",
      messages: [
        {
          role: "assistant",
          content: "Earlier recommendations",
          meta: { recommendations: [priorRecommendation] },
        },
      ],
      isLoggedIn: false,
      spoilerMode: "none",
    });

    assert.equal(replay.recommendations.length, 1);
    assert.equal(replay.recommendations[0]?.novelId, "replay-spoiler-fixture");
    const community = replay.recommendations[0]?.community;
    if (community?.previews.length) {
      for (const preview of community.previews) {
        assert.doesNotMatch(preview.title, /hero dies/i);
        assert.doesNotMatch(preview.excerpt, /hero dies/i);
      }
    }
    if (community?.consensus) {
      assert.doesNotMatch(community.consensus, /hero dies/i);
    }
  });

  it("picks the best card among already shown recommendations", async () => {
    const low = { ...priorRecommendation, novelId: "low", matchPercent: 70 };
    const high = {
      ...priorRecommendation,
      novelId: "high",
      title: "High Match",
      matchPercent: 95,
    };
    const response = await handleMoonieRequest({
      message: "Which is the best match among these picks?",
      messages: [
        {
          role: "assistant",
          content: "Earlier picks",
          meta: { recommendations: [low, high] },
        },
      ],
      isLoggedIn: true,
    });
    assert.equal(response.recommendations.length, 1);
    assert.equal(response.recommendations[0]?.novelId, "high");
    assert.match(response.reply, /among the cards already in this thread/i);
    assert.equal(response.consumesQuota, false);
  });

  it("returns public reviews for an anchored review request", async () => {
    const seed = await handleMoonieRequest({
      message: MOONIE_INTEGRATION_SEED_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });
    const novel = seed.recommendations[0];
    assert.ok(novel);

    const response = await handleMoonieRequest({
      message: "show me its reviews",
      messages: [
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(response.analyticsIntent, "novel_reviews");
    assert.ok(response.novelOverview);
    assert.equal(response.novelOverview?.title, novel.title);
    assert.equal(response.recommendations.length, 0);
    assert.match(response.reply, /review/i);
  });

  it("resolves reviews of these novels from the latest recommendation batch", async () => {
    const seed = await handleMoonieRequest({
      message: MOONIE_INTEGRATION_SEED_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });
    assert.ok(seed.recommendations.length >= 2);

    const response = await handleMoonieRequest({
      message: "give me reviews of these novels",
      messages: [
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations.slice(0, 2) },
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(response.analyticsIntent, "novel_reviews");
    assert.doesNotMatch(response.reply, /couldn't verify/i);
    assert.notEqual(
      response.reply,
      "Which novel would you like to see reviews for?"
    );
    assert.ok(
      response.novelReviewGroups?.length || response.novelOverview,
      "expected review payload"
    );
  });

  it("clarifies ambiguous that novels phrasing with shown titles", async () => {
    const seed = await handleMoonieRequest({
      message: MOONIE_INTEGRATION_SEED_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });
    assert.ok(seed.recommendations[0]);

    const response = await handleMoonieRequest({
      message: "give me reviews of that novels",
      messages: [
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations.slice(0, 1) },
        },
      ],
      isLoggedIn: false,
    });

    assert.match(response.reply, new RegExp(seed.recommendations[0]!.title, "i"));
    assert.doesNotMatch(response.reply, /couldn't verify/i);
    assert.equal(response.consumesQuota, false);
  });
});
