import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  searchHref,
  searchInterpretationLabels,
} from "./search";

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
