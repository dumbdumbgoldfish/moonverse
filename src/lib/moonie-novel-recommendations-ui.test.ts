import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFile } from "node:fs/promises";

describe("MoonieNovelRecommendations labels", () => {
  it("renders recommendation labels as non-interactive chips", async () => {
    const source = await readFile(
      new URL("../components/novels/MoonieNovelRecommendations.tsx", import.meta.url),
      "utf8"
    );
    assert.match(source, /recommendationLabels/);
    assert.match(source, /cursor-default/);
    assert.doesNotMatch(
      source,
      /recommendationLabels[\s\S]*moonieEntryHref/
    );
  });
});
