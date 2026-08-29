"use client";

import Link from "next/link";
import { CoverImage } from "@/components/ui/CoverImage";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";
import { ReviewVerdictBadge } from "./ReviewVerdictBadge";

interface ReviewsSalonShelfCardProps {
  review: ReviewListItem;
  priority?: boolean;
  className?: string;
}

export function ReviewsSalonShelfCard({
  review,
  priority = false,
  className,
}: ReviewsSalonShelfCardProps) {
  return (
    <article
      className={cn(
        "group relative w-[148px] shrink-0 snap-start touch-manipulation sm:w-[168px]",
        className
      )}
    >
      <Link
        href={`/reviews/${review.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7F1]"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#1A1224]/5 ring-1 ring-[#1A1224]/8 shadow-[0_12px_32px_-24px_rgba(26,18,36,0.45)] transition-all duration-200 fine-group-hover:-translate-y-1 fine-group-hover:shadow-[0_20px_40px_-24px_rgba(26,18,36,0.5)] motion-reduce:transition-none motion-reduce:fine-group-hover:translate-y-0">
          <CoverImage
            src={review.coverUrl}
            alt=""
            title={review.novelTitle}
            author={review.novelAuthor}
            genres={review.genres}
            rating={review.rating}
            reviewCount={review.novelReviewCount}
            themeSeed={`${review.novelId}|${review.novelTitle}`}
            sizes="168px"
            priority={priority}
            compactFallback
            className="object-cover transition-transform duration-300 fine-group-hover:scale-[1.04] motion-reduce:fine-group-hover:scale-100"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-[#1A1224]/90 via-[#1A1224]/50 to-transparent p-3 pt-10">
            <p className="line-clamp-2 font-serif text-sm leading-snug text-white">
              {review.novelTitle}
            </p>
          </div>
          <div className="absolute right-2 top-2 z-[2]">
            <ReviewVerdictBadge rating={review.rating} />
          </div>
        </div>
      </Link>

      <div className="mt-2.5 space-y-1 px-0.5">
        {review.feedReason ? (
          <p className="line-clamp-1 text-[11px] font-medium text-[#6E46C7]">
            {review.feedReason}
          </p>
        ) : null}
        <p className="line-clamp-1 text-[11px] text-[#1A1224]/55">
          <Link
            href={`/users/${review.reviewerUsername}`}
            className="fine-hover:text-[#6E46C7]"
            onClick={(event) => event.stopPropagation()}
          >
            {review.reviewerName}
          </Link>
        </p>
      </div>
    </article>
  );
}
