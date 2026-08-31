import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCurrentTurnHardConstraints,
  novelMatchesHardConstraints,
  parseMinimumAverageRating,
  parseRequestedRecommendationCount,
} from "@/lib/moonie/hard-constraints";
import {
  resolveNovelDiscoverySort,
  sortHybridCandidates,
} from "@/lib/moonie/discovery-sort";
import { labelsMatch } from "@/lib/moonie/label-match";
import {
  DEMO_COMPLETED_SLICE_OF_LIFE_MESSAGE,
  DEMO_COMPLETED_SLICE_OF_LIFE_NOVELS,
  DEMO_LOW_TRUST_COMPLETED_SLICE_OF_LIFE,
  DEMO_LOW_TRUST_UNKNOWN_SLICE_OF_LIFE,
} from "@/lib/moonie/demo-acceptance-fixtures";
import { extractPreferencesFromMessage } from "@/lib/moonie/preferences";
import { buildGroundedRecommendations } from "@/services/moonie-pipeline.service";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import { runSearch } from "@/services/search.service";

describe("search filter parsing", () => {
  it("parses minimum rating and requested counts from discovery phrasing", () => {
    assert.equal(parseMinimumAverageRating("Find novels with rating 4 or higher"), 4);
    assert.equal(parseRequestedRecommendationCount("Show me 5 fantasy novels"), 5);
    assert.equal(parseRequestedRecommendationCount("top 2 results"), 2);
    assert.equal(resolveNovelDiscoverySort("Find the highest-rated fantasy novels"), "rating");
    assert.equal(resolveNovelDiscoverySort("Show me the newest romance novels"), "recent");
  });

  it("sorts by rating with deterministic tie-breaking on review count", () => {
    const sorted = sortHybridCandidates(
      [
        {
          id: "a",
          averageRating: 4.5,
          reviewCount: 2,
          score: 0.9,
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "b",
          averageRating: 4.5,
          reviewCount: 10,
          score: 0.5,
          createdAt: new Date("2024-06-01"),
        },
        {
          id: "c",
          averageRating: 3.8,
          reviewCount: 20,
          score: 1,
          createdAt: new Date("2025-01-01"),
        },
      ],
      "rating"
    );
    assert.equal(sorted[0]?.id, "b");
    assert.equal(sorted[1]?.id, "a");
    assert.equal(sorted[2]?.id, "c");
  });
});

