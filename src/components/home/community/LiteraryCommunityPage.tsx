"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CommunityPageHeader } from "@/components/home/community/CommunityPageHeader";
import { CommunityLeftRail } from "@/components/home/community/CommunityLeftRail";
import { LiteraryDiscoveryRail } from "@/components/home/community/LiteraryDiscoveryRail";
import { EditorialFeedFilters } from "@/components/home/community/EditorialFeedFilters";
import { LiteraryReviewCard } from "@/components/home/community/LiteraryReviewCard";
import { CommunityEmptyState } from "@/components/home/community/CommunityEmptyState";
import { CommunitySalonPrompt } from "@/components/home/community/CommunitySalonPrompt";
import { CommunityLaneFilters } from "@/components/home/community/CommunityLaneFilters";
import {
  buildCommunityLanes,
  resolveCommunityLane,
  reviewMatchesLane,
  type CommunityLane,
} from "@/lib/community-lanes";
import { CommunityReviewOverlay } from "@/components/community/CommunityReviewOverlay";
import { FeedInfiniteSentinel } from "@/components/feed/FeedInfiniteSentinel";
import {
  attachFeedReasons,
  type FeedReasonContext,
} from "@/lib/feed-reasons";
import {
  diversifyByReviewer,
  FEED_PAGE_SIZE,
  type HomeFeedTab,
} from "@/lib/feed";
import {
  LITERARY_PAGE_BG,
  LITERARY_SALON_STYLE,
} from "@/lib/literary-salon";
import { getInitials } from "@/lib/review-utils";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import type { PreferredGenreOption } from "@/services/preference.service";
import type { ReadingTasteSnapshot } from "@/services/feed.service";
import type { CommunityDeskSnapshot } from "@/services/community-desk.service";
import type { TasteInsightSnapshot } from "@/lib/taste-signature";
import type { TopReviewerPreview } from "@/types/discovery";
import type { FolderListItem } from "@/types/folder";
import type { CommentItem, ReviewListItem } from "@/types/review";

const LANE_TARGET_VISIBLE = 4;
const LANE_PREFETCH_MAX_ATTEMPTS = 8;

interface FeedPagePayload {
  reviews: ReviewListItem[];
  likedReviewIds: string[];
  followingReviewerIds: string[];
  comments: Record<string, CommentItem[]>;
  savedFolderIds: Record<string, string[]>;
  hasMore: boolean;
  nextOffset: number;
}

interface LiteraryCommunityPageProps {
  feed: HomeFeedTab;
  initialReviews: ReviewListItem[];
  initialHasMore: boolean;
  likedReviewIds: string[];
  followingReviewerIds: string[];
  commentsByReview: Record<string, CommentItem[]>;
  savedFolderIdsByReview: Record<string, string[]>;
  folders: FolderListItem[];
  taste: ReadingTasteSnapshot;
  tasteInsight: TasteInsightSnapshot;
  desk: CommunityDeskSnapshot;
  suggestedReviewers: TopReviewerPreview[];
  currentUserId: string;
  displayName: string;
  username?: string;
  avatarUrl?: string | null;
  preferredGenres?: PreferredGenreOption[];
  followerCount?: number;
  learningTaste?: boolean;
  communityBasePath?: string;
}

