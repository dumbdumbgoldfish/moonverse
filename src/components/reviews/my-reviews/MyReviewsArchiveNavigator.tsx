"use client";

import { CalendarDays } from "lucide-react";
import {
  getMonthBucketsForYear,
  getReviewCountForYear,
  MONTH_SHORT_LABELS,
  type ReviewMonthBucket,
} from "@/components/reviews/my-reviews/review-archive-utils";
import { cn } from "@/lib/utils";

interface MyReviewsArchiveNavigatorProps {
  years: number[];
  buckets: ReviewMonthBucket[];
  totalReviews: number;
  selectedYear: number | "all";
  selectedMonth: number | "all";
  onYearChange: (year: number | "all") => void;
  onMonthChange: (month: number | "all") => void;
}

export function MyReviewsArchiveNavigator({
  years,
  buckets,
  totalReviews,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
}: MyReviewsArchiveNavigatorProps) {
  const monthBuckets =
    selectedYear === "all" ? [] : getMonthBucketsForYear(buckets, selectedYear);
  const selectedYearCount =
    selectedYear === "all"
      ? totalReviews
      : getReviewCountForYear(buckets, selectedYear);

  const periodLabel =
    selectedYear === "all"
      ? "Full archive"
      : selectedMonth === "all"
        ? `${selectedYear}`
        : `${MONTH_SHORT_LABELS[selectedMonth]} ${selectedYear}`;

  return (
    <section
      aria-label="Archive navigation"
      className="overflow-hidden rounded-2xl border border-violet-100/90 bg-[linear-gradient(180deg,#fffdfa_0%,#ffffff_42%,#faf8ff_100%)] shadow-[0_16px_40px_-34px_rgba(76,29,149,0.45)]"
    >
      <div className="border-b border-violet-100/80 bg-white/70 px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f3ff] text-primary ring-1 ring-violet-100">
              <CalendarDays className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--mv-plum)]">
                Reading log index
              </p>
              <h3 className="font-serif text-lg font-bold text-night-blue sm:text-xl">
                {periodLabel}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                {selectedYearCount}{" "}
                {selectedYearCount === 1 ? "entry" : "entries"}
                {selectedYear !== "all" ? " in this period" : " on MoonVerse"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            On the shelf
          </p>
          <div className="flex flex-wrap items-end gap-1 border-b border-violet-100/90 pb-1">
            <YearSpine
              active={selectedYear === "all"}
              label="All"
              count={totalReviews}
              onClick={() => onYearChange("all")}
            />
            {years.map((year) => (
              <YearSpine
                key={year}
                active={selectedYear === year}
                label={String(year)}
                count={getReviewCountForYear(buckets, year)}
                onClick={() => onYearChange(year)}
              />
            ))}
          </div>
        </div>

        {selectedYear !== "all" ? (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Month stamps
            </p>
            <div className="flex flex-wrap gap-2">
              <MonthStamp
                active={selectedMonth === "all"}
                label="Whole year"
                count={selectedYearCount}
                onClick={() => onMonthChange("all")}
              />
              {monthBuckets.map((bucket) => (
                <MonthStamp
                  key={bucket.month}
                  active={selectedMonth === bucket.month}
                  label={bucket.shortLabel}
                  count={bucket.reviews.length}
                  onClick={() => onMonthChange(bucket.month)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function YearSpine({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative min-w-[4.5rem] px-3 pb-2 pt-1 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]/35 focus-visible:ring-offset-2"
      )}
    >
      <span
        className={cn(
          "block font-serif text-2xl font-bold leading-none transition",
          active ? "text-night-blue" : "text-slate-400 group-hover:text-slate-600"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "mt-1 block text-[11px] font-semibold tabular-nums",
          active ? "text-[var(--mv-plum)]" : "text-slate-400"
        )}
      >
        {count}
      </span>
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-2 bottom-0 h-0.5 rounded-full transition",
          active
            ? "bg-gradient-to-r from-[var(--mv-gold)] via-[var(--mv-plum)] to-[var(--mv-violet)]"
            : "bg-transparent group-hover:bg-violet-100"
        )}
      />
    </button>
  );
}

function MonthStamp({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-w-[4.75rem] flex-col items-center rounded-xl border px-3 py-2.5 text-center transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]/35",
        active
          ? "border-[var(--mv-plum)]/25 bg-[#f7f3ff] text-night-blue shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
          : "border-violet-100/90 bg-white text-slate-600 hover:border-[var(--mv-plum)]/15 hover:bg-[#fffcff]"
      )}
    >
      <span
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.14em]",
          active ? "text-[var(--mv-plum)]" : "text-slate-500"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "mt-1 font-serif text-lg font-bold tabular-nums leading-none",
          active ? "text-night-blue" : "text-slate-700"
        )}
      >
        {count}
      </span>
    </button>
  );
}
