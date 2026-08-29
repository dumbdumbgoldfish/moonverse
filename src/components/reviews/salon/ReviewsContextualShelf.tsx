"use client";

import { ReviewsSalonShelf } from "@/components/reviews/salon/ReviewsSalonShelf";
import { genreLabel } from "@/lib/genres";
import type { ReviewListItem } from "@/types/review";

interface ReviewsContextualShelfProps {
  genreSlug: string | null;
  tagSlugs: string[];
  reviews: ReviewListItem[];
}

export function ReviewsContextualShelf({
  genreSlug,
  tagSlugs,
  reviews,
}: ReviewsContextualShelfProps) {
  if (reviews.length === 0) return null;

  const genreName = genreSlug ? genreLabel(genreSlug) : null;
  const isCatchAllGenre =
    genreSlug === "other" || genreName?.toLowerCase() === "other";

  const title = genreName
    ? isCatchAllGenre
      ? "More from this shelf"
      : `More in ${genreName}`
    : tagSlugs.length > 0
      ? "More like this shelf"
      : "More from this browse";

  const subtitle = genreName
    ? isCatchAllGenre
      ? "Keep exploring nearby picks"
      : `More ${genreName} reviews you may like`
    : tagSlugs.length > 0
      ? "Keep exploring nearby picks"
      : "Keep exploring nearby picks";

  return (
    <ReviewsSalonShelf
      id="contextual"
      title={title}
      subtitle={subtitle}
      iconName="sparkles"
      accentClass="text-[#6E46C7]"
      reviews={reviews}
      className="border-y border-[#1A1224]/8 py-8"
    />
  );
}

export function ReviewsContextualShelfSkeleton() {
  return (
    <div
      className="animate-pulse border-y border-[#1A1224]/8 py-8"
      aria-busy="true"
      aria-label="Loading nearby picks"
    >
      <div className="mb-3 space-y-2">
        <div className="h-3 w-44 rounded bg-[#1A1224]/8" />
        <div className="h-7 w-56 rounded bg-[#1A1224]/10" />
      </div>
      <div className="flex gap-3.5 overflow-hidden md:px-10">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-[220px] w-[148px] shrink-0 rounded-xl bg-[#1A1224]/8 sm:w-[168px]"
          />
        ))}
      </div>
    </div>
  );
}
