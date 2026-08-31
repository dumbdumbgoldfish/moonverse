import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  pickLandingDoorCovers,
} from "@/lib/landing-door-covers";
import { normalizeNovelTitle } from "@/lib/landing-genres";

const CURATED = new Set([normalizeNovelTitle("The King's Avatar")]);

describe("pickLandingDoorCovers", () => {
  it("includes eligible action titles even when cover art is missing", () => {
    const novels = [
      {
        id: "noise-1",
        title: "Western Seed Novel",
        author: "Seed Author",
        coverUrl: "https://covers.openlibrary.org/b/id/99-M.jpg",
        _count: { reviews: 40, readingLinks: 0 },
      },
      {
        id: "king",
        title: "The King's Avatar",
        author: "Butterfly Blue",
        coverUrl: null,
        _count: { reviews: 12, readingLinks: 1 },
      },
      {
        id: "maniac",
        title: "The Magical Girl Maniac",
        author: "Magical Girl Gunslinger",
        coverUrl: null,
        _count: { reviews: 8, readingLinks: 1 },
      },
    ];

    const picked = pickLandingDoorCovers(novels, 3, CURATED);

    assert.equal(picked.length, 2);
    assert.equal(picked[0]?.title, "The King's Avatar");
    assert.equal(picked[0]?.novelId, "king");
    assert.deepEqual(
      picked.map((cover) => cover.title),
      ["The King's Avatar", "The Magical Girl Maniac"]
    );
  });

  it("prefers resolved jackets when both eligible titles have art", () => {
    const novels = [
      {
        id: "plain",
        title: "Plain Linked",
        author: "Author",
        coverUrl: null,
        _count: { reviews: 2, readingLinks: 1 },
      },
      {
        id: "art",
        title: "Art Linked",
        author: "Author",
        coverUrl: "https://covers.openlibrary.org/b/id/12-M.jpg",
        _count: { reviews: 2, readingLinks: 1 },
      },
    ];

    const picked = pickLandingDoorCovers(novels, 1, new Set());

    assert.equal(picked.length, 1);
    assert.equal(picked[0]?.novelId, "art");
    assert.equal(
      picked[0]?.coverUrl,
      "https://covers.openlibrary.org/b/id/12-M.jpg"
    );
  });

  it("returns no previews when the door has no eligible records", () => {
    const picked = pickLandingDoorCovers(
      [
        {
          id: "seed",
          title: "Seed Only",
          author: "Author",
          coverUrl: "https://covers.openlibrary.org/b/id/1-M.jpg",
          _count: { reviews: 5, readingLinks: 0 },
        },
      ],
      3,
      new Set()
    );

    assert.deepEqual(picked, []);
  });
});
