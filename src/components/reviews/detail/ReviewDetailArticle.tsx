import { ReviewBylineStrip } from "@/components/reviews/detail/ReviewBylineStrip";
import { ReviewDetailBodyPanel } from "@/components/reviews/detail/ReviewDetailBodyPanel";
import { ReviewDiscussionHost } from "@/components/reviews/ReviewDiscussionHost";
import { ReviewOwnerActions } from "@/components/reviews/detail/ReviewOwnerActions";
import { ReviewVerdictChip } from "@/components/reviews/detail/ReviewVerdictChip";
import { cn } from "@/lib/utils";
import type { FolderListItem } from "@/types/folder";
import type { ReviewerPublicStats } from "@/services/review.service";
import type { CommentItem, ReviewDetail } from "@/types/review";

interface ReviewDetailArticleProps {
  review: ReviewDetail;
  comments: CommentItem[];
  reviewerStats: ReviewerPublicStats;
  isOwner: boolean;
  isLoggedIn?: boolean;
  initialLiked: boolean;
  initialFollowing?: boolean;
  folders: FolderListItem[];
  savedFolderIds: string[];
  currentUserId?: string;
  currentUserName?: string;
  currentUserImage?: string | null;
  className?: string;
}

export function ReviewDetailArticle({
  review,
  comments,
  reviewerStats,
  isOwner,
  isLoggedIn = true,
  initialLiked,
  initialFollowing = false,
  folders,
  savedFolderIds,
  currentUserId,
  currentUserName,
  currentUserImage,
  className,
}: ReviewDetailArticleProps) {
  return (
    <article id="review-article" className={cn(className)}>
      <header className="flex shrink-0 flex-col gap-3 border-b border-[#1a1033]/6 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-start lg:justify-between">
        <ReviewBylineStrip
          reviewerName={review.reviewerName}
          reviewerUsername={review.reviewerUsername}
          reviewerAvatar={review.reviewerAvatar}
          reviewerAvatarUrl={review.reviewerAvatarUrl}
          reviewerId={review.userId}
          createdAt={review.createdAt}
          body={review.body}
          reviewerStats={reviewerStats}
          isOwner={isOwner}
          isLoggedIn={isLoggedIn}
          initialFollowing={initialFollowing}
        />
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ReviewVerdictChip rating={review.rating} size="md" />
          {isOwner ? <ReviewOwnerActions reviewId={review.id} /> : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 px-4 py-4 sm:px-6">
        <ReviewDetailBodyPanel
          body={review.body}
          containsSpoilers={review.containsSpoilers}
          isLoggedIn={isLoggedIn}
        />
      </div>

      <div className="mt-auto shrink-0 border-t border-[#1a1033]/6 px-4 py-3 sm:px-6">
        <ReviewDiscussionHost
          review={review}
          comments={comments}
          isLoggedIn={isLoggedIn}
          isOwner={isOwner}
          initialLiked={initialLiked}
          folders={folders}
          savedFolderIds={savedFolderIds}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserImage={currentUserImage}
        />
      </div>
    </article>
  );
}
