import { BrowseReviewCard } from "@/components/browse/BrowseReviewCard";
import type { ReviewListItem } from "@/types/review";

interface ProfileReviewCardProps {
  review: ReviewListItem;
  className?: string;
  priority?: boolean;
}

export function ProfileReviewCard({
  review,
  className,
  priority = false,
}: ProfileReviewCardProps) {
  return (
    <BrowseReviewCard
      review={review}
      priority={priority}
      density="carousel"
      className={className}
    />
  );
}
