"use client";

import { useMemo, useState } from "react";
import { ProfileReviewCard } from "@/components/users/ProfileReviewCard";
import { sortProfileReviews } from "@/components/users/profile-reviews-sort";
import type { ProfileReviewSortOrder } from "@/components/users/profile-reviews-sort";
import {
  ProfileSectionCarousel,
  ProfileSectionSortToggle,
} from "@/components/users/ProfileSectionCarousel";
import { profileSectionByLabel } from "@/components/users/profile-carousel-layout";
import { formatCompactCount } from "@/lib/format-utils";
import type { ReviewListItem } from "@/types/review";

export type { ProfileReviewSortOrder };

interface ProfileReviewsCarouselProps {
  reviews: ReviewListItem[];
  displayName: string;
  isOwnProfile: boolean;
}

export function ProfileReviewsCarousel({
  reviews,
  displayName,
  isOwnProfile,
}: ProfileReviewsCarouselProps) {
  const [sortOrder, setSortOrder] = useState<ProfileReviewSortOrder>("newest");

  const sortedReviews = useMemo(
    () => sortProfileReviews(reviews, sortOrder),
    [reviews, sortOrder]
  );

  return (
    <ProfileSectionCarousel
      title={`${formatCompactCount(sortedReviews.length)} Review${
        sortedReviews.length === 1 ? "" : "s"
      } by ${profileSectionByLabel(displayName, isOwnProfile)}`}
      ariaLabel={`Reviews by ${displayName}`}
      items={sortedReviews}
      getItemKey={(review) => review.id}
      renderItem={(review) => <ProfileReviewCard review={review} />}
      sortControl={
        <ProfileSectionSortToggle
          value={sortOrder}
          onChange={setSortOrder}
          label="Sort reviews"
        />
      }
      previousLabel="Show previous reviews"
      nextLabel="Show next reviews"
    />
  );
}
