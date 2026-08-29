import type { ReviewListItem, ReviewSort } from "@/types/review";

export function primarySocialSignal(review: ReviewListItem): {
  kind: "saves" | "likes";
  count: number;
  label: "saves" | "likes";
} {
  if (review.saveCount >= review.likeCount) {
    return { kind: "saves", count: review.saveCount, label: "saves" };
  }
  return { kind: "likes", count: review.likeCount, label: "likes" };
}

/** Short, honest ranking copy for Discover cards (~six words). */
export function buildDiscoverReason(
  review: ReviewListItem,
  sort: ReviewSort
): string {
  switch (sort) {
    case "for-you":
      if (review.feedReason) return review.feedReason;
      if (review.genres[0]) return `Because you like ${review.genres[0]}`;
      return "Matched to your taste";
    case "following":
      return "From someone you follow";
    case "from-saves":
      return "Because you saved similar";
    case "hidden-gems":
      return "Quietly loved";
    case "latest":
      return "Just reviewed";
    case "highest-rated":
      return "Highly rated";
    case "most-discussed":
      return "Readers are talking";
    case "most-saved":
      return "Often saved";
    case "most-shared":
      return "Widely shared";
    case "trending":
    default:
      if (review.likeCount >= 20) return "Loved this week";
      if (review.genres[0]) return `Rising in ${review.genres[0]}`;
      return "Trending now";
  }
}

export function attachDiscoverReasons(
  reviews: ReviewListItem[],
  sort: ReviewSort
): ReviewListItem[] {
  return reviews.map((review) => ({
    ...review,
    feedReason: review.feedReason ?? buildDiscoverReason(review, sort),
  }));
}
