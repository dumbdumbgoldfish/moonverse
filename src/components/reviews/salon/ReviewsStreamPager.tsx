"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { DiscoverReviewCard } from "@/components/discovery/DiscoverReviewCard";
import { cn } from "@/lib/utils";
import type { FolderListItem } from "@/types/folder";
import type { ReviewListItem } from "@/types/review";

interface ReviewsStreamPagerProps {
  reviews: ReviewListItem[];
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  highlightIndex: number;
  isLoggedIn: boolean;
  folders: FolderListItem[];
  compareReviewIds: Set<string>;
  onPrevious: () => void;
  onNext: () => void;
  onPreview: (review: ReviewListItem, index: number) => void;
  onAuthRequired: () => void;
  onToggleCompare: (review: ReviewListItem) => void;
}

export function ReviewsStreamPager({
  reviews,
  page,
  pageSize,
  total,
  loading,
  highlightIndex,
  isLoggedIn,
  folders,
  compareReviewIds,
  onPrevious,
  onNext,
  onPreview,
  onAuthRequired,
  onToggleCompare,
}: ReviewsStreamPagerProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrevious = page > 1 && !loading;
  const canNext = page < totalPages && !loading;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null
  );
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!slideDirection) return;
    const timer = window.setTimeout(() => {
      setAnimating(false);
      setSlideDirection(null);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [page, slideDirection]);

  const handlePrevious = () => {
    if (!canPrevious) return;
    setSlideDirection("left");
    setAnimating(true);
    onPrevious();
  };

  const handleNext = () => {
    if (!canNext) return;
    setSlideDirection("right");
    setAnimating(true);
    onNext();
  };

  const cardLayout = "comfortable" as const;

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "relative py-1 transition-opacity duration-200",
          loading && reviews.length > 0 && "opacity-70"
        )}
      >
        <div
          key={page}
          className={cn(
            "transition-[opacity,transform] duration-200 motion-reduce:transition-none",
            animating && slideDirection === "right" && "translate-x-1 opacity-90",
            animating && slideDirection === "left" && "-translate-x-1 opacity-90",
            !animating && "translate-x-0 opacity-100"
          )}
        >
          <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 md:gap-4">
            {reviews.map((review, index) => (
              <DiscoverReviewCard
                key={review.id}
                review={review}
                layout={cardLayout}
                className="h-full"
                highlighted={highlightIndex === index}
                priority={index === 0 && review.id !== reviews[0]?.id}
                isLoggedIn={isLoggedIn}
                folders={folders}
                comparePinned={compareReviewIds.has(review.id)}
                onPreview={() => onPreview(review, index)}
                onAuthRequired={onAuthRequired}
                onToggleCompare={onToggleCompare}
              />
            ))}
          </div>
        </div>

        {loading && reviews.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#6E46C7]" aria-hidden />
          </div>
        ) : null}
      </div>

      {total > 0 ? (
        <nav
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
          aria-label="Review pages"
        >
          <p className="text-xs tabular-nums text-[#1A1224]/50" aria-live="polite">
            {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}{" "}
            <span className="text-[#1A1224]/35">of</span>{" "}
            {total.toLocaleString()}
            <span className="mx-2 text-[#1A1224]/25">·</span>
            Page {page} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={!canPrevious}
              onClick={handlePrevious}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-full transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
                canPrevious
                  ? "bg-white text-[#1A1224] ring-1 ring-[#1A1224]/10 fine-hover:-translate-x-0.5 fine-hover:ring-[#6E46C7]/35"
                  : "cursor-not-allowed bg-white/50 text-[#1A1224]/25 ring-1 ring-[#1A1224]/5"
              )}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={!canNext}
              onClick={handleNext}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-full transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
                canNext
                  ? "bg-[#1A1224] text-white fine-hover:translate-x-0.5 fine-hover:bg-[#2a1848]"
                  : "cursor-not-allowed bg-[#1A1224]/15 text-white/50"
              )}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
