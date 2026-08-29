import { cache } from "react";
import { attachFeedReasons } from "@/lib/feed-reasons";
import { diversifyByReviewer, FEED_PAGE_SIZE, type HomeFeedTab } from "@/lib/feed";
import { db } from "@/lib/db";
import { getContinueReadingReviews } from "@/services/discovery.service";
import {
  getCommentPreviewsByReviewIds,
  getLikedReviewIds,
  getReadingTasteSnapshot,
  getSuggestedReviewers,
} from "@/services/feed.service";
import { getFoldersByUser, getSavedFolderIdsByReviewIds } from "@/services/folder.service";
import { getFollowerCount, getFollowingIds } from "@/services/follow-queries";
import { getPersonalizedHomeShelves } from "@/services/home-shelves.service";
import {
  getOrCreateDailyPick,
  type MoonieDailyPick,
} from "@/services/moonie-daily.service";
import {
  getCommunityDeskSnapshot,
  getTasteInsightSnapshot,
} from "@/services/community-desk.service";
import {
  getAllReviews,
  getFollowingReviews,
  getPersonalizedReviews,
} from "@/services/review.service";
import type { TasteInsightSnapshot } from "@/lib/taste-signature";
import type { CommunityDeskSnapshot } from "@/services/community-desk.service";
import type { ReadingTasteSnapshot } from "@/services/feed.service";
import type { TopReviewerPreview } from "@/types/discovery";
import type { CommentItem, ReviewListItem } from "@/types/review";
import type { DiscoveryShelfData } from "@/types/shelves";
import type { FolderListItem } from "@/types/folder";
import type { PreferredGenreOption } from "@/services/preference.service";
import { getPreferredGenres } from "@/services/preference.service";

export interface HomeDashboardShared {
  userId: string;
  displayName: string;
  username: string;
  greetingName: string;
  avatarUrl: string | null;
  avatarInitials: string;
  taste: ReadingTasteSnapshot;
  tasteInsight: TasteInsightSnapshot;
  desk: CommunityDeskSnapshot;
  preferredGenres: PreferredGenreOption[];
  folders: FolderListItem[];
  suggestedReviewers: TopReviewerPreview[];
  followerCount: number;
}

export type HomeDashboardSharedProps = HomeDashboardShared;

export interface ReviewInteractions {
  likedReviewIds: string[];
  followingReviewerIds: string[];
  commentsByReview: Record<string, CommentItem[]>;
  savedFolderIdsByReview: Record<string, string[]>;
}

export interface HomeDashboardCommunityProps {
  feed: HomeFeedTab;
  reviews: ReviewListItem[];
  hasMore: boolean;
  learningTaste: boolean;
  interactions: ReviewInteractions;
}

export interface HomeForYouPanelData {
  dailyPick: MoonieDailyPick | null;
  continueReading: ReviewListItem[];
  madeForYouShelf: DiscoveryShelfData | null;
  circleShelf: DiscoveryShelfData | null;
  reviewHighlights: ReviewListItem[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "R";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function mapComments(
  commentsByReview: Map<string, CommentItem[]>
): Record<string, CommentItem[]> {
  const comments: Record<string, CommentItem[]> = {};
  for (const [id, list] of commentsByReview) {
    comments[id] = list;
  }
  return comments;
}

function mapSavedFolders(
  savedByReview: Map<string, string[]>
): Record<string, string[]> {
  const savedFolderIds: Record<string, string[]> = {};
  for (const [id, list] of savedByReview) {
    savedFolderIds[id] = list;
  }
  return savedFolderIds;
}

export const loadHomeDashboardShared = cache(async function loadHomeDashboardShared(
  userId: string,
  profile: {
    name?: string | null;
    username?: string;
    image?: string | null;
  }
): Promise<HomeDashboardShared> {
  const displayName =
    profile.name?.trim() || profile.username?.trim() || "Reader";
  const username = profile.username?.trim() || "reader";
  const greetingName = displayName.split(/\s+/)[0] || "reader";

  const [taste, preferredGenres, folders, followerCount, currentUser, desk] =
    await Promise.all([
      getReadingTasteSnapshot(userId),
      getPreferredGenres(userId),
      getFoldersByUser(userId),
      getFollowerCount(userId),
      db.user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
      }),
      getCommunityDeskSnapshot(userId),
    ]);

  const tasteInsight = await getTasteInsightSnapshot(userId, taste);

  const reviewerGenres = [
    ...taste.topGenres.map((genre) => genre.name),
    ...preferredGenres.map((genre) => genre.name),
  ];
  const suggestedWithMatch = await getSuggestedReviewers(
    userId,
    5,
    reviewerGenres
  );

  return {
    userId,
    displayName,
    username,
    greetingName,
    avatarUrl: currentUser?.avatarUrl ?? profile.image ?? null,
    avatarInitials: getInitials(displayName),
    taste,
    tasteInsight,
    desk,
    preferredGenres,
    folders,
    suggestedReviewers: suggestedWithMatch,
    followerCount,
  };
});

export const loadHomeForYouPanel = cache(async function loadHomeForYouPanel(
  userId: string
): Promise<HomeForYouPanelData> {
  const [dailyPick, continueReading, shelves] = await Promise.all([
    getOrCreateDailyPick(userId),
    getContinueReadingReviews(userId),
    getPersonalizedHomeShelves(userId),
  ]);

  const madeForYouShelf =
    shelves.find((shelf) => shelf.id === "made-for-you") ?? null;
  const circleShelf =
    shelves.find((shelf) => shelf.id === "from-community") ??
    shelves.find((shelf) => shelf.id === "trending") ??
    null;

  const highlightPool =
    madeForYouShelf?.reviews ??
    circleShelf?.reviews ??
    [];
  const reviewHighlights = highlightPool
    .filter((review) => review.id !== dailyPick?.reviewId)
    .slice(0, 3);

  return {
    dailyPick,
    continueReading,
    madeForYouShelf,
    circleShelf,
    reviewHighlights,
  };
});

export const loadHomeCommunityPanel = cache(async function loadHomeCommunityPanel(
  userId: string,
  feed: HomeFeedTab
): Promise<HomeDashboardCommunityProps> {
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
    if (reviews.length === 0) learningTaste = true;
  }

  if (feed === "for-you" || feed === "following") {
    reviews = diversifyByReviewer(reviews);
  }

  const reviewIds = reviews.map((review) => review.id);
  const reviewerIds = reviews
    .map((review) => review.reviewerId)
    .filter((id): id is string => Boolean(id));

  const [likedIds, commentsByReview, followingIds, savedByReview] =
    await Promise.all([
      getLikedReviewIds(userId, reviewIds),
      getCommentPreviewsByReviewIds(reviewIds, 2),
      getFollowingIds(userId, reviewerIds),
      getSavedFolderIdsByReviewIds(reviewIds, userId),
    ]);

  if (feed === "for-you" && reviews.length > 0) {
    reviews = attachFeedReasons(reviews, {
      topGenres: taste.topGenres,
      topTag: taste.topTag,
      preferredGenreNames: preferredGenres.map((genre) => genre.name),
      followingIds,
    });
  }

  return {
    feed,
    reviews,
    hasMore: reviews.length === FEED_PAGE_SIZE,
    learningTaste,
    interactions: {
      likedReviewIds: [...likedIds],
      followingReviewerIds: [...followingIds],
      commentsByReview: mapComments(commentsByReview),
      savedFolderIdsByReview: mapSavedFolders(savedByReview),
    },
  };
});
