import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCurrentTurnHardConstraints,
  EMPTY_HARD_CONSTRAINTS,
  novelMatchesHardConstraints,
} from "@/lib/moonie/hard-constraints";
import { labelsMatch } from "@/lib/moonie/label-match";
import {
  DEMO_COMPLETED_SLICE_OF_LIFE_MESSAGE,
  DEMO_COMPLETED_SLICE_OF_LIFE_NOVELS,
  DEMO_LOW_TRUST_COMPLETED_FOUND_FAMILY,
  DEMO_LOW_TRUST_COMPLETED_SLICE_OF_LIFE,
  DEMO_LOW_TRUST_ONGOING_FOUND_FAMILY,
  DEMO_LOW_TRUST_UNKNOWN_SLICE_OF_LIFE,
  MOONIE_SLICE_OF_LIFE_SEED_MESSAGE,
} from "@/lib/moonie/demo-acceptance-fixtures";
import {
  EMPTY_INTERPRETED_PREFERENCES,
  extractPreferencesFromMessage,
} from "@/lib/moonie/preferences";
import { buildGroundedRecommendations } from "@/services/moonie-pipeline.service";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import { countNovelsMatchingPreferences } from "@/services/hybrid-retrieval.service";

describe("Moonie recommendation criteria path", () => {
  it("uses found-family OR slice-of-life for eligibility while saved taste only ranks", async () => {
    const message =
      "A comforting found-family or slice-of-life story with a hopeful ending.";
    const requestPrefs = extractPreferencesFromMessage(message);
    const rankingPrefs = {
      ...requestPrefs,
      genres: ["Family", "Fantasy", "Cultivation", "Comedy"],
      influencedBy: ["saved genres"],
    };
    const hardConstraints = buildCurrentTurnHardConstraints(message);

    const result = await buildGroundedRecommendations({
      prefs: rankingPrefs,
      requestPrefs,
      queryText: message,
      disableSemantic: true,
      hardConstraints,
      take: 5,
    });

    assert.ok(result.recommendations.length > 0);
    assert.deepEqual(result.interpretedPreferences, requestPrefs);
    assert.equal(result.interpretedPreferences?.genres.includes("Fantasy"), false);
    for (const recommendation of result.recommendations) {
      assert.equal(
        novelMatchesHardConstraints(
          {
            genres: recommendation.genres,
            tags: recommendation.tags ?? [],
            publicationStatus: recommendation.publicationStatus,
          },
          hardConstraints
        ),
        true
      );
      assert.ok(
        (recommendation.tags ?? []).some(
          (tag) =>
            labelsMatch(tag, "found family") ||
            labelsMatch(tag, "slice-of-life")
        ) ||
          recommendation.genres.some((genre) =>
            labelsMatch(genre, "slice-of-life")
          )
      );
    }
  });

  it("applies completed AND slice-of-life constraints on documented fixtures", () => {
    const hard = buildCurrentTurnHardConstraints(DEMO_COMPLETED_SLICE_OF_LIFE_MESSAGE);
    for (const fixture of DEMO_COMPLETED_SLICE_OF_LIFE_NOVELS) {
      assert.equal(
        novelMatchesHardConstraints(
          {
            ...fixture,
            genres: [...fixture.genres],
            tags: [...fixture.tags],
          },
          hard
        ),
        true
      );
    }
    assert.equal(
      novelMatchesHardConstraints(
        {
          ...DEMO_LOW_TRUST_COMPLETED_SLICE_OF_LIFE,
          genres: [...DEMO_LOW_TRUST_COMPLETED_SLICE_OF_LIFE.genres],
          tags: [...DEMO_LOW_TRUST_COMPLETED_SLICE_OF_LIFE.tags],
        },
        hard
      ),
      true
    );
    assert.equal(
      novelMatchesHardConstraints(
        {
          ...DEMO_LOW_TRUST_UNKNOWN_SLICE_OF_LIFE,
          genres: [...DEMO_LOW_TRUST_UNKNOWN_SLICE_OF_LIFE.genres],
          tags: [...DEMO_LOW_TRUST_UNKNOWN_SLICE_OF_LIFE.tags],
        },
        hard
      ),
      false
    );
  });

  it("applies documented low-trust completion fixtures for found-family acceptance", () => {
    const hard = buildCurrentTurnHardConstraints(
      "Show me completed found family or slice-of-life novels"
    );
    assert.equal(
      novelMatchesHardConstraints(
        {
          ...DEMO_LOW_TRUST_COMPLETED_FOUND_FAMILY,
          genres: [...DEMO_LOW_TRUST_COMPLETED_FOUND_FAMILY.genres],
          tags: [...DEMO_LOW_TRUST_COMPLETED_FOUND_FAMILY.tags],
        },
        hard
      ),
      true
    );
    assert.equal(
      novelMatchesHardConstraints(
        {
          ...DEMO_LOW_TRUST_ONGOING_FOUND_FAMILY,
          genres: [...DEMO_LOW_TRUST_ONGOING_FOUND_FAMILY.genres],
          tags: [...DEMO_LOW_TRUST_ONGOING_FOUND_FAMILY.tags],
        },
        hard
      ),
      false
    );
  });

  it("treats completed found-family or slice-of-life as OR plus completed", async () => {
    const message = "Show me completed found family or slice-of-life novels";
    const requestPrefs = extractPreferencesFromMessage(message);
    const hardConstraints = buildCurrentTurnHardConstraints(message);
    assert.equal(hardConstraints.inclusionMatch, "any");
    assert.equal(hardConstraints.status, "completed");
    assert.deepEqual(hardConstraints.tags, ["found family", "slice-of-life"]);

    const eligible = await countNovelsMatchingPreferences({
      prefs: requestPrefs,
      hardConstraints,
    });
    const result = await buildGroundedRecommendations({
      prefs: requestPrefs,
      requestPrefs,
      queryText: message,
      disableSemantic: true,
      hardConstraints,
      take: 5,
    });

    if (eligible > 0) {
      assert.ok(result.recommendations.length > 0);
      for (const recommendation of result.recommendations) {
        assert.equal(
          novelMatchesHardConstraints(
            {
              genres: recommendation.genres,
              tags: recommendation.tags ?? [],
              publicationStatus: recommendation.publicationStatus,
            },
            hardConstraints
          ),
          true
        );
      }
    } else {
      assert.equal(result.recommendations.length, 0);
      assert.equal(result.state, "no_results");
      assert.doesNotMatch(result.reply, /additional unseen/i);
      assert.match(
        result.reply,
        /could not verify|could not find|do not list a reliable/i
      );
    }
  });

  it("treats explicit low-trust Completed as completed-eligible in retrieval", async () => {
    const message = DEMO_COMPLETED_SLICE_OF_LIFE_MESSAGE;
    const requestPrefs = extractPreferencesFromMessage(message);
    const hardConstraints = buildCurrentTurnHardConstraints(message);

    const eligible = await countNovelsMatchingPreferences({
      prefs: requestPrefs,
      hardConstraints,
    });

    const result = await buildGroundedRecommendations({
      prefs: requestPrefs,
      requestPrefs,
      queryText: message,
      disableSemantic: true,
      hardConstraints,
      take: 5,
    });

    if (eligible > 0) {
      assert.ok(result.recommendations.length > 0);
      assert.doesNotMatch(result.reply, /unverified demo metadata/i);
      for (const recommendation of result.recommendations) {
        assert.equal(
          novelMatchesHardConstraints(
            {
              genres: recommendation.genres,
              tags: recommendation.tags ?? [],
              publicationStatus: recommendation.publicationStatus,
            },
            hardConstraints
          ),
          true
        );
      }
    } else {
      assert.equal(result.recommendations.length, 0);
      assert.doesNotMatch(result.reply, /unverified demo metadata/i);
    }
  });

  it("keeps slice-of-life through retrieval and explanations on demo catalogue", async () => {
    const message = MOONIE_SLICE_OF_LIFE_SEED_MESSAGE;
    const requestPrefs = extractPreferencesFromMessage(message);
    const hardConstraints = buildCurrentTurnHardConstraints(message);
    const rankingPrefs = {
      ...EMPTY_INTERPRETED_PREFERENCES,
      ...requestPrefs,
      genres: ["Family", "Fantasy", "Cultivation", "Comedy"],
      influencedBy: ["saved genres"],
    };

    const result = await buildGroundedRecommendations({
      prefs: rankingPrefs,
      requestPrefs,
      queryText: message,
      disableSemantic: true,
      hardConstraints,
      take: 5,
    });

    assert.ok(result.recommendations.length > 0);
    assert.deepEqual(result.interpretedPreferences?.tags, ["slice-of-life"]);
    for (const recommendation of result.recommendations) {
      assert.ok(
        (recommendation.tags ?? []).some((tag) =>
          labelsMatch(tag, "slice-of-life")
        ) ||
          recommendation.genres.some((genre) =>
            labelsMatch(genre, "slice-of-life")
          )
      );
      assert.match(recommendation.reason, /slice-of-life/i);
    }
  });

  it("returns disjoint unseen batches, then explains partial and complete exhaustion", async () => {
    const message = MOONIE_SLICE_OF_LIFE_SEED_MESSAGE;
    const requestPrefs = extractPreferencesFromMessage(message);
    const hardConstraints = buildCurrentTurnHardConstraints(message);
    const baseOptions = {
      prefs: requestPrefs,
      requestPrefs,
      queryText: message,
      disableSemantic: true,
      hardConstraints,
      take: 3,
    } as const;

    const first = await buildGroundedRecommendations(baseOptions);
    assert.ok(first.recommendations.length > 0);
    const firstIds = first.recommendations.map((item) => item.novelId);

    const second = await buildGroundedRecommendations({
      ...baseOptions,
      excludeNovelIds: firstIds,
      previouslyShownNovelIds: firstIds,
      seekingUnseen: true,
    });
    assert.ok(second.recommendations.length > 0);
    assert.ok(second.recommendations.every((item) => !firstIds.includes(item.novelId)));

    const shownIds = [
      ...firstIds,
      ...second.recommendations.map((item) => item.novelId),
    ];
    const unseenEligible = await countNovelsMatchingPreferences({
      prefs: requestPrefs,
      excludeNovelIds: shownIds,
      hardConstraints,
    });
    const totalEligible = await countNovelsMatchingPreferences({
      prefs: requestPrefs,
      hardConstraints,
    });
    assert.ok(unseenEligible > 0, "fixture catalogue should have unseen slice-of-life rows");
    const partialTake = Math.min(unseenEligible + 1, 5);
    const partial = await buildGroundedRecommendations({
      ...baseOptions,
      take: partialTake,
      excludeNovelIds: shownIds,
      previouslyShownNovelIds: shownIds,
      seekingUnseen: true,
    });
    assert.ok(partial.recommendations.length > 0);
    if (unseenEligible < partialTake) {
      assert.ok(partial.recommendations.length < partialTake);
      assert.match(partial.reply, /fewer than the \d+ requested/i);
    } else {
      assert.equal(partial.recommendations.length, partialTake);
      assert.ok(
        partial.recommendations.every((item) => !shownIds.includes(item.novelId))
      );
    }

    const allShownIds = [
      ...shownIds,
      ...partial.recommendations.map((item) => item.novelId),
    ];
    const remainingUnseen = await countNovelsMatchingPreferences({
      prefs: requestPrefs,
      excludeNovelIds: allShownIds,
      hardConstraints,
    });
    if (remainingUnseen === 0) {
      const exhausted = await buildGroundedRecommendations({
        ...baseOptions,
        excludeNovelIds: allShownIds,
        previouslyShownNovelIds: allShownIds,
        seekingUnseen: true,
      });
      assert.equal(exhausted.recommendations.length, 0);
      assert.match(exhausted.reply, /no additional unseen/i);
      assert.equal(
        exhausted.followUpQuestion,
        "Show all previous recommendations again"
      );
    }

    const explicitlyHidden = await buildGroundedRecommendations({
      ...baseOptions,
      excludeNovelIds: allShownIds,
      hasExplicitExclusions: true,
    });
    if (allShownIds.length >= totalEligible) {
      assert.equal(explicitlyHidden.recommendations.length, 0);
      assert.match(explicitlyHidden.reply, /hid|rejected|excluded/i);
    } else {
      assert.ok(explicitlyHidden.recommendations.every(
        (item) => !allShownIds.includes(item.novelId)
      ));
    }
  });

  it("replays the latest verified cards without running a new batch", async () => {
    const priorRecommendations = [
      {
        novelId: "verified-1",
        title: "Verified One",
        author: "Author",
        reason: "Verified reason.",
        genres: ["Fantasy"],
        tags: ["slice-of-life"],
        confidence: "high" as const,
        matchPercent: 90,
        sourceStatus: "verified" as const,
        availableOn: [],
      },
    ];

    const replay = await handleMoonieRequest({
      message: "Show all previous recommendations again",
      messages: [
        {
          role: "assistant",
          content: "Earlier recommendations",
          meta: { recommendations: priorRecommendations },
        },
      ],
      isLoggedIn: false,
    });

    assert.deepEqual(replay.recommendations, priorRecommendations);
    assert.equal(replay.consumesQuota, false);
  });

  it("replays every prior recommendation batch from the same conversation", async () => {
    const batch1 = [
      {
        novelId: "verified-1",
        title: "Verified One",
        author: "Author",
        reason: "Verified reason.",
        genres: ["Fantasy"],
        tags: ["slice-of-life"],
        confidence: "high" as const,
        matchPercent: 90,
        sourceStatus: "verified" as const,
        availableOn: [],
      },
    ];
    const batch2 = [
      {
        novelId: "verified-2",
        title: "Verified Two",
        author: "Author",
        reason: "Verified reason.",
        genres: ["Fantasy"],
        tags: ["found-family"],
        confidence: "high" as const,
        matchPercent: 88,
        sourceStatus: "verified" as const,
        availableOn: [],
      },
    ];

    const replay = await handleMoonieRequest({
      message: "all previous recommendations again",
      messages: [
        {
          role: "assistant",
          content: "Earlier recommendations",
          meta: { recommendations: batch1 },
        },
        { role: "user", content: "Show me short completed novels" },
        {
          role: "assistant",
          content: "No matches.",
          meta: { response: { state: "no_results", recommendations: [] } },
        },
        {
          role: "assistant",
          content: "More picks",
          meta: { recommendations: batch2 },
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(replay.recommendations.length, 2);
    assert.deepEqual(
      replay.recommendations.map((rec) => rec.novelId),
      ["verified-1", "verified-2"]
    );
    assert.equal(replay.consumesQuota, false);
  });

  it("keeps genuine zero matches distinct from unseen exhaustion", async () => {
    const prefs = {
      ...EMPTY_INTERPRETED_PREFERENCES,
      tags: ["definitely-not-a-real-tag"],
      status: "completed",
    };
    const result = await buildGroundedRecommendations({
      prefs,
      requestPrefs: prefs,
      queryText: "Show me completed definitely-not-a-real-tag novels",
      disableSemantic: true,
      hardConstraints: {
        ...EMPTY_HARD_CONSTRAINTS,
        tags: ["definitely-not-a-real-tag"],
        status: "completed",
      },
      seekingUnseen: true,
      previouslyShownNovelIds: [],
      take: 5,
    });

    assert.equal(result.recommendations.length, 0);
    assert.doesNotMatch(result.reply, /additional unseen/i);
    assert.match(result.reply, /could not find|no .*match/i);
  });
});
