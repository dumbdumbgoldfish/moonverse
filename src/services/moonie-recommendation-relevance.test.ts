import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCurrentTurnHardConstraints,
  novelMatchesHardConstraints,
} from "@/lib/moonie/hard-constraints";
import { labelsMatch } from "@/lib/moonie/label-match";
import {
  DEMO_COMPLETED_SLICE_OF_LIFE_MESSAGE,
  MOONIE_INTEGRATION_SEED_MESSAGE,
} from "@/lib/moonie/demo-acceptance-fixtures";
import {
  EMPTY_INTERPRETED_PREFERENCES,
  extractPreferencesFromMessage,
} from "@/lib/moonie/preferences";
import {
  confidenceFromMatchPercent,
  matchPercent,
  matchStrengthLabel,
} from "@/lib/moonie/ranking";
import { selectDiverseCandidates } from "@/services/hybrid-retrieval.service";
import {
  buildGroundedRecommendations,
  buildRecommendationReason,
  type NovelCandidate,
} from "@/services/moonie-pipeline.service";
import { handleMoonieRequest } from "@/services/moonie-response.service";

function fixtureCandidate(
  overrides: Partial<NovelCandidate> & Pick<NovelCandidate, "id" | "title">
): NovelCandidate {
  return {
    author: "Author",
    coverUrl: null,
    synopsis: null,
    originalLanguage: "en",
    publicationStatus: "Completed",
    lengthBand: null,
    chapterCount: null,
    metadataSource: null,
    createdAt: new Date("2024-01-01"),
    genres: ["Fantasy"],
    tags: [],
    moods: [],
    reviewCount: 5,
    averageRating: 4.2,
    topReviewId: null,
    score: 0.5,
    scoreBreakdown: {
      semantic: 0.1,
      structured: 0.1,
      quality: 0.1,
      history: 0,
      diversity: 0,
    },
    semantic: 0.2,
    lexical: 0,
    historySignals: {},
    ...overrides,
  };
}

describe("diversity selection preserves score ordering", () => {
  it("keeps greedy diverse picks in descending score order after re-sort", () => {
    const ranked = [
      { id: "f1", genres: ["Fantasy"], score: 0.92 },
      { id: "f2", genres: ["Fantasy"], score: 0.88 },
      { id: "r1", genres: ["Romance"], score: 0.9 },
      { id: "f3", genres: ["Fantasy"], score: 0.85 },
    ];
    const diverse = selectDiverseCandidates(ranked, 3);
    const ordered = [...diverse].sort((a, b) => b.score - a.score);
    assert.deepEqual(ordered.map((row) => row.id), ["f1", "r1", "f2"]);
    for (let index = 1; index < ordered.length; index += 1) {
      assert.ok(ordered[index - 1]!.score >= ordered[index]!.score);
    }
  });

  it("limits primary-genre repetition in the diverse set", () => {
    const ranked = [
      { id: "1", genres: ["Romance"], score: 1 },
      { id: "2", genres: ["Romance"], score: 0.95 },
      { id: "3", genres: ["Romance"], score: 0.9 },
      { id: "4", genres: ["Fantasy"], score: 0.85 },
    ];
    const top3 = selectDiverseCandidates(ranked, 3);
    assert.ok(!top3.some((row) => row.id === "3"));
    assert.ok(top3.some((row) => row.id === "4"));
  });
});

describe("match score consistency", () => {
  it("uses the same match percent for floating and desk from one score", () => {
    const score = 0.27;
    const floatingPct = matchPercent(score);
    const deskPct = matchPercent(score);
    assert.equal(floatingPct, deskPct);
    assert.equal(floatingPct, 27);
    assert.equal(matchStrengthLabel(floatingPct), "weak");
    assert.equal(confidenceFromMatchPercent(floatingPct), "low");
  });

  it("does not label weak overlap as strong in reasons", () => {
    const weak = buildRecommendationReason(
      fixtureCandidate({
        id: "weak",
        title: "Weak Fit",
        score: 0.27,
        reviewCount: 10,
        scoreBreakdown: {
          semantic: 0.02,
          structured: 0.05,
          quality: 0.12,
          history: 0,
          diversity: 0,
        },
      }),
      { ...EMPTY_INTERPRETED_PREFERENCES, genres: ["Fantasy"] },
      "fantasy novels",
      undefined,
      { allowPersonalization: false }
    );
    assert.doesNotMatch(weak.reason, /strong/i);
    assert.match(weak.drawback ?? "", /overlap is limited/i);
  });
});

describe("guest personalization boundary", () => {
  it("does not cite saved taste or library for guests even with history signals", () => {
    const guest = buildRecommendationReason(
      fixtureCandidate({
        id: "guest",
        title: "Guest Novel",
        historySignals: {
          tasteGenreAffinity: true,
          savedNovel: true,
          onReadingList: true,
        },
      }),
      { ...EMPTY_INTERPRETED_PREFERENCES, genres: ["Fantasy"] },
      "fantasy",
      undefined,
      { allowPersonalization: false }
    );
    assert.equal(guest.personalizationReasons.length, 0);
    assert.doesNotMatch(guest.reason, /saved taste|reading list|saved library/i);
  });

  it("cites only available personalization signals for authenticated users", () => {
    const auth = buildRecommendationReason(
      fixtureCandidate({
        id: "auth",
        title: "Auth Novel",
        historySignals: {
          savedNovel: true,
          tasteGenreAffinity: true,
        },
      }),
      { ...EMPTY_INTERPRETED_PREFERENCES, genres: ["Fantasy"] },
      "fantasy",
      undefined,
      { allowPersonalization: true }
    );
    assert.ok(
      auth.personalizationReasons.some((line) => /saved library/i.test(line))
    );
    assert.doesNotMatch(
      auth.personalizationReasons.join(" "),
      /saved taste profile/i
    );
  });

  it("guest recommendations do not claim saved taste in summary", async () => {
    const response = await handleMoonieRequest({
      message: MOONIE_INTEGRATION_SEED_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });
    assert.doesNotMatch(response.reply, /saved taste|your history|who you follow/i);
  });
});

