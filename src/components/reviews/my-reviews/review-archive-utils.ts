import type { ReviewListItem } from "@/types/review";

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MONTH_SHORT_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export interface ReviewMonthBucket {
  year: number;
  month: number;
  label: string;
  shortLabel: string;
  reviews: ReviewListItem[];
}

export function getReviewYears(reviews: ReviewListItem[]): number[] {
  const years = new Set<number>();
  for (const review of reviews) {
    const year = new Date(review.createdAt).getFullYear();
    if (!Number.isNaN(year)) years.add(year);
  }
  return Array.from(years).sort((a, b) => b - a);
}

export function groupReviewsByMonth(
  reviews: ReviewListItem[]
): ReviewMonthBucket[] {
  const buckets = new Map<string, ReviewListItem[]>();

  for (const review of reviews) {
    const date = new Date(review.createdAt);
    const year = date.getFullYear();
    const month = date.getMonth();
    if (Number.isNaN(year) || Number.isNaN(month)) continue;
    const key = `${year}-${month}`;
    const existing = buckets.get(key) ?? [];
    existing.push(review);
    buckets.set(key, existing);
  }

  return Array.from(buckets.entries())
    .map(([key, bucketReviews]) => {
      const [year, month] = key.split("-").map(Number);
      return {
        year,
        month,
        label: MONTH_LABELS[month] ?? "Unknown",
        shortLabel: MONTH_SHORT_LABELS[month] ?? "-",
        reviews: bucketReviews.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
}

export function filterReviewBuckets(
  buckets: ReviewMonthBucket[],
  year: number | "all",
  month: number | "all"
): ReviewMonthBucket[] {
  return buckets.filter((bucket) => {
    if (year !== "all" && bucket.year !== year) return false;
    if (month !== "all" && bucket.month !== month) return false;
    return true;
  });
}

export function getReviewCountForYear(
  buckets: ReviewMonthBucket[],
  year: number
): number {
  return buckets
    .filter((bucket) => bucket.year === year)
    .reduce((sum, bucket) => sum + bucket.reviews.length, 0);
}

export function getMonthBucketsForYear(
  buckets: ReviewMonthBucket[],
  year: number
): ReviewMonthBucket[] {
  return buckets
    .filter((bucket) => bucket.year === year)
    .sort((a, b) => b.month - a.month);
}

export function formatReviewDay(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
