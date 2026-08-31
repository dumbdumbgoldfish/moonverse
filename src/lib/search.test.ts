import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseSearchQuery,
  searchHref,
  searchInterpretationLabels,
} from "./search";

describe("parseSearchQuery", () => {
  it("does not steal a genre facet out of Cultivation Chat Group", () => {
    const parsed = parseSearchQuery("Cultivation Chat Group");
    assert.equal(parsed.genreSlug, null);
    assert.equal(parsed.text, "Cultivation Chat Group");
  });

  it("still treats a standalone cultivation query as a genre facet", () => {
    const parsed = parseSearchQuery("cultivation");
    assert.equal(parsed.genreSlug, "cultivation");
    assert.equal(parsed.text, "");
  });

  it("still extracts a genre-plus-tag filter query", () => {
    const parsed = parseSearchQuery("fantasy slow-burn");
    assert.equal(parsed.genreSlug, "fantasy");
    assert.ok(parsed.tagSlugs.includes("slow-burn"));
    assert.equal(parsed.text, "");
  });
});

describe("searchHref", () => {
  it("omits an empty q parameter", () => {
    assert.equal(searchHref(""), "/search");
    assert.equal(searchHref("   "), "/search");
  });

  it("encodes a query", () => {
    assert.equal(
      searchHref("solo leveling"),
      "/search?q=solo%20leveling"
    );
  });
});

describe("searchInterpretationLabels", () => {
  it("explains a plain text query", () => {
    const labels = searchInterpretationLabels(
      {
        genre: null,
        tags: [],
        handle: null,
        author: null,
        quoted: null,
      },
      "shadow slave"
    );
    assert.equal(labels[0]?.label, "Title, author, alias, and catalog text");
  });
});
