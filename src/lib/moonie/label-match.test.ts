import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { labelsMatch, matchedPreferenceLabels } from "./label-match";

describe("labelsMatch", () => {
  it("matches exact and slug-equivalent genre names", () => {
    assert.equal(labelsMatch("Isekai", "isekai"), true);
    assert.equal(labelsMatch("Sci-Fi", "sci-fi"), true);
  });

  it("rejects substring-only overlaps", () => {
    assert.equal(labelsMatch("Slice of Life", "life"), false);
    assert.equal(labelsMatch("Biography", "io"), false);
    assert.equal(labelsMatch("The Mamba Mentality", "isekai"), false);
  });
});

describe("matchedPreferenceLabels", () => {
  it("returns only user preferences that match catalogue genres", () => {
    const matched = matchedPreferenceLabels(
      ["Biography", "Sports"],
      ["isekai", "sports"]
    );
    assert.deepEqual(matched, ["sports"]);
  });
});
