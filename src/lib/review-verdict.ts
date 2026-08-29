export type ReviewVerdictTone = "love" | "like" | "mixed" | "dislike" | "dnf";

export interface ReviewVerdict {
  label: string;
  tone: ReviewVerdictTone;
  shortLabel: string;
}

/** Human-readable verdict from a 1–5 star rating. */
export function reviewVerdict(rating: number): ReviewVerdict {
  if (rating >= 5) {
    return { label: "Loved it", tone: "love", shortLabel: "Love" };
  }
  if (rating >= 4) {
    return { label: "Really liked it", tone: "like", shortLabel: "Like" };
  }
  if (rating >= 3) {
    return { label: "Mixed feelings", tone: "mixed", shortLabel: "Mixed" };
  }
  if (rating >= 2) {
    return { label: "Disappointed", tone: "dislike", shortLabel: "Low" };
  }
  return { label: "Not for me", tone: "dnf", shortLabel: "DNF" };
}

export function communityDeltaCopy(
  reviewRating: number,
  communityAverage: number,
  total: number,
): string | null {
  if (total < 2) return null;
  const delta = reviewRating - communityAverage;
  if (Math.abs(delta) < 0.4) {
    return "Lines up with the community average.";
  }
  if (delta > 0) {
    return `Higher than the community average (${communityAverage.toFixed(1)}★).`;
  }
  return `More critical than the community average (${communityAverage.toFixed(1)}★).`;
}
