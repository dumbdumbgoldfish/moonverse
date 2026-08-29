"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, FolderMinus, Loader2, Sparkles } from "lucide-react";
import { removeReviewFromFolderAction, toggleFolderFeaturedAction } from "@/actions/folder.actions";
import { ReviewResultCard } from "@/components/browse/ReviewResultCard";
import {
  SEARCH_SCROLL_PANEL_CLASS,
  WORKS_REVIEWS_GRID_CLASS,
} from "@/components/search/search-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FOLDER_REVIEWS_PAGE_SIZE } from "@/lib/folder-reviews";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import type { FolderDetail } from "@/types/folder";
import type { ReviewListItem } from "@/types/review";

interface FolderDetailViewProps {
  folder: FolderDetail;
  backHref?: string;
}

interface FolderPaginationState {
  folderId: string;
  baselineReviewsReference: ReviewListItem[];
  baselineHasMore: boolean;
  baselineReviewCount: number;
  reviews: ReviewListItem[];
  hasMore: boolean;
  reviewCount: number;
  generation: number;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function createFolderPaginationState(
  folder: FolderDetail,
  generation: number
): FolderPaginationState {
  return {
    folderId: folder.id,
    baselineReviewsReference: folder.reviews,
    baselineHasMore: folder.hasMoreReviews,
    baselineReviewCount: folder.reviewCount,
    reviews: folder.reviews,
    hasMore: folder.hasMoreReviews,
    reviewCount: folder.reviewCount,
    generation,
  };
}

function mergeFolderReviews(
  incoming: ReviewListItem[],
  local: ReviewListItem[]
) {
  const seen = new Set<string>();
  const merged: ReviewListItem[] = [];

  for (const review of incoming) {
    if (seen.has(review.id)) continue;
    seen.add(review.id);
    merged.push(review);
  }

  for (const review of local) {
    if (seen.has(review.id)) continue;
    seen.add(review.id);
    merged.push(review);
  }

  return merged;
}

export function FolderDetailView({
  folder,
  backHref = "/folders",
}: FolderDetailViewProps) {
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingRemoval, setPendingRemoval] = useState<{
    folderId: string;
    reviewId: string;
  } | null>(null);
  const [errorRecord, setErrorRecord] = useState<{
    folderId: string;
    message: string;
  } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState(() =>
    createFolderPaginationState(folder, 0)
  );

  let nextPagination = pagination;
  if (pagination.folderId !== folder.id) {
    nextPagination = createFolderPaginationState(
      folder,
      pagination.generation + 1
    );
    setPagination(nextPagination);
  } else if (
    pagination.baselineReviewsReference !== folder.reviews ||
    pagination.baselineHasMore !== folder.hasMoreReviews ||
    pagination.baselineReviewCount !== folder.reviewCount
  ) {
    nextPagination = {
      ...pagination,
      baselineReviewsReference: folder.reviews,
      baselineHasMore: folder.hasMoreReviews,
      baselineReviewCount: folder.reviewCount,
      reviews: mergeFolderReviews(folder.reviews, pagination.reviews),
      hasMore: folder.hasMoreReviews,
      reviewCount: folder.reviewCount,
      generation: pagination.generation + 1,
    };
    setPagination(nextPagination);
  }

  const reviews = nextPagination.reviews;
  const hasMore = nextPagination.hasMore;
  const reviewCount = nextPagination.reviewCount;
  const pendingReviewId =
    pendingRemoval && pendingRemoval.folderId === folder.id
      ? pendingRemoval.reviewId
      : null;
  const error =
    errorRecord && errorRecord.folderId === folder.id
      ? errorRecord.message
      : null;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    const requestFolderId = nextPagination.folderId;
    const requestGeneration = nextPagination.generation;
    const offset = nextPagination.reviews.length;