export function LiteraryCommunityPage({
  feed,
  initialReviews,
  initialHasMore,
  likedReviewIds,
  followingReviewerIds,
  commentsByReview,
  savedFolderIdsByReview,
  folders,
  taste,
  tasteInsight,
  desk,
  suggestedReviewers,
  currentUserId,
  displayName,
  username,
  avatarUrl,
  preferredGenres = [],
  followerCount = 0,
  learningTaste = false,
  communityBasePath = "/community",
}: LiteraryCommunityPageProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [likedIds, setLikedIds] = useState(() => new Set(likedReviewIds));
  const [followingIds, setFollowingIds] = useState(
    () => new Set(followingReviewerIds)
  );
  const [, setComments] = useState(commentsByReview);
  const [savedMap, setSavedMap] = useState(savedFolderIdsByReview);
  const [offset, setOffset] = useState(initialReviews.length);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [laneFilter, setLaneFilter] = useState<CommunityLane | null>(null);
  const [laneSearch, setLaneSearch] = useState({
    key: `${feed}:`,
    exhausted: false,
  });

  const feedScrollRef = useRef<HTMLDivElement>(null);
  const loadingLockRef = useRef(false);
  const offsetRef = useRef(offset);
  const hasMoreRef = useRef(hasMore);
  const followingIdsRef = useRef(followingIds);
  const activeLaneRef = useRef<CommunityLane | null>(null);
  const lanePrefetchAttemptsRef = useRef({ key: `${feed}:`, count: 0 });
  const reviewsRef = useRef(reviews);

  const handle = username || "reader";
  const avatarInitials = getInitials(displayName || handle);
  const diversify = feed === "for-you" || feed === "following";
  const lanes = useMemo(
    () =>
      buildCommunityLanes(
        preferredGenres.length > 0 ? preferredGenres : taste.topGenres
      ),
    [preferredGenres, taste.topGenres]
  );
  const activeLane = laneFilter;
  const activeLaneId = laneFilter?.id ?? null;
  const laneSearchKey = `${feed}:${activeLaneId ?? ""}`;
  const laneSearchExhausted =
    laneSearch.key === laneSearchKey && laneSearch.exhausted;
  const visibleReviews = useMemo(
    () =>
      activeLane
        ? reviews.filter((review) => reviewMatchesLane(review, activeLane))
        : reviews,
    [activeLane, reviews]
  );
  const lanePrefetching =
    Boolean(activeLane) &&
    !laneSearchExhausted &&
    hasMore &&
    visibleReviews.length < LANE_TARGET_VISIBLE;

  useEffect(() => {
    reviewsRef.current = reviews;
  }, [reviews]);

  useEffect(() => {
    activeLaneRef.current = activeLane;
  }, [activeLane]);

  useEffect(() => {
    offsetRef.current = offset;
    hasMoreRef.current = hasMore;
    followingIdsRef.current = followingIds;
  }, [offset, hasMore, followingIds]);

  useEffect(() => {
    const key = `mv-community-scroll:${feed}`;
    const column = feedScrollRef.current;
    const desktop = () => window.matchMedia("(min-width: 1280px)").matches;

    const restore = () => {
      const stored = Number(sessionStorage.getItem(key) || 0);
      if (!stored) return;
      requestAnimationFrame(() => {
        if (desktop() && column) column.scrollTop = stored;
        else window.scrollTo(0, stored);
      });
    };
    restore();

    const persist = () => {
      const value = desktop() && column ? column.scrollTop : window.scrollY;
      sessionStorage.setItem(key, String(value));
    };

    column?.addEventListener("scroll", persist, { passive: true });
    window.addEventListener("scroll", persist, { passive: true });
    return () => {
      persist();
      column?.removeEventListener("scroll", persist);
      window.removeEventListener("scroll", persist);
    };
  }, [feed]);

  // Desktop: lock document scroll so only the three columns move.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const sync = () => {
      document.documentElement.classList.toggle(
        "mv-community-scroll-lock",
        media.matches
      );
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
      document.documentElement.classList.remove("mv-community-scroll-lock");
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingLockRef.current || !hasMoreRef.current) return;

    const lane = activeLaneRef.current;
    const searchKey = `${feed}:${lane?.id ?? ""}`;
    if (lane && lanePrefetchAttemptsRef.current.key !== searchKey) {
      lanePrefetchAttemptsRef.current = { key: searchKey, count: 0 };
    }
    const visibleBefore = lane
      ? reviewsRef.current.filter((review) => reviewMatchesLane(review, lane))
          .length
      : 0;

    loadingLockRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/feed?feed=${feed}&offset=${offsetRef.current}&limit=${FEED_PAGE_SIZE}`
      );
      if (!response.ok) {
        throw new Error("Unable to load more reviews.");
      }
      const data = (await response.json()) as FeedPagePayload;

      const prev = reviewsRef.current;
      const seen = new Set(prev.map((item) => item.id));
      let next = data.reviews.filter((item) => !seen.has(item.id));
      const lastReviewer = prev[prev.length - 1]?.reviewerId ?? null;
      if (diversify) {
        next = diversifyByReviewer(next, lastReviewer);
      }
      if (feed === "for-you") {
        const reasonContext: FeedReasonContext = {
          topGenres: taste.topGenres,
          topTag: taste.topTag,
          preferredGenreNames: preferredGenres.map((genre) => genre.name),
          followingIds: new Set([
            ...followingIdsRef.current,
            ...data.followingReviewerIds,
          ]),
        };
        next = attachFeedReasons(next, reasonContext);
      }

      const merged = [...prev, ...next];
      reviewsRef.current = merged;
      setReviews(merged);
      setLikedIds((current) => {
        const updated = new Set(current);
        for (const id of data.likedReviewIds) updated.add(id);
        return updated;
      });
      setFollowingIds((current) => {
        const updated = new Set(current);
        for (const id of data.followingReviewerIds) updated.add(id);
        return updated;
      });
      setComments((current) => ({ ...current, ...data.comments }));
      setSavedMap((current) => ({ ...current, ...data.savedFolderIds }));
      setOffset(data.nextOffset);
      setHasMore(data.hasMore);

      if (lane) {
        const visibleAfter = merged.filter((review) =>
          reviewMatchesLane(review, lane)
        ).length;

        if (!data.hasMore && visibleAfter === 0) {
          setLaneSearch({ key: searchKey, exhausted: true });
        } else if (
          data.reviews.length > 0 &&
          visibleAfter < LANE_TARGET_VISIBLE
        ) {
          if (visibleAfter <= visibleBefore) {
            const attempts = lanePrefetchAttemptsRef.current;
            const nextCount =
              attempts.key === searchKey ? attempts.count + 1 : 1;
            lanePrefetchAttemptsRef.current = {
              key: searchKey,
              count: nextCount,
            };
            if (
              nextCount >= LANE_PREFETCH_MAX_ATTEMPTS ||
              !data.hasMore
            ) {
              setLaneSearch({ key: searchKey, exhausted: true });
            }
          } else {
            lanePrefetchAttemptsRef.current = { key: searchKey, count: 0 };
          }
        }
      }
    } catch {
      setError("Could not load more reviews. Please try again.");
    } finally {
      loadingLockRef.current = false;
      setIsLoadingMore(false);
    }
  }, [diversify, feed, preferredGenres, taste.topGenres, taste.topTag]);

  useEffect(() => {
    if (!lanePrefetching || isLoadingMore) return;
    const timer = window.setTimeout(() => {
      void loadMore();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [isLoadingMore, lanePrefetching, loadMore]);

  const leftRail = (
    <CommunityLeftRail
      displayName={displayName || handle}
      username={handle}
      avatarInitials={avatarInitials}
      avatarUrl={avatarUrl}
      reviewCount={taste.reviewCount}
      followerCount={followerCount}
      savedNovelCount={taste.savedNovelCount}
      genres={preferredGenres}
      desk={desk}
      taste={taste}
      currentUserId={currentUserId}
    />
  );

  const rightRail = (
    <LiteraryDiscoveryRail
      taste={taste}
      tasteInsight={tasteInsight}
      suggestedReviewers={suggestedReviewers}
    />
  );

  const feedContent = (
    <>
      <CommunityPageHeader
        feed={feed}
        followingCount={taste.followingCount}
        savedCount={taste.savedNovelCount}
        genreCount={preferredGenres.length}
      />

      <EditorialFeedFilters value={feed} basePath={communityBasePath} />

      <CommunityLaneFilters
        lanes={lanes}
        value={laneFilter?.id ?? null}
        onChange={(nextLaneId) =>
          setLaneFilter(
            nextLaneId
              ? lanes.find((lane) => lane.id === nextLaneId) ?? null
              : null
          )
        }
      />

      <CommunitySalonPrompt
        onOpenLane={(lane) => {
          setLaneFilter(resolveCommunityLane(lanes, lane));
        }}
      />

      {activeLane ? (
        <p className="text-[12px] font-medium text-[var(--mv-text-muted)]">
          Showing{" "}
          <span className="font-semibold text-[var(--mv-plum)]">
            {activeLane.label}
          </span>{" "}
          reviews
          {visibleReviews.length > 0
            ? ` · ${visibleReviews.length} in this feed${
                lanePrefetching && isLoadingMore ? " · loading more" : ""
              }`
            : lanePrefetching && isLoadingMore
              ? " · searching your feed"
              : ""}
        </p>
      ) : null}

      {reviews.length === 0 ? (
        <CommunityEmptyState
          feed={feed}
          followingCount={taste.followingCount}
          learningTaste={
            learningTaste || (feed === "for-you" && !taste.hasSignals)
          }
        />
      ) : (
        <div className="space-y-4">
          {visibleReviews.length === 0 ? (
            <div className="rounded-2xl border border-[var(--mv-border)] bg-white px-5 py-8 text-center">
              <p className="text-sm font-medium text-[var(--mv-ink)]">
                {(isLoadingMore || lanePrefetching) && !laneSearchExhausted
                  ? `Looking for ${activeLane?.label ?? "matching"} reviews…`
                  : `No ${activeLane?.label ?? "matching"} reviews in this feed yet`}
              </p>
              <p className="mt-1 text-[13px] text-[var(--mv-text-muted)]">
                {(isLoadingMore || lanePrefetching) && !laneSearchExhausted
                  ? "MoonVerse is scanning more of your feed for a match."
                  : "Try another lane, or show all reviews."}
              </p>
              <button
                type="button"
                onClick={() => setLaneFilter(null)}
                className="mt-3 text-[13px] font-semibold text-[var(--mv-plum)] hover:underline"
              >
                Show all reviews
              </button>
            </div>
          ) : null}
          {visibleReviews.map((review) => {
            const following = review.reviewerId
              ? followingIds.has(review.reviewerId)
              : false;
            return (
              <LiteraryReviewCard
                key={review.id}
                review={review}
                initialLiked={likedIds.has(review.id)}
                initialFollowing={following}
                folders={folders}
                savedFolderIds={savedMap[review.id] ?? []}
                currentUserId={currentUserId}
              />
            );
          })}

          <FeedInfiniteSentinel
            rootRef={feedScrollRef}
            hasMore={hasMore && !lanePrefetching}
            isLoading={isLoadingMore && !lanePrefetching}
            onLoadMore={loadMore}
            disabled={lanePrefetching}
            error={error}
          />
        </div>
      )}

      <div className="space-y-4 border-t border-[var(--mv-border)] pt-6 xl:hidden">
        <LiteraryDiscoveryRail
          taste={taste}
          tasteInsight={tasteInsight}
          suggestedReviewers={suggestedReviewers}
          variant="mobile"
        />
        {leftRail}
      </div>
    </>
  );

  return (
    <CommunityReviewOverlay communityPath={communityBasePath}>
      <>
      {/* Keeps layout height under the fixed desktop shell so the footer stays off-screen. */}
      <div
        className="hidden xl:block xl:h-[calc(100dvh-var(--mv-nav-h))]"
        aria-hidden
      />

      <div
        className={cn(
          "relative overflow-x-hidden",
          LITERARY_PAGE_BG,
          // Mobile / tablet: normal single-column page scroll.
          "safe-bottom-pad",
          // Desktop: fixed shell with independently scrolling columns.
          "xl:fixed xl:inset-x-0 xl:top-[var(--mv-nav-h)] xl:bottom-0 xl:z-10 xl:overflow-hidden xl:pb-0"
        )}
        style={LITERARY_SALON_STYLE}
      >
        <div
          className="pointer-events-none absolute -right-[8%] top-20 size-[26rem] rounded-full bg-[var(--mv-glow)]/30 blur-3xl"
          aria-hidden
        />

        <div
          className={cn(
            "relative min-h-0",
            SITE_SHELL_CLASS,
            "py-5 xl:h-full xl:min-h-0 xl:py-0"
          )}
        >
          <div
            className={cn(
              "grid min-h-0 items-start gap-5",
              "xl:h-full xl:min-h-0 xl:grid-cols-[228px_minmax(0,1fr)_272px] xl:items-stretch xl:gap-7"
            )}
          >
            <div
              className="mv-community-column hidden min-h-0 py-6 xl:block"
              tabIndex={0}
              aria-label="Community shortcuts"
            >
              {leftRail}
            </div>

            <div
              ref={feedScrollRef}
              className="mv-community-column mx-auto min-h-0 w-full min-w-0 max-w-full space-y-4 px-0 xl:mx-0 xl:py-5 xl:pr-1"
              tabIndex={0}
              aria-label="Community feed"
            >
              {feedContent}
            </div>

            <div
              className="mv-community-column hidden min-h-0 py-6 xl:block"
              tabIndex={0}
              aria-label="Discovery sidebar"
            >
              {rightRail}
            </div>
          </div>
        </div>
      </div>
      </>
    </CommunityReviewOverlay>
  );
}
