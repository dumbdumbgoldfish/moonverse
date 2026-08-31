import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseShelfNearbyTitles } from "@/lib/discover";
import { resolveShelfRecommendationAnchors } from "./shelf-context";

describe("shelf nearby title parsing", () => {
  it("extracts semicolon-separated shelf neighbours", () => {
    const titles = parseShelfNearbyTitles(
      "Recommend a next read from the MoonVerse catalog. Nearby on this shelf: Sovereign of the Three Realms; Outlander; The Housemaid Is Watching. Name in-catalog titles only, with a short why."
    );
    assert.deepEqual(titles, [
      "Sovereign of the Three Realms",
      "Outlander",
      "The Housemaid Is Watching",
    ]);
  });
});

describe("resolveShelfRecommendationAnchors", () => {
  it("maps resolved catalogue ids and reports unresolved titles", async () => {
    const anchors = await resolveShelfRecommendationAnchors(
      "Nearby on this shelf: Known Title; Missing Title.",
      async (title) => (title === "Known Title" ? ["novel-known"] : [])
    );
    assert.ok(anchors);
    assert.deepEqual(anchors.novelIds, ["novel-known"]);
    assert.deepEqual(anchors.unresolvedTitles, ["Missing Title"]);
  });
});
