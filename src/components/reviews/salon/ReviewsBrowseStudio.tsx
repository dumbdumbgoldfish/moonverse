"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutGrid,
  List,
  Lock,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { getGenrePresentation } from "@/lib/genre-presentation";
import {
  DISCOVER_SORT_OPTIONS,
  discoverSortLabel,
  isGatedDiscoverSort,
} from "@/lib/discover";
import {
  REVIEW_VERDICT_FILTERS,
  type ReviewVerdictFilter,
} from "@/lib/review-verdict-filter";
import { WEB_NOVEL_GENRES } from "@/lib/genres";
import { cn } from "@/lib/utils";
import type { DiscoverTagPreview } from "@/types/discovery";
import type { GenreOption, ReviewSort } from "@/types/review";
import type { SearchResultType } from "@/types/search";

const PUBLIC_SORTS: ReviewSort[] = [
  "trending",
  "latest",
  "highest-rated",
  "most-discussed",
  "most-saved",
  "most-shared",
];

const MODES: {
  type: SearchResultType | "reviews-browse";
  label: string;
  icon: typeof BookOpen;
}[] = [
  { type: "reviews-browse", label: "Discover", icon: BookOpen },
  { type: "works", label: "Works", icon: Search },
  { type: "people", label: "People", icon: Users },
  { type: "lists", label: "Lists", icon: List },
];

function reviewsBrowseHref(query: string): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  const qs = params.toString();
  return qs ? `/discover?${qs}` : "/discover";
}

function catalogSearchHref(type: SearchResultType, query: string): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  params.set("type", type);
  return `/search?${params.toString()}`;
}

interface ReviewsBrowseStudioProps {
  query: string;
  sort: ReviewSort;
  filterCount: number;
  activeGenre: string | null;
  activeTags: string[];
  activeVerdict: ReviewVerdictFilter | null;
  spoilerFree: boolean;
  genres: GenreOption[];
  popularTags: DiscoverTagPreview[];
  chips: { key: string; label: string }[];
  isLoggedIn: boolean;
  onSearch: (query: string) => void;
  onSortSelect: (sort: ReviewSort) => void;
  onSortGated: () => void;
  onOpenFilters: () => void;
  onSelectGenre: (slug: string | null) => void;
  onToggleTag: (slug: string) => void;
  onToggleSpoiler: () => void;
  onSelectVerdict: (verdict: ReviewVerdictFilter | null) => void;
  onRemoveChip: (key: string) => void;
  onClearFilters: () => void;
}

function genreIcon(slug: string) {
  return WEB_NOVEL_GENRES.find((g) => g.slug === slug)?.icon ?? LayoutGrid;
}

