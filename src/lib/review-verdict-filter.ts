import { reviewVerdict, type ReviewVerdictTone } from "@/lib/review-verdict";

export type ReviewVerdictFilter = ReviewVerdictTone;

export const REVIEW_VERDICT_FILTERS: {
  value: ReviewVerdictFilter;
  label: string;
  description: string;
}[] = [
  { value: "love", label: "Loved it", description: "5★ reviews" },
  { value: "like", label: "Worth it", description: "4★ reviews" },
  { value: "mixed", label: "Mixed", description: "3★ reviews" },
  { value: "dislike", label: "Low", description: "2★ reviews" },
  { value: "dnf", label: "DNF", description: "1★ reviews" },
];

const VALID_VERDICT_FILTERS = new Set<string>(REVIEW_VERDICT_FILTERS.map((f) => f.value));

export function parseReviewVerdictFilter(
  value: string | null | undefined
): ReviewVerdictFilter | null {
  if (!value || !VALID_VERDICT_FILTERS.has(value)) return null;
  return value as ReviewVerdictFilter;
}

export function verdictFilterLabel(filter: ReviewVerdictFilter): string {
  return REVIEW_VERDICT_FILTERS.find((f) => f.value === filter)?.label ?? filter;
}

export function ratingForVerdictFilter(filter: ReviewVerdictFilter): number {
  switch (filter) {
    case "love":
      return 5;
    case "like":
      return 4;
    case "mixed":
      return 3;
    case "dislike":
      return 2;
    case "dnf":
      return 1;
  }
}

/** Rating range matching reviewVerdict() buckets. */
export function ratingRangeForVerdictFilter(
  filter: ReviewVerdictFilter
): { min: number; max: number } {
  switch (filter) {
    case "love":
      return { min: 5, max: 5 };
    case "like":
      return { min: 4, max: 4.99 };
    case "mixed":
      return { min: 3, max: 3.99 };
    case "dislike":
      return { min: 2, max: 2.99 };
    case "dnf":
      return { min: 0, max: 1.99 };
  }
}

export function reviewMatchesVerdictFilter(
  rating: number,
  filter: ReviewVerdictFilter
): boolean {
  const { min, max } = ratingRangeForVerdictFilter(filter);
  return rating >= min && rating <= max;
}

export function chipLabelForVerdict(filter: ReviewVerdictFilter): string {
  return reviewVerdict(
    filter === "love"
      ? 5
      : filter === "like"
        ? 4
        : filter === "mixed"
          ? 3
          : filter === "dislike"
            ? 2
            : 1
  ).label;
}