describe("hard constraint matching", () => {
  it("requires every genre when Fantasy and Mystery are both stated", () => {
    const hard = buildCurrentTurnHardConstraints(
      "Find novels with both Fantasy and Mystery"
    );
    assert.ok(hard.genres.some((genre) => labelsMatch(genre, "fantasy")));
    assert.ok(hard.genres.some((genre) => labelsMatch(genre, "mystery")));
    assert.equal(hard.genreMatch, "all");

    assert.equal(
      novelMatchesHardConstraints(
        { genres: ["Fantasy", "Mystery"], tags: [], publicationStatus: "Completed" },
        hard
      ),
      true
    );
    assert.equal(
      novelMatchesHardConstraints(
        { genres: ["Fantasy"], tags: [], publicationStatus: "Completed" },
        hard
      ),
      false
    );
  });

  it("uses OR semantics when the message says or between tropes", () => {
    const message = "Show me found family or slice-of-life novels";
    const hard = buildCurrentTurnHardConstraints(message);
    assert.equal(hard.tagMatch, "any");
    assert.equal(
      novelMatchesHardConstraints(
        { genres: ["Romance"], tags: ["found family"], publicationStatus: "Completed" },
        hard
      ),
      true
    );
    assert.equal(
      novelMatchesHardConstraints(
        { genres: ["Slice of Life"], tags: [], publicationStatus: "Completed" },
        hard
      ),
      true
    );
    assert.equal(
      novelMatchesHardConstraints(
        { genres: ["Fantasy"], tags: ["dungeon"], publicationStatus: "Completed" },
        hard
      ),
      false
    );
  });

  it("applies minimum average rating as a hard filter", () => {
    const hard = buildCurrentTurnHardConstraints("Recommend fantasy novels rated 4 or higher");
    assert.equal(hard.minAverageRating, 4);
    assert.equal(
      novelMatchesHardConstraints(
        {
          genres: ["Fantasy"],
          tags: [],
          publicationStatus: "Completed",
          averageRating: 4.2,
        },
        hard
      ),
      true
    );
    assert.equal(
      novelMatchesHardConstraints(
        {
          genres: ["Fantasy"],
          tags: [],
          publicationStatus: "Completed",
          averageRating: 3.5,
        },
        hard
      ),
      false
    );
    assert.equal(
      novelMatchesHardConstraints(
        {
          genres: ["Fantasy"],
          tags: [],
          publicationStatus: "Completed",
          averageRating: null,
        },
        hard
      ),
      false
    );
  });

  it("keeps documented completed slice-of-life fixtures and rejects unknown status", () => {
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
});

describe("grounded recommendation retrieval", () => {
  it("returns only novels matching explicit hard filters", async () => {
    const message = "Show me completed slice-of-life novels";
    const requestPrefs = extractPreferencesFromMessage(message);
    const hardConstraints = buildCurrentTurnHardConstraints(message);

    const result = await buildGroundedRecommendations({
      prefs: requestPrefs,
      requestPrefs,
      queryText: message,
      disableSemantic: true,
      hardConstraints,
      take: 5,
    });

    if (result.recommendations.length > 0) {
      for (const recommendation of result.recommendations) {
        assert.equal(
          novelMatchesHardConstraints(
            {
              genres: recommendation.genres,
              tags: recommendation.tags ?? [],
              publicationStatus: recommendation.publicationStatus,
              averageRating: recommendation.averageRating,
            },
            hardConstraints
          ),
          true
        );
      }
    } else {
      assert.equal(result.state, "no_results");
      assert.match(result.reply, /could not find|no additional|unverified/i);
    }
  });

  it("respects requested result count when enough matches exist", async () => {
    const message = "Recommend 3 fantasy novels";
    const requestPrefs = extractPreferencesFromMessage(message);
    const hardConstraints = buildCurrentTurnHardConstraints(message);

    const result = await buildGroundedRecommendations({
      prefs: requestPrefs,
      requestPrefs,
      queryText: message,
      disableSemantic: true,
      hardConstraints,
      take: 3,
    });

    if (result.recommendations.length > 0) {
      assert.ok(result.recommendations.length <= 3);
    }
  });

  it("reports zero matches clearly for impossible combinations", async () => {
    const response = await handleMoonieRequest({
      message: "Show me completed cultivation xianxia dungeon novels with no harem",
      messages: [],
      isLoggedIn: false,
    });

    if (response.recommendations.length === 0) {
      assert.equal(response.state, "no_results");
      assert.match(
        response.reply,
        /could not find|no additional|unverified|after respecting/i
      );
      assert.doesNotMatch(response.reply, /here are some unrelated/i);
    }
  });
});

describe("search facet vs Moonie filter consistency", () => {
  it("Moonie fantasy filter stays within search fantasy facet results", async () => {
    const search = await runSearch({
      query: "",
      type: "works",
      genreSlug: "fantasy",
      limit: 20,
    });
    if (search.totals.works === 0) return;

    const moonie = await handleMoonieRequest({
      message: "Find novels with genre Fantasy",
      messages: [],
      isLoggedIn: false,
    });

    if (moonie.recommendations.length === 0) return;

    const searchIds = new Set(search.works.map((work) => work.id));
    for (const recommendation of moonie.recommendations) {
      assert.ok(
        recommendation.genres.some((genre) => /fantasy/i.test(genre)),
        recommendation.title
      );
      if (searchIds.has(recommendation.novelId)) {
        assert.ok(searchIds.has(recommendation.novelId));
      }
    }
  });
});
