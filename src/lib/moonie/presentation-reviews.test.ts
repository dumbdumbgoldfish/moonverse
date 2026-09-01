import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldShowNovelReviewAggregateOverview, resolveMoonieCardMode } from "@/lib/moonie/presentation";
import type { MoonieChatMessage, MoonieNovelOverview, MoonieReviewerResult } from "@/types/moonie";

const overview: MoonieNovelOverview = {
  novelId: "novel-hidden-oracle",
  title: "The Hidden Oracle",
  genres: [],
  tags: [],
  readingSources: [],
  community: {
    reviewCount: 12,
    averageRating: 3.8,
    previews: [
      {
        id: "preview-1",
        title: "Preview one",
        excerpt: "Excerpt",
        rating: 4,
        reviewerName: "Reader A",
      },
    ],
    consensus: "Mixed",
  },
};

function assistantMessage(
  partial: Partial<MoonieChatMessage>
): MoonieChatMessage {
  return {
    id: "assistant-1",
    role: "assistant",
    content: "Here are reviews.",
    ...partial,
  };
}

describe("shouldShowNovelReviewAggregateOverview", () => {
  it("hides aggregate block for explicit counted scoped review cards", () => {
    const message = assistantMessage({
      novelOverview: overview,
      rankedReviews: [
        {
          id: "rev-1",
          title: "Review one",
          excerpt: "One",
          rating: 5,
          reviewerName: "A",
          novelId: "novel-hidden-oracle",
          novelTitle: "The Hidden Oracle",
          containsSpoilers: false,
        },
        {
          id: "rev-2",
          title: "Review two",
          excerpt: "Two",
          rating: 4,
          reviewerName: "B",
          novelId: "novel-hidden-oracle",
          novelTitle: "The Hidden Oracle",
          containsSpoilers: false,
        },
      ],
      explicitCountedReviews: true,
      requestedCount: 2,
    });

    assert.equal(shouldShowNovelReviewAggregateOverview(message), false);
  });

  it("keeps aggregate block for ordinary uncounted review presentation", () => {
    const message = assistantMessage({
      novelOverview: overview,
      rankedReviews: [
        {
          id: "rev-1",
          title: "Review one",
          excerpt: "One",
          rating: 5,
          reviewerName: "A",
          novelId: "novel-hidden-oracle",
          novelTitle: "The Hidden Oracle",
          containsSpoilers: false,
        },
      ],
      requestedCount: 10,
    });

    assert.equal(shouldShowNovelReviewAggregateOverview(message), true);
  });
});

describe("resolveMoonieCardMode — who reviewed", () => {
  const reviewers: MoonieReviewerResult[] = [
    {
      id: "u1",
      displayName: "Mana Tea Collector",
      username: "novascroll10qa732",
      avatarInitials: "MT",
      reviewCount: 20,
      followerCount: 3,
    },
    {
      id: "u2",
      displayName: "Soft Apple Blossom",
      username: "ezrapages37qa1231",
      avatarInitials: "SA",
      reviewCount: 5,
      followerCount: 1,
    },
  ];

  it("routes who-reviewed payloads to structured reviewer cards", () => {
    const mode = resolveMoonieCardMode(
      assistantMessage({
        analyticsIntent: "novel_reviews",
        reviewerResults: reviewers,
        rankedReviews: [],
        content:
          "12 unique MoonVerse reviewers reviewed **The Hidden Oracle**.",
      }),
      "Who reviewed The Hidden Oracle?"
    );
    assert.equal(mode, "reviewers");
  });
});
