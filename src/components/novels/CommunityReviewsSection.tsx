"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MessageSquareText, PenLine } from "lucide-react";
import { CommunityReviewCard } from "@/components/novels/CommunityReviewCard";
import { NovelCarouselArrow } from "@/components/novels/NovelCarouselArrow";
import { MV_FILTER_ACTIVE, MV_PRIMARY_BTN } from "@/lib/novels/salon-surface";
import { reviewDecideScore } from "@/lib/novels/verdict";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

type ReviewSortOption = "decide" | "newest" | "highest" | "dissent";

interface CommunityReviewsSectionProps {
  novelId: string;
  reviews: ReviewListItem[];
  ratingFilter: number | null;
}

function useCardsPerPage() {
  const [perPage, setPerPage] = useState(1);

  useEffect(() => {
    const update = () => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setPerPage(2);
      } else {
        setPerPage(1);
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return perPage;
}

export function CommunityReviewsSection({
  novelId,
  reviews,
  ratingFilter,
}: CommunityReviewsSectionProps) {
  const [sort, setSort] = useState<ReviewSortOption>("decide");
  const [spoilerFree, setSpoilerFree] = useState(false);
  const [fading, setFading] = useState(false);
  const perPage = useCardsPerPage();
  const resetKey = `${ratingFilter ?? "all"}:${perPage}`;
  const [pagination, setPagination] = useState<{ key: string; page: number }>({
    key: resetKey,
    page: 1,
  });
  const page = pagination.key === resetKey ? pagination.page : 1;

  function setPage(next: number) {
    setPagination({ key: resetKey, page: next });
  }

  const filtered = useMemo(() => {
    return reviews.filter((review) => {
      if (ratingFilter && review.rating !== ratingFilter) return false;
      if (spoilerFree && review.containsSpoilers) return false;
      return true;
    });
  }, [ratingFilter, reviews, spoilerFree]);

  const sortedReviews = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "highest":
          return b.rating - a.rating || reviewDecideScore(b) - reviewDecideScore(a);
        case "dissent":
          return a.rating - b.rating || reviewDecideScore(b) - reviewDecideScore(a);
        case "decide":
        default:
          return reviewDecideScore(b) - reviewDecideScore(a);
      }
    });
  }, [filtered, sort]);

  const total = sortedReviews.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, pageCount);
  const pageItems = sortedReviews.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const rangeEnd = Math.min(currentPage * perPage, total);

  const changeSort = (next: ReviewSortOption) => {
    setSort(next);
    setPage(1);
  };

  const goToPage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), pageCount);
    if (clamped === currentPage) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setPage(clamped);
      return;
    }
    setFading(true);
    window.setTimeout(() => {
      setPage(clamped);
      setFading(false);
    }, 140);
  };

  return (
    <section
      id="edition-reviews"
      aria-labelledby="community-reviews-heading"
      className="scroll-mt-28"
    >
      <div className="flex flex-col gap-3 border-b border-[#6E46C7]/12 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#6E46C7]">
            <MessageSquareText className="size-3.5" aria-hidden />
            Reader arguments
          </p>
          <h2
            id="community-reviews-heading"
            className="mt-1 font-heading text-2xl font-bold text-[#1a1033]"
          >
            Community reviews
          </h2>
          <p className="mt-1 text-sm text-[#4a4458]">
            {ratingFilter
              ? `${filtered.length} ${filtered.length === 1 ? "review" : "reviews"} rated ${ratingFilter}`
              : `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"} from MoonVerse readers, organised to browse.`}
          </p>
        </div>
        <Link
          href={`/reviews/new?novelId=${novelId}`}
          className={cn(MV_PRIMARY_BTN, "min-h-10 px-4 text-sm font-bold")}
        >
          <PenLine className="size-4" aria-hidden />
          Write a review
        </Link>
      </div>

      {reviews.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["decide", "Most useful"],
              ["newest", "Newest"],
              ["highest", "Highest"],
              ["dissent", "Dissent"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeSort(value)}
              className={cn(
                "min-h-9 rounded-full px-2.5 text-xs font-semibold ring-1",
                sort === value
                  ? MV_FILTER_ACTIVE
                  : "bg-white text-[#4a4458] ring-[#6E46C7]/15 hover:bg-[#F4ECF8] hover:ring-[#6E46C7]/40"
              )}
              aria-pressed={sort === value}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSpoilerFree((current) => !current);
              setPage(1);
            }}
            className={cn(
              "min-h-9 rounded-full px-2.5 text-xs font-semibold ring-1",
              spoilerFree
                ? "bg-[#F4ECF8] text-[#4C35C4] ring-[#6E46C7]/40"
                : "bg-white text-[#4a4458] ring-[#6E46C7]/15 hover:bg-[#F4ECF8] hover:ring-[#6E46C7]/40"
            )}
            aria-pressed={spoilerFree}
          >
            Spoiler-free
          </button>
        </div>
      ) : null}

      {sortedReviews.length > 0 ? (
        <div className="mt-4">
          <div className="flex items-stretch gap-2">
            <NovelCarouselArrow
              direction="prev"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
              label="Show previous reviews"
            />

            <div
              className={cn(
                "grid min-w-0 flex-1 gap-3 transition-opacity duration-150",
                fading && "opacity-0",
                perPage === 1 ? "grid-cols-1" : "grid-cols-2"
              )}
              role="region"
              aria-label="Community review gallery"
              aria-live="polite"
            >
              {pageItems.map((review) => (
                <div key={review.id} className="min-w-0">
                  <CommunityReviewCard review={review} />
                </div>
              ))}
            </div>

            <NovelCarouselArrow
              direction="next"
              disabled={currentPage >= pageCount}
              onClick={() => goToPage(currentPage + 1)}
              label="Show next reviews"
            />
          </div>

          <p
            className="mt-3 text-center text-sm tabular-nums text-[#4a4458]"
            aria-live="polite"
          >
            <span className="font-semibold text-[#1a1033]">
              {rangeStart}–{rangeEnd}
            </span>{" "}
            of {total} {total === 1 ? "review" : "reviews"}
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-[20px] border border-dashed border-[#6E46C7]/25 bg-white px-5 py-8 text-center">
          <p className="font-heading text-xl font-bold text-[#1a1033]">
            {reviews.length === 0 ? "No reviews yet" : "No reviews match those filters"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#4a4458]">
            {reviews.length === 0
              ? "Be the first finished reader to share a thoughtful take on this novel."
              : "Clear the star filter or spoiler-free toggle to see more arguments."}
          </p>
          <Link
            href={`/reviews/new?novelId=${novelId}`}
            className={cn(MV_PRIMARY_BTN, "mt-4 min-h-10 px-5 text-sm font-bold")}
          >
            Write a review
          </Link>
        </div>
      )}
    </section>
  );
}
