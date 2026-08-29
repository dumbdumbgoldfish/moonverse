import type { ReviewListItem } from "@/types/review";

export interface FeedReasonContext {
  topGenres: { name: string; slug: string }[];
  topTag: { name: string; slug: string } | null;
  preferredGenreNames: string[];
  followingIds: Set<string>;
}

/**
 * Build a short, honest recommendation label for For You posts.
 * Uses only real taste signals: never invents fake activity.
 */
export function buildFeedReason(
  review: ReviewListItem,
  context: FeedReasonContext
): string {
  if (review.reviewerId && context.followingIds.has(review.reviewerId)) {
    return "From someone in your circle";
  }

  const preferred = new Set(
    context.preferredGenreNames.map((name) => name.toLowerCase())
  );
  const tasteGenres = new Set(
    context.topGenres.map((genre) => genre.name.toLowerCase())
  );

  for (const genre of review.genres) {
    if (preferred.has(genre.toLowerCase()) || tasteGenres.has(genre.toLowerCase())) {
      return `Because you like ${genre}`;
    }
  }

  if (context.topTag) {
    const tagName = context.topTag.name;
    const match = review.tags.find(
      (tag) => tag.toLowerCase() === tagName.toLowerCase()
    );
    if (match) {
      return `Based on your saved ${tagName} reviews`;
    }
  }

  if (context.topGenres[0]) {
    return "Similar readers liked this";
  }

  if (context.preferredGenreNames[0]) {
    return `Curated from your ${context.preferredGenreNames[0]} orbit`;
  }

  return "Matched to your reading taste";
}

export function attachFeedReasons(
  reviews: ReviewListItem[],
  context: FeedReasonContext
): ReviewListItem[] {
  return reviews.map((review) => ({
    ...review,
    feedReason: buildFeedReason(review, context),
  }));
}
