"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { NovelCarouselArrow } from "@/components/novels/NovelCarouselArrow";
import { ProfileReadingListShelfNovelCard } from "@/components/users/ProfileReadingListShelfNovelCard";
import {
  profileCarouselCardWidthClass,
  useProfileCarouselCardsPerView,
  PROFILE_CAROUSEL_LOAD_MORE_MIN_HEIGHT,
} from "@/components/users/profile-carousel-layout";
import { READING_LIST_SHELF_PAGE_SIZE } from "@/lib/reading-list-shelf";
import { formatCompactCount } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import type {
  ReadingListPreview,
  ReadingListShelfNovel,
} from "@/types/discovery";

interface ProfileReadingListShelfProps {
  list: ReadingListPreview;
}

interface ShelfPaginationState {
  listId: string;
  baselineNovelsReference: ReadingListShelfNovel[];
  baselineHasMore: boolean;
  novels: ReadingListShelfNovel[];
  hasMore: boolean;
  generation: number;
}

const EMPTY_SHELF_NOVELS: ReadingListShelfNovel[] = [];

function incomingShelfNovels(list: ReadingListPreview) {
  return list.novels ?? EMPTY_SHELF_NOVELS;
}

function incomingShelfHasMore(list: ReadingListPreview) {
  return list.hasMoreNovels ?? false;
}

function createShelfPaginationState(
  list: ReadingListPreview,
  generation: number
): ShelfPaginationState {
  const novels = incomingShelfNovels(list);
  const hasMore = incomingShelfHasMore(list);
  return {
    listId: list.id,
    baselineNovelsReference: novels,
    baselineHasMore: hasMore,
    novels,
    hasMore,
    generation,
  };
}

function mergeShelfNovels(
  incoming: ReadingListShelfNovel[],
  local: ReadingListShelfNovel[]
) {
  const seen = new Set<string>();
  const merged: ReadingListShelfNovel[] = [];

  for (const novel of incoming) {
    if (seen.has(novel.novelId)) continue;
    seen.add(novel.novelId);
    merged.push(novel);
  }

  for (const novel of local) {
    if (seen.has(novel.novelId)) continue;
    seen.add(novel.novelId);
    merged.push(novel);
  }

  return merged;
}

