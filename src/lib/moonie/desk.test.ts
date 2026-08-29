import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compareDiscoveryHref,
  previousUserContent,
  slateDiversityLine,
  tasteUsedLabels,
} from "./desk";

describe("compareDiscoveryHref", () => {
  it("builds a works search from genre, tags, and the original prompt", () => {
    const href = compareDiscoveryHref(
      {
        genres: ["GL"],
        tags: ["slow-burn"],
        excludedTags: ["harem"],
        status: "completed",
        mood: [],
        language: null,
      },
      "cozy romance"
    );
    assert.equal(
      href,
      "/search?genre=gl&tags=slow-burn&q=cozy+romance&type=works"
    );
  });

  it("falls back to a keyword search", () => {
    assert.equal(
      compareDiscoveryHref(undefined, "revenge fantasy"),
      "/search?q=revenge+fantasy"
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
