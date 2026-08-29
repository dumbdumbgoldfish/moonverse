"use client";

import Link from "next/link";
import { Columns2, Trash2, X } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";
import { trackReviewsEvent } from "@/lib/reviews-analytics";

interface ReviewsCompareTrayProps {
  reviews: ReviewListItem[];
  onRemove: (reviewId: string) => void;
  onClear: () => void;
  className?: string;
}

export function ReviewsCompareTray({
  reviews,
  onRemove,
  onClear,
  className,
}: ReviewsCompareTrayProps) {
  if (reviews.length === 0) return null;

  const compareHref =
    reviews.length >= 2
      ? `/reviews/${reviews[0]!.id}?compare=${reviews
          .slice(1)
          .map((review) => review.id)
          .join(",")}`
      : undefined;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[#1A1224]/10 bg-[#FBF7F1]/95 shadow-[0_-16px_40px_-28px_rgba(26,18,36,0.45)] backdrop-blur-sm",
        "safe-bottom-pad",
        className
      )}
      role="region"
      aria-label="Compare reviews tray"
    >
      <div className={cn(SITE_SHELL_CLASS, "flex flex-wrap items-center gap-3 py-3")}>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E46C7]">
          Compare {reviews.length}/3
        </p>
        <ul className="flex flex-1 flex-wrap items-center gap-2">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="inline-flex items-center gap-2 rounded-full border border-[#1A1224]/10 bg-white py-1 pl-1 pr-2"
            >
              <span className="relative size-7 overflow-hidden rounded-full bg-[#1A1224]/5">
                <CoverImage
                  src={review.coverUrl}
                  alt=""
                  title={review.novelTitle}
                  sizes="28px"
                  compactFallback
                />
              </span>
              <Link
                href={`/reviews/${review.id}`}
                className="max-w-[8rem] truncate text-xs font-semibold text-[#1A1224] hover:text-[#6E46C7]"
              >
                {review.novelTitle}
              </Link>
              <button
                type="button"
                aria-label={`Remove ${review.novelTitle} from compare`}
                onClick={() => onRemove(review.id)}
                className="rounded-full p-0.5 text-[#1A1224]/40 hover:bg-[#6E46C7]/10 hover:text-[#1A1224]"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[#1A1224]/12 px-3 text-xs font-bold text-[#1A1224]/70 hover:bg-white"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Clear
          </button>
          {compareHref ? (
            <Link
              href={compareHref}
              onClick={() => trackReviewsEvent("compare_open", { count: reviews.length })}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#1A1224] px-3 text-xs font-bold text-white hover:bg-[#2a1848]"
            >
              <Columns2 className="size-3.5" aria-hidden />
              Open compare
            </Link>
          ) : (
            <span className="inline-flex min-h-9 items-center rounded-full bg-[#1A1224]/20 px-3 text-xs font-bold text-white/70">
              Add one more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
