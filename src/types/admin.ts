import type {
  ContentModerationStatus,
  NotificationType,
  UserRole,
} from "@prisma/client";
import type { TagKind } from "@prisma/client";

export interface AdminDashboardStats {
  users: number;
  reviews: number;
  novels: number;
  comments: number;
  likes: number;
  folders: number;
}

export interface AdminDashboardAttention {
  openReports: number;
  pendingReadingLinks: number;
  pendingTagSuggestions: number;
  autoFlaggedReviews: number;
  autoFlaggedComments: number;
}

export interface AdminReviewSummary {
  id: string;
  title: string;
  rating: number;
  novelTitle: string;
  reviewerUsername: string;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  moderationStatus: ContentModerationStatus;
  createdAt: string;
}

export interface AdminListPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  isSuspended: boolean;
  reviewCount: number;
  followerCount: number;
  createdAt: string;
}

export interface AdminCommentSummary {
  id: string;
  body: string;
  reviewId: string;
  reviewTitle: string;
  authorUsername: string;
  authorDisplayName: string;
  parentCommentId: string | null;
  moderationStatus: ContentModerationStatus;
  createdAt: string;
}

export interface AdminNovelSummary {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  externalLink: string | null;
  reviewCount: number;
  genreNames: string[];
  tagNames: string[];
  genreIds: string[];
  tagIds: string[];
  createdAt: string;
}

export interface AdminGenreSummary {
  id: string;
  name: string;
  slug: string;
  novelCount: number;
}

export interface AdminTagSummary {
  id: string;
  name: string;
  slug: string;
  kind: TagKind;
  novelCount: number;
}

export interface AdminNotificationSummary {
  id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  isRead: boolean;
  recipientUsername: string;
  createdAt: string;
}
