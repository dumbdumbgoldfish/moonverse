"use client";

import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ComponentType,
  type SVGProps,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Loader2, SlidersHorizontal } from "lucide-react";
import { useSignInPrompt } from "@/components/auth/SignInPromptProvider";
import { DiscoverFilterBar } from "@/components/discovery/DiscoverFilterBar";
import { DiscoverMoonieShelf } from "@/components/discovery/DiscoverMoonieShelf";
import { DiscoverPreviewRail } from "@/components/discovery/DiscoverPreviewRail";
import { ReviewsCompareTray } from "@/components/reviews/salon/ReviewsCompareTray";
import { ReviewsContextualShelf, ReviewsContextualShelfSkeleton } from "@/components/reviews/salon/ReviewsContextualShelf";
import { ReviewsMembershipBand } from "@/components/reviews/salon/ReviewsMembershipBand";
import { ReviewsMobilePreviewSheet } from "@/components/reviews/salon/ReviewsMobilePreviewSheet";
import { ReviewsSalonMasthead } from "@/components/reviews/salon/ReviewsSalonMasthead";
import { ReviewsSalonMoonieAside } from "@/components/reviews/salon/ReviewsSalonMoonieAside";
import { ReviewsSalonPulseAside } from "@/components/reviews/salon/ReviewsSalonPulseAside";
import { ReviewsStreamPager } from "@/components/reviews/salon/ReviewsStreamPager";
import { BrowseQuickPaths } from "@/components/search/browse/BrowseQuickPaths";
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
  markSalonVisited,
  type DiscoverTab,
} from "@/lib/discover";
import {
  parseReviewVerdictFilter,
  type ReviewVerdictFilter,
} from "@/lib/review-verdict-filter";
import { genreLabel, WEB_NOVEL_GENRES } from "@/lib/genres";
import {
  scrollToSectionId,
  scrollToSectionIdWhenReady,
} from "@/lib/scroll-to-section";
import { cn } from "@/lib/utils";
import type { CommunityStats } from "@/services/community.service";
import type { DiscoverTagPreview, TopReviewerPreview } from "@/types/discovery";
import type { FolderListItem } from "@/types/folder";
import type { GenreOption, ReviewListItem, ReviewSort } from "@/types/review";
import { LOGIN_GATED_SORTS, parseReviewSort } from "@/types/review";
import { trackReviewsEvent } from "@/lib/reviews-analytics";
import type { ReactNode } from "react";
import type { UserSearchResult } from "@/services/user.service";

const LOGIN_GATED_SORT_SET = new Set<ReviewSort>(LOGIN_GATED_SORTS);
const CONTEXTUAL_SHELF_SIZE = 8;
const SIDEBAR_STICKY = "sticky top-[calc(var(--mv-nav-h)+0.75rem)] space-y-6";
const GENRE_PREVIEW_COUNT = 12;

type IconType = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

function genreIcon(slug: string): IconType {
  return (
    (WEB_NOVEL_GENRES.find((g) => g.slug === slug)?.icon as IconType) ??
    LayoutGrid
  );
}

interface DiscoverFilters {
  q: string;
  genre: string | null;
  tags: string[];
  sort: ReviewSort;
  tab: DiscoverTab;
  spoilerFree: boolean;
  hasOfficialLink: boolean;
  verdict: ReviewVerdictFilter | null;
}

interface DiscoverPageProps {
  reviews: ReviewListItem[];
  totalReviews: number;
  reviewPageSize: number;
  profilePageSize: number;
  profiles: UserSearchResult[];
  genres: GenreOption[];
  catalogTags: CatalogTag[];
  popularTags: DiscoverTagPreview[];
  topReviewers: TopReviewerPreview[];
  communityStats?: CommunityStats;
  contextualShelfReviews?: ReviewListItem[];
  children?: ReactNode;
  folders: FolderListItem[];
  initialQuery?: string;
  initialGenre?: string;
  initialTags?: string[];
  initialSort?: ReviewSort;
  initialTab?: DiscoverTab;
  initialSpoilerFree?: boolean;
  initialHasOfficialLink?: boolean;
  initialVerdict?: ReviewVerdictFilter | null;
  initialPage?: number;
  isLoggedIn?: boolean;
  currentUserId?: string;
  /** Fetch genres/stats/reviewers after first paint. */
  loadSidebarMeta?: boolean;
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
    verdict: parseReviewVerdictFilter(params.get("verdict")),
  };
}

