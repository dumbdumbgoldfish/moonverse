import { LiteraryCommunityPage } from "@/components/home/community/LiteraryCommunityPage";
import { attachFeedReasons } from "@/lib/feed-reasons";
import {
  diversifyByReviewer,
  FEED_PAGE_SIZE,
  parseHomeFeedTab,
} from "@/lib/feed";
import { COMMUNITY_PATH } from "@/lib/home-view";
import { db } from "@/lib/db";
import { requireOnboardedUser } from "@/lib/onboarding-guard";
import {
  getCommunityDeskSnapshot,
  getTasteInsightSnapshot,
} from "@/services/community-desk.service";
import {
  getCommentPreviewsByReviewIds,
  getLikedReviewIds,
  getReadingTasteSnapshot,
  getSuggestedReviewers,
} from "@/services/feed.service";
import {
  getFoldersByUser,
  getSavedFolderIdsByReviewIds,
} from "@/services/folder.service";
import { getFollowerCount, getFollowingIds } from "@/services/follow-queries";
import { getPreferredGenres } from "@/services/preference.service";
import {
  getAllReviews,
  getFollowingReviews,
  getPersonalizedReviews,
} from "@/services/review.service";
import type { CommentItem, ReviewListItem } from "@/types/review";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Community · MoonVerse",
  description:
    "Reviews from followed readers, trending discussions and the MoonVerse circle.",
};

interface CommunityPageProps {
  searchParams: Promise<{ feed?: string }>;
}

export default async function CommunityPage({
  searchParams,
}: CommunityPageProps) {
  const session = await requireOnboardedUser(COMMUNITY_PATH);
  const params = await searchParams;
  const feed = parseHomeFeedTab(params.feed);
  const userId = session.user.id;
  const displayName =
    session.user.name?.trim() || session.user.username || "Reader";

  const [taste, preferredGenres] = await Promise.all([
    getReadingTasteSnapshot(userId),
    getPreferredGenres(userId),
  ]);

  let reviews: ReviewListItem[] = [];
  let learningTaste = false;

  if (feed === "following") {
    reviews = await getFollowingReviews(userId, {
      limit: FEED_PAGE_SIZE,
      offset: 0,
    });
  } else if (feed === "trending") {
    reviews = await getAllReviews({
      sort: "trending",
      limit: FEED_PAGE_SIZE,
      offset: 0,
    });
  } else if (feed === "latest") {
    reviews = await getAllReviews({
      sort: "latest",
      limit: FEED_PAGE_SIZE,
      offset: 0,
    });
  } else if (!taste.hasSignals) {
    reviews = [];
    learningTaste = true;
  } else {
    reviews = await getPersonalizedReviews(userId, {
      limit: FEED_PAGE_SIZE,
      offset: 0,
      allowTrendingFallback: false,
    });
    if (reviews.length === 0) {
      learningTaste = true;
    }
  }

  if (feed === "for-you" || feed === "following") {
    reviews = diversifyByReviewer(reviews);
  }

  const reviewIds = reviews.map((review) => review.id);
  const reviewerIds = reviews
    .map((review) => review.reviewerId)
    .filter((id): id is string => Boolean(id));

  const [
    likedIds,
    commentsByReview,
    followingIds,
    savedByReview,
    folders,
    suggestedReviewers,
    followerCount,
    currentUser,
    desk,
  ] = await Promise.all([
    getLikedReviewIds(userId, reviewIds),
    getCommentPreviewsByReviewIds(reviewIds, 2),
    getFollowingIds(userId, reviewerIds),
    getSavedFolderIdsByReviewIds(reviewIds, userId),
    getFoldersByUser(userId),
    getSuggestedReviewers(userId, 5, [
      ...taste.topGenres.map((genre) => genre.name),
      ...preferredGenres.map((genre) => genre.name),
    ]),
    getFollowerCount(userId),
    db.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    }),
    getCommunityDeskSnapshot(userId),
  ]);

  const tasteInsight = await getTasteInsightSnapshot(userId, taste);

  if (feed === "for-you" && reviews.length > 0) {
    reviews = attachFeedReasons(reviews, {
      topGenres: taste.topGenres,
      topTag: taste.topTag,
      preferredGenreNames: preferredGenres.map((genre) => genre.name),
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

  return (
    <LiteraryCommunityPage
      key={feed}
      feed={feed}
      initialReviews={reviews}
      initialHasMore={reviews.length === FEED_PAGE_SIZE}
      likedReviewIds={[...likedIds]}
      followingReviewerIds={[...followingIds]}
      commentsByReview={comments}
      savedFolderIdsByReview={savedFolderIds}
      folders={folders}
      taste={taste}
      tasteInsight={tasteInsight}
      desk={desk}
      suggestedReviewers={suggestedReviewers}
      preferredGenres={preferredGenres}
      followerCount={followerCount}
      learningTaste={learningTaste}
      currentUserId={userId}
      displayName={displayName}
      username={session.user.username}
      avatarUrl={currentUser?.avatarUrl ?? session.user.image}
      communityBasePath={COMMUNITY_PATH}
    />
  );
}
