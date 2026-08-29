"use client";

import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useSignInPrompt } from "@/components/auth/SignInPromptProvider";
import { DiscoverFilterBar } from "@/components/discovery/DiscoverFilterBar";
import { DiscoverHero } from "@/components/discovery/DiscoverHero";
import { DiscoverMoonieShelf } from "@/components/discovery/DiscoverMoonieShelf";
import { DiscoverPreviewRail } from "@/components/discovery/DiscoverPreviewRail";
import { DiscoverReviewCard } from "@/components/discovery/DiscoverReviewCard";
import {
  DISCOVER_MAX_TAGS,
  TagRefinePanel,
  type CatalogTag,
} from "@/components/discovery/TagRefinePanel";
import { MoonieEmptyState } from "@/components/moonie/MoonieEmptyState";
import { Button } from "@/components/ui/button";
import {
  buildMoonieShelfPrompt,
  discoverShelfCopy,
  parseDiscoverLayout,
  readStoredDiscoverLayout,
  storeDiscoverLayout,
  type DiscoverLayout,
  type DiscoverTab,
} from "@/lib/discover";
import { genreLabel } from "@/lib/genres";
import { cn } from "@/lib/utils";
import type { DiscoverTagPreview, TopReviewerPreview } from "@/types/discovery";
import type { FolderListItem } from "@/types/folder";
import type { GenreOption, ReviewListItem, ReviewSort } from "@/types/review";
import { LOGIN_GATED_SORTS, parseReviewSort } from "@/types/review";
import { BrowseCommandBar } from "@/components/search/browse/BrowseCommandBar";
import { BrowseProofRail } from "@/components/search/browse/BrowseProofRail";
import { BrowseQuickPaths } from "@/components/search/browse/BrowseQuickPaths";
import { BrowseSecondaryRails } from "@/components/search/browse/BrowseSecondaryRails";
import { BrowseSignupBand } from "@/components/search/browse/BrowseSignupBand";
import type { CommunityStats } from "@/services/community.service";
import type { UserSearchResult } from "@/services/user.service";

const LOGIN_GATED_SORT_SET = new Set<ReviewSort>(LOGIN_GATED_SORTS);
const SIDEBAR_STICKY = "sticky top-[calc(var(--mv-nav-h)+0.75rem)] space-y-6";
const GENRE_PREVIEW_COUNT = 12;

interface DiscoverFilters {
  q: string;
  genre: string | null;
  tags: string[];
  sort: ReviewSort;
  tab: DiscoverTab;
  spoilerFree: boolean;
  hasOfficialLink: boolean;
}

interface DiscoverPageProps {
  reviews: ReviewListItem[];
  totalReviews: number;
  reviewPageSize: number;
  profiles: UserSearchResult[];
  genres: GenreOption[];
  catalogTags: CatalogTag[];
  popularTags: DiscoverTagPreview[];
  topReviewers: TopReviewerPreview[];
  communityStats?: CommunityStats;
  highestRated?: ReviewListItem[];
  folders: FolderListItem[];
  initialQuery?: string;
  initialGenre?: string;
  initialTags?: string[];
  initialSort?: ReviewSort;
  initialLayout?: DiscoverLayout;
  initialSpoilerFree?: boolean;
  initialHasOfficialLink?: boolean;
  isLoggedIn?: boolean;
  currentUserId?: string;
}

function parseTagsParam(params: URLSearchParams): string[] {
  const fromTags = (params.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const legacy = params.get("tag")?.trim();
  const merged = [...fromTags];
  if (legacy && !merged.includes(legacy)) merged.push(legacy);
  return merged.slice(0, DISCOVER_MAX_TAGS);
}

function filtersFromSearch(search: string, isLoggedIn = true): DiscoverFilters {
  const params = new URLSearchParams(search);
  return {
    q: params.get("q") ?? "",
    genre: params.get("genre"),
    tags: parseTagsParam(params),
    sort: parseReviewSort(params.get("sort"), isLoggedIn),
    tab: "reviews",
    spoilerFree: params.get("spoilers") === "hide",
    hasOfficialLink: params.get("link") === "official",
  };
}

function filtersToParams(
  filters: DiscoverFilters,
  layout: DiscoverLayout
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.tags.length) params.set("tags", filters.tags.join(","));
  if (filters.sort !== "trending") params.set("sort", filters.sort);
  if (filters.tab !== "reviews") params.set("tab", filters.tab);
  if (filters.spoilerFree) params.set("spoilers", "hide");
  if (filters.hasOfficialLink) params.set("link", "official");
  if (layout !== "comfortable") params.set("layout", layout);
  return params;
}

function tagsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function filtersEqual(a: DiscoverFilters, b: DiscoverFilters): boolean {
  return (
    a.q.trim() === b.q.trim() &&
    a.genre === b.genre &&
    tagsEqual(a.tags, b.tags) &&
    a.sort === b.sort &&
    a.tab === b.tab &&
    a.spoilerFree === b.spoilerFree &&
    a.hasOfficialLink === b.hasOfficialLink
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

async function fetchDiscover(
  filters: DiscoverFilters,
  offset: number,
  limit: number,
  layout: DiscoverLayout
): Promise<{
  reviews: ReviewListItem[];
  profiles: UserSearchResult[];
  total: number;
} | null> {
  const params = filtersToParams(filters, layout);
  params.set("offset", String(offset));
  params.set("limit", String(limit));
  const response = await fetch(`/api/discover?${params.toString()}`);
  if (!response.ok) return null;
  return response.json();
}

export function DiscoverPage({
  reviews: initialReviews,
  totalReviews: initialTotal,
  reviewPageSize,
  profiles: initialProfiles,
  genres,
  catalogTags,
  popularTags,
  topReviewers,
  communityStats,
  highestRated = [],
  folders,
  initialQuery = "",
  initialGenre,
  initialTags = [],
  initialSort = "trending",
  initialLayout = "comfortable",
  initialSpoilerFree = false,
  initialHasOfficialLink = false,
  isLoggedIn = false,
  currentUserId,
}: DiscoverPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { promptSignIn } = useSignInPrompt();
  const [, startTransition] = useTransition();

  const [filters, setFilters] = useState<DiscoverFilters>(() => ({
    q: initialQuery,
    genre: initialGenre ?? null,
    tags: initialTags,
    sort: initialSort,
    tab: "reviews",
    spoilerFree: initialSpoilerFree,
    hasOfficialLink: initialHasOfficialLink,
  }));
  const [layout, setLayout] = useState<DiscoverLayout>(initialLayout);
  const [reviews, setReviews] = useState(initialReviews);
  const [, setProfiles] = useState(initialProfiles);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [preview, setPreview] = useState<ReviewListItem | null>(
    initialReviews[0] ?? null
  );
  const [highlightIndex, setHighlightIndex] = useState(0);

  const syncUrl = useCallback(
    (
      next: DiscoverFilters,
      nextLayout: DiscoverLayout,
      { useRouterSync = false } = {}
    ) => {
      const params = filtersToParams(next, nextLayout);
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (useRouterSync) {
        router.replace(href, { scroll: false });
      } else {
        window.history.replaceState(window.history.state, "", href);
      }
    },
    [pathname, router]
  );

  const loadResults = useCallback(
    async (next: DiscoverFilters, offset = 0, nextLayout = layout) => {
      setLoading(true);
      try {
        const limit = reviewPageSize;
        const data = await fetchDiscover(next, offset, limit, nextLayout);
        if (!data) return;
        setReviews(data.reviews);
        setProfiles([]);
        setPreview(data.reviews[0] ?? null);
        setHighlightIndex(0);
        setTotal(data.total);
      } finally {
        setLoading(false);
      }
    },
    [layout, reviewPageSize]
  );

  const applyFilters = useCallback(
    (updates: Partial<DiscoverFilters>, opts?: { syncNav?: boolean }) => {
      const next: DiscoverFilters = { ...filters, ...updates, tab: "reviews" };
      if (filtersEqual(filters, next)) return;
      setFilters(next);
      setPage(1);
      syncUrl(next, layout, {
        useRouterSync:
          opts?.syncNav === true || next.q.trim() !== filters.q.trim(),
      });
      startTransition(() => {
        void loadResults(next, 0);
      });
    },
    [filters, layout, loadResults, syncUrl]
  );

  const applyLayout = useCallback(
    (nextLayout: DiscoverLayout) => {
      if (nextLayout === layout) return;
      setLayout(nextLayout);
      storeDiscoverLayout(nextLayout);
      syncUrl(filters, nextLayout);
    },
    [filters, layout, syncUrl]
  );

  useEffect(() => {
    const next: DiscoverFilters = {
      q: initialQuery,
      genre: initialGenre ?? null,
      tags: initialTags,
      sort: initialSort,
      tab: "reviews",
      spoilerFree: initialSpoilerFree,
      hasOfficialLink: initialHasOfficialLink,
    };
    // Server navigation replaces the initial result set; mirror it into the
    // interactive client state as one intentional synchronization step.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(next);
    setReviews(initialReviews);
    setProfiles(initialProfiles);
    setTotal(initialTotal);
    setPage(1);
    setPreview(initialReviews[0] ?? null);
    setHighlightIndex(0);
    setLayout(initialLayout);
  }, [
    initialQuery,
    initialGenre,
    initialTags,
    initialSort,
    initialLayout,
    initialSpoilerFree,
    initialHasOfficialLink,
    initialReviews,
    initialProfiles,
    initialTotal,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("layout")) return;
    const stored = readStoredDiscoverLayout();
    if (stored === layout) return;
    queueMicrotask(() => {
      setLayout(stored);
      syncUrl(filters, stored);
    });
    // Hydrate layout from localStorage once when the URL does not specify it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const next = filtersFromSearch(window.location.search, isLoggedIn);
      const nextLayout = parseDiscoverLayout(
        new URLSearchParams(window.location.search).get("layout")
      );
      setFilters(next);
      setLayout(nextLayout);
      setPage(1);
      startTransition(() => {
        void loadResults(next, 0, nextLayout);
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [loadResults, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) return;
    const params = new URLSearchParams(window.location.search);
    const sortParam = params.get("sort");
    if (sortParam && LOGIN_GATED_SORT_SET.has(sortParam as ReviewSort)) {
      params.delete("sort");
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      window.history.replaceState(window.history.state, "", href);
    }
  }, [isLoggedIn, pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (filters.tab !== "reviews" || reviews.length === 0) return;
      if (isTypingTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "j" || event.key === "k") {
        event.preventDefault();
        setHighlightIndex((current) => {
          const next =
            event.key === "j"
              ? Math.min(reviews.length - 1, current + 1)
              : Math.max(0, current - 1);
          const review = reviews[next];
          if (review) {
            setPreview(review);
            const reduceMotion = window.matchMedia(
              "(prefers-reduced-motion: reduce)"
            ).matches;
            document
              .getElementById(`discover-review-${review.id}`)
              ?.scrollIntoView({
                block: "nearest",
                behavior: reduceMotion ? "auto" : "smooth",
              });
          }
          return next;
        });
        return;
      }

      const current = reviews[highlightIndex];
      if (!current) return;

      if (event.key === "Enter") {
        event.preventDefault();
        router.push(`/reviews/${current.id}`);
        return;
      }

      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!isLoggedIn) {
          promptSignIn();
          return;
        }
        const save = document.querySelector<HTMLElement>(
          `[data-discover-save="${current.id}"] button, [data-discover-save="${current.id}"]`
        );
        save?.click();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filters.tab, highlightIndex, isLoggedIn, promptSignIn, reviews, router]);

  const selectGenre = (slug: string | null) => {
    if (slug !== null && filters.genre === slug) {
      applyFilters({ genre: null });
      return;
    }
    applyFilters({ genre: slug, tab: "reviews" });
  };

  const toggleTag = (slug: string) => {
    const active = filters.tags.includes(slug);
    const nextTags = active
      ? filters.tags.filter((t) => t !== slug)
      : filters.tags.length >= DISCOVER_MAX_TAGS
        ? filters.tags
        : [...filters.tags, slug];
    applyFilters({ tags: nextTags, tab: "reviews" });
  };

  const selectSort = (sort: ReviewSort) => {
    if (filters.sort === sort) return;
    applyFilters({ sort, tab: "reviews" });
  };

  const clearAllFilters = () => {
    applyFilters(
      {
        q: "",
        genre: null,
        tags: [],
        sort: "trending",
        tab: "reviews",
        spoilerFree: false,
        hasOfficialLink: false,
      },
      { syncNav: true }
    );
  };

  const pageSize = reviewPageSize;

  const goToPage = useCallback(
    (nextPage: number) => {
      if (nextPage < 1) return;
      const offset = (nextPage - 1) * pageSize;
      setPage(nextPage);
      startTransition(() => {
        void loadResults(filters, offset);
      });
    },
    [filters, loadResults, pageSize]
  );

  const rankedGenres = [...genres].sort(
    (a, b) => b.reviewCount - a.reviewCount || a.name.localeCompare(b.name)
  );
  const selectedOutsidePreview =
    Boolean(filters.genre) &&
    !rankedGenres
      .slice(0, GENRE_PREVIEW_COUNT)
      .some((g) => g.slug === filters.genre);
  const visibleGenres =
    showAllGenres || selectedOutsidePreview
      ? rankedGenres
      : rankedGenres.slice(0, GENRE_PREVIEW_COUNT);
  const hiddenGenreCount = Math.max(
    0,
    rankedGenres.length - GENRE_PREVIEW_COUNT
  );

  const tagName = (slug: string) =>
    catalogTags.find((t) => t.slug === slug)?.name ??
    popularTags.find((t) => t.slug === slug)?.name ??
    slug;

  const shelf = discoverShelfCopy({
    sort: filters.sort,
    tab: filters.tab,
    query: filters.q,
    genreSlug: filters.genre,
    tagNames: filters.tags.map(tagName),
    spoilerFree: filters.spoilerFree,
    hasOfficialLink: filters.hasOfficialLink,
  });

  const mooniePrompt = useMemo(
    () =>
      buildMoonieShelfPrompt({
        genreName: filters.genre ? genreLabel(filters.genre) : null,
        tagNames: filters.tags.map(tagName),
        novelTitles: reviews.map((review) => review.novelTitle),
      }),
    // tagName is stable enough for this shelf prompt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.genre, filters.tags, reviews]
  );

  const chips = [
    filters.q.trim()
      ? {
          key: "q",
          label: `“${filters.q.trim()}”`,
        }
      : null,
    filters.genre
      ? {
          key: "genre",
          label: genreLabel(filters.genre),
        }
      : null,
    ...filters.tags.map((slug) => ({
      key: `tag:${slug}`,
      label: tagName(slug),
    })),
    filters.spoilerFree
      ? {
          key: "spoilers",
          label: "Spoiler-free",
        }
      : null,
    filters.hasOfficialLink
      ? {
          key: "link",
          label: "Official link",
        }
      : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const showDefaultPitch =
    !filters.q.trim() &&
    !filters.genre &&
    filters.tags.length === 0 &&
    !filters.spoilerFree &&
    !filters.hasOfficialLink &&
    filters.sort === "trending";

  const removeChip = (key: string) => {
    if (key === "q") {
      applyFilters({ q: "" }, { syncNav: true });
      return;
    }
    if (key === "genre") {
      applyFilters({ genre: null });
      return;
    }
    if (key.startsWith("tag:")) {
      toggleTag(key.slice(4));
      return;
    }
    if (key === "spoilers") {
      applyFilters({ spoilerFree: false });
      return;
    }
    if (key === "link") {
      applyFilters({ hasOfficialLink: false });
    }
  };

  const filterPanelProps = {
    filters,
    visibleGenres,
    rankedGenres,
    hiddenGenreCount,
    showAllGenres,
    selectedOutsidePreview,
    catalogTags,
    onSelectGenre: selectGenre,
    onToggleShowAll: () => setShowAllGenres((open) => !open),
    onToggleTag: toggleTag,
    onToggleSpoiler: () =>
      applyFilters({ spoilerFree: !filters.spoilerFree, tab: "reviews" }),
    onToggleOfficial: () =>
      applyFilters({
        hasOfficialLink: !filters.hasOfficialLink,
        tab: "reviews",
      }),
  };

  return (
    <div className="safe-bottom-pad relative min-h-[70vh] bg-[#FBF7F1] text-[#1A1224]">
      <div className={SITE_SHELL_CLASS}>
        <DiscoverHero
          kicker={shelf.kicker}
          title={shelf.title}
          blurb={shelf.blurb}
          featured={reviews[0] ?? null}
          isLoggedIn={isLoggedIn}
          loading={loading}
          showDefaultPitch={showDefaultPitch}
        />

        {communityStats ? (
          <div className="mt-4">
            <BrowseProofRail
              stats={communityStats}
              topReviewers={topReviewers}
              isLoggedIn={isLoggedIn}
            />
          </div>
        ) : null}

        <BrowseCommandBar
          query={filters.q}
          sort={filters.sort}
          layout={layout}
          filterCount={chips.length}
          isLoggedIn={isLoggedIn}
          onSearch={(q) => applyFilters({ q }, { syncNav: true })}
          onSortSelect={selectSort}
          onSortGated={() => promptSignIn()}
          onLayoutChange={applyLayout}
          onOpenFilters={() => setFiltersOpen(true)}
        />

        <BrowseQuickPaths
          genres={genres}
          popularTags={popularTags}
          activeGenre={filters.genre}
          activeTags={filters.tags}
          onSelectGenre={selectGenre}
          onToggleTag={toggleTag}
        />

        <DiscoverFilterBar
          chips={chips}
          onRemoveChip={removeChip}
          onClear={clearAllFilters}
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
          filterPanel={
            <DiscoverFilterPanel idPrefix="mobile-discover" {...filterPanelProps} />
          }
          toolbar={null}
        />

        <DiscoverMoonieShelf
          prompt={mooniePrompt}
          className="mb-6"
          showGuestPrompts={!isLoggedIn}
        />

        <div
          id="browse-feed"
          className="mb-3 flex scroll-mt-28 items-center justify-between gap-3"
        >
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1A1224]">
            <Compass className="size-3.5 text-[#6E46C7]" aria-hidden />
            Review stream
          </p>
          {loading ? (
            <span className="inline-flex items-center gap-1 text-xs text-[#1A1224]/55">
              <Loader2 className="size-3 animate-spin" aria-hidden />
              Updating…
            </span>
          ) : (
            <p
              className="text-xs tabular-nums text-[#1A1224]/50"
              aria-live="polite"
            >
              {total.toLocaleString()}{" "}
              {total === 1 ? "review" : "reviews"}
            </p>
          )}
        </div>

        <div className="grid items-start gap-8 pb-12 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,720px)_280px]">
          <aside className="hidden self-start lg:block">
            <div className={SIDEBAR_STICKY}>
              <DiscoverFilterPanel
                idPrefix="desktop-discover"
                {...filterPanelProps}
              />
              {topReviewers.length > 0 && (
                <section>
                  <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A1224]/45">
                    Top reviewers
                  </h2>
                  <ul className="space-y-2">
                    {topReviewers.map((user) => (
                      <li key={user.id}>
                        <Link
                          href={`/users/${user.username}`}
                          className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#6E46C7]/12 text-[10px] font-bold text-[#6E46C7]">
                            {user.avatarInitials}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold">
                              {user.displayName}
                            </span>
                            <span className="block text-[10px] text-[#1A1224]/50">
                              {user.reviewCount} reviews
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </aside>

          <main
            className={cn(
              "min-w-0 transition-opacity duration-150",
              loading && "pointer-events-none opacity-60"
            )}
          >
            {reviews.length > 0 ? (
              <>
                <div
                  className={cn(
                    layout === "covers"
                      ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
                      : "grid gap-4"
                  )}
                >
                  {reviews.map((review, i) => (
                    <DiscoverReviewCard
                      key={review.id}
                      review={review}
                      layout={layout}
                      highlighted={highlightIndex === i}
                      priority={i < 4}
                      isLoggedIn={isLoggedIn}
                      folders={folders}
                      onPreview={() => {
                        setPreview(review);
                        setHighlightIndex(i);
                      }}
                      onAuthRequired={() => promptSignIn()}
                    />
                  ))}
                </div>
                <DiscoverPagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  loading={loading}
                  onPrevious={() => goToPage(page - 1)}
                  onNext={() => goToPage(page + 1)}
                />
              </>
            ) : !loading ? (
              <DiscoverReviewsEmptyState
                filters={filters}
                tagName={tagName}
                onRelax={(updates) => applyFilters(updates)}
              />
            ) : null}
          </main>

          <DiscoverPreviewRail
            review={preview}
            isLoggedIn={isLoggedIn}
            folders={folders}
            currentUserId={currentUserId}
            onAuthRequired={() => promptSignIn()}
          />
        </div>

        <BrowseSecondaryRails
          popularTags={popularTags}
          highestRated={highestRated}
          layout={layout}
          isLoggedIn={isLoggedIn}
          hasOfficialLinkFilter={filters.hasOfficialLink}
          onToggleOfficialLink={() =>
            applyFilters({
              hasOfficialLink: !filters.hasOfficialLink,
              tab: "reviews",
            })
          }
          onToggleTag={toggleTag}
          onAuthRequired={() => promptSignIn()}
        />

        {!isLoggedIn ? <BrowseSignupBand /> : null}
      </div>
    </div>
  );
}

function DiscoverFilterPanel({
  filters,
  visibleGenres,
  rankedGenres,
  hiddenGenreCount,
  showAllGenres,
  selectedOutsidePreview,
  catalogTags,
  idPrefix = "discover",
  onSelectGenre,
  onToggleShowAll,
  onToggleTag,
  onToggleSpoiler,
  onToggleOfficial,
}: {
  filters: DiscoverFilters;
  visibleGenres: GenreOption[];
  rankedGenres: GenreOption[];
  hiddenGenreCount: number;
  showAllGenres: boolean;
  selectedOutsidePreview: boolean;
  catalogTags: CatalogTag[];
  idPrefix?: string;
  onSelectGenre: (slug: string | null) => void;
  onToggleShowAll: () => void;
  onToggleTag: (slug: string) => void;
  onToggleSpoiler: () => void;
  onToggleOfficial: () => void;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A1224]/45">
          Genre
        </h2>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => onSelectGenre(null)}
              className={cn(
                "w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium transition-colors duration-150",
                !filters.genre
                  ? "bg-[#6E46C7]/10 font-semibold text-[#6E46C7]"
                  : "text-[#1A1224]/60 hover:bg-white hover:text-[#1A1224]"
              )}
            >
              Any genre
            </button>
          </li>
          {visibleGenres.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => onSelectGenre(g.slug)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors duration-150",
                  filters.genre === g.slug
                    ? "bg-[#6E46C7]/10 font-semibold text-[#6E46C7]"
                    : "text-[#1A1224]/60 hover:bg-white hover:text-[#1A1224]"
                )}
              >
                <span className="truncate">{g.name}</span>
                <span className="tabular-nums text-[10px] opacity-70">
                  {g.reviewCount}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {hiddenGenreCount > 0 && !selectedOutsidePreview && (
          <button
            type="button"
            onClick={onToggleShowAll}
            className="mt-2 text-[11px] font-semibold text-[#6E46C7] hover:underline"
          >
            {showAllGenres
              ? "Show less"
              : `Show all ${rankedGenres.length} genres`}
          </button>
        )}
      </section>

      <TagRefinePanel
        tags={catalogTags}
        selectedTags={filters.tags}
        onToggle={onToggleTag}
        idPrefix={idPrefix}
      />

      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A1224]/45">
          Reading
        </h2>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[#1A1224]/80">
          <input
            type="checkbox"
            checked={filters.spoilerFree}
            onChange={onToggleSpoiler}
            className="size-3.5 accent-[#6E46C7]"
          />
          Spoiler-free
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[#1A1224]/80">
          <input
            type="checkbox"
            checked={filters.hasOfficialLink}
            onChange={onToggleOfficial}
            className="size-3.5 accent-[#6E46C7]"
          />
          Official reading link
        </label>
      </section>
    </div>
  );
}

function DiscoverReviewsEmptyState({
  filters,
  tagName,
  onRelax,
}: {
  filters: DiscoverFilters;
  tagName: (slug: string) => string;
  onRelax: (updates: Partial<DiscoverFilters>) => void;
}) {
  if (filters.sort === "following") {
    return (
      <MoonieEmptyState
        variant="thinking"
        title="You're not following anyone yet"
        description="Follow reviewers to see their latest and trending reviews here."
        action={
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => onRelax({ sort: "trending" })}
          >
            Browse trending
          </Button>
        }
      />
    );
  }

  if (filters.sort === "from-saves") {
    return (
      <MoonieEmptyState
        variant="thinking"
        title="Save reviews to unlock this feed"
        description="Add reviews to folders and this shelf will fill with similar picks."
        action={
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => onRelax({ sort: "trending" })}
          >
            Browse trending
          </Button>
        }
      />
    );
  }

  const relaxals: { label: string; updates: Partial<DiscoverFilters> }[] = [];
  if (filters.tags[0]) {
    relaxals.push({
      label: `Drop ${tagName(filters.tags[0])}`,
      updates: { tags: filters.tags.slice(1) },
    });
  }
  if (filters.genre) {
    relaxals.push({
      label: `Drop ${genreLabel(filters.genre)}`,
      updates: { genre: null },
    });
  }
  if (filters.spoilerFree) {
    relaxals.push({
      label: "Allow spoilers",
      updates: { spoilerFree: false },
    });
  }
  if (filters.hasOfficialLink) {
    relaxals.push({
      label: "Include all links",
      updates: { hasOfficialLink: false },
    });
  }
  if (filters.q.trim()) {
    relaxals.push({ label: "Clear search", updates: { q: "" } });
  }

  return (
    <MoonieEmptyState
      variant="thinking"
      title="Nothing on this shelf yet"
      description="Relax one filter, or ask Moonie for a next read from nearby titles."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          {relaxals.slice(0, 3).map((item) => (
            <Button
              key={item.label}
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => onRelax(item.updates)}
            >
              {item.label}
            </Button>
          ))}
          {relaxals.length === 0 ? (
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => onRelax({ sort: "trending" })}
            >
              Reset to trending
            </Button>
          ) : null}
        </div>
      }
    />
  );
}

