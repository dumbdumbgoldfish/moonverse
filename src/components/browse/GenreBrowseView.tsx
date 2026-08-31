"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { BrowseComparePanel } from "@/components/browse/BrowseComparePanel";
import { BrowseCompareTray } from "@/components/browse/BrowseCompareTray";
import { BrowseEmptyState } from "@/components/browse/BrowseEmptyState";
import { GenreHeroCard } from "@/components/browse/GenreHeroCard";
import {
  genreBrowseSortToApi,
  type GenreBrowseSort,
} from "@/lib/browse-sort";
import { GenreTagFilters } from "@/components/browse/GenreTagFilters";
import { ResultsToolbar } from "@/components/browse/ResultsToolbar";
import { ReviewResultCard } from "@/components/browse/ReviewResultCard";
import { WorkPreviewDrawer } from "@/components/browse/WorkPreviewDrawer";
import { WorkResultCard } from "@/components/browse/WorkResultCard";
import { getGenrePresentation } from "@/lib/genre-presentation";
import {
  moonieEntryHref,
  moonieLoggedInEntryHref,
} from "@/lib/moonie/open-moonie";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import type { BrowseMode, BrowseWorkItem } from "@/types/browse";
import type { ReviewListItem } from "@/types/review";

interface BrowseTag {
  name: string;
  slug: string;
}

interface GenreBrowseViewProps {
  genreSlug: string;
  initialMode?: BrowseMode;
  initialReviews: ReviewListItem[];
  initialWorks: BrowseWorkItem[];
  initialTotal: number;
  novelCount?: number;
  /** Shelf covers for the genre hero mosaic (may differ from current page results). */
  heroCovers?: Array<{
    novelId: string;
    title: string;
    author: string;
    coverUrl: string;
  }>;
  tags: BrowseTag[];
  initialTagSlugs?: string[];
  initialSort?: GenreBrowseSort;
  initialOfficialOnly?: boolean;
  isAuthenticated?: boolean;
}

