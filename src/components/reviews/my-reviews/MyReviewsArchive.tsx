"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, PencilLine, Sparkles } from "lucide-react";
import { NovelCarouselArrow } from "@/components/novels/NovelCarouselArrow";
import { MyReviewArchiveCard } from "@/components/reviews/my-reviews/MyReviewArchiveCard";
import { MyReviewsArchiveNavigator } from "@/components/reviews/my-reviews/MyReviewsArchiveNavigator";
import {
  filterReviewBuckets,
  getReviewYears,
  groupReviewsByMonth,
  type ReviewMonthBucket,
} from "@/components/reviews/my-reviews/review-archive-utils";
import { WritingSectionHeader } from "@/components/reviews/write/WritingStudioChrome";
import {
  DeskPrimaryButton,
  DeskTextLink,
} from "@/components/reviews/write/WritingDeskButtons";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

function useCardsPerPage() {
  const [cardsPerPage, setCardsPerPage] = useState(3);

  useEffect(() => {
    function update() {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setCardsPerPage(3);
      } else if (window.matchMedia("(min-width: 640px)").matches) {
        setCardsPerPage(2);
      } else {
        setCardsPerPage(1);
      }
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return cardsPerPage;
}

function MonthReviewCarousel({
  bucket,
  deletingReviewId,
  onDelete,
  showYearInTitle,
}: {
  bucket: ReviewMonthBucket;
  deletingReviewId: string | null;
  onDelete: (reviewId: string) => void;
  showYearInTitle: boolean;
}) {
  const cardsPerPage = useCardsPerPage();
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(bucket.reviews.length / cardsPerPage));

  useEffect(() => {
    setPage(0);
  }, [bucket.year, bucket.month, bucket.reviews.length, cardsPerPage]);

  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * cardsPerPage;
  const visibleReviews = bucket.reviews.slice(start, start + cardsPerPage);

  const title = showYearInTitle
    ? `${bucket.label} ${bucket.year}`
    : bucket.label;

  return (
    <section
      aria-label={`${title} reviews`}
      className="rounded-xl border border-violet-100/80 bg-white/70 p-3 shadow-[0_12px_32px_-28px_rgba(76,29,149,0.35)] sm:p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg font-bold text-night-blue">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {bucket.reviews.length}{" "}
            {bucket.reviews.length === 1 ? "review" : "reviews"}
            {pageCount > 1
              ? ` · Showing ${start + 1}–${Math.min(start + cardsPerPage, bucket.reviews.length)}`
              : null}
          </p>
        </div>
        {pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <NovelCarouselArrow
              direction="prev"
              disabled={safePage === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              label={`Show previous ${title} reviews`}
            />
            <span className="min-w-[3.5rem] text-center text-xs font-semibold tabular-nums text-slate-500">
              {safePage + 1} / {pageCount}
            </span>
            <NovelCarouselArrow
              direction="next"
              disabled={safePage >= pageCount - 1}
              onClick={() =>
                setPage((current) => Math.min(pageCount - 1, current + 1))
              }
              label={`Show next ${title} reviews`}
            />
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "grid gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 sm:gap-4",
          cardsPerPage === 1 && "grid-cols-1",
          cardsPerPage === 2 && "grid-cols-1 md:grid-cols-2",
          cardsPerPage >= 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}
        key={`${bucket.year}-${bucket.month}-${safePage}-${cardsPerPage}`}
      >
        {visibleReviews.map((review) => (
          <MyReviewArchiveCard
            key={review.id}
            review={review}
            deletingReviewId={deletingReviewId}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

interface MyReviewsArchiveProps {
  reviews: ReviewListItem[];
  deletingReviewId: string | null;
  deleteError: string | null;
  onDelete: (reviewId: string) => void;
}

export function MyReviewsArchive({
  reviews,
  deletingReviewId,
  deleteError,
  onDelete,
}: MyReviewsArchiveProps) {
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");

  const years = useMemo(() => getReviewYears(reviews), [reviews]);
  const allBuckets = useMemo(() => groupReviewsByMonth(reviews), [reviews]);

  const visibleBuckets = useMemo(
    () => filterReviewBuckets(allBuckets, selectedYear, selectedMonth),
    [allBuckets, selectedYear, selectedMonth]
  );

  function handleYearChange(year: number | "all") {
    setSelectedYear(year);
    setSelectedMonth("all");
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-[28px] border border-violet-100 bg-white px-6 py-12 text-center shadow-[0_16px_40px_-36px_rgba(76,29,149,0.35)]">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f7f3ff] text-primary ring-1 ring-violet-100">
          <BookOpen className="size-6" aria-hidden />
        </span>
        <p className="mt-4 font-serif text-xl font-bold text-night-blue">
          No published reviews yet
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          When you publish, your reviews appear here in a dated archive you can
          browse by year and month.
        </p>
        <DeskPrimaryButton render={<Link href="/reviews/new" />} className="mt-5">
          <PencilLine className="size-4" aria-hidden />
          Write your first review
        </DeskPrimaryButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WritingSectionHeader
        eyebrow="Live on MoonVerse"
        title="Published reviews"
        description="Your reading log, filed by when you published. Pick a year on the shelf, then stamp a month."
        action={
          <DeskTextLink href="/reviews/new">
            <Sparkles className="size-4" aria-hidden />
            Write another
          </DeskTextLink>
        }
      />

      {deleteError ? (
        <p
          className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {deleteError}
        </p>
      ) : null}

      <MyReviewsArchiveNavigator
        years={years}
        buckets={allBuckets}
        totalReviews={reviews.length}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={handleYearChange}
        onMonthChange={setSelectedMonth}
      />

      {visibleBuckets.length === 0 ? (
        <div className="rounded-[1.35rem] border border-dashed border-violet-200 bg-white/90 px-5 py-10 text-center">
          <p className="font-serif text-lg font-bold text-night-blue">
            No reviews in this period
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Try another year or month filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleBuckets.map((bucket) => (
            <MonthReviewCarousel
              key={`${bucket.year}-${bucket.month}`}
              bucket={bucket}
              deletingReviewId={deletingReviewId}
              onDelete={onDelete}
              showYearInTitle={selectedYear === "all"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
