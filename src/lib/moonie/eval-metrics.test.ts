import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MoonieRecommendation } from "@/types/moonie";
import {
  diversityRatio,
  explanationGroundingRate,
  filterToAllowlist,
  jaccardSimilarity,
  meanConsistency,
  meanRelevance,
  recommendationRelevance,
  topOneConcentration,
  unsupportedTitleRate,
} from "./eval-metrics";

const prefs = {
  genres: ["romance"],
  tags: ["slow-burn"],
  excludedTags: [],
  status: null,
  mood: [],
  language: null,
};

function rec(
  partial: Partial<MoonieRecommendation> & { novelId: string; title: string }
): MoonieRecommendation {
  return {
    reason: "test",
    genres: [],
    confidence: "medium",
    sourceStatus: "none",
    ...partial,
  };
}

describe("moonie eval metrics", () => {
  it("scores genre/tag relevance", () => {
    const good = rec({
      novelId: "1",
      title: "A",
      genres: ["Romance"],
      tags: ["slow-burn"],
    });
    const weak = rec({
      novelId: "2",
      title: "B",
      genres: ["Horror"],
      tags: ["gore"],
    });
    assert.ok(recommendationRelevance(good, prefs) > 0.9);
    assert.ok(recommendationRelevance(weak, prefs) < 0.2);
    assert.ok(meanRelevance([good, weak], prefs) > 0.4);
  });

  it("computes unsupported-title rate against allowlist", () => {
    const catalogue = new Set(["a", "b"]);
    const rows = [
      rec({ novelId: "a", title: "Real" }),
      rec({ novelId: "x", title: "Fake" }),
    ];
    assert.equal(unsupportedTitleRate(rows, catalogue), 0.5);
    assert.equal(filterToAllowlist(rows, catalogue).length, 1);
  });

  it("measures consistency with Jaccard similarity", () => {
    assert.equal(jaccardSimilarity(["a", "b"], ["a", "b"]), 1);
    assert.equal(jaccardSimilarity(["a"], ["b"]), 0);
    assert.ok(
      meanConsistency([
        ["a", "b"],
        ["a", "c"],
        ["a", "b"],
      ]) > 0.3
    );
  });

  it("measures diversity and top-1 concentration", () => {
    assert.equal(diversityRatio(["a", "a", "b"]), 2 / 3);
    assert.equal(topOneConcentration(["x", "x", "y"]), 2 / 3);
  });

  it("scores explanation grounding against candidate fields", () => {
    const grounded = rec({
      novelId: "1",
      title: "Moonlight Pact",
      genres: ["Romance"],
      reason: "Moonlight Pact is a slow-burn Romance",
    });
    const ungrounded = rec({
      novelId: "2",
      title: "Other",
      genres: ["Horror"],
      reason: "This invented title is a masterpiece of lore.",
    });
    assert.equal(explanationGroundingRate([grounded]), 1);
    assert.equal(explanationGroundingRate([ungrounded]), 0);
  });
});
