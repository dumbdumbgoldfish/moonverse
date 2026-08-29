"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, List, Search, SlidersHorizontal, Users } from "lucide-react";
import { DiscoverSortMenu } from "@/components/discovery/DiscoverSortMenu";
import { DiscoverViewSwitcher } from "@/components/discovery/DiscoverViewSwitcher";
import type { DiscoverLayout } from "@/lib/discover";
import { cn } from "@/lib/utils";
import type { ReviewSort } from "@/types/review";
import type { SearchResultType } from "@/types/search";

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

interface BrowseCommandBarProps {
  query: string;
  sort: ReviewSort;
  layout: DiscoverLayout;
  filterCount: number;
  isLoggedIn: boolean;
  onSearch: (query: string) => void;
  onSortSelect: (sort: ReviewSort) => void;
  onSortGated: () => void;
  onLayoutChange: (layout: DiscoverLayout) => void;
  onOpenFilters: () => void;
}

export function BrowseCommandBar({
  query,
  sort,
  layout,
  filterCount,
  isLoggedIn,
  onSearch,
  onSortSelect,
  onSortGated,
  onLayoutChange,
  onOpenFilters,
}: BrowseCommandBarProps) {
  const pathname = usePathname();
  const onReviewsPage = pathname === "/discover" || pathname === "/reviews";
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(query);
  const [lastQuery, setLastQuery] = useState(query);

  if (query !== lastQuery) {
    setLastQuery(query);
    setDraft(query);
  }

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

  return (
    <div className="sticky top-[var(--mv-nav-h)] z-20 -mx-4 border-b border-[#1A1224]/8 bg-[#FBF7F1]/95 px-4 py-3 backdrop-blur-sm lg:static lg:z-0 lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
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
            <span className="tabular-nums text-[#6E46C7]">{filterCount}</span>
          ) : null}
        </button>
      </form>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <div
          className="discover-hscroll flex min-w-0 flex-1 gap-1"
          role="tablist"
          aria-label="Browse mode"
        >
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
                role="tab"
                aria-selected={active}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
                  active
                    ? "mv-nav-signup border-0 text-white"
                    : "bg-white text-[#1A1224]/75 ring-1 ring-[#1A1224]/10 hover:ring-[#6E46C7]/25"
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DiscoverSortMenu
            value={sort}
            isLoggedIn={isLoggedIn}
            onSelect={onSortSelect}
            onGatedSelect={onSortGated}
          />
          <DiscoverViewSwitcher value={layout} onChange={onLayoutChange} />
        </div>
      </div>
    </div>
  );
}
