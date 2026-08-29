import type { ReviewListItem } from "@/types/review";

export type ProfileReviewSortOrder = "newest" | "oldest";

export function sortProfileReviews(
  reviews: ReviewListItem[],
  order: ProfileReviewSortOrder
): ReviewListItem[] {
  const next = [...reviews];
  next.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return order === "newest" ? bTime - aTime : aTime - bTime;
  });
  return next;
}
