"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { WorkPreviewDrawer } from "@/components/browse/WorkPreviewDrawer";
import { SearchEmptyLanding } from "@/components/search/SearchEmptyLanding";
import { SearchFacetRail } from "@/components/search/SearchFacetRail";
import { SearchInsightBar } from "@/components/search/SearchInsightBar";
import { SearchResultsBody } from "@/components/search/SearchResultsBody";
import { SEARCH_SCROLL_PANEL_CLASS, WORKS_REVIEWS_GRID_CLASS } from "@/components/search/search-layout";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { notifySearchLocation, SEARCH_LOCATION_EVENT } from "@/lib/search-location";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import {
  facetLabel,
  parseSearchPage,
  parseSearchSort,
  parseSearchType,
  parseTagSlugs,
  relatedSearchSuggestions,
  searchHref,
  searchBatchSize,
  searchInterpretationLabels,
  searchPagingKind,
  type SearchPagingKind,
} from "@/lib/search";
import { searchWorkToBrowseItem } from "@/lib/search-browse-adapter";
import { cn } from "@/lib/utils";
import type {
  SearchResponse,
  SearchResultType,
  SearchSort,
} from "@/types/search";
import type { BrowseWorkItem } from "@/types/browse";

interface SearchFilters {
  q: string;
  type: SearchResultType;
  sort: SearchSort;
  genre: string | null;
  tags: string[];
  minRating: number;
  page: number;
}

interface SearchPageProps {
  initial: SearchResponse;
  isLoggedIn: boolean;
  currentUserId?: string;
  minRating?: number;
  initialPage?: number;
}

function filtersFromSearch(search: string): SearchFilters {
  const params = new URLSearchParams(search);
  const rating = Number(params.get("rating") ?? "0");
  return {
    q: params.get("q") ?? "",
    type: parseSearchType(params.get("type") ?? params.get("tab")),
    sort: parseSearchSort(params.get("sort")),
    genre: params.get("genre"),
    tags: parseTagSlugs(params.get("tags") ?? undefined, params.get("tag") ?? undefined),
    minRating: rating === 3 || rating === 4 ? rating : 0,
    page: parseSearchPage(params.get("page")),
  };
}

function filtersToParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.sort !== "relevance") params.set("sort", filters.sort);
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.tags.length) params.set("tags", filters.tags.join(","));
  if (filters.minRating) params.set("rating", String(filters.minRating));
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

function filtersEqual(a: SearchFilters, b: SearchFilters): boolean {
  return (
    a.q.trim() === b.q.trim() &&
    a.type === b.type &&
    a.sort === b.sort &&
    a.genre === b.genre &&
    a.minRating === b.minRating &&
    a.page === b.page &&
    a.tags.join(",") === b.tags.join(",")
  );
}

function mergeHits<T extends { id: string }>(prev: T[], next: T[]): T[] {
  const seen = new Set(prev.map((item) => item.id));
  return [...prev, ...next.filter((item) => !seen.has(item.id))];
}

function loadedCountForKind(
  kind: SearchPagingKind,
  result: SearchResponse,
  visibleWorks: SearchResponse["works"]
): number {
  if (kind === "works") return visibleWorks.length;
  if (kind === "reviews") return result.reviews.length;
  if (kind === "people") return result.people.length;
  return result.lists.length;
}

function appendOffsetForKind(
  kind: SearchPagingKind,
  result: SearchResponse,
  visibleWorks: SearchResponse["works"]
): number {
  return loadedCountForKind(kind, result, visibleWorks);
}

export function SearchPage({
  initial,
  isLoggedIn,
  currentUserId,
  minRating = 0,
  initialPage = 1,
}: SearchPageProps) {
  return (
    <SearchResultsView
      key={`${initial.query}|${initial.type}|${initial.sort}|${initial.facets.genre ?? ""}|${initial.facets.tags.join(",")}|${minRating}`}
      initial={initial}
      isLoggedIn={isLoggedIn}
      currentUserId={currentUserId}
      minRating={minRating === 3 || minRating === 4 ? minRating : 0}
      initialPage={Math.max(1, initialPage)}
    />
  );
}

