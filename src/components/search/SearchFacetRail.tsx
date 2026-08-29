"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { WEB_NOVEL_GENRES } from "@/lib/genres";
import { WEB_NOVEL_TAGS } from "@/lib/tags";
import { facetLabel, searchSortLabel } from "@/lib/search";
import { cn } from "@/lib/utils";
import type { SearchSort } from "@/types/search";

const SORTS: SearchSort[] = [
  "relevance",
  "most-reviewed",
  "highest-rated",
  "recent",
];

const POPULAR_GENRES = WEB_NOVEL_GENRES.slice(0, 8);
const POPULAR_TAGS = WEB_NOVEL_TAGS.slice(0, 10);

interface SearchFacetRailProps {
  sort: SearchSort;
  genre: string | null;
  tags: string[];
  minRating: number;
  onSort: (sort: SearchSort) => void;
  onGenre: (slug: string | null) => void;
  onTagToggle: (slug: string) => void;
  onMinRating: (rating: number) => void;
  onClear: () => void;
  className?: string;
}

export function SearchFacetRail({
  sort,
  genre,
  tags,
  minRating,
  onSort,
  onGenre,
  onTagToggle,
  onMinRating,
  onClear,
  className,
}: SearchFacetRailProps) {
  const hasFilters = Boolean(genre || tags.length || minRating);

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col gap-4 rounded-[1.25rem] border border-[#1A1224]/8 bg-white/80 p-4",
        "min-h-0 max-h-full overflow-y-auto overscroll-contain",
        "lg:w-56 xl:w-60",
        className,
      )}
      aria-label="Search filters"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#6E46C7]">
          <SlidersHorizontal className="size-3.5" aria-hidden />
          Refine
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-semibold text-[#1A1224]/50 hover:text-[#6E46C7]"
          >
            Clear
          </button>
        ) : null}
      </div>

      <label className="block space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#1A1224]/45">
          Sort
        </span>
        <span className="relative block">
          <select
            value={sort}
            onChange={(event) => onSort(event.target.value as SearchSort)}
            className="w-full appearance-none rounded-xl border border-[#1A1224]/10 bg-[#FBF7F1]/80 py-2 pl-3 pr-8 text-[13px] font-medium text-[#1A1224] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/30"
          >
            {SORTS.map((item) => (
              <option key={item} value={item}>
                {searchSortLabel(item)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#1A1224]/40"
            aria-hidden
          />
        </span>
      </label>

      <fieldset className="space-y-2">
        <legend className="text-[11px] font-semibold uppercase tracking-wide text-[#1A1224]/45">
          Genre
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_GENRES.map((item) => {
            const active = genre === item.slug;
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => onGenre(active ? null : item.slug)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-[#6E46C7] text-white"
                    : "bg-[#F4ECF8] text-[#4C35C4] hover:bg-[#EDE4FF]",
                )}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-[11px] font-semibold uppercase tracking-wide text-[#1A1224]/45">
          Tropes
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TAGS.map((item) => {
            const active = tags.includes(item.slug);
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => onTagToggle(item.slug)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-[#E8C36A]/25 text-[#6B5420] ring-1 ring-[#E8C36A]/50"
                    : "bg-[#FBF7F1] text-[#1A1224]/60 ring-1 ring-[#1A1224]/8 hover:ring-[#6E46C7]/25",
                )}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-[11px] font-semibold uppercase tracking-wide text-[#1A1224]/45">
          Rating
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {[0, 3, 4].map((rating) => {
            const active = minRating === rating;
            const label =
              rating === 0 ? "Any" : rating === 3 ? "3★+" : "4★+";
            return (
              <button
                key={rating}
                type="button"
                onClick={() => onMinRating(rating)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  active
                    ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                    : "bg-white text-[#1A1224]/55 ring-1 ring-[#1A1224]/10",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {(genre || tags.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {genre ? (
            <span className="rounded-md bg-[#F4ECF8] px-2 py-0.5 text-[10px] font-medium text-[#6E46C7]">
              {facetLabel(genre, "genre")}
            </span>
          ) : null}
          {tags.map((slug) => (
            <span
              key={slug}
              className="rounded-md bg-[#FFF6E8] px-2 py-0.5 text-[10px] font-medium text-[#6B5420]"
            >
              {facetLabel(slug, "tag")}
            </span>
          ))}
        </div>
      )}

    </aside>
  );
}