export function ReviewsBrowseStudio({
  query,
  sort,
  filterCount,
  activeGenre,
  activeTags,
  activeVerdict,
  spoilerFree,
  genres,
  popularTags,
  chips,
  isLoggedIn,
  onSearch,
  onSortSelect,
  onSortGated,
  onOpenFilters,
  onSelectGenre,
  onToggleTag,
  onToggleSpoiler,
  onSelectVerdict,
  onRemoveChip,
  onClearFilters,
}: ReviewsBrowseStudioProps) {
  const pathname = usePathname();
  const onReviewsPage = pathname === "/discover" || pathname === "/reviews";
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const topGenres = genres.slice(0, 8);
  const topTags = popularTags.slice(0, 6);

  return (
    <section
      aria-label="Browse studio"
      className="sticky top-[var(--mv-nav-h)] z-20 -mx-4 border-y border-[#1A1224]/8 bg-[#FBF7F1]/92 px-4 py-4 backdrop-blur-md lg:static lg:z-0 lg:mx-0 lg:rounded-[1.25rem] lg:border lg:bg-white/70 lg:px-5 lg:shadow-[0_16px_48px_-40px_rgba(26,18,36,0.35)] lg:backdrop-blur-none"
    >
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1224]/45">
        Browse studio
      </p>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(draft.trim());
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#1A1224]/40"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Filter reviews on this page…"
            aria-label="Filter reviews"
            className="h-10 w-full rounded-full border border-[#1A1224]/10 bg-white pl-9 pr-4 text-sm text-[#1A1224] placeholder:text-[#1A1224]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/40"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-[#1A1224]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#1A1224]/35 sm:inline">
            /
          </span>
        </div>
        <button
          type="button"
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-medium text-[#1A1224] ring-1 ring-[#1A1224]/12 lg:hidden"
          onClick={onOpenFilters}
        >
          <SlidersHorizontal className="size-3.5" aria-hidden />
          Filters
          {filterCount > 0 ? (
            <span className="tabular-nums text-[#C89B4A]">{filterCount}</span>
          ) : null}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Sort">
        {PUBLIC_SORTS.map((value) => {
          const active = sort === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSortSelect(value)}
              className={cn(
                "inline-flex min-h-8 items-center rounded-full px-3 text-[12px] font-semibold transition-colors",
                active
                  ? "bg-[#1A1224] text-white"
                  : "bg-white text-[#1A1224]/75 ring-1 ring-[#1A1224]/10 hover:ring-[#6E46C7]/25"
              )}
            >
              {discoverSortLabel(value)}
            </button>
          );
        })}
        {DISCOVER_SORT_OPTIONS.filter((opt) => opt.group === "for-you").map(
          (opt) => {
            const locked = !isLoggedIn && isGatedDiscoverSort(opt.value);
            const active = sort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  if (locked) {
                    onSortGated();
                    return;
                  }
                  onSortSelect(opt.value);
                }}
                className={cn(
                  "inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-[12px] font-semibold transition-colors",
                  active
                    ? "mv-nav-signup border-0 text-white"
                    : locked
                      ? "bg-white/60 text-[#1A1224]/45 ring-1 ring-[#1A1224]/8"
                      : "bg-white text-[#1A1224]/75 ring-1 ring-[#1A1224]/10 hover:ring-[#6E46C7]/25"
                )}
              >
                {opt.label}
                {locked ? <Lock className="size-3" aria-hidden /> : null}
              </button>
            );
          }
        )}
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1A1224]/45">
          Verdict
        </p>
        <div className="discover-hscroll flex gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => onSelectVerdict(null)}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-[12px] font-semibold",
              !activeVerdict
                ? "bg-[#1A1224] text-white"
                : "bg-white text-[#1A1224]/75 ring-1 ring-[#1A1224]/10"
            )}
          >
            All verdicts
          </button>
          {REVIEW_VERDICT_FILTERS.map(({ value, label }) => {
            const active = activeVerdict === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onSelectVerdict(value)}
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
                  active
                    ? "bg-[#C89B4A]/20 text-[#8A6A1A] ring-1 ring-[#C89B4A]/40"
                    : "bg-white text-[#1A1224]/75 ring-1 ring-[#1A1224]/10 hover:ring-[#C89B4A]/30"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 discover-hscroll flex gap-1.5 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => onSelectGenre(null)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold",
            !activeGenre
              ? "bg-[#C89B4A]/20 text-[#8A6A1A] ring-1 ring-[#C89B4A]/35"
              : "bg-white text-[#1A1224] ring-1 ring-[#1A1224]/10"
          )}
        >
          <LayoutGrid className="size-3.5" aria-hidden />
          All genres
        </button>
        {topGenres.map((genre) => {
          const Icon = genreIcon(genre.slug);
          const active = activeGenre === genre.slug;
          return (
            <button
              key={genre.slug}
              type="button"
              onClick={() => onSelectGenre(genre.slug)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
                active
                  ? "mv-nav-signup border-0 text-white"
                  : cn(
                      "bg-white ring-1 ring-[#1A1224]/10 hover:ring-[#6E46C7]/25",
                      getGenrePresentation(genre.slug)?.accentClass ??
                        "text-[#1A1224]"
                    )
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {genre.name}
            </button>
          );
        })}
      </div>

      {topTags.length > 0 ? (
        <div className="mt-2 discover-hscroll flex gap-1.5 overflow-x-auto pb-0.5">
          {topTags.map((tag) => {
            const active = activeTags.includes(tag.slug);
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => onToggleTag(tag.slug)}
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-[12px] font-semibold",
                  active
                    ? "bg-[#C89B4A]/20 text-[#8A6A1A] ring-1 ring-[#C89B4A]/40"
                    : "bg-white text-[#1A1224]/75 ring-1 ring-[#1A1224]/10 hover:ring-[#C89B4A]/30"
                )}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleSpoiler}
          className={cn(
            "inline-flex min-h-8 items-center rounded-full px-3 text-[12px] font-semibold transition-colors",
            spoilerFree
              ? "bg-[#1A1224] text-white"
              : "bg-white text-[#1A1224]/70 ring-1 ring-[#1A1224]/10"
          )}
        >
          Spoiler-free
        </button>

        <div className="discover-hscroll ml-auto flex min-w-0 gap-1 overflow-x-auto lg:hidden">
          {MODES.map(({ type, label, icon: Icon }) => {
            const isReviewsBrowse = type === "reviews-browse";
            const active = isReviewsBrowse ? onReviewsPage : false;
            const href = isReviewsBrowse
              ? reviewsBrowseHref(query)
              : catalogSearchHref(type, query);
            return (
              <Link
                key={type}
                href={href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  active
                    ? "bg-[#6E46C7]/12 text-[#6E46C7]"
                    : "text-[#1A1224]/55 hover:text-[#6E46C7]"
                )}
              >
                <Icon className="size-3" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#1A1224]/6 pt-3">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onRemoveChip(chip.key)}
              className="inline-flex items-center gap-1 rounded-full bg-[#C89B4A]/12 px-2.5 py-1 text-[11px] font-semibold text-[#8A6A1A] ring-1 ring-[#C89B4A]/30 hover:bg-[#C89B4A]/18"
            >
              {chip.label}
              <span aria-hidden>×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onClearFilters}
            className="text-[11px] font-semibold text-[#6E46C7] hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </section>
  );
}
