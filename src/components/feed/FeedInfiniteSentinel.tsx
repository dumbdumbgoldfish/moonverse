"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Loader2 } from "lucide-react";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";

interface FeedInfiniteSentinelProps {
  /** Scroll container for desktop column scroll; ignored when it is not scrollable. */
  rootRef?: RefObject<HTMLElement | null>;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  disabled?: boolean;
  error?: string | null;
}

function resolveScrollRoot(
  candidate: HTMLElement | null | undefined
): Element | null {
  if (!candidate || typeof window === "undefined") return null;
  const style = window.getComputedStyle(candidate);
  const overflowY = style.overflowY;
  const isScrollable =
    (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
    candidate.scrollHeight > candidate.clientHeight + 1;
  return isScrollable ? candidate : null;
}

/**
 * Intersection Observer trigger for feed infinite scroll.
 * Uses the centre column as root on desktop; falls back to the viewport on mobile.
 */
export function FeedInfiniteSentinel({
  rootRef,
  hasMore,
  isLoading,
  onLoadMore,
  disabled = false,
  error = null,
}: FeedInfiniteSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || disabled || !hasMore || isLoading) return;

    let observer: IntersectionObserver | null = null;

    const connect = () => {
      observer?.disconnect();
      const root = resolveScrollRoot(rootRef?.current ?? null);
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            onLoadMore();
          }
        },
        {
          root,
          rootMargin: "280px 0px",
          threshold: 0,
        }
      );
      observer.observe(node);
    };

    connect();

    const media = window.matchMedia("(min-width: 1280px)");
    media.addEventListener("change", connect);

    return () => {
      media.removeEventListener("change", connect);
      observer?.disconnect();
    };
  }, [rootRef, hasMore, isLoading, disabled, onLoadMore]);

  if (disabled) return null;

  return (
    <div className="space-y-3 py-2" aria-live="polite">
      {error ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-[var(--mv-text-muted)]">
            <Loader2 className="size-4 animate-spin text-[var(--mv-plum)]" aria-hidden />
            Loading more reviews…
          </div>
          <FeedSkeleton count={2} />
        </div>
      ) : null}

      {!hasMore && !isLoading ? (
        <p className="py-6 text-center text-sm font-medium text-[var(--mv-text-muted)]">
          You&apos;ve reached the end of the feed.
        </p>
      ) : null}

      {/* Always mounted while more pages exist so IO can re-arm after each load. */}
      {hasMore ? (
        <div
          ref={sentinelRef}
          className="h-1 w-full"
          aria-hidden
          data-feed-infinite-sentinel
        />
      ) : null}
    </div>
  );
}
