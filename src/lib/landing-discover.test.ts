import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  discoverShelfQuote,
  isLandingDiscoverCandidate,
  pickLandingDiscoverNovels,
} from "./landing-discover";
import type { TrendingNovelPreview } from "../types/discovery";

function novel(
  partial: Partial<TrendingNovelPreview> &
    Pick<TrendingNovelPreview, "novelId" | "title">
): TrendingNovelPreview {
  return {
    author: "Author",
    coverUrl: "",
    averageRating: 3,
    reviewCount: 2,
    totalLikes: 1,
    totalComments: 0,
    totalSaves: 0,
    mostRecentReviewAt: "2026-08-01T00:00:00.000Z",
    score: 10,
    ...partial,
  };
}

describe("landing discover shelf", () => {
  it("keeps Witcher, King and Lee Child off the shelf", () => {
    const witcher = novel({
      novelId: "w",
      title: "Krew elfów",
      author: "Andrzej Sapkowski",
      score: 90,
      averageRating: 3.5,
    });
    const king = novel({
      novelId: "k",
      title: "Mr. Mercedes",
      author: "Stephen King",
      score: 80,
    });
    const child = novel({
      novelId: "c",
      title: "Bad Luck and Trouble",
      author: "Lee Child",
      score: 70,
      averageRating: 5,
    });
    const web = novel({
      novelId: "g",
      title: "Genius Doctor: Black Belly Miss",
      author: "Good Morning",
      score: 12,
      averageRating: 2.5,
      hasOfficialLink: true,
    });

    assert.equal(isLandingDiscoverCandidate(witcher), false);
    assert.equal(isLandingDiscoverCandidate(king), false);
    assert.equal(isLandingDiscoverCandidate(child), false);
    assert.equal(isLandingDiscoverCandidate(web), true);

    const picked = pickLandingDiscoverNovels(
      [witcher, king, child, web],
      12,
      "trending"
    );
    assert.deepEqual(
      picked.map((item) => item.title),
      ["Genius Doctor: Black Belly Miss"]
    );
  });

  it("sorts highest rated by live average, not trending score", () => {
    const quiet = novel({
      novelId: "q",
      title: "Cultivation Chat Group",
      averageRating: 4.5,
      score: 8,
      hasOfficialLink: true,
    });
    const loud = novel({
      novelId: "l",
      title: "A Will Eternal",
      averageRating: 3,
      score: 40,
      hasOfficialLink: true,
    });
    const picked = pickLandingDiscoverNovels([loud, quiet], 2, "highest");
    assert.deepEqual(
      picked.map((item) => item.title),
      ["Cultivation Chat Group", "A Will Eternal"]
    );
  });

  it("prefers novels with real cover art on the discover shelf", () => {
    const bare = novel({
      novelId: "b",
      title: "Genius Doctor: Black Belly Miss",
      score: 90,
      hasOfficialLink: true,
      coverUrl: "",
    });
    const jacket = novel({
      novelId: "j",
      title: "A Will Eternal",
      score: 12,
      hasOfficialLink: true,
      coverUrl: "https://cdn.wuxiaworld.com/images/covers/awe.webp",
    });
    const picked = pickLandingDiscoverNovels([bare, jacket], 2, "trending");
    assert.equal(picked[0]?.title, "A Will Eternal");
  });

  it("drops template review titles instead of inventing a quote", () => {
    assert.equal(
      discoverShelfQuote("A casual reader's notes on Mr. Mercedes (48)"),
      undefined
    );
    assert.equal(
      discoverShelfQuote("fantasy with teeth: Krew elfów"),
      "fantasy with teeth: Krew elfów"
    );
    assert.equal(discoverShelfQuote("short"), undefined);
  });
});
