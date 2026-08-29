import type { ReadingLinkItem } from "@/types/reading-link";

export type ReviewSort =
  | "latest"
  | "trending"
  | "for-you"
  | "following"
  | "from-saves"
  | "hidden-gems"
  | "highest-rated"
  | "most-discussed"
  | "most-saved"
  | "most-shared";

/** Sorts only available to logged-in viewers on Discover. */
export const LOGIN_GATED_SORTS: ReviewSort[] = [
  "for-you",
  "following",
  "from-saves",
  "hidden-gems",
];

const ALL_REVIEW_SORTS = new Set<ReviewSort>([
  "latest",
  "trending",
  ...LOGIN_GATED_SORTS,
  "highest-rated",
  "most-discussed",
  "most-saved",
  "most-shared",
]);

const LOGIN_GATED_SORT_SET = new Set<ReviewSort>(LOGIN_GATED_SORTS);

/** Parse a sort param; guests cannot use login-gated sorts (falls back to trending). */
export function parseReviewSort(
  value: string | undefined | null,
  isLoggedIn = true
): ReviewSort {
  const sort =
    value && ALL_REVIEW_SORTS.has(value as ReviewSort)
      ? (value as ReviewSort)
      : "trending";
  if (!isLoggedIn && LOGIN_GATED_SORT_SET.has(sort)) {
    return "trending";
  }
  return sort;
}

export interface ReviewListItem {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  rating: number;
  containsSpoilers: boolean;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  novelId: string;
  novelTitle: string;
  novelAuthor: string;
  coverUrl: string;
  reviewerId?: string;
  reviewerName: string;
  reviewerUsername: string;
  reviewerAvatar: string;
  reviewerAvatarUrl?: string;
  genres: string[];
  tags: string[];
  createdAt: string;
  /** Present on For You feed when a real taste signal matched. */
  feedReason?: string;
  novelAverageRating?: number | null;
  novelReviewCount?: number;
  hasOfficialLink?: boolean;
  officialLinkUrl?: string;
  officialLinkLabel?: string;
  originalLanguage?: string | null;
  publicationStatus?: string | null;
  /** Batch-enriched public reviewer stats for browse cards. */
  reviewerReviewCount?: number;
  reviewerAverageRating?: number | null;
  reviewerTopGenre?: string | null;
}

export interface ReviewDetail extends ReviewListItem {
  userId: string;
  externalLink?: string;
}

export interface CommentItem {
  id: string;
  reviewId: string;
  userId: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar: string;
  authorAvatarUrl?: string;
  body: string;
  containsSpoilers?: boolean;
  moderationStatus?: "OK" | "AUTO_FLAGGED" | "HIDDEN";
  createdAt: string;
  parentCommentId?: string;
  likeCount: number;
  likedByMe?: boolean;
  replies: CommentItem[];
}

export interface GenreOption {
  id: string;
  name: string;
  slug: string;
  reviewCount: number;
}

export interface NovelDetail {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string;
  externalLink: string | null;
  synopsis: string | null;
  originalLanguage: string | null;
  publicationStatus: string | null;
  publisher: string | null;
  aliases: string[];
  tropes: string[];
  moods: string[];
  contentWarnings: { name: string; slug: string }[];
  chapterCount: number | null;
  lengthBand: string | null;
  metadataSource: string | null;
  lastVerifiedAt: string | null;
  likedTropes: string[];
  saveCount: number;
  readingStatusCounts: { want: number; reading: number; finished: number };
  publicLists: { id: string; name: string }[];
  genres: string[];
  tags: string[];
  reviewCount: number;
  averageRating: number | null;
  ratingDistribution: { rating: number; count: number }[];
  createdAt: string;
  readingLinks: ReadingLinkItem[];
}

export interface NovelRecommendation {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string;
  averageRating: number | null;
  reviewCount: number;
  genres: string[];
  tags: string[];
  matchingLabels: string[];
  reason: string;
}
