import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { db } from "@/lib/db";
import { ContentModerationStatus } from "@prisma/client";
import { handleMoonieRequest } from "@/services/moonie-response.service";

async function sampleNovelWithReviews(): Promise<{
  novelId: string;
  title: string;
  reviewIds: string[];
} | null> {
  const review = await db.review.findFirst({
    where: { moderationStatus: ContentModerationStatus.OK },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      novelId: true,
      novel: { select: { title: true } },
    },
  });
  if (!review) return null;

  const reviews = await db.review.findMany({
    where: {
      novelId: review.novelId,
      moderationStatus: ContentModerationStatus.OK,
    },
    select: { id: true },
    take: 10,
  });

  return {
    novelId: review.novelId,
    title: review.novel.title,
    reviewIds: reviews.map((row) => row.id),
  };
}

async function sampleReviewerWithReviews(): Promise<{
  userId: string;
  username: string;
  displayName: string;
  reviewCount: number;
} | null> {
  const user = await db.user.findFirst({
    where: {
      isSuspended: false,
      reviews: {
        some: { moderationStatus: ContentModerationStatus.OK },
      },
    },
    orderBy: { reviews: { _count: "desc" } },
    select: {
      id: true,
      username: true,
      displayName: true,
      _count: { select: { reviews: true } },
    },
  });
  if (!user) return null;
  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    reviewCount: user._count.reviews,
  };
}

describe("moonie reviews and reviewer factual retrieval", () => {
  it("lists reviews for an exact novel title with correct novel scope", async () => {
    const sample = await sampleNovelWithReviews();
    if (!sample) return;

    const response = await handleMoonieRequest({
      message: `reviews for ${sample.title}`,
      messages: [],
      isLoggedIn: false,
    });

    assert.ok((response.rankedReviews?.length ?? 0) > 0);
    assert.equal(response.responseKind, "reviews");
    for (const review of response.rankedReviews ?? []) {
      assert.equal(review.novelId, sample.novelId);
      assert.ok(review.id);
      assert.ok(review.reviewerName);
    }
  });

  it("returns highest-rated, most recent, and most liked reviews for a novel", async () => {
    const sample = await sampleNovelWithReviews();
    if (!sample || sample.reviewIds.length < 2) return;

    const highest = await handleMoonieRequest({
      message: `highest rated review for ${sample.title}`,
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(highest.rankingMetric, "review_rating");
    assert.equal(highest.rankedReviews?.length, 1);
    assert.equal(highest.rankedReviews?.[0]?.novelId, sample.novelId);
    assert.match(highest.reply, /Read full review/i);

    const recent = await handleMoonieRequest({
      message: `most recent review for ${sample.title}`,
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(recent.rankingMetric, "review_recent");
    assert.equal(recent.rankedReviews?.[0]?.novelId, sample.novelId);

    const liked = await handleMoonieRequest({
      message: `most liked review for ${sample.title}`,
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(liked.rankingMetric, "review_helpful");
    assert.equal(liked.rankedReviews?.[0]?.novelId, sample.novelId);
  });

  it("returns spoiler-free reviews only in spoiler-safe mode", async () => {
    const sample = await sampleNovelWithReviews();
    if (!sample) return;

    const response = await handleMoonieRequest({
      message: `spoiler-free reviews for ${sample.title}`,
      messages: [],
      isLoggedIn: false,
      spoilerMode: "none",
    });

    for (const review of response.rankedReviews ?? []) {
      assert.equal(review.containsSpoilers, false);
      assert.equal(review.novelId, sample.novelId);
    }
  });

  it("answers who reviewed it from active novel context", async () => {
    const sample = await sampleNovelWithReviews();
    if (!sample) return;

    const lookup = await handleMoonieRequest({
      message: `reviews for ${sample.title}`,
      messages: [],
      isLoggedIn: false,
    });

    const who = await handleMoonieRequest({
      message: "who reviewed it?",
      messages: [
        { role: "user", content: `reviews for ${sample.title}` },
        {
          role: "assistant",
          content: lookup.reply,
          meta: {
            novelOverview: lookup.novelOverview,
            lookupSession: lookup.lookupSession,
            rankedReviews: lookup.rankedReviews,
          },
        },
      ],
      isLoggedIn: false,
    });

    assert.match(who.reply, /reviewer/i);
    assert.ok((who.rankedReviews?.length ?? 0) > 0);
    for (const review of who.rankedReviews ?? []) {
      assert.equal(review.novelId, sample.novelId);
    }
  });

  it("resolves exact reviewer lookup with profile link and review count", async () => {
    const reviewer = await sampleReviewerWithReviews();
    if (!reviewer) return;

    const response = await handleMoonieRequest({
      message: `who is @${reviewer.username}`,
      messages: [],
      isLoggedIn: false,
    });

    assert.equal(response.reviewerOverview?.username, reviewer.username);
    assert.equal(response.reviewerOverview?.reviewCount, reviewer.reviewCount);
    assert.match(response.reply, /View profile/i);
    assert.match(response.reply, new RegExp(`/users/${reviewer.username}`));
  });

  it("lists reviews authored by a reviewer", async () => {
    const reviewer = await sampleReviewerWithReviews();
    if (!reviewer) return;

    const response = await handleMoonieRequest({
      message: `show me @${reviewer.username} reviews`,
      messages: [],
      isLoggedIn: false,
    });

    assert.ok(response.reviewerOverview);
    assert.ok((response.reviewerOverview?.recentReviews.length ?? 0) > 0);
    assert.match(response.reply, new RegExp(reviewer.displayName, "i"));
  });

  it("follow-up show me their reviews uses active reviewer context", async () => {
    const ranking = await handleMoonieRequest({
      message: "recommend top 5 reviewer",
      messages: [],
      isLoggedIn: false,
    });
    const first = ranking.reviewerResults?.[0];
    if (!first) return;

    const response = await handleMoonieRequest({
      message: "show me their reviews",
      messages: [
        { role: "user", content: "recommend top 5 reviewer" },
        {
          role: "assistant",
          content: ranking.reply,
          meta: {
            reviewerResults: ranking.reviewerResults,
            reviewerSession: ranking.reviewerSession,
          },
        },
      ],
      isLoggedIn: false,
    });

    assert.ok(response.reviewerOverview);
    assert.equal(response.reviewerOverview?.username, first.username);
    assert.ok((response.reviewerOverview?.recentReviews.length ?? 0) > 0);
  });

  it("returns unknown reviewer without fabricating a profile", async () => {
    const response = await handleMoonieRequest({
      message: "who is @zzz_nonexistent_reviewer_99999",
      messages: [],
      isLoggedIn: false,
    });
    assert.match(response.reply, /couldn't find|could not find/i);
    assert.equal(response.reviewerOverview, undefined);
  });

  it("disambiguates similar reviewer names instead of picking arbitrarily", async () => {
    const users = await db.user.findMany({
      where: {
        isSuspended: false,
        displayName: { contains: "Fixture", mode: "insensitive" },
      },
      take: 3,
      select: { username: true },
    });
    if (users.length < 2) return;

    const response = await handleMoonieRequest({
      message: "who is Fixture",
      messages: [],
      isLoggedIn: false,
    });

    assert.ok((response.reviewerResults?.length ?? 0) >= 2);
    assert.match(response.reply, /Which one do you mean|matching/i);
  });
});
