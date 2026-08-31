import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  BROWSE_CLARIFY_FIRST_PROMPT,
  DISCOVER_SALON_MOONIE_PROMPT,
  FOR_YOU_SHELF_REVIEWS_PROMPT,
} from "@/lib/moonie/entry-prompts";
import { classifyMoonieIntents, primaryRetrievalIntent } from "@/lib/moonie/intent";
import { hydrateStoredAssistantMeta } from "@/lib/moonie/persist-assistant-turn";
import { handleMoonieRequest } from "./moonie-response.service";
import type { MoonieRecommendation } from "@/types/moonie";

const TOP_REVIEW_PHRASES = [
  "give me top 5 reviews",
  "give me top 5 novel reviews",
] as const;

const PRIOR_RECS: MoonieRecommendation[] = [
  {
    novelId: "prior-rec-1",
    title: "Prior Rec One",
    author: "Author",
    reason: "Shown earlier.",
    genres: ["Fantasy"],
    tags: [],
    confidence: "high",
    matchPercent: 90,
    sourceStatus: "verified",
    availableOn: [],
  },
  {
    novelId: "prior-rec-2",
    title: "Prior Rec Two",
    author: "Author",
    reason: "Shown earlier.",
    genres: ["Romance"],
    tags: [],
    confidence: "high",
    matchPercent: 80,
    sourceStatus: "verified",
    availableOn: [],
  },
];

function priorRecommendationMessages() {
  return [
    { role: "user" as const, content: "Recommend fantasy novels" },
    {
      role: "assistant" as const,
      content: "Here are verified matches.",
      meta: { recommendations: PRIOR_RECS, responseKind: "recommendations" },
    },
  ];
}