function filtersToParams(filters: DiscoverFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.tags.length) params.set("tags", filters.tags.join(","));
  if (filters.sort !== "trending") params.set("sort", filters.sort);
  if (filters.tab !== "reviews") params.set("tab", filters.tab);
  if (filters.spoilerFree) params.set("spoilers", "hide");
  if (filters.hasOfficialLink) params.set("link", "official");
  if (filters.verdict) params.set("verdict", filters.verdict);
  return params;
}

function pageFromSearch(search: string): number {
  const raw = new URLSearchParams(search).get("page");
  const parsed = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function filtersToParamsWithPage(
  filters: DiscoverFilters,
  page: number
): URLSearchParams {
  const params = filtersToParams(filters);
  if (page > 1) params.set("page", String(page));
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
    a.hasOfficialLink === b.hasOfficialLink &&
    a.verdict === b.verdict
  );
}

function isDefaultDiscoverPitch(filters: DiscoverFilters): boolean {
  return (
    !filters.q.trim() &&
    !filters.genre &&
    filters.tags.length === 0 &&
    !filters.spoilerFree &&
    !filters.hasOfficialLink &&
    !filters.verdict &&
    filters.sort === "trending"
  );
}

function hasActiveDiscoverFilters(filters: DiscoverFilters): boolean {
  return !isDefaultDiscoverPitch(filters);
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
  { lightweight = false }: { lightweight?: boolean } = {}
): Promise<{
  reviews: ReviewListItem[];
  profiles: UserSearchResult[];
  total: number;
} | null> {
  const params = filtersToParams(filters);
  params.set("offset", String(offset));
  params.set("limit", String(limit));
  if (lightweight) params.set("lightweight", "1");
  const response = await fetch(`/api/discover?${params.toString()}`);
  if (!response.ok) return null;
  return response.json();
}

