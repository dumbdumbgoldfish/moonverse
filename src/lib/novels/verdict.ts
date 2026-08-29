export type ScoreConfidence = "empty" | "low" | "building" | "stable";

export function scoreConfidence(reviewCount: number): ScoreConfidence {
  if (reviewCount <= 0) return "empty";
  if (reviewCount < 3) return "low";
  if (reviewCount < 8) return "building";
  return "stable";
}

export function scoreHonestyLabel(reviewCount: number): string {
  switch (scoreConfidence(reviewCount)) {
    case "empty":
      return "No community score yet";
    case "low":
      return reviewCount === 1
        ? "Early signal from 1 review"
        : `Early signal from ${reviewCount} reviews`;
    case "building":
      return `Building from ${reviewCount} reviews`;
    default:
      return `From ${reviewCount} reviews`;
  }
}

export function reviewDecideScore(review: {
  likeCount: number;
  commentCount: number;
  saveCount: number;
  containsSpoilers: boolean;
  createdAt: string;
}): number {
  const ageDays = Math.max(
    0,
    (Date.now() - new Date(review.createdAt).getTime()) / 86_400_000
  );
  const recency = Math.max(0, 12 - ageDays / 14);
  return (
    review.likeCount * 3 +
    review.commentCount * 2 +
    review.saveCount +
    recency -
    (review.containsSpoilers ? 1.5 : 0)
  );
}