    setLoadingMore(true);
    try {
      const response = await fetch(
        `/api/folders/${requestFolderId}/reviews?offset=${offset}&limit=${FOLDER_REVIEWS_PAGE_SIZE}`,
      );
      if (!response.ok) return;

      const data = (await response.json()) as {
        reviews: ReviewListItem[];
        hasMore: boolean;
      };

      setPagination((current) => {
        if (
          current.folderId !== requestFolderId ||
          current.generation !== requestGeneration
        ) {
          return current;
        }
        const seen = new Set(current.reviews.map((review) => review.id));
        const next = data.reviews.filter((review) => !seen.has(review.id));
        return {
          ...current,
          reviews: [...current.reviews, ...next],
          hasMore: data.hasMore,
        };
      });
    } finally {
      setLoadingMore(false);
    }
  }, [
    hasMore,
    loadingMore,
    nextPagination.folderId,
    nextPagination.generation,
    nextPagination.reviews.length,
  ]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    const root = scrollRootRef.current;
    if (!sentinel || !root || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { root, rootMargin: "160px", threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, reviews.length]);

  const handleRemove = (reviewId: string) => {
    const requestFolderId = folder.id;
    setErrorRecord(null);
    setPendingRemoval({ folderId: requestFolderId, reviewId });
    startTransition(async () => {
      const result = await removeReviewFromFolderAction(requestFolderId, reviewId);
      setPendingRemoval((current) =>
        current &&
        current.folderId === requestFolderId &&
        current.reviewId === reviewId
          ? null
          : current
      );
      if (!result.success) {
        setErrorRecord({
          folderId: requestFolderId,
          message: result.error,
        });
        return;
      }
      setPagination((current) => {
        if (current.folderId !== requestFolderId) return current;
        return {
          ...current,
          reviews: current.reviews.filter((review) => review.id !== reviewId),
          reviewCount: Math.max(0, current.reviewCount - 1),
          generation: current.generation + 1,
        };
      });
      router.refresh();
    });
  };

  const handleToggleFeatured = () => {
    const requestFolderId = folder.id;
    setErrorRecord(null);
    startTransition(async () => {
      const result = await toggleFolderFeaturedAction(
        requestFolderId,
        !folder.isFeatured
      );
      if (!result.success) {
        setErrorRecord({
          folderId: requestFolderId,
          message: result.error,
        });
        return;
      }
      router.refresh();
    });
  };

  return (
    <div
      className={cn(
        SITE_SHELL_CLASS,
        "flex min-h-[calc(100dvh-4rem)] flex-col gap-6 py-6",
      )}
    >
      <div className="shrink-0 space-y-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1A1224]/55 transition hover:text-[#6E46C7]"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back to library
        </Link>

        <header className="rounded-[1.25rem] border border-[#1A1224]/8 bg-white p-5 shadow-[0_20px_48px_-36px_rgba(26,18,36,0.18)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E46C7]">
                Reading list
              </p>
              <h1 className="mt-1 font-serif text-2xl font-medium tracking-tight text-[#1A1224] sm:text-[1.75rem]">
                {folder.name}
              </h1>
              {folder.description ? (
                <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#1A1224]/65">
                  {folder.description}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {folder.isPublic ? (
                  <Badge variant="secondary" className="rounded-full">
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full">
                    Private
                  </Badge>
                )}
                {folder.isFeatured ? (
                  <Badge variant="default" className="rounded-full">
                    Featured
                  </Badge>
                ) : null}
                <span className="text-[13px] text-[#1A1224]/50">
                  {reviewCount} {reviewCount === 1 ? "story" : "stories"} · Created{" "}
                  {formatDate(folder.createdAt)}
                </span>
              </div>
            </div>

            {folder.canManage && folder.isPublic ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={handleToggleFeatured}
                disabled={isPending}
              >
                <Sparkles data-icon="inline-start" aria-hidden />
                {folder.isFeatured ? "Remove from /lists" : "Feature on /lists"}
              </Button>
            ) : null}
          </div>
        </header>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {reviewCount === 0 ? (
        <div className="shrink-0 rounded-[1.25rem] border border-dashed border-[#1A1224]/15 bg-[#FBF7F1]/60 px-6 py-16 text-center">
          <p className="font-serif text-lg text-[#1A1224]">No stories saved yet</p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] text-[#1A1224]/55">
            Browse reviews and save them to this list from any review page.
          </p>
          <Link
            href="/reviews"
            className="mt-5 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Browse reviews
          </Link>
        </div>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="mb-4 flex shrink-0 items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E46C7]">
                Saved stories
              </p>
              <h2 className="mt-1 font-serif text-xl font-medium tracking-tight text-[#1A1224]">
                {reviewCount} in this list
              </h2>
              {reviews.length < reviewCount ? (
                <p className="mt-1 text-[12px] text-[#1A1224]/50">
                  Showing {reviews.length} of {reviewCount}
                </p>
              ) : null}
            </div>
          </div>

          <div
            ref={scrollRootRef}
            className={cn(SEARCH_SCROLL_PANEL_CLASS, "min-h-0 flex-1 p-4 sm:p-5")}
            aria-label="Saved stories"
          >
            <div className={WORKS_REVIEWS_GRID_CLASS}>
              {reviews.map((review) => (
                <div key={review.id} className="group relative">
                  <ReviewResultCard review={review} />
                  {folder.canManage ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "absolute right-3 top-3 z-10 h-8 gap-1.5 border-white/80 bg-white/95 px-2.5 text-[11px] shadow-sm",
                        "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
                        "motion-reduce:opacity-100",
                      )}
                      onClick={() => handleRemove(review.id)}
                      disabled={isPending && pendingReviewId === review.id}
                      aria-label={`Remove ${review.novelTitle} from list`}
                    >
                      <FolderMinus className="size-3.5" aria-hidden />
                      Remove
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>

            {hasMore ? (
              <div
                ref={loadMoreRef}
                className="flex items-center justify-center py-6 text-sm text-[#1A1224]/50"
                aria-live="polite"
              >
                {loadingMore ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading more stories…
                  </span>
                ) : (
                  "Scroll for more"
                )}
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
