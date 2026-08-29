import { ReviewsFollowRail } from "@/components/reviews/salon/ReviewsFollowRail";
import { ReviewsSalonShelf } from "@/components/reviews/salon/ReviewsSalonShelf";
import type { ReviewsSalonShelfData } from "@/components/reviews/salon/reviews-salon-shelf-data";

interface ReviewsSalonShelvesViewProps {
  data: ReviewsSalonShelfData;
}

export function ReviewsSalonShelvesView({ data }: ReviewsSalonShelvesViewProps) {
  return (
    <div className="space-y-10">
      <ReviewsSalonShelf
        key="momentum"
        id="momentum"
        title="Tonight's momentum"
        subtitle="Trending in the last 48 hours"
        iconName="trending"
        accentClass="text-[#6E46C7]"
        reviews={data.momentumReviews}
        eagerImageCount={1}
      />
      <ReviewsSalonShelf
        key="loved"
        id="loved"
        title="Verdict wall"
        subtitle="Readers who loved it"
        iconName="star"
        accentClass="text-[#C89B4A]"
        reviews={data.lovedReviews}
      />
      <ReviewsSalonShelf
        key="hidden-gems"
        id="hidden-gems"
        title="Hidden gems"
        subtitle="Underrated picks worth your time"
        iconName="gem"
        accentClass="text-teal-700"
        reviews={data.hiddenGemsReviews}
      />
      {data.genreSpotlightReviews.length > 0 && data.genreSpotlightName ? (
        <ReviewsSalonShelf
          key="genre-spotlight"
          id="genre-spotlight"
          title={`${data.genreSpotlightName} spotlight`}
          subtitle="Genre room of the week"
          iconName="sparkles"
          reviews={data.genreSpotlightReviews}
        />
      ) : null}
      <ReviewsFollowRail
        key="follow-rail"
        reviewers={data.topReviewers}
        isLoggedIn={data.isLoggedIn}
      />
    </div>
  );
}

export function ReviewsSalonShelvesSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      {[0, 1, 2].map((section) => (
        <div key={section} className="space-y-3">
          <div className="h-4 w-40 rounded bg-[#1A1224]/8" />
          <div className="h-6 w-56 rounded bg-[#1A1224]/10" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[220px] w-[148px] shrink-0 rounded-xl bg-[#1A1224]/8"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
