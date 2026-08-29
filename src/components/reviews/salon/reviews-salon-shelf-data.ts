import type { TopReviewerPreview } from "@/types/discovery";
import type { ReviewListItem } from "@/types/review";

export interface ReviewsSalonShelfData {
  momentumReviews: ReviewListItem[];
  lovedReviews: ReviewListItem[];
  hiddenGemsReviews: ReviewListItem[];
  genreSpotlightReviews: ReviewListItem[];
  genreSpotlightName?: string;
  genreSpotlightSlug?: string;
  topReviewers: TopReviewerPreview[];
  isLoggedIn: boolean;
}
