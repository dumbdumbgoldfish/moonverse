import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  displayReviewTitle,
  isLandingHeroCandidate,
  isTemplateReviewTitle,
  pickLandingCommunityReviews,
  pickLandingHeroReviews,
  scoreLandingCommunityReview,
} from "./landing-reviews";
import type { ReviewListItem } from "../types/review";

function review(
  partial: Partial<ReviewListItem> & Pick<ReviewListItem, "id" | "title" | "novelId">
): ReviewListItem {
  return {
    excerpt: "There are chapters I had to put down because I needed a minute to think.",
    body: "There are chapters I had to put down because I needed a minute to think.",
    rating: 4,
    containsSpoilers: false,
    likeCount: 1,
    commentCount: 0,
    saveCount: 0,
    shareCount: 0,
    novelTitle: "Test Novel",
    novelAuthor: "Author",
    coverUrl: "",
    reviewerName: "Reader",
    reviewerUsername: "reader",
    reviewerAvatar: "R",
    genres: ["Romance"],
    tags: [],
    createdAt: "2026-06-25T00:00:00.000Z",
    ...partial,
  };
}

describe("landing community reviews", () => {
  it("fixes the seed grammar without touching other A-titles", () => {
    assert.equal(
      displayReviewTitle("A emotional reader's notes on Mr. Mercedes (48)"),
      "An emotional reader's notes on Mr. Mercedes"
    );
    assert.equal(
      displayReviewTitle("A Curse for True Love: patient, imperfect and worth finishing"),
      "A Curse for True Love: patient, imperfect and worth finishing"
    );
    assert.equal(displayReviewTitle("Honest take: Bunny"), "Honest take: Bunny");
  });

  it("flags template notes and prefers a human title", () => {
    assert.equal(
      isTemplateReviewTitle("A emotional reader's notes on Mr. Mercedes (48)"),
      true
    );
    const junk = review({
      id: "1",
      novelId: "n1",
      title: "A emotional reader's notes on Mr. Mercedes (48)",
      likeCount: 7,
    });
    const human = review({
      id: "2",
      novelId: "n2",
      title: "What worked (and what dragged) in Bad Luck and Trouble",
      likeCount: 2,
    });
    assert.ok(scoreLandingCommunityReview(human) > scoreLandingCommunityReview(junk));
    const picked = pickLandingCommunityReviews([junk, human], 1);
    assert.equal(picked[0]?.id, "2");
  });

  it("keeps one review per novel", () => {
    const a = review({ id: "1", novelId: "same", title: "Honest take: Bunny" });
    const b = review({
      id: "2",
      novelId: "same",
      title: "Bunny comedy with teeth: Bunny",
      likeCount: 9,
    });
    const c = review({
      id: "3",
      novelId: "other",
      title: "Why I landed on 4 stars for Coiling Dragon",
    });
    const picked = pickLandingCommunityReviews([a, b, c], 4);
    assert.equal(picked.length, 2);
    assert.equal(new Set(picked.map((item) => item.novelId)).size, 2);
  });
});

describe("landing hero faces", () => {
  it("keeps Stephen King and Lee Child off the hero when a web novel exists", () => {
    const king = review({
      id: "k",
      novelId: "king",
      title: "A casual reader's notes on Mr. Mercedes",
      novelTitle: "Mr. Mercedes",
      novelAuthor: "Stephen King",
      rating: 5,
      likeCount: 40,
    });
    const child = review({
      id: "c",
      novelId: "child",
      title: "A veteran reader's notes on Bad Luck and Trouble",
      novelTitle: "Bad Luck and Trouble",
      novelAuthor: "Lee Child",
      rating: 5,
      likeCount: 30,
    });
    const web = review({
      id: "w",
      novelId: "web",
      title: "Why the revenge plot in Genius Doctor still works",
      novelTitle: "Genius Doctor: Black Belly Miss",
      novelAuthor: "Good Morning",
      rating: 3,
      likeCount: 2,
      hasOfficialLink: true,
    });

    assert.equal(isLandingHeroCandidate(king), false);
    assert.equal(isLandingHeroCandidate(child), false);
    assert.equal(isLandingHeroCandidate(web), true);

    const picked = pickLandingHeroReviews([king, child, web], 3);
    assert.deepEqual(
      picked.map((item) => item.novelTitle),
      ["Genius Doctor: Black Belly Miss"]
    );
  });

  it("does not invent a third face when only two catalogue titles qualify", () => {
    const a = review({
      id: "a",
      novelId: "a",
      title: "Found family done right",
      novelTitle: "A Will Eternal",
      hasOfficialLink: true,
    });
    const b = review({
      id: "b",
      novelId: "b",
      title: "The climb is the point",
      novelTitle: "Against the Gods",
      hasOfficialLink: true,
    });
    const noise = review({
      id: "n",
      novelId: "n",
      title: "A casual reader's notes on The Great God Pan",
      novelTitle: "The Great God Pan",
    });
    const picked = pickLandingHeroReviews([a, b, noise], 3);
    assert.equal(picked.length, 2);
  });

  it("can restrict community picks to catalogue titles", () => {
    const king = review({
      id: "k",
      novelId: "king",
      title: "What worked in Mr. Mercedes",
      novelTitle: "Mr. Mercedes",
      likeCount: 40,
    });
    const web = review({
      id: "w",
      novelId: "web",
      title: "Why the revenge plot still works",
      novelTitle: "Genius Doctor: Black Belly Miss",
      hasOfficialLink: true,
    });
    const picked = pickLandingCommunityReviews([king, web], 2, {
      catalogueOnly: true,
    });
    assert.deepEqual(
      picked.map((item) => item.novelTitle),
      ["Genius Doctor: Black Belly Miss"]
    );
  });
});
