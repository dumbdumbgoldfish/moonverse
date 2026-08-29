"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessagesSquare, PenLine } from "lucide-react";
import { CommunityReviewCard } from "@/components/novels/CommunityReviewCard";
import { NovelCarouselArrow } from "@/components/novels/NovelCarouselArrow";
import { ReviewSignInButton } from "@/components/reviews/detail/ReviewGuestAuthButtons";
import { DETAIL_MODULE_LABEL } from "@/lib/reviews/detail-surface";
import { MV_PRIMARY_BTN } from "@/lib/novels/salon-surface";
import { cn } from "@/lib/utils";
import type { ReviewDetail, ReviewListItem } from "@/types/review";

interface RelatedReviewsCarouselProps {
  reviews: ReviewListItem[];
  currentReview?: Pick<ReviewDetail, "rating" | "title" | "novelTitle" | "novelId">;
  novelTitle?: string;
  novelId?: string;
  isLoggedIn?: boolean;
  embedded?: boolean;
}

function useCardsPerPage() {
  const [perPage, setPerPage] = useState(1);

  useEffect(() => {
    const update = () => {
      setPerPage(window.matchMedia("(min-width: 768px)").matches ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return perPage;
}

export function RelatedReviewsCarousel({
  reviews,
  currentReview,
  novelTitle,
  novelId,
  isLoggedIn = true,
  embedded = false,
}: RelatedReviewsCarouselProps) {
  const perPage = useCardsPerPage();
  const [page, setPage] = useState(1);
  const [fading, setFading] = useState(false);
  const title = novelTitle ?? currentReview?.novelTitle ?? "this novel";
  const writeHref = novelId
    ? `/reviews/new?novelId=${novelId}`
    : currentReview
      ? `/reviews/new?novelId=${currentReview.novelId}`
      : "/reviews/new";

  const total = reviews.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, pageCount);
  const pageItems = reviews.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const rangeEnd = Math.min(currentPage * perPage, total);

  useEffect(() => {
    setPage(1);
  }, [reviews.length, perPage]);

  const goToPage = useCallback(
    (next: number) => {
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
    },
    [currentPage, pageCount],
  );

  const countLabel =
    reviews.length === 0
      ? "Add another perspective"
      : reviews.length === 1
        ? "1 more review of this title"
        : `${reviews.length} more reviews of this title`;

  return (
    <section
      aria-labelledby="other-reviews-heading"
      className={cn(!embedded && "rounded-[1.5rem] border border-[#1a1033]/8 bg-white p-5 sm:p-6")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <h2 id="other-reviews-heading" className={DETAIL_MODULE_LABEL}>
            <MessagesSquare className="size-3.5" aria-hidden />
            More reviews for this novel
          </h2>
          <p className="mt-1.5 font-heading text-xl font-semibold leading-snug text-[#1a1033] sm:text-2xl">
            Other takes on {title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#5a4d72]">{countLabel}</p>
        </div>

        {reviews.length > 0 ? (
          isLoggedIn ? (
            <Link
              href={writeHref}
              className={cn(MV_PRIMARY_BTN, "min-h-10 shrink-0 px-4 text-sm font-bold")}
            >
              <PenLine className="size-4" aria-hidden />
              Write a review
            </Link>
          ) : (
            <ReviewSignInButton
              callbackUrl={writeHref}
              className={cn(MV_PRIMARY_BTN, "min-h-10 shrink-0 px-4 text-sm font-bold")}
            >
              <PenLine className="size-4" aria-hidden />
              Write a review
            </ReviewSignInButton>
          )
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <div className="mt-4 flex max-w-md flex-col gap-3 rounded-[1.1rem] border border-dashed border-[#6E46C7]/20 bg-[#F8F1FA] px-5 py-6">
          <p className="text-sm leading-relaxed text-[#5a4d72]">
            This is currently the only community review of {title}. Write the next take so readers can compare.
          </p>
          {isLoggedIn ? (
            <Link href={writeHref} className={cn(MV_PRIMARY_BTN, "h-10 w-fit px-4 text-sm")}>
              <PenLine className="size-4" aria-hidden />
              Write a review
            </Link>
          ) : (
            <ReviewSignInButton
              callbackUrl={writeHref}
              className={cn(MV_PRIMARY_BTN, "h-10 w-fit px-4 text-sm")}
            >
              <PenLine className="size-4" aria-hidden />
              Write a review
            </ReviewSignInButton>
          )}
        </div>
      ) : (
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
                perPage === 1 ? "grid-cols-1" : "grid-cols-2",
              )}
              role="region"
              aria-label={`More reviews of ${title}`}
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
      )}
    </section>
  );
}