export function ReviewsSalonPage({
  reviews: initialReviews,
  totalReviews: initialTotal,
  reviewPageSize,
  profilePageSize,
  profiles: initialProfiles,
  genres,
  catalogTags,
  popularTags,
  topReviewers,
  communityStats,
  contextualShelfReviews = [],
  children,
  folders,
  initialQuery = "",
  initialGenre,
  initialTags = [],
  initialSort = "trending",
  initialTab = "reviews",
  initialSpoilerFree = false,
  initialHasOfficialLink = false,
  initialVerdict = null,
  initialPage = 1,
  isLoggedIn = false,
  currentUserId,
  loadSidebarMeta = false,
}: DiscoverPageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { promptSignIn } = useSignInPrompt();
  const [, startTransition] = useTransition();

  const [genresState, setGenresState] = useState(genres);
  const [popularTagsState, setPopularTagsState] = useState(popularTags);
  const [topReviewersState, setTopReviewersState] = useState(topReviewers);
  const [communityStatsState, setCommunityStatsState] = useState(communityStats);
  const [foldersState, setFoldersState] = useState(folders);
  const [sidebarMetaLoading, setSidebarMetaLoading] = useState(loadSidebarMeta);

  const [filters, setFilters] = useState<DiscoverFilters>(() => ({
    q: initialQuery,
    genre: initialGenre ?? null,
    tags: initialTags,
    sort: initialSort,
    tab: "reviews",
    spoilerFree: initialSpoilerFree,
    hasOfficialLink: initialHasOfficialLink,
    verdict: initialVerdict,
  }));
  const [reviews, setReviews] = useState(initialReviews);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [preview, setPreview] = useState<ReviewListItem | null>(
    initialReviews[0] ?? null
  );
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [compareReviews, setCompareReviews] = useState<ReviewListItem[]>([]);
  const [contextualShelf, setContextualShelf] =
    useState<ReviewListItem[]>(contextualShelfReviews);

  const totalPages = Math.max(1, Math.ceil(total / reviewPageSize));

  const syncUrl = useCallback(
    (
      next: DiscoverFilters,
      nextPage = page,
      { useRouterSync = false } = {}
    ) => {
      const params = filtersToParamsWithPage(next, nextPage);
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (useRouterSync) {
        router.replace(href, { scroll: false });
      } else {
        window.history.replaceState(window.history.state, "", href);
      }
    },
    [pathname, router, page]
  );

  const loadResults = useCallback(
    async (next: DiscoverFilters, offset = 0) => {
      const fetchContextualShelf =
        offset === 0 && hasActiveDiscoverFilters(next);

      setLoading(true);
      if (fetchContextualShelf) {
        setContextualShelf([]);
      }

      try {
        const [mainData, shelfData] = await Promise.all([
          fetchDiscover(next, offset, reviewPageSize),
          fetchContextualShelf
            ? fetchDiscover(next, reviewPageSize, CONTEXTUAL_SHELF_SIZE, {
                lightweight: true,
              })
            : Promise.resolve(null),
        ]);

        if (!mainData) return;

        setReviews(mainData.reviews);
        setProfiles([]);
        setPreview(mainData.reviews[0] ?? null);
        setHighlightIndex(0);
        setTotal(mainData.total);

        if (offset === 0) {
          setContextualShelf(
            fetchContextualShelf ? (shelfData?.reviews ?? []) : []
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [reviewPageSize]
  );

  const applyFilters = useCallback(
    (updates: Partial<DiscoverFilters>, opts?: { syncNav?: boolean }) => {
      const next: DiscoverFilters = { ...filters, ...updates, tab: "reviews" };
      if (filtersEqual(filters, next)) return;
      setFilters(next);
      setPage(1);

      const returningToDefault = isDefaultDiscoverPitch(next);

      syncUrl(next, 1, {
        useRouterSync:
          opts?.syncNav === true ||
          next.q.trim() !== filters.q.trim() ||
          returningToDefault,
      });

      if (returningToDefault) return;

      startTransition(() => {
        void loadResults(next, 0);
      });
    },
    [filters, loadResults, syncUrl]
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
      verdict: initialVerdict,
    };
    // Server navigation replaces the initial result set; mirror it into the
    // interactive client state as one intentional synchronization step.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(next);
    setReviews(initialReviews);
    setProfiles(initialProfiles);
    setTotal(initialTotal);
    setPage(initialPage);
    setPreview(initialReviews[0] ?? null);
    setHighlightIndex(0);
    setContextualShelf(contextualShelfReviews);
  }, [
    initialQuery,
    initialGenre,
    initialTags,
    initialSort,
    initialSpoilerFree,
    initialHasOfficialLink,
    initialVerdict,
    initialPage,
    initialReviews,
    initialProfiles,
    initialTotal,
    contextualShelfReviews,
  ]);

  useEffect(() => {
    markSalonVisited();
  }, []);

  useEffect(() => {
    if (!loadSidebarMeta) return;
    let cancelled = false;

    void fetch("/api/reviews/salon-meta")
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (
          payload: {
            genres?: GenreOption[];
            popularTags?: DiscoverTagPreview[];
            topReviewers?: TopReviewerPreview[];
            communityStats?: CommunityStats;
            folders?: FolderListItem[];
          } | null
        ) => {
          if (cancelled || !payload) return;
          if (payload.genres) setGenresState(payload.genres);
          if (payload.popularTags) setPopularTagsState(payload.popularTags);
          if (payload.topReviewers) setTopReviewersState(payload.topReviewers);
          if (payload.communityStats) setCommunityStatsState(payload.communityStats);
          if (payload.folders) setFoldersState(payload.folders);
          setSidebarMetaLoading(false);
        }
      )
      .finally(() => {
        if (!cancelled) setSidebarMetaLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadSidebarMeta]);

  useEffect(() => {
    const onPopState = () => {
      const next = filtersFromSearch(window.location.search, isLoggedIn);
      const nextPage = pageFromSearch(window.location.search);
      setFilters(next);
      setPage(nextPage);
      startTransition(() => {
        void loadResults(next, (nextPage - 1) * reviewPageSize);
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [loadResults, isLoggedIn, reviewPageSize]);

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

  const goToPage = useCallback(
    (nextPage: number) => {
      if (nextPage < 1 || nextPage > totalPages || loading) return;
      setPage(nextPage);
      syncUrl(filters, nextPage);
      startTransition(() => {
        void loadResults(filters, (nextPage - 1) * reviewPageSize);
      });
      scrollToSectionId("review-stream", { updateHash: false });
    },
    [filters, loadResults, loading, reviewPageSize, syncUrl, totalPages]
  );

  const goToPreviousPage = useCallback(() => {
    goToPage(page - 1);
  }, [goToPage, page]);

  const goToNextPage = useCallback(() => {
    goToPage(page + 1);
  }, [goToPage, page]);

  const compareReviewIds = useMemo(
    () => new Set(compareReviews.map((review) => review.id)),
    [compareReviews]
  );

  const toggleCompare = useCallback((review: ReviewListItem) => {
    setCompareReviews((current) => {
      const exists = current.some((item) => item.id === review.id);
      if (exists) {
        return current.filter((item) => item.id !== review.id);
      }
      if (current.length >= 3) return current;
      return [...current, review];
    });
  }, []);

  const rankedGenres = [...genresState].sort(
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
    popularTagsState.find((t) => t.slug === slug)?.name ??
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

  const showDefaultPitch = isDefaultDiscoverPitch(filters);
  const showContextualShelf = !showDefaultPitch;
  const contextualShelfPending =
    showContextualShelf && loading && contextualShelf.length === 0;

  const spotlightReview = reviews.length > 1 ? reviews[1] : reviews[0] ?? null;

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
        verdict: null,
      },
      { syncNav: true }
    );
  };

  useEffect(() => {
    if (window.location.hash !== "#review-stream") return;
    scrollToSectionIdWhenReady("review-stream");
  }, [showDefaultPitch]);

  return (
    <div
      className={cn(
        "relative bg-[#FBF7F1] text-[#1A1224]",
        isLoggedIn ? "safe-bottom-pad min-h-[70vh]" : "pb-4 md:pb-6"
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(110,70,199,0.08),_transparent_60%),radial-gradient(ellipse_at_80%_20%,_rgba(200,155,74,0.08),_transparent_45%)]"
        aria-hidden
      />
      <div className={cn(SITE_SHELL_CLASS, "relative space-y-8 pt-5 sm:pt-6")}>
        <ReviewsSalonMasthead
          kicker={shelf.kicker}
          title={shelf.title}
          blurb={shelf.blurb}
          featured={reviews[0] ?? null}
          stats={communityStatsState}
          topReviewers={topReviewersState}
          isLoggedIn={isLoggedIn}
          loading={loading && !showDefaultPitch}
          showDefaultPitch={showDefaultPitch}
        />

        {showDefaultPitch ? children : null}

        {showContextualShelf ? (
          contextualShelfPending ? (
            <ReviewsContextualShelfSkeleton />
          ) : contextualShelf.length > 0 ? (
            <ReviewsContextualShelf
              genreSlug={filters.genre}
              tagSlugs={filters.tags}
              reviews={contextualShelf}
            />
          ) : null
        ) : null}

        <DiscoverMoonieShelf
          prompt={mooniePrompt}
          showGuestPrompts={!isLoggedIn}
          className="lg:hidden"
        />

        <div className="space-y-1 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={cn(
                "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-semibold",
                "border border-[#1A1224]/12 bg-white text-[#1A1224] shadow-sm",
                "transition fine-hover:border-[#6E46C7]/30 fine-hover:bg-[#6E46C7]/5"
              )}
            >
              <SlidersHorizontal className="size-4 text-[#6E46C7]" aria-hidden />
              Choose genre & filters
              {chips.length > 0 ? (
                <span className="rounded-full bg-[#6E46C7] px-2 py-0.5 text-[10px] font-bold text-white">
                  {chips.length}
                </span>
              ) : null}
            </button>
          </div>

          <BrowseQuickPaths
            genres={genresState}
            popularTags={popularTagsState}
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
              sidebarMetaLoading && genresState.length === 0 ? (
                <div
                  className="animate-pulse space-y-3 rounded-xl bg-[#1A1224]/5 p-4"
                  aria-hidden
                >
                  <div className="h-3 w-24 rounded bg-[#1A1224]/10" />
                  <div className="h-8 w-full rounded bg-[#1A1224]/8" />
                  <div className="h-8 w-full rounded bg-[#1A1224]/8" />
                </div>
              ) : (
                <DiscoverFilterPanel
                  idPrefix="mobile-discover"
                  {...filterPanelProps}
                />
              )
            }
            toolbar={null}
          />
        </div>

        <div
          id="review-stream"
          className="scroll-mt-28 border-t border-[#1A1224]/8 pt-8"
        >
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1224]/45">
                Discover stream
              </p>
              <h2 className="mt-1 font-serif text-2xl font-medium text-[#1A1224]">
                {shelf.title}
              </h2>
              <p className="mt-1 text-sm text-[#1A1224]/55">{shelf.blurb}</p>
            </div>
            {loading && reviews.length === 0 ? (
              <span className="inline-flex items-center gap-1 text-xs text-[#1A1224]/55">
                <Loader2 className="size-3 animate-spin" aria-hidden />
                Updating…
              </span>
            ) : (
              <p
                className="text-xs tabular-nums text-[#1A1224]/50"
                aria-live="polite"
              >
                {total.toLocaleString()} {total === 1 ? "review" : "reviews"}
              </p>
            )}
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_280px]">
            <aside className="hidden self-start lg:block">
              <div className={SIDEBAR_STICKY}>
                {sidebarMetaLoading && genresState.length === 0 ? (
                  <div
                    className="animate-pulse space-y-3 rounded-xl bg-[#1A1224]/5 p-4"
                    aria-hidden
                  >
                    <div className="h-3 w-24 rounded bg-[#1A1224]/10" />
                    <div className="h-8 w-full rounded bg-[#1A1224]/8" />
                    <div className="h-8 w-full rounded bg-[#1A1224]/8" />
                    <div className="h-8 w-2/3 rounded bg-[#1A1224]/8" />
                  </div>
                ) : (
                  <DiscoverFilterPanel
                    idPrefix="desktop-discover"
                    {...filterPanelProps}
                  />
                )}
                <ReviewsSalonMoonieAside prompt={mooniePrompt} className="mt-6" />
              </div>
            </aside>

            <main
              className={cn(
                "min-w-0 transition-opacity duration-150",
                loading && reviews.length === 0 && "pointer-events-none opacity-60"
              )}
            >
              {reviews.length > 0 || loading ? (
                <ReviewsStreamPager
                  reviews={reviews}
                  page={page}
                  pageSize={reviewPageSize}
                  total={total}
                  loading={loading}
                  highlightIndex={highlightIndex}
                  isLoggedIn={isLoggedIn}
                  folders={foldersState}
                  compareReviewIds={compareReviewIds}
                  onPrevious={goToPreviousPage}
                  onNext={goToNextPage}
                  onPreview={(review, index) => {
                    setPreview(review);
                    setHighlightIndex(index);
                  }}
                  onAuthRequired={() => {
                    trackReviewsEvent("sign_in_prompt", { source: "save" });
                    promptSignIn();
                  }}
                  onToggleCompare={toggleCompare}
                />
              ) : (
                <DiscoverReviewsEmptyState
                  filters={filters}
                  tagName={tagName}
                  onRelax={(updates) => applyFilters(updates)}
                />
              )}
            </main>

            <aside className="hidden self-start xl:block">
              <div className={SIDEBAR_STICKY}>
                <DiscoverPreviewRail
                  review={preview}
                  isLoggedIn={isLoggedIn}
                  folders={foldersState}
                  currentUserId={currentUserId}
                  onAuthRequired={() => promptSignIn()}
                />
                <ReviewsSalonPulseAside
                  genres={genresState}
                  spotlightReview={spotlightReview}
                  activeGenre={filters.genre}
                  onSelectGenre={(slug) => selectGenre(slug)}
                  className="mt-6"
                />
              </div>
            </aside>
          </div>
        </div>

        <ReviewsMobilePreviewSheet
          review={preview}
          open={mobilePreviewOpen}
          onOpenChange={setMobilePreviewOpen}
          isLoggedIn={isLoggedIn}
          folders={foldersState}
          onAuthRequired={() => promptSignIn()}
        />

        {!isLoggedIn ? (
          <ReviewsMembershipBand stats={communityStatsState} />
        ) : null}
      </div>

      <ReviewsCompareTray
        reviews={compareReviews}
        onRemove={(reviewId) =>
          setCompareReviews((current) =>
            current.filter((item) => item.id !== reviewId)
          )
        }
        onClear={() => setCompareReviews([])}
      />
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

/** @deprecated Use ReviewsSalonPage */
export const DiscoverPage = ReviewsSalonPage;
