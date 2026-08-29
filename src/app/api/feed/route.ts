import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { attachFeedReasons } from "@/lib/feed-reasons";
import {
  diversifyByReviewer,
  FEED_PAGE_SIZE,
  parseHomeFeedTab,
} from "@/lib/feed";
import {
  getCommentPreviewsByReviewIds,
  getLikedReviewIds,
  getReadingTasteSnapshot,
} from "@/services/feed.service";
import { getSavedFolderIdsByReviewIds } from "@/services/folder.service";
import { getFollowingIds } from "@/services/follow-queries";
import { getPreferredGenres } from "@/services/preference.service";
import {
  getAllReviews,
  getFollowingReviews,
  getPersonalizedReviews,
} from "@/services/review.service";
import type { CommentItem, ReviewListItem } from "@/types/review";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const feed = parseHomeFeedTab(searchParams.get("feed"));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? "0") || 0);
  const limit = Math.min(
    20,
    Math.max(1, Number(searchParams.get("limit") ?? FEED_PAGE_SIZE) || FEED_PAGE_SIZE)
  );
  const userId = session.user.id;
  let reviews: ReviewListItem[] = [];

  if (feed === "following") {
    reviews = await getFollowingReviews(userId, { limit, offset });
  } else if (feed === "trending") {
    reviews = await getAllReviews({
      sort: "trending",
      limit,
      offset,
    });
  } else if (feed === "latest") {
    reviews = await getAllReviews({
      sort: "latest",
      limit,
      offset,
    });
  } else {
    reviews = await getPersonalizedReviews(userId, {
      limit,
      offset,
      allowTrendingFallback: false,
    });
  }

  if (feed === "for-you" || feed === "following") {
    reviews = diversifyByReviewer(reviews);
  }

  const reviewIds = reviews.map((review) => review.id);
  const reviewerIds = reviews
    .map((review) => review.reviewerId)
    .filter((id): id is string => Boolean(id));

  const [likedIds, commentsByReview, followingIds, savedByReview, taste, preferred] =
    await Promise.all([
      getLikedReviewIds(userId, reviewIds),
      getCommentPreviewsByReviewIds(reviewIds, 2),
      getFollowingIds(userId, reviewerIds),
      getSavedFolderIdsByReviewIds(reviewIds, userId),
      feed === "for-you" ? getReadingTasteSnapshot(userId) : null,
      feed === "for-you" ? getPreferredGenres(userId) : null,
    ]);

  if (feed === "for-you" && taste && preferred) {
    reviews = attachFeedReasons(reviews, {
      topGenres: taste.topGenres,
      topTag: taste.topTag,
      preferredGenreNames: preferred.map((genre) => genre.name),
      followingIds,
    });
  }

  const comments: Record<string, CommentItem[]> = {};
  for (const [id, list] of commentsByReview) {
    comments[id] = list;
  }

  const savedFolderIds: Record<string, string[]> = {};
  for (const [id, list] of savedByReview) {
    savedFolderIds[id] = list;
  }

  return NextResponse.json({
    reviews,
    likedReviewIds: [...likedIds],
    followingReviewerIds: [...followingIds],
    comments,
    savedFolderIds,
    hasMore: reviews.length === limit,
    nextOffset: offset + reviews.length,
  });
}
