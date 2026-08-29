"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CommunityPageHeader } from "@/components/home/community/CommunityPageHeader";
import { CommunityEmptyState } from "@/components/home/community/CommunityEmptyState";
import { EditorialFeedFilters } from "@/components/home/community/EditorialFeedFilters";
import { LiteraryReviewCard } from "@/components/home/community/LiteraryReviewCard";
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
import type {
  HomeDashboardCommunityProps,
  HomeDashboardSharedProps,
  ReviewInteractions,
} from "@/lib/home-dashboard";
import type { CommentItem, ReviewListItem } from "@/types/review";

interface FeedPagePayload {
  reviews: ReviewListItem[];
  likedReviewIds: string[];
  followingReviewerIds: string[];
  comments: Record<string, CommentItem[]>;
  savedFolderIds: Record<string, string[]>;
  hasMore: boolean;
  nextOffset: number;
}

interface CommunityPanelProps {
  shared: HomeDashboardSharedProps;
  data: HomeDashboardCommunityProps;
  onFeedChange?: (feed: HomeFeedTab) => void;
}

function applyInteractions(
  interactions: ReviewInteractions
): {
  likedIds: Set<string>;
  followingIds: Set<string>;
  comments: Record<string, CommentItem[]>;
  savedMap: Record<string, string[]>;
} {
  return {
    likedIds: new Set(interactions.likedReviewIds),
    followingIds: new Set(interactions.followingReviewerIds),
    comments: interactions.commentsByReview,
    savedMap: interactions.savedFolderIdsByReview,
  };
}

export function CommunityPanel({
  shared,
  data,
}: CommunityPanelProps) {
  const initial = applyInteractions(data.interactions);
  const [feed] = useState(data.feed);
  const [reviews, setReviews] = useState(data.reviews);
  const [likedIds, setLikedIds] = useState(initial.likedIds);
  const [followingIds, setFollowingIds] = useState(initial.followingIds);
  const [, setComments] = useState(initial.comments);
  const [savedMap, setSavedMap] = useState(initial.savedMap);
  const [hasMore, setHasMore] = useState(data.hasMore);
  const [learningTaste] = useState(data.learningTaste);
  const [offset, setOffset] = useState(data.reviews.length);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingFeed] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadingLockRef = useRef(false);
  const offsetRef = useRef(offset);
  const hasMoreRef = useRef(hasMore);
  const followingIdsRef = useRef(followingIds);

  const diversify = feed === "for-you" || feed === "following";

  useEffect(() => {
    offsetRef.current = offset;
    hasMoreRef.current = hasMore;
    followingIdsRef.current = followingIds;
  }, [offset, hasMore, followingIds]);

  const loadMore = useCallback(async () => {
    if (loadingLockRef.current || !hasMoreRef.current || isLoadingFeed) return;

    loadingLockRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/feed?feed=${feed}&offset=${offsetRef.current}&limit=${FEED_PAGE_SIZE}`
      );
      if (!response.ok) throw new Error("Unable to load more reviews.");
      const payload = (await response.json()) as FeedPagePayload;

      setReviews((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        let next = payload.reviews.filter((item) => !seen.has(item.id));
        const lastReviewer = prev[prev.length - 1]?.reviewerId ?? null;
        if (diversify) {
          next = diversifyByReviewer(next, lastReviewer);
        }
        if (feed === "for-you") {
          const reasonContext: FeedReasonContext = {
            topGenres: shared.taste.topGenres,
            topTag: shared.taste.topTag,
            preferredGenreNames: shared.preferredGenres.map((g) => g.name),
            followingIds: new Set([
              ...followingIdsRef.current,
              ...payload.followingReviewerIds,
            ]),
          };
          next = attachFeedReasons(next, reasonContext);
        }
        return [...prev, ...next];
      });
      setLikedIds((prev) => {
        const next = new Set(prev);
        for (const id of payload.likedReviewIds) next.add(id);
        return next;
      });
      setFollowingIds((prev) => {
        const next = new Set(prev);
        for (const id of payload.followingReviewerIds) next.add(id);
        return next;
      });
      setComments((prev) => ({ ...prev, ...payload.comments }));
      setSavedMap((prev) => ({ ...prev, ...payload.savedFolderIds }));
      setOffset(payload.nextOffset);
      setHasMore(payload.hasMore);
    } catch {
      setError("Could not load more reviews. Please try again.");
    } finally {
      loadingLockRef.current = false;
      setIsLoadingMore(false);
    }
  }, [diversify, feed, isLoadingFeed, shared.preferredGenres, shared.taste]);

  return (
    <div
      className="space-y-5"
      aria-busy={isLoadingFeed}
    >
      <CommunityPageHeader
        feed={feed}
        followingCount={shared.taste.followingCount}
        savedCount={shared.taste.savedNovelCount}
        genreCount={shared.preferredGenres.length}
      />

      <EditorialFeedFilters
        value={feed}
        basePath="/community"
      />

      <div
        className={
          isLoadingFeed
            ? "pointer-events-none space-y-4 opacity-50 transition-opacity duration-200"
            : "space-y-4 transition-opacity duration-200"
        }
      >
        {reviews.length === 0 ? (
          <CommunityEmptyState
            feed={feed}
            followingCount={shared.taste.followingCount}
            learningTaste={
              learningTaste || (feed === "for-you" && !shared.taste.hasSignals)
            }
          />
        ) : (
          <>
            {reviews.map((review) => {
              const following = review.reviewerId
                ? followingIds.has(review.reviewerId)
                : false;
              return (
                <LiteraryReviewCard
                  key={review.id}
                  review={review}
                  initialLiked={likedIds.has(review.id)}
                  initialFollowing={following}
                  folders={shared.folders}
                  savedFolderIds={savedMap[review.id] ?? []}
                  currentUserId={shared.userId}
                />
              );
            })}

            <FeedInfiniteSentinel
              hasMore={hasMore}
              isLoading={isLoadingMore}
              onLoadMore={loadMore}
              error={error}
            />
          </>
        )}
      </div>
    </div>
  );
}
