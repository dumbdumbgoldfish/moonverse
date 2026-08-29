"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResultType } from "@/types/search";

interface SearchInsightBarProps {
  query: string;
  totals: {
    works: number;
    reviews: number;
    people: number;
    lists: number;
  };
  interpretation: { key: string; label: string }[];
  related: string[];
  activeType: SearchResultType;
  onTypeChange: (type: SearchResultType) => void;
  onRelated: (query: string) => void;
  onQuickRating: () => void;
  hasRatingFilter: boolean;
  className?: string;
}

const TYPE_PILLS: { type: SearchResultType; label: string }[] = [
  { type: "all", label: "All" },
  { type: "works", label: "Works" },
  { type: "reviews", label: "Reviews" },
  { type: "people", label: "People" },
  { type: "lists", label: "Lists" },
];

export function SearchInsightBar({
  query,
  totals,
  interpretation,
  related,
  activeType,
  onTypeChange,
  onRelated,
  onQuickRating,
  hasRatingFilter,
  className,
}: SearchInsightBarProps) {
  const total =
    totals.works + totals.reviews + totals.people + totals.lists;

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border border-[#6E46C7]/12 bg-gradient-to-r from-[#F8F4FF] via-white to-[#FFF9F0] px-4 py-3",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E46C7]">
            <Sparkles className="size-3" aria-hidden />
            Query insight
          </p>
          <p className="mt-1 font-serif text-lg font-medium tracking-tight text-[#1A1224]">
            {query.trim() ? (
              <>
                Matches for{" "}
                <span className="text-[#6E46C7]">“{query.trim()}”</span>
              </>
            ) : (
              "Filtered catalogue"
            )}
          </p>
          {interpretation.length > 0 ? (
            <p className="mt-1 text-[12px] text-[#1A1224]/55">
              {interpretation.map((chip) => chip.label).join(" · ")}
            </p>
          ) : null}
        </div>
        <p className="shrink-0 rounded-full bg-[#0B0818] px-3 py-1 text-[11px] font-semibold tabular-nums text-[#E8C36A]">
          {total.toLocaleString()} matches
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TYPE_PILLS.map(({ type, label }) => {
          const count =
            type === "all"
              ? total
              : totals[type];
          const active = activeType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all",
                active
                  ? "bg-[#6E46C7] text-white shadow-[0_8px_20px_-12px_rgba(110,70,199,0.65)]"
                  : "bg-white/80 text-[#1A1224]/65 ring-1 ring-[#1A1224]/10 hover:ring-[#6E46C7]/30 hover:text-[#6E46C7]",
              )}
            >
              {label}
              <span
                className={cn(
                  "min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-[#F4ECF8] text-[#6E46C7]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}

        <span className="hidden h-5 w-px bg-[#1A1224]/10 sm:block" aria-hidden />

        <button
          type="button"
          onClick={onQuickRating}
          className={cn(
            "rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 transition-colors",
            hasRatingFilter
              ? "bg-amber-50 text-amber-900 ring-amber-200"
              : "bg-white/80 text-[#1A1224]/65 ring-[#1A1224]/10 hover:ring-[#6E46C7]/30",
          )}
        >
          4★+
        </button>
      </div>

      {related.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#1A1224]/45">
            Narrow:
          </span>
          {related.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onRelated(term)}
              className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#4C35C4] ring-1 ring-[#6E46C7]/15 hover:bg-[#F4ECF8]"
            >
              {term}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
