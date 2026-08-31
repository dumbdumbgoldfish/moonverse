import { normalizeLookupQueryText } from "@/lib/moonie/intent";

export type MoonieDiscoverySort = "hybrid" | "rating" | "recent" | "reviews";

export function resolveNovelDiscoverySort(message: string): MoonieDiscoverySort {
  const text = normalizeLookupQueryText(message).toLowerCase();
  if (
    /\b(?:highest[- ]rated|best rated|top rated|strongest rated)\b/.test(text)
  ) {
    return "rating";
  }
  if (/\b(?:most reviewed|most reviews)\b/.test(text)) {
    return "reviews";
  }
  if (/\b(?:newest|most recent|latest)\b/.test(text)) {
    return "recent";
  }
  return "hybrid";
}

export function sortHybridCandidates<T extends {
  averageRating: number | null;
  reviewCount: number;
  score: number;
  createdAt?: Date | string | null;
}>(
  candidates: T[],
  sort: MoonieDiscoverySort
): T[] {
  if (sort === "hybrid") return candidates;

  return [...candidates].sort((a, b) => {
    if (sort === "rating") {
      const ratingDiff = (b.averageRating ?? 0) - (a.averageRating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return b.reviewCount - a.reviewCount;
    }
    if (sort === "reviews") {
      const reviewDiff = b.reviewCount - a.reviewCount;
      if (reviewDiff !== 0) return reviewDiff;
      return (b.averageRating ?? 0) - (a.averageRating ?? 0);
    }
    const aTime =
      a.createdAt instanceof Date
        ? a.createdAt.getTime()
        : a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;
    const bTime =
      b.createdAt instanceof Date
        ? b.createdAt.getTime()
        : b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;
    return bTime - aTime;
  });
}