const MAX_TAGS = 5;
const PAGE_SIZE = 15;
const MAX_COMPARE = 3;
const WORKS_ONLY_SORTS = new Set<GenreBrowseSort>([
  "community-strength",
  "catalogue-confidence",
  "affinity",
]);

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function GenreBrowseView({
  genreSlug,
  initialMode = "works",
  initialReviews,
  initialWorks,
  initialTotal,
  novelCount,
  heroCovers,
  tags,
  initialTagSlugs = [],
  initialSort = "hot",
  initialOfficialOnly = false,
  isAuthenticated = false,
}: GenreBrowseViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [, startTransition] = useTransition();

  const [mode, setMode] = useState<BrowseMode>(initialMode);
  const [sort, setSort] = useState<GenreBrowseSort>(initialSort);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTagSlugs);
  const [officialOnly, setOfficialOnly] = useState(initialOfficialOnly);
  const [reviews, setReviews] = useState(initialReviews);
  const [works, setWorks] = useState(initialWorks);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  /** Grid stays on the last loaded mode until the next fetch lands (avoids empty flash). */
  const [renderedMode, setRenderedMode] = useState<BrowseMode>(initialMode);
  const [previewWork, setPreviewWork] = useState<BrowseWorkItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [compareWorks, setCompareWorks] = useState<BrowseWorkItem[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const cardNodes = useRef(new Map<string, HTMLElement>());
  const skipNextFetch = useRef(true);

  const presentation = getGenrePresentation(genreSlug);

  const selectedTagObjects = useMemo(
    () =>
      selectedTags
        .map((slug) => tags.find((t) => t.slug === slug))
        .filter((t): t is BrowseTag => Boolean(t)),
    [selectedTags, tags]
  );

  const moonieHref = session?.user
    ? moonieLoggedInEntryHref()
    : moonieEntryHref();

  const hasActiveFilters = selectedTags.length > 0 || officialOnly;
  const compareIds = useMemo(
    () => new Set(compareWorks.map((work) => work.novelId)),
    [compareWorks]
  );

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      const next = params.toString();
      const href = next ? `${pathname}?${next}` : pathname;
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const buildParams = useCallback(
    (extra?: Record<string, string>) => {
      const params = new URLSearchParams();
      params.set("genre", genreSlug);
      params.set("mode", mode);
      if (selectedTags.length) params.set("tags", selectedTags.join(","));
      params.set(
        "sort",
        WORKS_ONLY_SORTS.has(sort) ? sort : genreBrowseSortToApi(sort)
      );
      if (officialOnly) params.set("link", "official");
      params.set("limit", String(PAGE_SIZE));
      if (extra) {
        for (const [key, value] of Object.entries(extra)) {
          params.set(key, value);
        }
      }
      return params;
    },
    [genreSlug, mode, officialOnly, selectedTags, sort]
  );

  const fetchPage = useCallback(
    async (extra: Record<string, string>) => {
      const response = await fetch(`/api/browse?${buildParams(extra).toString()}`);
      if (!response.ok) return null;
      return (await response.json()) as {
        mode?: BrowseMode;
        reviews?: ReviewListItem[];
        works?: BrowseWorkItem[];
        total: number;
      };
    },
    [buildParams]
  );

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setFocusIndex(-1);
      try {
        const data = await fetchPage({
          offset: String((page - 1) * PAGE_SIZE),
        });
        if (!data || cancelled) return;
        setTotal(data.total);
        const nextMode = data.mode ?? mode;
        if (nextMode === "works") {
          setWorks(data.works ?? []);
          setReviews([]);
        } else {
          setReviews(data.reviews ?? []);
          setWorks([]);
        }
        setRenderedMode(nextMode);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [fetchPage, mode, page]);

  // Fetch skips the first effect pass so SSR payload is kept.
  const resetPage = () => setPage(1);

  const toggleTag = (slug: string) => {
    const next = selectedTags.includes(slug)
      ? selectedTags.filter((t) => t !== slug)
      : selectedTags.length >= MAX_TAGS
        ? selectedTags
        : [...selectedTags, slug];
    setSelectedTags(next);
    resetPage();
    updateUrl({ tags: next.length ? next.join(",") : null });
  };

  const removeTag = (slug: string) => {
    const next = selectedTags.filter((t) => t !== slug);
    setSelectedTags(next);
    resetPage();
    updateUrl({ tags: next.length ? next.join(",") : null });
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setOfficialOnly(false);
    resetPage();
    updateUrl({ tags: null, link: null });
  };

  const relaxFilters = () => {
    if (selectedTags.length > 0) {
      const next = selectedTags.slice(0, -1);
      setSelectedTags(next);
      resetPage();
      updateUrl({ tags: next.length ? next.join(",") : null });
      return;
    }
    if (officialOnly) {
      setOfficialOnly(false);
      resetPage();
      updateUrl({ link: null });
    }
  };

  const handleSortChange = (value: GenreBrowseSort) => {
    setSort(value);
    resetPage();
    updateUrl({ sort: value === "hot" ? null : value });
  };

  const handleModeChange = (value: BrowseMode) => {
    if (value === mode) return;
    setMode(value);
    resetPage();
    setLoading(true);
    setFocusIndex(-1);
    const nextSort =
      value === "reviews" && WORKS_ONLY_SORTS.has(sort) ? "hot" : sort;
    if (nextSort !== sort) setSort(nextSort);
    updateUrl({
      mode: value === "works" ? null : value,
      sort: nextSort === "hot" ? null : nextSort,
    });
  };

  const handleOfficialOnlyChange = (value: boolean) => {
    setOfficialOnly(value);
    resetPage();
    updateUrl({ link: value ? "official" : null });
  };

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openPreview = (work: BrowseWorkItem) => {
    setPreviewWork(work);
    setPreviewOpen(true);
  };

  const toggleCompare = (work: BrowseWorkItem) => {
    setCompareWorks((prev) => {
      if (prev.some((row) => row.novelId === work.novelId)) {
        return prev.filter((row) => row.novelId !== work.novelId);
      }
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, work];
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Escape") {
        if (compareOpen) {
          setCompareOpen(false);
          return;
        }
        if (previewOpen) {
          setPreviewOpen(false);
          return;
        }
        setFocusIndex(-1);
        return;
      }

      if (isTypingTarget(event.target)) return;
      if (previewOpen || compareOpen) return;

      if (event.key === "/") {
        event.preventDefault();
        document.getElementById("browse-tag-filters")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        const firstTag = document.querySelector<HTMLElement>(
          "#browse-tag-filters button"
        );
        firstTag?.focus();
        return;
      }

      if (mode !== "works" || works.length === 0) return;

      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        setFocusIndex((prev) => {
          const next = prev < 0 ? 0 : Math.min(prev + 1, works.length - 1);
          const work = works[next];
          const node = work ? cardNodes.current.get(work.novelId) : null;
          node?.focus();
          node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return next;
        });
        return;
      }

      if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        setFocusIndex((prev) => {
          const next =
            prev < 0 ? 0 : Math.max(prev - 1, 0);
          const work = works[next];
          const node = work ? cardNodes.current.get(work.novelId) : null;
          node?.focus();
          node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return next;
        });
        return;
      }

      if (event.key === "Enter" && focusIndex >= 0) {
        const work = works[focusIndex];
        if (!work) return;
        event.preventDefault();
        openPreview(work);
        return;
      }

      if ((event.key === "c" || event.key === "C") && focusIndex >= 0) {
        const work = works[focusIndex];
        if (!work) return;
        event.preventDefault();
        toggleCompare(work);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    compareOpen,
    focusIndex,
    mode,
    previewOpen,
    works,
  ]);

  if (!presentation) return null;

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const hasPrevious = page > 1;
  const hasNext = page * PAGE_SIZE < total;
  const showingWorks = renderedMode === "works";
  const isEmpty =
    !loading &&
    ((showingWorks && works.length === 0) ||
      (!showingWorks && reviews.length === 0));

  return (
    <div
      className={cn(
        SITE_SHELL_CLASS,
        "safe-bottom-pad py-3 md:py-4",
        compareWorks.length > 0 && "pb-28"
      )}
    >
      <div className="space-y-3">
        <GenreHeroCard
          compact
          eyebrow="Browse"
          title={presentation.label}
          description={presentation.description}
          icon={presentation.icon}
          accentClass={presentation.accentClass}
          softBackgroundClass={presentation.softBackgroundClass}
          iconContainerClass={presentation.iconContainerClass}
          decorClass={presentation.decorClass}
          reviewCount={showingWorks ? undefined : total}
          novelCount={novelCount}
          covers={
            heroCovers && heroCovers.length > 0
              ? heroCovers
              : works.slice(0, 4).map((work) => ({
                  novelId: work.novelId,
                  title: work.title,
                  author: work.author,
                  coverUrl: work.coverUrl,
                }))
          }
          moonieHref={moonieHref}
        />

        <GenreTagFilters
          genreSlug={genreSlug}
          tags={tags}
          selectedTags={selectedTags}
          maxTags={MAX_TAGS}
          onToggle={toggleTag}
          softBackgroundClass={presentation.softBackgroundClass}
        />

        <ResultsToolbar
          mode={mode}
          onModeChange={handleModeChange}
          total={total}
          sort={sort}
          onSortChange={handleSortChange}
          loading={loading}
          selectedTags={selectedTagObjects}
          onRemoveTag={removeTag}
          onClearTags={clearFilters}
          officialOnly={officialOnly}
          onOfficialOnlyChange={handleOfficialOnlyChange}
          moonieHref={moonieHref}
          isAuthenticated={isAuthenticated}
        />

        <div
          className={cn(
            "grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3",
            loading &&
              (works.length > 0 || reviews.length > 0) &&
              "pointer-events-none opacity-60"
          )}
          aria-busy={loading}
        >
          {isEmpty ? (
            <div className="col-span-full">
              <BrowseEmptyState
                genreName={presentation.label}
                genreSlug={genreSlug}
                mode={mode}
                hasActiveFilters={hasActiveFilters}
                canRelax={hasActiveFilters}
                moonieHref={moonieHref}
                onClearFilters={clearFilters}
                onRelaxFilters={relaxFilters}
              />
            </div>
          ) : null}

          {showingWorks
            ? works.map((work, index) => (
                <WorkResultCard
                  key={work.novelId}
                  work={work}
                  priority={index < 4}
                  onPreview={openPreview}
                  compared={compareIds.has(work.novelId)}
                  onToggleCompare={toggleCompare}
                  focused={focusIndex === index}
                  cardRef={(node) => {
                    if (node) cardNodes.current.set(work.novelId, node);
                    else cardNodes.current.delete(work.novelId);
                  }}
                />
              ))
            : reviews.map((review, index) => (
                <ReviewResultCard
                  key={review.id}
                  review={review}
                  priority={page === 1 && index < 4}
                />
              ))}
        </div>

        {total > 0 && (
          <nav
            className="flex items-center justify-center gap-3 pt-2"
            aria-label="Pagination"
          >
            <button
              type="button"
              aria-label="Previous page"
              disabled={!hasPrevious || loading}
              onClick={() => goToPage(page - 1)}
              className={cn(
                "flex size-10 items-center justify-center rounded-full transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6246ea]",
                hasPrevious && !loading
                  ? "bg-white text-[#1a1033] ring-1 ring-[#1a1033]/10 hover:ring-[#6246ea]/35"
                  : "cursor-not-allowed bg-white/60 text-[#1a1033]/30 ring-1 ring-[#1a1033]/5"
              )}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>

            <span
              className="min-w-[8.5rem] text-center text-sm tabular-nums text-[#4c3d6e]"
              aria-live="polite"
            >
              {loading ? (
                <Loader2 className="mx-auto size-4 animate-spin" aria-hidden />
              ) : (
                <>
                  {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}{" "}
                  <span className="text-[#1a1033]/40">of</span>{" "}
                  {total.toLocaleString()}
                </>
              )}
            </span>

            <button
              type="button"
              aria-label="Next page"
              disabled={!hasNext || loading}
              onClick={() => goToPage(page + 1)}
              className={cn(
                "flex size-10 items-center justify-center rounded-full transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6246ea]",
                hasNext && !loading
                  ? "bg-white text-[#1a1033] ring-1 ring-[#1a1033]/10 hover:ring-[#6246ea]/35"
                  : "cursor-not-allowed bg-white/60 text-[#1a1033]/30 ring-1 ring-[#1a1033]/5"
              )}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </nav>
        )}
      </div>

      <WorkPreviewDrawer
        work={previewWork}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        genreLabel={presentation.label}
      />

      <BrowseCompareTray
        works={compareWorks}
        onRemove={(novelId) =>
          setCompareWorks((prev) => prev.filter((work) => work.novelId !== novelId))
        }
        onClear={() => setCompareWorks([])}
        onOpenCompare={() => setCompareOpen(true)}
      />

      <BrowseComparePanel
        works={compareWorks}
        open={compareOpen}
        onOpenChange={setCompareOpen}
      />
    </div>
  );
}
