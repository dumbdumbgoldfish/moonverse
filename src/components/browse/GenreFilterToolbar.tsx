"use client";

import { Clock3, Flame, ListFilter, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

type BrowseSort = "hot" | "new";

interface GenreFilterToolbarProps {
  sort: BrowseSort;
  onSortChange: (sort: BrowseSort) => void;
  selectedTags: { name: string; slug: string }[];
  total: number;
  loading?: boolean;
  onClearFilters: () => void;
}

const SORT_OPTIONS: { value: BrowseSort; label: string; icon: typeof Flame }[] = [
  { value: "hot", label: "Hot", icon: Flame },
  { value: "new", label: "New", icon: Clock3 },
];

export function GenreFilterToolbar({
  sort,
  onSortChange,
  selectedTags,
  total,
  loading,
  onClearFilters,
}: GenreFilterToolbarProps) {
  const hasFilters = selectedTags.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-violet-100/90 bg-white p-3.5",
        "shadow-[0_4px_20px_-10px_rgba(98,70,234,0.18)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="sr-only">Sort reviews</span>
        {SORT_OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = sort === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onSortChange(value)}
              className={cn(
                "inline-flex h-11 min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                active
                  ? "mv-nav-signup border-0 text-white ring-2 ring-[#6E46C7]/20"
                  : "border border-violet-200 bg-violet-50/40 text-[#1a1033] hover:border-primary/35 hover:bg-violet-50"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </button>
          );
        })}
        {loading && (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
            aria-live="polite"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
            Updating…
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-0 sm:px-3">
        {hasFilters ? (
          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#1a1033]">
            <SlidersHorizontal className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate">
              {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""} active
            </span>
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ListFilter className="size-4 text-primary/60" aria-hidden />
            No tag filters applied
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="inline-flex items-center gap-1.5 text-sm text-[#1a1033]">
          <span className="text-lg font-extrabold tabular-nums text-primary">
            {total.toLocaleString()}
          </span>
          <span className="font-semibold">{total === 1 ? "result" : "results"}</span>
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className={cn(
              "inline-flex h-11 min-h-11 items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/50 px-3.5 text-sm font-bold text-[#1a1033]",
              "transition-colors hover:border-primary/35 hover:bg-violet-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
            aria-label="Clear all tag filters"
          >
            <X className="size-4" aria-hidden />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