function SearchResultsView({
  initial,
  isLoggedIn,
  currentUserId,
  minRating,
  initialPage,
}: {
  initial: SearchResponse;
  isLoggedIn: boolean;
  currentUserId?: string;
  minRating: number;
  initialPage: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const requestIdRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [previewWork, setPreviewWork] = useState<BrowseWorkItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    q: initial.query,
    type: initial.type,
    sort: initial.sort,
    genre: initial.facets.genre,
    tags: initial.facets.tags,
    minRating,
    page: initialPage,
  }));
  const [result, setResult] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [paging, setPaging] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { recentQueries, clear: clearRecents, error: recentError, remember } =
    useRecentSearches();
  const totalsRef = useRef(initial.totals);
  const filtersRef = useRef(filters);
  const resultRef = useRef(initial);
  const visibleWorksRef = useRef(initial.works);
  const sizeReadyRef = useRef(false);
  const fetchedSizeRef = useRef(6);
  const applyFiltersRef = useRef<(updates: Partial<SearchFilters>) => void>(() => {});
  const [pageSize, setPageSize] = useState(12);

  const hasQuery = Boolean(
    filters.q.trim() || filters.genre || filters.tags.length
  );

  const pagingKind = searchPagingKind(filters.type, result.totals);

  useEffect(() => {
    const syncSize = () => {
      setPageSize(searchBatchSize(pagingKind, window.innerWidth));
    };
    syncSize();
    window.addEventListener("resize", syncSize);
    return () => window.removeEventListener("resize", syncSize);
  }, [pagingKind]);

  const visibleWorks = useMemo(() => {
    if (!filters.minRating) return result.works;
    return result.works.filter(
      (work) => (work.averageRating ?? 0) >= filters.minRating
    );
  }, [filters.minRating, result.works]);

  const totalHits =
    result.totals.works +
    result.totals.reviews +
    result.totals.people +
    result.totals.lists;

  const isAllView = filters.type === "all";
  const activeLoaded = loadedCountForKind(pagingKind, result, visibleWorks);
  const activeTotal = result.totals[pagingKind] || 0;
  const hasMore = !isAllView && activeLoaded < activeTotal;
  const hasVisibleResults = isAllView
    ? totalHits > 0
    : activeLoaded > 0;

  const interpretation = useMemo(
    () => searchInterpretationLabels(result.facets, filters.q),
    [result.facets, filters.q],
  );

  const related = useMemo(
    () =>
      relatedSearchSuggestions(
        filters.q,
        visibleWorks,
        result.didYouMean,
      ),
    [filters.q, visibleWorks, result.didYouMean],
  );

  const openWorkPreview = useCallback((work: BrowseWorkItem) => {
    setPreviewWork(work);
    setPreviewOpen(true);
  }, []);

  const peekWork = useCallback(
    (work: SearchResponse["works"][number]) => {
      openWorkPreview(searchWorkToBrowseItem(work, filters.sort));
    },
    [filters.sort, openWorkPreview],
  );

  const syncUrl = useCallback(
    (next: SearchFilters) => {
      const params = filtersToParams({ ...next, page: 1 });
      params.delete("page");
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      window.history.replaceState(window.history.state, "", href);
      notifySearchLocation();
    },
    [pathname]
  );

  const load = useCallback(
    async (next: SearchFilters, size: number, append: boolean) => {
      const requestId = ++requestIdRef.current;
      if (append) setPaging(true);
      else setLoading(true);
      setLoadError(null);
      const fetchType = next.type === "all" ? "all" : next.type;
      const pagingKindForFetch =
        fetchType === "all" ? searchPagingKind("all", totalsRef.current) : fetchType;
      const offset = append
        ? appendOffsetForKind(
            pagingKindForFetch,
            resultRef.current,
            visibleWorksRef.current
          )
        : (Math.max(1, next.page) - 1) * size;
      try {
        const params = filtersToParams({ ...next, page: 1 });
        params.delete("rating");
        params.delete("page");
        params.set("type", fetchType);
        params.set("limit", String(size));
        params.set("offset", String(offset));
        const response = await fetch(`/api/search?${params.toString()}`);
        if (requestId !== requestIdRef.current) return;
        if (!response.ok) {
          setLoadError("Could not update results. Try again.");
          return;
        }
        const data = (await response.json()) as SearchResponse;
        if (requestId !== requestIdRef.current) return;
        fetchedSizeRef.current = size;
        setResult((prev) => {
          const base = {
            ...data,
            type: next.type,
            totals:
              fetchType === "all"
                ? data.totals
                : { ...prev.totals, [fetchType]: data.totals[fetchType] },
          };

          if (!append) {
            return {
              ...base,
              works:
                fetchType === "reviews" || fetchType === "people" || fetchType === "lists"
                  ? prev.works
                  : data.works,
              reviews:
                fetchType === "works" || fetchType === "people" || fetchType === "lists"
                  ? prev.reviews
                  : data.reviews,
              people:
                fetchType === "works" || fetchType === "reviews" || fetchType === "lists"
                  ? prev.people
                  : data.people,
              lists:
                fetchType === "works" || fetchType === "reviews" || fetchType === "people"
                  ? prev.lists
                  : data.lists,
            };
          }

          const nextWorks =
            fetchType === "reviews" || fetchType === "people" || fetchType === "lists"
              ? prev.works
              : mergeHits(prev.works, data.works);
          const nextReviews =
            fetchType === "works" || fetchType === "people" || fetchType === "lists"
              ? prev.reviews
              : mergeHits(prev.reviews, data.reviews);
          const nextPeople =
            fetchType === "works" || fetchType === "reviews" || fetchType === "lists"
              ? prev.people
              : mergeHits(prev.people, data.people);
          const nextLists =
            fetchType === "works" || fetchType === "reviews" || fetchType === "people"
              ? prev.lists
              : mergeHits(prev.lists, data.lists);

          const stalled =
            (pagingKindForFetch === "works" && nextWorks.length === prev.works.length) ||
            (pagingKindForFetch === "reviews" &&
              nextReviews.length === prev.reviews.length) ||
            (pagingKindForFetch === "people" &&
              nextPeople.length === prev.people.length) ||
            (pagingKindForFetch === "lists" && nextLists.length === prev.lists.length);

          return {
            ...base,
            works: nextWorks,
            reviews: nextReviews,
            people: nextPeople,
            lists: nextLists,
            totals: stalled
              ? {
                  ...base.totals,
                  [pagingKindForFetch]:
                    pagingKindForFetch === "works"
                      ? visibleWorksRef.current.length
                      : loadedCountForKind(pagingKindForFetch, prev, visibleWorksRef.current),
                }
              : base.totals,
          };
        });

      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError("Could not update results. Try again.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setPaging(false);
        }
      }
    },
    []
  );

  const applyFilters = useCallback(
    (updates: Partial<SearchFilters>) => {
      const resetPage =
        updates.page === undefined &&
        (updates.q !== undefined ||
          updates.type !== undefined ||
          updates.sort !== undefined ||
          updates.genre !== undefined ||
          updates.tags !== undefined);
      const next = {
        ...filters,
        ...updates,
        page: updates.page ?? (resetPage ? 1 : filters.page),
      };
      if (filtersEqual(filters, next)) return;
      if (updates.type !== undefined && updates.type !== filters.type) {
        requestIdRef.current += 1;
        setPaging(false);
        if (updates.type !== "all" && filters.type !== "all") {
          setResult((prev) => ({
            ...prev,
            works: updates.type === "works" ? [] : prev.works,
            reviews: updates.type === "reviews" ? [] : prev.reviews,
            people: updates.type === "people" ? [] : prev.people,
            lists: updates.type === "lists" ? [] : prev.lists,
          }));
        }
      }
      setFilters(next);
      syncUrl(next);
      if (next.q.trim()) remember(next.q);
      const pageOnly =
        next.q.trim() === filters.q.trim() &&
        next.type === filters.type &&
        next.sort === filters.sort &&
        next.genre === filters.genre &&
        next.tags.join(",") === filters.tags.join(",") &&
        next.page !== filters.page;
      const needsFetch =
        pageOnly ||
        next.q.trim() !== filters.q.trim() ||
        next.type !== filters.type ||
        next.sort !== filters.sort ||
        next.genre !== filters.genre ||
        next.tags.join(",") !== filters.tags.join(",");
      if (!needsFetch) return;
      const nextKind = searchPagingKind(next.type, totalsRef.current);
      const size =
        typeof window === "undefined"
          ? pageSize
          : searchBatchSize(nextKind, window.innerWidth);
      startTransition(() => {
        void load(next, size, pageOnly);
      });
    },
    [filters, load, pageSize, syncUrl, remember]
  );

  useEffect(() => {
    totalsRef.current = result.totals;
    filtersRef.current = filters;
    resultRef.current = result;
    visibleWorksRef.current = visibleWorks;
    applyFiltersRef.current = applyFilters;
  }, [result, filters, visibleWorks, applyFilters]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!sizeReadyRef.current) {
      sizeReadyRef.current = true;
      return;
    }
    if (fetchedSizeRef.current === pageSize) return;
    const current = filtersRef.current;
    if (!current.q.trim() && !current.genre && current.tags.length === 0) return;
    const next = { ...current, page: 1 };
    setFilters(next);
    syncUrl(next);
    void load(next, pageSize, false);
  }, [pageSize, load, syncUrl]);

  const loadMore = useCallback(() => {
    if (loading || paging || !hasMore) return;
    applyFiltersRef.current({ page: filters.page + 1 });
  }, [filters.page, hasMore, loading, paging]);

  useEffect(() => {
    const root = resultsScrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target || !hasMore || loading || paging) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      { root, rootMargin: "240px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loading, paging, pagingKind, activeLoaded]);

  useEffect(() => {
    const syncFromLocation = () => {
      const next = filtersFromSearch(window.location.search);
      if (filtersEqual(filtersRef.current, next)) return;
      setFilters(next);
      startTransition(() => {
        void load(next, pageSize, false);
      });
    };
    window.addEventListener(SEARCH_LOCATION_EVENT, syncFromLocation);
    return () =>
      window.removeEventListener(SEARCH_LOCATION_EVENT, syncFromLocation);
  }, [load, pageSize]);

  useEffect(() => {
    const onPop = () => {
      const next = filtersFromSearch(window.location.search);
      setFilters(next);
      startTransition(() => {
        void load(next, pageSize, false);
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [load, pageSize]);

  return (
    <div
      className={cn(
        "flex flex-col bg-[#FBF7F1] text-[#1A1224]",
        hasQuery && "h-[calc(100dvh-var(--mv-nav-h))] min-h-0 overflow-hidden",
      )}
    >
      <div className={cn(SITE_SHELL_CLASS, "shrink-0 space-y-3 pb-2 pt-3 sm:pt-4")}>
        {hasQuery ? (
          <div className="space-y-3">
            <SearchInsightBar
              query={filters.q}
              totals={result.totals}
              interpretation={interpretation}
              related={related}
              activeType={filters.type}
              onTypeChange={(type) => applyFilters({ type, page: 1 })}
              onRelated={(term) => {
                remember(term);
                applyFilters({ q: term, page: 1 });
              }}
              onQuickRating={() =>
                applyFilters({
                  minRating: filters.minRating >= 4 ? 0 : 4,
                  page: 1,
                })
              }
              hasRatingFilter={filters.minRating >= 4}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((open) => !open)}
                className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#6E46C7] ring-1 ring-[#6E46C7]/20"
              >
                {mobileFiltersOpen ? "Hide filters" : "Filters & sort"}
              </button>
              {loading ? (
                <span className="inline-flex items-center gap-1 text-xs text-[#1A1224]/50">
                  <Loader2 className="size-3 animate-spin" />
                  Updating…
                </span>
              ) : loadError ? (
                <span role="alert" className="text-xs font-medium text-[#B42318]">
                  {loadError}
                </span>
              ) : null}
            </div>

            {mobileFiltersOpen ? (
              <SearchFacetRail
                className="lg:hidden"
                sort={filters.sort}
                genre={filters.genre}
                tags={filters.tags}
                minRating={filters.minRating}
                onSort={(sort) => applyFilters({ sort, page: 1 })}
                onGenre={(genre) => applyFilters({ genre, page: 1 })}
                onTagToggle={(slug) => {
                  const has = filters.tags.includes(slug);
                  applyFilters({
                    tags: has
                      ? filters.tags.filter((item) => item !== slug)
                      : filters.tags.length >= 3
                        ? filters.tags
                        : [...filters.tags, slug],
                    page: 1,
                  });
                }}
                onMinRating={(minRating) => applyFilters({ minRating, page: 1 })}
                onClear={() =>
                  applyFilters({
                    q: "",
                    genre: null,
                    tags: [],
                    minRating: 0,
                    page: 1,
                  })
                }
              />
            ) : null}

            {result.didYouMean ? (
              <p className="text-sm text-[#1A1224]/70">
                Did you mean{" "}
                <button
                  type="button"
                  className="font-semibold text-[#6E46C7] underline-offset-2 hover:underline"
                  onClick={() => {
                    const term = result.didYouMean ?? "";
                    if (!term) return;
                    remember(term);
                    router.push(searchHref(term));
                  }}
                >
                  {result.didYouMean}
                </button>
                ?
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {!hasQuery ? (
        <div className={cn(SITE_SHELL_CLASS, "flex-1 overflow-y-auto pb-8")}>
          <SearchEmptyLanding
            recents={recentQueries}
            recentError={recentError}
            popular={result.works}
            onRecent={(query) => {
              remember(query);
              router.push(searchHref(query));
            }}
            onClearRecents={clearRecents}
          />
        </div>
      ) : (
        <div
          className={cn(
            SITE_SHELL_CLASS,
            "flex min-h-0 flex-1 items-stretch gap-4 pb-4",
          )}
        >
          <SearchFacetRail
            className="hidden lg:flex"
            sort={filters.sort}
            genre={filters.genre}
            tags={filters.tags}
            minRating={filters.minRating}
            onSort={(sort) => applyFilters({ sort, page: 1 })}
            onGenre={(genre) => applyFilters({ genre, page: 1 })}
            onTagToggle={(slug) => {
              const has = filters.tags.includes(slug);
              applyFilters({
                tags: has
                  ? filters.tags.filter((item) => item !== slug)
                  : filters.tags.length >= 3
                    ? filters.tags
                    : [...filters.tags, slug],
                page: 1,
              });
            }}
            onMinRating={(minRating) => applyFilters({ minRating, page: 1 })}
            onClear={() =>
              applyFilters({
                q: "",
                genre: null,
                tags: [],
                minRating: 0,
                page: 1,
              })
            }
          />

          <main
            ref={resultsScrollRef}
            className={SEARCH_SCROLL_PANEL_CLASS}
            aria-label="Search results"
            aria-busy={loading || paging}
          >
            <div className="p-4 sm:p-5 lg:p-6">
              {loading && !hasVisibleResults ? (
                <SearchSkeleton />
              ) : !hasVisibleResults ? (
                <ZeroState
                  filters={filters}
                  onRelax={(updates) => applyFilters(updates)}
                />
              ) : (
                <div className={cn(paging && "opacity-90")}>
                  <SearchResultsBody
                    result={result}
                    visibleWorks={visibleWorks}
                    filters={filters}
                    isLoggedIn={isLoggedIn}
                    currentUserId={currentUserId}
                    paging={paging}
                    hasMore={hasMore}
                    activeLoaded={activeLoaded}
                    activeTotal={activeTotal}
                    isAllView={isAllView}
                    pagingKind={pagingKind}
                    onViewAll={(type) => applyFilters({ type, page: 1 })}
                    onPreviewWork={openWorkPreview}
                    onWorkPeek={peekWork}
                    sentinelRef={sentinelRef}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      <WorkPreviewDrawer
        work={previewWork}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className={WORKS_REVIEWS_GRID_CLASS} aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex gap-4 rounded-2xl border border-primary/10 bg-white p-4"
        >
          <span className="h-[168px] w-[120px] shrink-0 animate-pulse rounded-xl bg-[#EDE8FF] sm:h-[200px] sm:w-[140px]" />
          <div className="min-w-0 flex-1 space-y-2">
            <span className="block h-4 w-3/4 animate-pulse rounded bg-[#EDE8FF]" />
            <span className="block h-3 w-1/2 animate-pulse rounded bg-[#F4ECF8]" />
            <span className="block h-3 w-full animate-pulse rounded bg-[#F4ECF8]" />
            <span className="block h-3 w-5/6 animate-pulse rounded bg-[#F4ECF8]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ZeroState({
  filters,
  onRelax,
}: {
  filters: SearchFilters;
  onRelax: (updates: Partial<SearchFilters>) => void;
}) {
  return (
    <div className="rounded-[24px] bg-white px-6 py-12 text-center ring-1 ring-[#1A1224]/8">
      <Search className="mx-auto size-10 text-[#6E46C7]/50" aria-hidden />
      <h2 className="mt-4 font-serif text-xl">No matches found</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#1A1224]/60">
        Try a shorter keyword, check spelling, or remove a filter.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {filters.minRating ? (
          <button
            type="button"
            className="rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold ring-1 ring-[#1A1224]/12"
            onClick={() => onRelax({ minRating: 0 })}
          >
            Drop rating filter
          </button>
        ) : null}
        {filters.tags[0] ? (
          <button
            type="button"
            className="rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold ring-1 ring-[#1A1224]/12"
            onClick={() => onRelax({ tags: filters.tags.slice(1) })}
          >
            Drop {facetLabel(filters.tags[0], "tag")}
          </button>
        ) : null}
        {filters.genre ? (
          <button
            type="button"
            className="rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold ring-1 ring-[#1A1224]/12"
            onClick={() => onRelax({ genre: null })}
          >
            Drop {facetLabel(filters.genre, "genre")}
          </button>
        ) : null}
        <Link
          href="/discover"
          className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#6E46C7]"
        >
          Browse reviews
        </Link>
      </div>
    </div>
  );
}
