import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { curatedCoverUrlForTitle } from "../../prisma/lib/open-library-covers";
import { isMissingCoverUrl, resolveCoverUrl } from "@/lib/review-utils";

describe("landing curated covers", () => {
  it("resolves catalogue fallbacks for landing titles with null DB covers", () => {
    const cases = [
      "Lord of the Mysteries",
      "The Three-Body Problem",
      "Dungeon Crawler Carl",
      "He Who Fights With Monsters",
      "Sovereign of the Three Realms",
      "Reverend Insanity",
    ];

    for (const title of cases) {
      const resolved = resolveCoverUrl(null, { title });
      assert.equal(isMissingCoverUrl(resolved), false, title);
      assert.ok(curatedCoverUrlForTitle(title) || resolved, title);
    }
  });

  it("matches novel detail hero resolution when DB cover is missing", () => {
    const resolved = resolveCoverUrl(null, { title: "Sovereign of the Three Realms" });
    assert.equal(isMissingCoverUrl(resolved), false);
    assert.notEqual(resolved, "");
  });

  it("does not use the broken Lord of the Mysteries web-serial wikimedia path", () => {
    const url = curatedCoverUrlForTitle("Lord of the Mysteries");
    assert.ok(url);
    assert.equal(url?.includes("Lord_of_Mysteries_web_serial_cover"), false);
    assert.match(url!, /Lord_of_Mysteries.*print_cover/);
  });
});
