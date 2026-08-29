"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorialFeedFilters } from "@/components/home/community/EditorialFeedFilters";
import { LiteraryReviewCard } from "@/components/home/community/LiteraryReviewCard";
import { CommunityEmptyState } from "@/components/home/community/CommunityEmptyState";
import { FeedInfiniteSentinel } from "@/components/feed/FeedInfiniteSentinel";
import { ReaderHubSectionHeader } from "@/components/home/reader-hub/ReaderHubSectionHeader";
import {
  attachFeedReasons,
  type FeedReasonContext,
} from "@/lib/feed-reasons";
import {
  diversifyByReviewer,
  FEED_PAGE_SIZE,
  type HomeFeedTab,
} from "@/lib/feed";
import type { PreferredGenreOption } from "@/services/preference.service";
import type { ReadingTasteSnapshot } from "@/services/feed.service";
import type { FolderListItem } from "@/types/folder";
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

interface CommunityFeedPanelProps {
  feed: HomeFeedTab;
  initialReviews: ReviewListItem[];
  initialHasMore: boolean;
  likedReviewIds: string[];
  followingReviewerIds: string[];
  commentsByReview: Record<string, CommentItem[]>;
  savedFolderIdsByReview: Record<string, string[]>;
  folders: FolderListItem[];
  taste: ReadingTasteSnapshot;
  preferredGenres: PreferredGenreOption[];
  learningTaste?: boolean;
  currentUserId: string;
}

export function CommunityFeedPanel({
  feed,
  initialReviews,
  initialHasMore,
  likedReviewIds,
  followingReviewerIds,
  commentsByReview,
  savedFolderIdsByReview,
  folders,
  taste,
  preferredGenres,
  learningTaste = false,
  currentUserId,
}: CommunityFeedPanelProps) {
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

  const loadingLockRef = useRef(false);
  const offsetRef = useRef(initialReviews.length);
  const hasMoreRef = useRef(initialHasMore);
  const followingIdsRef = useRef(new Set(followingReviewerIds));

  const diversify = feed === "for-you" || feed === "following";

  useEffect(() => {
    offsetRef.current = offset;
    hasMoreRef.current = hasMore;
    followingIdsRef.current = followingIds;
  }, [offset, hasMore, followingIds]);

  const loadMore = useCallback(async () => {
    if (loadingLockRef.current || !hasMoreRef.current) return;

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

      setReviews((prev) => {
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
        return [...prev, ...next];
      });
      setLikedIds((prev) => {
        const next = new Set(prev);
        for (const id of data.likedReviewIds) next.add(id);
        return next;
      });
      setFollowingIds((prev) => {
        const next = new Set(prev);
        for (const id of data.followingReviewerIds) next.add(id);
        return next;
      });
      setComments((prev) => ({ ...prev, ...data.comments }));
      setSavedMap((prev) => ({ ...prev, ...data.savedFolderIds }));
      setOffset(data.nextOffset);
      setHasMore(data.hasMore);
    } catch {
      setError("Could not load more reviews. Please try again.");
    } finally {
      loadingLockRef.current = false;
      setIsLoadingMore(false);
    }
  }, [diversify, feed, preferredGenres, taste.topGenres, taste.topTag]);

  return (
    <div className="space-y-5">
      <ReaderHubSectionHeader
        section="community"
        feed={feed}
        followingCount={taste.followingCount}
        savedCount={taste.savedNovelCount}
        genreCount={preferredGenres.length}
      />

      <EditorialFeedFilters value={feed} basePath="/community" />

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
                folders={folders}
                savedFolderIds={savedMap[review.id] ?? []}
                currentUserId={currentUserId}
              />
            );
          })}

          <FeedInfiniteSentinel
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={loadMore}
            error={error}
          />
        </div>
      )}
    </div>
  );
}
