export type ReviewSort = "latest" | "trending" | "highest-rated";

export interface ReviewListItem {
  id: string;
  title: string;
  excerpt: string;
  rating: number;
  likeCount: number;
  novelId: string;
  novelTitle: string;
  novelAuthor: string;
  coverUrl: string;
  reviewerName: string;
  reviewerUsername: string;
  reviewerAvatar: string;
  genres: string[];
  createdAt: string;
}

export interface ReviewDetail extends ReviewListItem {
  userId: string;
  body: string;
  tags: string[];
  externalLink?: string;
  commentCount: number;
  shareCount: number;
  saveCount: number;
}

export interface CommentItem {
  id: string;
  reviewId: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  createdAt: string;
  parentCommentId?: string;
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
  genres: string[];
  tags: string[];
  reviewCount: number;
  averageRating: number | null;
  createdAt: string;
}
