import { ReviewBreadcrumbs } from "@/components/reviews/detail/ReviewBreadcrumbs";
import { ReviewDetailArticle } from "@/components/reviews/detail/ReviewDetailArticle";
import { ReviewRelatedInfoAside } from "@/components/reviews/detail/ReviewRelatedInfoAside";
import { ReviewDiscoverySection } from "@/components/reviews/detail/ReviewDiscoverySection";
import { ReviewEditionHero } from "@/components/reviews/detail/ReviewEditionHero";
import { ReviewReadingProgress } from "@/components/reviews/detail/ReviewReadingProgress";
import { DETAIL_STAGE } from "@/lib/reviews/detail-surface";
import { LITERARY_PAGE_BG } from "@/lib/literary-salon";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import type { FolderListItem } from "@/types/folder";
import type { ReadingLinkItem } from "@/types/reading-link";
import type {
  CommentItem,
  NovelRecommendation,
  ReviewDetail,
  ReviewListItem,
} from "@/types/review";
import type {
  NovelReviewStats,
  ReviewerPublicStats,
} from "@/services/review.service";

interface ReviewDetailViewProps {
  review: ReviewDetail;
  comments: CommentItem[];
  stats: NovelReviewStats;
  readingLinks: ReadingLinkItem[];
  relatedReviews: ReviewListItem[];
  recommendations: NovelRecommendation[];
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

export function ReviewDetailView({
  review,
  comments,
  stats,
  readingLinks,
  relatedReviews,
  recommendations,
  reviewerStats,
  isLoggedIn,
  isOwner,
  initialLiked,
  initialFollowing,
  folders,
  savedFolderIds,
  currentUserId,
  currentUserName,
  currentUserImage,
}: ReviewDetailViewProps) {
  const primaryGenre = review.genres[0];
  const otherReviews = relatedReviews.filter((item) => item.id !== review.id);

  return (
    <div className={cn("safe-bottom-pad text-[#1a1033]", LITERARY_PAGE_BG)}>
      <ReviewReadingProgress targetId="review-article" />

      <div className={cn(SITE_SHELL_CLASS, "space-y-4 py-5 sm:space-y-5 sm:py-6")}>
        <ReviewBreadcrumbs
          novelTitle={review.novelTitle}
          novelId={review.novelId}
          primaryGenre={primaryGenre}
          reviewTitle={review.title}
        />

        <ReviewEditionHero review={review} stats={stats} isLoggedIn={isLoggedIn} />

        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
            <div className={cn(DETAIL_STAGE, "flex min-h-0 flex-col")}>
              <ReviewDetailArticle
                review={review}
                comments={comments}
                reviewerStats={reviewerStats}
                isOwner={isOwner}
                isLoggedIn={isLoggedIn}
                initialLiked={initialLiked}
                initialFollowing={initialFollowing}
                folders={folders}
                savedFolderIds={savedFolderIds}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                currentUserImage={currentUserImage}
                className="flex min-h-0 flex-1 flex-col"
              />
            </div>

            <div className="flex min-h-0 flex-col">
              <ReviewRelatedInfoAside
                review={review}
                stats={stats}
                readingLinks={readingLinks}
                className="lg:h-full"
              />
            </div>
          </div>

          <ReviewDiscoverySection
            otherReviews={otherReviews}
            currentReview={review}
            recommendations={recommendations}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>
    </div>
  );
}