describe("Moonie review and ranking task routing", () => {
  for (const message of TOP_REVIEW_PHRASES) {
    it(`asks for a ranking basis for "${message}" without novel cards`, async () => {
      const intents = classifyMoonieIntents(message);
      assert.equal(primaryRetrievalIntent(intents), "TOP_REVIEWS");
      assert.equal(intents.includes("RECOMMEND"), false);

      const response = await handleMoonieRequest({
        message,
        messages: [],
        isLoggedIn: false,
      });

      assert.equal(response.responseKind, "chat");
      assert.equal(response.recommendations.length, 0);
      assert.equal(response.pendingClarification?.kind, "review_ranking");
      assert.equal(response.requestedCount, 5);
      assert.equal(response.rankingMetric ?? null, null);
      assert.match(response.reply, /highest rated|most recent|most helpful/i);
    });

    it(`keeps count=5 for "${message}" after a ranking-basis answer`, async () => {
      const ask = await handleMoonieRequest({
        message,
        messages: [],
        isLoggedIn: false,
      });
      const answered = await handleMoonieRequest({
        message: "Highest rated",
        messages: [
          { role: "user", content: message },
          {
            role: "assistant",
            content: ask.reply,
            meta: {
              pendingClarification: ask.pendingClarification,
              requestedCount: ask.requestedCount,
              responseKind: ask.responseKind,
            },
          },
        ],
        isLoggedIn: false,
      });

      assert.equal(answered.responseKind, "reviews");
      assert.equal(answered.rankingMetric, "review_rating");
      assert.equal(answered.requestedCount, 5);
      assert.ok((answered.rankedReviews?.length ?? 0) <= 5);
      assert.equal(answered.recommendations.length, 0);
      for (const review of answered.rankedReviews ?? []) {
        assert.ok(review.id);
        assert.ok(review.novelId);
        assert.ok(review.reviewerName);
      }
    });

    it(`does not silently restrict "${message}" to prior recommendations`, async () => {
      const response = await handleMoonieRequest({
        message,
        messages: priorRecommendationMessages(),
        isLoggedIn: false,
      });
      assert.equal(response.pendingClarification?.kind, "review_ranking");
      assert.equal(response.pendingClarification?.amongThese, false);
      assert.equal(response.recommendations.length, 0);
    });
  }

  it("routes the salon binge-review chip to reviews or a reading-preference ask", async () => {
    const message =
      "Recommend spoiler-aware novel reviews from the MoonVerse salon that match what I might binge next.";
    const emptyIntents = classifyMoonieIntents(message);
    assert.equal(primaryRetrievalIntent(emptyIntents), "SALON_REVIEWS");
    assert.equal(emptyIntents.includes("FIND_REVIEWERS"), false);
    assert.equal(emptyIntents.includes("REVIEWER_OVERVIEW"), false);
    assert.equal(emptyIntents.includes("TOP_REVIEWS"), false);

    const afterReviewer = classifyMoonieIntents(message, {
      hasPriorReviewerResults: true,
    });
    assert.equal(primaryRetrievalIntent(afterReviewer), "SALON_REVIEWS");
    assert.equal(afterReviewer.includes("REVIEWER_OVERVIEW"), false);
    assert.equal(afterReviewer.includes("FIND_REVIEWERS"), false);

    const response = await handleMoonieRequest({
      message,
      messages: [],
      isLoggedIn: false,
    });
    assert.doesNotMatch(response.reply, /Which reviewer/i);
    assert.doesNotMatch(response.reply, /How should I rank them/i);
    assert.equal(response.recommendations.length, 0);
    assert.ok(
      response.pendingClarification?.kind === "review_preference" ||
        (response.rankedReviews?.length ?? 0) > 0
    );
    if (response.pendingClarification?.kind === "review_preference") {
      assert.equal(response.consumesQuota, false);
      assert.equal(response.responseKind, "chat");
      assert.match(response.reply, /mood|romance|fantasy/i);
    }
  });

  it("completes the salon binge chip after a reading-preference answer", async () => {
    const message =
      "Recommend spoiler-aware novel reviews from the MoonVerse salon that match what I might binge next.";
    const ask = await handleMoonieRequest({
      message,
      messages: [],
      isLoggedIn: false,
    });
    if (ask.pendingClarification?.kind !== "review_preference") {
      assert.ok((ask.rankedReviews?.length ?? 0) > 0);
      return;
    }

    const answered = await handleMoonieRequest({
      message: "Romance",
      messages: [
        { role: "user", content: message },
        {
          role: "assistant",
          content: ask.reply,
          meta: {
            pendingClarification: ask.pendingClarification,
            requestedCount: ask.requestedCount,
            responseKind: ask.responseKind,
          },
        },
      ],
      isLoggedIn: false,
    });

    assert.doesNotMatch(answered.reply, /Which reviewer/i);
    assert.equal(answered.responseKind, "reviews");
    assert.equal(answered.recommendations.length, 0);
    assert.ok(answered.rankedReviews);
    for (const review of answered.rankedReviews ?? []) {
      assert.ok(review.id);
      assert.ok(review.novelId);
      assert.ok(review.reviewerName);
    }
  });

  it("routes For You shelf review CTA to ranked reviews, not novel cards", async () => {
    const intents = classifyMoonieIntents(FOR_YOU_SHELF_REVIEWS_PROMPT);
    assert.equal(primaryRetrievalIntent(intents), "SALON_REVIEWS");

    const response = await handleMoonieRequest({
      message: FOR_YOU_SHELF_REVIEWS_PROMPT,
      messages: [],
      isLoggedIn: true,
      hasTasteHistory: true,
      tastePrefs: { genres: ["romance"], tags: [], mood: [] },
    });
    assert.equal(response.responseKind, "reviews");
    assert.equal(response.recommendations.length, 0);
    assert.ok(
      (response.rankedReviews?.length ?? 0) > 0 ||
        response.pendingClarification?.kind === "review_preference"
    );
  });

  it("asks one clarifying question before browse hub novel recommendations", async () => {
    const response = await handleMoonieRequest({
      message: BROWSE_CLARIFY_FIRST_PROMPT,
      messages: [],
      isLoggedIn: true,
    });
    assert.equal(response.consumesQuota, false);
    assert.equal(response.recommendations.length, 0);
    assert.match(
      response.reply,
      /genre|mood|trope|catalogue|taste/i
    );
    assert.ok((response.quickPrompts?.length ?? 0) > 0);
  });

  it("does not let prior reviewer context hijack the salon binge chip", async () => {
    const message =
      "Recommend spoiler-aware novel reviews from the MoonVerse salon that match what I might binge next.";
    const response = await handleMoonieRequest({
      message,
      messages: [
        { role: "user", content: "Recommend reviewers who often review cultivation novels." },
        {
          role: "assistant",
          content: "Here are public reviewers.",
          meta: {
            responseKind: "reviewers",
            reviewerResults: [
              {
                id: "rev-1",
                displayName: "Ada",
                username: "ada",
                avatarInitials: "A",
                reviewCount: 4,
                followerCount: 1,
              },
            ],
          },
        },
      ],
      isLoggedIn: false,
    });
    assert.doesNotMatch(response.reply, /Which reviewer/i);
    assert.notEqual(response.responseKind, "reviewers");
    assert.ok(
      response.pendingClarification?.kind === "review_preference" ||
        (response.rankedReviews?.length ?? 0) > 0
    );
  });

  it("skips the mood question when signed-in taste already has a genre", async () => {
    const message =
      "Recommend spoiler-aware novel reviews from the MoonVerse salon that match what I might binge next.";
    const response = await handleMoonieRequest({
      message,
      messages: [],
      isLoggedIn: true,
      tastePrefs: {
        genres: ["romance"],
        tags: [],
        excludedTags: [],
        mood: [],
        status: null,
        language: null,
        length: null,
        influencedBy: [],
      },
    });
    assert.doesNotMatch(response.reply, /Which reviewer/i);
    assert.doesNotMatch(response.reply, /How should I rank them/i);
    assert.notEqual(response.pendingClarification?.kind, "review_preference");
    assert.equal(response.responseKind, "reviews");
    assert.equal(response.recommendations.length, 0);
  });

  it("returns review cards after a most-recent ranking answer", async () => {
    const message = "give me the top 5 reviews";
    const ask = await handleMoonieRequest({
      message,
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(ask.pendingClarification?.kind, "review_ranking");

    const answered = await handleMoonieRequest({
      message: "most recent",
      messages: [
        { role: "user", content: message },
        {
          role: "assistant",
          content: ask.reply,
          meta: {
            pendingClarification: ask.pendingClarification,
            requestedCount: ask.requestedCount,
            responseKind: ask.responseKind,
          },
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(answered.rankingMetric, "review_recent");
    assert.equal(answered.responseKind, "reviews");
    assert.ok((answered.rankedReviews?.length ?? 0) > 0);
    for (const review of answered.rankedReviews ?? []) {
      assert.ok(review.id);
      assert.ok(review.novelId);
      assert.match(review.excerpt ?? "", /./);
    }

    const hydrated = hydrateStoredAssistantMeta({
      responseKind: answered.responseKind,
      rankedReviews: answered.rankedReviews,
      rankingMetric: answered.rankingMetric,
      spoilerMode: answered.spoilerMode,
      analyticsIntent: answered.analyticsIntent,
    });
    assert.equal(hydrated.rankedReviews?.length, answered.rankedReviews?.length);
    assert.equal(hydrated.rankingMetric, "review_recent");
  });

  it("salon binge prompt with taste prefs returns personalised review cards", async () => {
    const message =
      "Recommend spoiler-aware novel reviews from the MoonVerse salon that match what I might binge next.";
    const response = await handleMoonieRequest({
      message,
      messages: [],
      isLoggedIn: true,
      tastePrefs: {
        genres: ["romance", "action"],
        tags: [],
        excludedTags: [],
        mood: [],
        status: null,
        language: null,
        length: null,
        influencedBy: [],
      },
    });

    assert.equal(response.responseKind, "reviews");
    assert.equal(response.pendingClarification?.kind, undefined);
    assert.match(response.reply, /romance|action|reading preferences/i);
    assert.ok((response.rankedReviews?.length ?? 0) > 0);
    for (const review of response.rankedReviews ?? []) {
      assert.ok(review.id);
      assert.ok(review.novelId);
      assert.ok(review.reviewerName);
    }

    const hydrated = hydrateStoredAssistantMeta({
      responseKind: response.responseKind,
      rankedReviews: response.rankedReviews,
      interpretedPreferences: response.interpretedPreferences,
      spoilerMode: response.spoilerMode,
      analyticsIntent: response.analyticsIntent,
    });
    assert.equal(hydrated.rankedReviews?.length, response.rankedReviews?.length);
    assert.ok(hydrated.interpretedPreferences?.genres?.includes("romance"));
  });

  it("asks for novels on empty-chat pronoun review and reading-link follow-ups", async () => {
    const theirReviews = await handleMoonieRequest({
      message: "their reviews",
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(theirReviews.recommendations.length, 0);
    assert.doesNotMatch(theirReviews.reply, /couldn't find .*their reviews/i);
    assert.match(theirReviews.reply, /which|novel|title|name/i);

    const whereToRead = await handleMoonieRequest({
      message: "where can I read it?",
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(whereToRead.recommendations.length, 0);
    assert.match(whereToRead.reply, /which|novel|title|name/i);
  });

  it("Discover masthead opens fresh desk instead of salon widget prompt", () => {
    const masthead = readFileSync(
      new URL("../components/reviews/salon/ReviewsSalonMasthead.tsx", import.meta.url),
      "utf8"
    );
    assert.match(masthead, /moonieLoggedInEntryHref/);
    assert.doesNotMatch(masthead, /DISCOVER_SALON_MOONIE_PROMPT/);
    const aside = readFileSync(
      new URL("../components/reviews/salon/ReviewsSalonMoonieAside.tsx", import.meta.url),
      "utf8"
    );
    assert.match(aside, /moonieLoggedInEntryHref/);
    assert.doesNotMatch(aside, /DISCOVER_SALON_MOONIE_PROMPT/);
    const chip = DISCOVER_SALON_MOONIE_PROMPT;
    assert.match(chip, /spoiler-aware novel reviews from the MoonVerse salon/i);
    const intents = classifyMoonieIntents(chip);
    assert.equal(primaryRetrievalIntent(intents), "SALON_REVIEWS");
  });

  it("routes highest-rated novels to novel cards, not reviews", async () => {
    const intents = classifyMoonieIntents("give me the highest-rated novels");
    assert.equal(intents.includes("TOP_REVIEWS"), false);
    assert.equal(intents.includes("CATALOGUE_STAT"), false);

    const response = await handleMoonieRequest({
      message: "give me the highest-rated novels",
      messages: [],
      isLoggedIn: false,
    });

    assert.notEqual(response.responseKind, "reviews");
    assert.equal(response.rankedReviews, undefined);
    if (response.recommendations.length > 0) {
      assert.equal(response.responseKind, "recommendations");
      assert.ok(response.recommendations.every((rec) => rec.novelId));
    }
  });

  it("returns a catalogue aggregate for what novel has the most reviews", async () => {
    const intents = classifyMoonieIntents("what novel has the most reviews");
    assert.equal(primaryRetrievalIntent(intents), "CATALOGUE_STAT");
    assert.equal(intents.includes("RECOMMEND"), false);

    const response = await handleMoonieRequest({
      message: "what novel has the most reviews",
      messages: [],
      isLoggedIn: false,
    });

    assert.equal(response.responseKind, "catalogue_stat");
    assert.equal(response.rankingMetric, "novel_review_count");
    assert.equal(response.requestedCount, 1);
    assert.equal(response.recommendations.length, 0);
    if (response.catalogueStat) {
      assert.ok(response.catalogueStat.novelId);
      assert.ok(response.catalogueStat.title);
      assert.ok(response.catalogueStat.count >= 1);
      assert.match(response.reply, new RegExp(String(response.catalogueStat.count)));
    } else {
      assert.equal(response.state, "no_results");
    }
  });

  it("does not restrict the most-reviewed statistic to prior recommendations unless asked", async () => {
    const open = await handleMoonieRequest({
      message: "what novel has the most reviews",
      messages: priorRecommendationMessages(),
      isLoggedIn: false,
    });
    assert.equal(open.responseKind, "catalogue_stat");
    assert.equal(open.rankingMetric, "novel_review_count");
    assert.ok(open.catalogueStat?.novelId);
    assert.ok((open.catalogueStat?.count ?? 0) >= 1);
    assert.equal(
      PRIOR_RECS.some((rec) => rec.novelId === open.catalogueStat?.novelId),
      false,
      "open catalogue max must not silently use the prior shortlist"
    );

    const among = await handleMoonieRequest({
      message: "what novel has the most reviews among these",
      messages: priorRecommendationMessages(),
      isLoggedIn: false,
    });
    assert.equal(among.responseKind, "catalogue_stat");
    assert.equal(among.rankingMetric, "novel_review_count");
    assert.equal(among.state, "no_results");
    assert.equal(among.catalogueStat, undefined);
  });
});
