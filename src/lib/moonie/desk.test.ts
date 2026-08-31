import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compareDiscoveryCtaLabel,
  compareDiscoveryHref,
  MOONIE_DESK_CHIPS,
  previousUserContent,
  slateDiversityLine,
  tasteUsedLabels,
} from "./desk";
import { MOONIE_QUICK_PROMPTS } from "./constants";

describe("compareDiscoveryHref", () => {
  it("exports only current-turn Search facets, not conversational text", () => {
    const href = compareDiscoveryHref(
      "Recommend fantasy novels with slow burn"
    );
    assert.equal(
      href,
      "/search?genre=fantasy&tags=slow-burn&type=works"
    );
  });

  it("uses literal text only for a direct non-conversational Search query", () => {
    assert.equal(
      compareDiscoveryHref("Radiant Horizon"),
      "/search?q=Radiant%20Horizon"
    );
  });

  it("does not offer misleading Search links for similarity or unsupported constraints", () => {
    assert.equal(
      compareDiscoveryHref("Recommend novels similar to Radiant Horizon"),
      null
    );
    assert.equal(
      compareDiscoveryHref("More like this novel, refined to my taste."),
      null
    );
    assert.equal(
      compareDiscoveryHref("Recommend completed fantasy novels"),
      null
    );
    assert.equal(
      compareDiscoveryHref("Recommend fantasy novels without harem"),
      null
    );
  });

  it("does not turn live descriptive prompt builders into literal Search queries", () => {
    const descriptivePrompts = [
      MOONIE_DESK_CHIPS[0].prompt,
      MOONIE_QUICK_PROMPTS[0],
      MOONIE_QUICK_PROMPTS[1],
    ];

    for (const prompt of descriptivePrompts) {
      assert.equal(compareDiscoveryHref(prompt), null, prompt);
    }
  });

  it("labels title searches and facet browsing according to their URLs", () => {
    assert.equal(
      compareDiscoveryCtaLabel("/search?q=Radiant%20Horizon"),
      "Search this title"
    );
    assert.equal(
      compareDiscoveryCtaLabel("/search?genre=fantasy&type=works"),
      "Open these filters in Search"
    );
  });
});

describe("tasteUsedLabels", () => {
  it("lists used constraints in order", () => {
    assert.deepEqual(
      tasteUsedLabels({
        genres: ["Romance"],
        tags: ["found-family"],
        excludedTags: ["harem"],
        status: "completed",
        mood: ["hopeful"],
        language: null,
      }),
      ["Romance", "found-family", "hopeful", "completed"]
    );
  });
});

describe("slateDiversityLine", () => {
  it("summarises a slate without inventing titles", () => {
    const line = slateDiversityLine(
      [
        {
          novelId: "1",
          title: "A",
          reason: "",
          genres: ["Romance", "Fantasy"],
          confidence: "high",
          sourceStatus: "none",
        },
        {
          novelId: "2",
          title: "B",
          reason: "",
          genres: ["Romance"],
          confidence: "medium",
          sourceStatus: "none",
        },
      ],
      1
    );
    assert.equal(
      line,
      "2 titles · 2 genres · 0 invented titles · 1 marked not for me stay hidden"
    );
  });
});

describe("previousUserContent", () => {
  it("finds the nearest user prompt", () => {
    assert.equal(
      previousUserContent(
        [
          { role: "user", content: "first" },
          { role: "assistant", content: "ok" },
          { role: "user", content: "second" },
          { role: "assistant", content: "here" },
        ],
        3
      ),
      "second"
    );
  });
});
