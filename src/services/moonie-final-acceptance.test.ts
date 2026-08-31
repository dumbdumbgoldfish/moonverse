import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { labelsMatch } from "@/lib/moonie/label-match";
import {
  buildCurrentTurnHardConstraints,
  novelMatchesHardConstraints,
  parseRequestedRecommendationCount,
} from "@/lib/moonie/hard-constraints";
import {
  sanitizeCommunityInsightForMode,
} from "@/lib/moonie/spoiler-mode";
import { refreshRecommendationsForSpoilerMode } from "./moonie-novel-lookup.service";
import { handleMoonieRequest } from "./moonie-response.service";
import { buildMoonieReviewerOverviewResponse } from "./moonie-reviewer.service";

const rec = (
  id: string,
  title: string,
  matchPercent: number,
  genres: string[] = ["Fantasy"]
) => ({
  novelId: id,
  title,
  author: "Author",
  reason: "Fixture reason.",
  genres,
  tags: ["slice-of-life"],
  confidence: "high" as const,
  matchPercent,
  averageRating: 4.2,
  sourceStatus: "verified" as const,
  availableOn: [],
});

describe("novel about without thread context", () => {
  it("asks which novel to summarize instead of title lookup or arbitrary pick", async () => {
    const response = await handleMoonieRequest({
      message: "what is this novel about?",
      messages: [],
      isLoggedIn: false,
    });

    assert.equal(response.lookupSession, undefined);
    assert.equal(response.novelOverview, undefined);
    assert.equal(response.recommendations.length, 0);
    assert.match(response.reply, /which novel should i summarize/i);
    assert.doesNotMatch(response.reply, /couldn't verify/i);
    assert.doesNotMatch(response.reply, /could not find a verified match/i);
  });
});

describe("replay spoiler fail-closed on stored fallback", () => {
  const unfamiliarSpoiler =
    "The protagonist secretly marries her rival before the masquerade ends.";
  const storedCommunity = {
    averageRating: 4.4,
    reviewCount: 2,
    previews: [
      {
        id: "preview-unfamiliar",
        title: "Masquerade twist",
        excerpt: unfamiliarSpoiler,
        rating: 5,
        reviewerName: "Reader",
      },
    ],
    consensus: unfamiliarSpoiler,
  };

  it("withholds unverified stored review text in none without keyword fixtures", () => {
    const none = sanitizeCommunityInsightForMode(storedCommunity, "none", {
      unverifiedStoredFallback: true,
    });
    assert.equal(none?.consensus, null);
    assert.equal(none?.previews.length, 0);
    assert.equal(none?.averageRating, 4.4);
    assert.equal(none?.reviewCount, 2);
    assert.doesNotMatch(JSON.stringify(none ?? {}), /masquerade|secretly marries/i);
  });

  it("softens unverified stored review text in light without keyword fixtures", () => {
    const light = sanitizeCommunityInsightForMode(storedCommunity, "light", {
      unverifiedStoredFallback: true,
    });
    assert.equal(light?.consensus, null);
    assert.equal(light?.previews.length, 1);
    assert.match(light?.previews[0]?.excerpt ?? "", /Spoiler-marked review/i);
    assert.doesNotMatch(light?.previews[0]?.excerpt ?? "", /secretly marries/i);
  });

  it("re-sanitizes replay cards when DB refresh cannot re-verify community", async () => {
    const leaky = {
      ...rec("replay-unfamiliar-fixture", "Replay Unfamiliar", 88),
      community: storedCommunity,
    };

    const replay = await refreshRecommendationsForSpoilerMode([leaky], "none");
    assert.equal(replay.length, 1);
    assert.equal(replay[0]?.novelId, "replay-unfamiliar-fixture");
    assert.equal(replay[0]?.title, "Replay Unfamiliar");
    assert.equal(replay[0]?.matchPercent, 88);
    assert.equal(replay[0]?.community?.consensus, null);
    assert.equal(replay[0]?.community?.previews.length, 0);
    assert.doesNotMatch(JSON.stringify(replay[0]?.community ?? {}), /secretly marries/i);
  });
});

describe("catalogue top/best and Top 3 ranking", () => {
  const FANTASY_PROMPT = "Recommend me three fantasy novels with details";

  it("returns three ranked eligible fantasy novels, not unrelated padding", async () => {
    const hard = buildCurrentTurnHardConstraints(FANTASY_PROMPT);
    assert.equal(parseRequestedRecommendationCount(FANTASY_PROMPT), 3);

    const response = await handleMoonieRequest({
      message: FANTASY_PROMPT,
      messages: [],
      isLoggedIn: false,
    });

    assert.equal(response.recommendations.length, 3);
    for (const recommendation of response.recommendations) {
      assert.ok(
        recommendation.genres.some((genre) => labelsMatch(genre, "fantasy")),
        recommendation.title
      );
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

    for (let index = 1; index < response.recommendations.length; index += 1) {
      const prev = response.recommendations[index - 1]!.matchPercent ?? 0;
      const next = response.recommendations[index]!.matchPercent ?? 0;
      assert.ok(prev >= next, "recommendations should be ranked by match percent");
    }
    assert.doesNotMatch(response.reply, /comedy-only|crime|sports|non-fiction/i);
  });

  it("ranks catalogue best-match from eligible shortlist including previously shown titles", async () => {
    const seed = await handleMoonieRequest({
      message: "Recommend fantasy novels",
      messages: [],
      isLoggedIn: false,
    });
    assert.ok(seed.recommendations.length >= 2);
    const shownIds = seed.recommendations.map((item) => item.novelId);

    const response = await handleMoonieRequest({
      message: "What is the best match for fantasy?",
      messages: [
        {
          role: "assistant",
          content: seed.reply,
          meta: { recommendations: seed.recommendations },
        },
      ],
      previouslyShownNovelIds: shownIds,
      isLoggedIn: false,
    });

    assert.equal(response.recommendations.length, 1);
    assert.ok(
      response.recommendations[0]?.genres.some((genre) =>
        labelsMatch(genre, "fantasy")
      )
    );
    assert.match(response.reply, /shortlist|verified candidate/i);
    assert.doesNotMatch(response.reply, /couldn't verify "best match for fantasy"/i);
    assert.ok(
      shownIds.includes(response.recommendations[0]!.novelId) ||
        labelsMatch(response.recommendations[0]!.genres[0] ?? "", "fantasy")
    );
  });
});

describe("database failure vs genuine zero-match", () => {
  it("distinguishes unknown reviewer lookup from profile load failure", async () => {
    const noMatch = await handleMoonieRequest({
      message: "show me TotallyFakeReviewerAcceptanceFixture reviews",
      messages: [],
      isLoggedIn: false,
    });
    assert.match(
      noMatch.reply,
      /couldn't find a MoonVerse reviewer matching/i
    );
    assert.doesNotMatch(noMatch.reply, /couldn't load that reviewer profile/i);

    const loadFailure = await buildMoonieReviewerOverviewResponse({
      message: "show me their reviews",
      emphasizeAuthoredReviews: true,
      reviewerSession: {
        reviewers: [
          {
            id: "deleted-reviewer-acceptance-fixture",
            displayName: "Ghost",
            username: "ghostfixture",
            avatarInitials: "GF",
            avatarUrl: null,
            reviewCount: 1,
            followerCount: 0,
            isFollowing: false,
          },
        ],
        rankBy: "reviews",
        queryType: "lookup",
        activeReviewerId: "deleted-reviewer-acceptance-fixture",
      },
      activeReviewerId: "deleted-reviewer-acceptance-fixture",
    });
    assert.match(loadFailure.reply, /couldn't load that reviewer profile/i);
    assert.doesNotMatch(
      loadFailure.reply,
      /couldn't find a MoonVerse reviewer matching/i
    );
  });

  it("distinguishes catalogue zero-match from verified-match wording", async () => {
    const response = await handleMoonieRequest({
      message: "find novel TotallyFakeNovelAcceptanceFixture12345",
      messages: [],
      isLoggedIn: false,
    });
    assert.match(
      response.reply,
      /could not find a verified match|couldn't verify/i
    );
    assert.doesNotMatch(response.reply, /couldn't load that novel/i);
    assert.doesNotMatch(
      response.reply,
      /couldn't find a MoonVerse reviewer matching/i
    );
    assert.doesNotMatch(response.reply, /database|engine is not yet connected/i);
  });
});
