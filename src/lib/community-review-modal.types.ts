import type { FolderListItem } from "@/types/folder";
import type { CommentItem, ReviewDetail } from "@/types/review";
import type { ReviewerPublicStats } from "@/services/review.service";

export interface CommunityReviewModalData {
  review: ReviewDetail;
  comments: CommentItem[];
  reviewerStats: ReviewerPublicStats;
  isLoggedIn: boolean;
  isOwner: boolean;
  initialLiked: boolean;
  initialFollowing: boolean;
  folders: FolderListItem[];
  savedFolderIds: string[];
  currentUserId?: string;
  currentUserName?: string;
  currentUserImage?: string | null;
}