export function ProfileReadingListShelf({ list }: ProfileReadingListShelfProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const cardsPerView = useProfileCarouselCardsPerView();
  const [loadingMore, setLoadingMore] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [pagination, setPagination] = useState(() =>
    createShelfPaginationState(list, 0)
  );

  const incomingNovels = incomingShelfNovels(list);
  const incomingHasMore = incomingShelfHasMore(list);
  let nextPagination = pagination;
  if (pagination.listId !== list.id) {
    nextPagination = createShelfPaginationState(list, pagination.generation + 1);
    setPagination(nextPagination);
  } else if (
    pagination.baselineNovelsReference !== incomingNovels ||
    pagination.baselineHasMore !== incomingHasMore
  ) {
    nextPagination = {
      ...pagination,
      baselineNovelsReference: incomingNovels,
      baselineHasMore: incomingHasMore,
      novels: mergeShelfNovels(incomingNovels, pagination.novels),
      hasMore: incomingHasMore,
      generation: pagination.generation + 1,
    };
    setPagination(nextPagination);
  }

  const novels = nextPagination.novels;
  const hasMore = nextPagination.hasMore;

  const listHref = list.href ?? `/folders/${list.id}`;
  const storyLabel =
    list.reviewCount === 1 ? "story" : "stories";

  const updateArrows = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const maxScroll = node.scrollWidth - node.clientWidth;
    setCanPrev(node.scrollLeft > 8);
    setCanNext(maxScroll > 8 && node.scrollLeft < maxScroll - 8);
  }, []);

  const loadMoreNovels = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    const requestListId = nextPagination.listId;
    const requestGeneration = nextPagination.generation;
    const offset = nextPagination.novels.length;

    setLoadingMore(true);
    try {
      const response = await fetch(
        `/api/folders/${requestListId}/shelf-novels?offset=${offset}&limit=${READING_LIST_SHELF_PAGE_SIZE}`
      );
      if (!response.ok) return;

      const data = (await response.json()) as {
        novels: ReadingListShelfNovel[];
        hasMore: boolean;
      };

      setPagination((current) => {
        if (
          current.listId !== requestListId ||
          current.generation !== requestGeneration
        ) {
          return current;
        }
        const seen = new Set(current.novels.map((novel) => novel.novelId));
        const next: ReadingListShelfNovel[] = [];
        for (const novel of data.novels) {
          if (seen.has(novel.novelId)) continue;
          seen.add(novel.novelId);
          next.push(novel);
        }
        return {
          ...current,
          novels: [...current.novels, ...next],
          hasMore: data.hasMore,
        };
      });
    } finally {
      setLoadingMore(false);
    }
  }, [
    hasMore,
    loadingMore,
    nextPagination.generation,
    nextPagination.listId,
    nextPagination.novels.length,
  ]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    node.scrollLeft = 0;
    updateArrows();

    const onScroll = () => updateArrows();
    node.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(() => updateArrows());
    observer.observe(node);

    return () => {
      node.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [novels.length, cardsPerView, updateArrows]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    const scroller = scrollerRef.current;
    if (!sentinel || !scroller || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMoreNovels();
        }
      },
      { root: scroller, rootMargin: "120px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMoreNovels, novels.length]);

  function scrollShelf(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cardWidth = node.clientWidth / Math.max(cardsPerView, 1);
    node.scrollBy({
      left: direction * cardWidth * Math.max(cardsPerView - 0.5, 1),
      behavior: prefersReduced ? "auto" : "smooth",
    });
  }

  return (
    <section
      className="min-w-0"
      aria-label={`${list.name} reading list shelf`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={listHref}
            className="line-clamp-2 font-serif text-xl font-bold leading-tight text-[#1A1224] transition-colors hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {list.name}
          </Link>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-[#1A1224]/55">
            <span>
              Reading List · {formatCompactCount(list.reviewCount)} {storyLabel}
            </span>
            {!list.isPublic ? (
              <span className="inline-flex items-center gap-1 text-xs">
                <Lock className="size-3" aria-hidden="true" />
                Private
              </span>
            ) : null}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <NovelCarouselArrow
            direction="prev"
            disabled={!canPrev}
            onClick={() => scrollShelf(-1)}
            label={`Scroll ${list.name} shelf left`}
          />
          <NovelCarouselArrow
            direction="next"
            disabled={!canNext && !hasMore}
            onClick={() => {
              scrollShelf(1);
              if (hasMore) void loadMoreNovels();
            }}
            label={`Scroll ${list.name} shelf right`}
          />
        </div>
      </div>

      {novels.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-[#1A1224]/15 px-4 py-8 text-center text-sm text-[#1A1224]/55">
          No stories in this list yet.
        </p>
      ) : (
        <div
          ref={scrollerRef}
          className={cn(
            "mt-4 flex items-start gap-4 overflow-x-auto overscroll-x-contain px-1.5 py-1 scrollbar-hide",
            "snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch]"
          )}
        >
          {novels.map((novel) => (
            <div
              key={novel.novelId}
              className={cn(
                "shrink-0 snap-start",
                profileCarouselCardWidthClass(cardsPerView)
              )}
            >
              <ProfileReadingListShelfNovelCard novel={novel} />
            </div>
          ))}
          {hasMore ? (
            <div
              ref={loadMoreRef}
              className={cn(
                "flex shrink-0 snap-start items-center justify-center rounded-xl border border-dashed border-[#1A1224]/15 bg-[#FFFBFF] text-xs font-medium text-[#1A1224]/45",
                profileCarouselCardWidthClass(cardsPerView),
                PROFILE_CAROUSEL_LOAD_MORE_MIN_HEIGHT
              )}
              aria-hidden={!loadingMore}
            >
              {loadingMore ? "Loading more…" : ""}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
