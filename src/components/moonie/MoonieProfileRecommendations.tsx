"use client";

import { MoonieEmptyState } from "@/components/moonie/MoonieEmptyState";
import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { ProfileReviewCard } from "@/components/users/ProfileReviewCard";
import { ProfileSectionCarousel } from "@/components/users/ProfileSectionCarousel";
import { profileSectionByLabel } from "@/components/users/profile-carousel-layout";
import { formatCompactCount } from "@/lib/format-utils";
import type { ReviewListItem } from "@/types/review";

interface MoonieProfileRecommendationsProps {
  reviews: ReviewListItem[];
  displayName: string;
  isOwnProfile: boolean;
}

export function MoonieProfileRecommendations({
  reviews,
  displayName,
  isOwnProfile,
}: MoonieProfileRecommendationsProps) {
  if (reviews.length === 0) {
    return (
      <MoonieEmptyState
        variant="thinking"
        title="Moonie couldn't find picks yet"
        description={
          isOwnProfile
            ? "Review, save, or list stories you love and Moonie will tailor picks here."
            : "This reader hasn't built enough taste signals for recommendations yet."
        }
        action={
          isOwnProfile ? (
            <AskMoonieButton size="sm" prompt="Recommend novels for me" />
          ) : undefined
        }
      />
    );
  }

  const subject = profileSectionByLabel(displayName, isOwnProfile);

  return (
    <ProfileSectionCarousel
      title={`${formatCompactCount(reviews.length)} Recommendation${
        reviews.length === 1 ? "" : "s"
      } for ${subject}`}
      ariaLabel={
        isOwnProfile ? "Recommended for you" : `Recommendations for ${displayName}`
      }
      items={reviews}
      getItemKey={(review) => review.id}
      renderItem={(review) => <ProfileReviewCard review={review} />}
      previousLabel="Show previous recommendations"
      nextLabel="Show next recommendations"
    />
  );
}
