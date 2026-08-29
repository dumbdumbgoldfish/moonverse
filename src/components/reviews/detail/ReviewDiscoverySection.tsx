import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { MoonieNovelRecommendations } from "@/components/novels/MoonieNovelRecommendations";
import { RelatedReviewsCarousel } from "@/components/reviews/detail/RelatedReviewsCarousel";
import { ReviewMoonieAskButton } from "@/components/reviews/detail/ReviewMoonieAskButton";
import { ReviewGuestAuthButtons } from "@/components/reviews/detail/ReviewGuestAuthButtons";
import type { NovelRecommendation, ReviewDetail, ReviewListItem } from "@/types/review";

interface ReviewDiscoverySectionProps {
  otherReviews: ReviewListItem[];
  currentReview: ReviewDetail;
  recommendations: NovelRecommendation[];
  isLoggedIn: boolean;
}

export function ReviewDiscoverySection({
  otherReviews,
  currentReview,
  recommendations,
  isLoggedIn,
}: ReviewDiscoverySectionProps) {
  const hasMoonie = recommendations.length > 0;

  return (
    <div className="space-y-6" aria-label="Related reading">
      <RelatedReviewsCarousel
        reviews={otherReviews}
        currentReview={currentReview}
        novelTitle={currentReview.novelTitle}
        novelId={currentReview.novelId}
        isLoggedIn={isLoggedIn}
        embedded
      />

      {hasMoonie ? (
        <MoonieNovelRecommendations
          recommendations={recommendations}
          title={currentReview.novelTitle}
        />
      ) : (
        <section className="flex flex-col gap-4 rounded-[20px] border border-[#1a1033]/8 bg-[linear-gradient(180deg,#FFFBFF_0%,#F8F1FA_100%)] p-5 sm:flex-row sm:items-center sm:p-6">
          <MoonieMascot variant="waving" size={56} display="clean" lightweight />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C89B4A]">
              Moonie AI Assistant
            </p>
            <h2 className="mt-1.5 font-heading text-xl font-semibold text-[#1a1033]">
              Discover similar novels
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[#5a4d72]">
              Sign in to unlock personalised recommendations, save favourites, and ask Moonie for smarter suggestions based on this title.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ReviewMoonieAskButton
                novelTitle={currentReview.novelTitle}
                tags={currentReview.tags}
                isLoggedIn={isLoggedIn}
                variant="compact"
                label="Ask Moonie"
              />
              {!isLoggedIn ? (
                <ReviewGuestAuthButtons
                  callbackUrl={`/reviews/${currentReview.id}`}
                />
              ) : null}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
