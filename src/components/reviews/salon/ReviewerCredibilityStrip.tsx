import Link from "next/link";
import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

interface ReviewerCredibilityStripProps {
  review: ReviewListItem;
  className?: string;
}

export function ReviewerCredibilityStrip({
  review,
  className,
}: ReviewerCredibilityStripProps) {
  const count = review.reviewerReviewCount;
  if (!count || count <= 0) return null;

  const parts = [
    `${count} ${count === 1 ? "review" : "reviews"}`,
    review.reviewerAverageRating != null
      ? `avg ${review.reviewerAverageRating.toFixed(1)}★`
      : null,
    review.reviewerTopGenre ? `mostly ${review.reviewerTopGenre}` : null,
  ].filter(Boolean);

  return (
    <p
      className={cn(
        "inline-flex max-w-full items-center gap-1 truncate rounded-full border border-[#1A1224]/8 bg-[#faf8ff]/80 px-2.5 py-1 text-[10px] font-semibold text-[#4c3d6e]",
        className
      )}
    >
      <PenLine className="size-3 shrink-0 text-[#6E46C7]" aria-hidden />
      <Link
        href={`/users/${review.reviewerUsername}`}
        className="truncate fine-hover:text-[#6E46C7]"
      >
        {review.reviewerName}
      </Link>
      <span className="text-[#1A1224]/35">·</span>
      <span className="truncate">{parts.join(" · ")}</span>
    </p>
  );
}