describe("hard vs soft preference handling", () => {
  it("keeps completed-only hard filter while saved genres only rank", async () => {
    const message = DEMO_COMPLETED_SLICE_OF_LIFE_MESSAGE;
    const requestPrefs = extractPreferencesFromMessage(message);
    const rankingPrefs = {
      ...requestPrefs,
      genres: ["Fantasy", "Cultivation"],
      influencedBy: ["saved genres"],
    };
    const hard = buildCurrentTurnHardConstraints(message);

    const result = await buildGroundedRecommendations({
      prefs: rankingPrefs,
      requestPrefs,
      queryText: message,
      disableSemantic: true,
      hardConstraints: hard,
      take: 5,
    });

    for (const recommendation of result.recommendations) {
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
    assert.equal(result.interpretedPreferences?.genres.includes("Fantasy"), false);
  });

  it("applies explicit tag exclusions from negative preferences", async () => {
    const message = "Recommend fantasy novels with no harem";
    const prefs = extractPreferencesFromMessage(message);
    assert.ok(prefs.excludedTags.some((tag) => labelsMatch(tag, "harem")));

    const result = await buildGroundedRecommendations({
      prefs,
      requestPrefs: prefs,
      queryText: message,
      disableSemantic: true,
      hardConstraints: buildCurrentTurnHardConstraints(message),
      take: 5,
    });

    for (const recommendation of result.recommendations) {
      assert.ok(
        !recommendation.tags?.some((tag) => labelsMatch(tag, "harem")),
        recommendation.title
      );
    }
  });

  it("reports impossible hard combinations without unrelated padding", async () => {
    const response = await handleMoonieRequest({
      message:
        "Show me completed cultivation xianxia dungeon novels with no harem",
      messages: [],
      isLoggedIn: false,
    });
    if (response.recommendations.length === 0) {
      assert.equal(response.state, "no_results");
      assert.match(response.reply, /could not find|no additional|unverified|after respecting/i);
    }
  });
});

describe("recommendation retrieval quality", () => {
  it("returns top 3 fantasy novels ranked by match percent", async () => {
    const message = "Recommend me three fantasy novels";
    const hard = buildCurrentTurnHardConstraints(message);
    const prefs = extractPreferencesFromMessage(message);

    const result = await buildGroundedRecommendations({
      prefs,
      requestPrefs: prefs,
      queryText: message,
      disableSemantic: true,
      hardConstraints: hard,
      take: 3,
    });

    if (result.recommendations.length === 0) return;

    assert.ok(result.recommendations.length <= 3);
    for (const recommendation of result.recommendations) {
      assert.ok(
        recommendation.genres.some((genre) => labelsMatch(genre, "fantasy"))
      );
    }
    for (let index = 1; index < result.recommendations.length; index += 1) {
      const prev = result.recommendations[index - 1]!.matchPercent ?? 0;
      const next = result.recommendations[index]!.matchPercent ?? 0;
      assert.ok(prev >= next, "match percent should descend with hybrid ranking");
    }
  });

  it("prevents duplicate titles in one batch", async () => {
    const message = MOONIE_INTEGRATION_SEED_MESSAGE;
    const prefs = extractPreferencesFromMessage(message);
    const result = await buildGroundedRecommendations({
      prefs,
      requestPrefs: prefs,
      queryText: message,
      disableSemantic: true,
      hardConstraints: buildCurrentTurnHardConstraints(message),
      take: 5,
    });

    const keys = result.recommendations.map(
      (row) => `${row.title.trim().toLowerCase()}::${(row.author ?? "").trim().toLowerCase()}`
    );
    assert.equal(keys.length, new Set(keys).size);
  });

  it("separates ranking prefs from explanation prefs for saved taste", async () => {
    const message = "A comforting found-family or slice-of-life story";
    const requestPrefs = extractPreferencesFromMessage(message);
    const rankingPrefs = {
      ...requestPrefs,
      genres: ["Comedy", "Cultivation"],
      influencedBy: ["saved genres"],
    };

    const result = await buildGroundedRecommendations({
      prefs: rankingPrefs,
      requestPrefs,
      queryText: message,
      disableSemantic: true,
      hardConstraints: buildCurrentTurnHardConstraints(message),
      take: 3,
    });

    assert.deepEqual(result.interpretedPreferences, requestPrefs);
    for (const recommendation of result.recommendations) {
      assert.doesNotMatch(
        recommendation.reason,
        /comedy|cultivation/i,
        "saved ranking genres should not appear in guest-facing reasons"
      );
    }
  });
});
