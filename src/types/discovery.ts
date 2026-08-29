import type { ReviewListItem } from "@/types/review";

export interface ReadingListShelfNovel {
  novelId: string;
  title: string;
  author: string;
  coverUrl: string;
  averageRating: number | null;
  reviewCount: number;
  primaryGenre?: string;
  publicationStatus?: string;
  synopsisExcerpt?: string;
  hasOfficialLink?: boolean;
  tags: string[];
}

export interface ReadingListPreview {
  id: string;
  name: string;
  description?: string;
  ownerName: string;
  ownerUsername: string;
  reviewCount: number;
  isPublic: boolean;
  coverUrls: string[];
  /** Unique novel titles matching coverUrls order */
  novelTitles?: string[];
  highlightQuote?: string;
  highlightReviewer?: string;
  averageRating?: number;
  href?: string;
  curatorLabel?: string;
  /** Initial shelf novels for profile browsing (deduped by novel). */
  novels?: ReadingListShelfNovel[];
  hasMoreNovels?: boolean;
}

export interface TopReviewerPreview {
  id: string;
  displayName: string;
  username: string;
  avatarInitials: string;
  reviewCount: number;
  followerCount: number;
  /** Most common genre from recent reviews, when available. */
  highlightGenre?: string;
  /** Jaccard overlap with the viewer's favourite genres, 0-100. */
  tasteMatch?: number;
  /** Shared genre count for explainable follow suggestions. */
  sharedGenreCount?: number;
  /** Whether the current viewer already follows this reviewer. */
  viewerIsFollowing?: boolean;
}

export interface DiscoverTagPreview {
  id: string;
  name: string;
  slug: string;
  novelCount: number;
}

export interface ActivityPreview {
  id: string;
  type: string;
  message: string;
  link: string | null;
  createdAt: string;
  actorInitials: string;
}

export interface DiscoveryReview extends ReviewListItem {
  rank?: number;
}

export interface TrendingNovelPreview {
  novelId: string;
  title: string;
  author: string;
  coverUrl: string;
  primaryGenre?: string;
  averageRating: number;
  reviewCount: number;
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
  mostRecentReviewAt: string;
  communityQuote?: string;
  score: number;
  hasOfficialLink?: boolean;
}

export interface LandingGenreCover {
  novelId: string;
  title: string;
  author: string;
  coverUrl: string;
}

export interface LandingGenreDoor {
  kind: "genre" | "tag";
  slug: string;
  name: string;
  href: string;
  blurb: string;
  titleCount: number;
  reviewCount: number;
  featuredTitle?: string;
  covers: LandingGenreCover[];
}