function DiscoverPagination({
  page,
  pageSize,
  total,
  loading,
  onPrevious,
  onNext,
}: {
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (total === 0) return null;

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const hasPrevious = page > 1;
  const hasNext = page * pageSize < total;

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-3"
      aria-label="Pagination"
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={!hasPrevious || loading}
        onClick={onPrevious}
        className={cn(
          "flex size-10 items-center justify-center rounded-full transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
          hasPrevious && !loading
            ? "bg-white text-[#1A1224] ring-1 ring-[#1A1224]/10 hover:ring-[#6E46C7]/35"
            : "cursor-not-allowed bg-white/60 text-[#1A1224]/30 ring-1 ring-[#1A1224]/5"
        )}
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <span
        className="min-w-[8.5rem] text-center text-sm tabular-nums text-[#1A1224]/60"
        aria-live="polite"
      >
        {loading ? (
          <Loader2 className="mx-auto size-4 animate-spin" aria-hidden />
        ) : (
          <>
            {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}{" "}
            <span className="text-[#1A1224]/35">of</span>{" "}
            {total.toLocaleString()}
          </>
        )}
      </span>
      <button
        type="button"
        aria-label="Next page"
        disabled={!hasNext || loading}
        onClick={onNext}
        className={cn(
          "flex size-10 items-center justify-center rounded-full transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
          hasNext && !loading
            ? "bg-white text-[#1A1224] ring-1 ring-[#1A1224]/10 hover:ring-[#6E46C7]/35"
            : "cursor-not-allowed bg-white/60 text-[#1A1224]/30 ring-1 ring-[#1A1224]/5"
        )}
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </nav>
  );
}
