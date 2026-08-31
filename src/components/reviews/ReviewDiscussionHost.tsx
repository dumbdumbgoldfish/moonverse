"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ReportTargetType } from "@prisma/client";
import { CommunityReviewModalLoader } from "@/components/community/CommunityReviewModalLoader";
import { ReviewActionBar } from "@/components/feed/ReviewActionBar";
import { ReportButton } from "@/components/moderation/ReportButton";
import { subscribeCommunityReviewSync } from "@/lib/community-feed-sync";
import type { FolderListItem } from "@/types/folder";
import type { CommentItem, ReviewDetail } from "@/types/review";

function subscribeDiscussionHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function getDiscussionHashSnapshot() {
  const hash = window.location.hash.toLowerCase();
  return hash === "#comments" || hash === "#discussion";
}

function getServerDiscussionHashSnapshot() {
  return false;
}

interface ReviewDiscussionHostProps {
  review: ReviewDetail;
  comments: CommentItem[];
  isLoggedIn: boolean;
  isOwner: boolean;
  initialLiked: boolean;
  folders: FolderListItem[];
  savedFolderIds: string[];
  currentUserId?: string;
  currentUserName?: string;
  currentUserImage?: string | null;
  overlayOpen?: boolean;
  overlayFocusComments?: boolean;
  onOverlayOpenChange?: (open: boolean, focusComments?: boolean) => void;
}

export function ReviewDiscussionHost({
  review,
  isLoggedIn,
  isOwner,
  initialLiked,
  folders,
  savedFolderIds,
  overlayOpen,
  overlayFocusComments = false,
  onOverlayOpenChange,
}: ReviewDiscussionHostProps) {
  const controlled = onOverlayOpenChange != null;
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [focusComments, setFocusComments] = useState(false);
  const [hashDismissed, setHashDismissed] = useState(false);
  const hashRequested = useSyncExternalStore(
    subscribeDiscussionHash,
    getDiscussionHashSnapshot,
    getServerDiscussionHashSnapshot
  );
  const hashWantsOpen = hashRequested && !hashDismissed;
  const effectiveOpen = controlled
    ? overlayOpen ?? false
    : discussionOpen || hashWantsOpen;
  const effectiveFocus = controlled
    ? overlayFocusComments
    : discussionOpen
      ? focusComments
      : hashWantsOpen;
  const [commentCount, setCommentCount] = useState(review.commentCount);
  const [likeCount, setLikeCount] = useState(review.likeCount);
  const [saveCount, setSaveCount] = useState(review.saveCount);
  const [likedByMe, setLikedByMe] = useState(initialLiked);
  const [localSavedIds, setLocalSavedIds] = useState(savedFolderIds);
  const savedIdsRef = useRef(savedFolderIds);

  useEffect(() => {
    savedIdsRef.current = localSavedIds;
  }, [localSavedIds]);

  useEffect(() => {
    return subscribeCommunityReviewSync((detail) => {
      if (detail.reviewId !== review.id) return;
      if (detail.liked !== undefined) setLikedByMe(detail.liked);
      if (detail.likeCount !== undefined) setLikeCount(detail.likeCount);
      if (detail.commentCount !== undefined) setCommentCount(detail.commentCount);
      if (detail.saveCount !== undefined) setSaveCount(detail.saveCount);
      if (detail.savedFolderIds) {
        const incoming = detail.savedFolderIds;
        const current = savedIdsRef.current;
        const unchanged =
          incoming.length === current.length &&
          incoming.every((id, index) => id === current[index]);
        if (unchanged) return;
        savedIdsRef.current = incoming;
        setLocalSavedIds(incoming);
      }
    });
  }, [review.id]);

  function openDiscussion(shouldFocusComments: boolean) {
    if (controlled) {
      onOverlayOpenChange?.(true, shouldFocusComments);
      return;
    }
    setHashDismissed(false);
    setFocusComments(shouldFocusComments);
    setDiscussionOpen(true);
  }

  function closeDiscussion() {
    if (controlled) {
      onOverlayOpenChange?.(false, false);
      return;
    }
    setDiscussionOpen(false);
    setFocusComments(false);
    setHashDismissed(true);
  }

  return (
    <>
      <div className="space-y-4">
        <ReviewActionBar
          reviewId={review.id}
          reviewTitle={review.title}
          likeCount={likeCount}
          commentCount={commentCount}
          saveCount={saveCount}
          shareCount={review.shareCount}
          initialLiked={likedByMe}
          folders={folders}
          savedFolderIds={localSavedIds}
          isLoggedIn={isLoggedIn}
          onCommentClick={() => openDiscussion(true)}
          onLikeChange={(liked, nextCount) => {
            setLikedByMe(liked);
            setLikeCount(nextCount);
          }}
          variant="literary"
        />

        {!isOwner && isLoggedIn ? (
          <div className="flex justify-end border-t border-[#6E46C7]/8 pt-2">
            <ReportButton
              targetType={ReportTargetType.REVIEW}
              targetId={review.id}
              isLoggedIn={isLoggedIn}
              variant="text"
            />
          </div>
        ) : null}
      </div>

      {effectiveOpen ? (
        <CommunityReviewModalLoader
          key={`${review.id}:${effectiveFocus ? "comments" : "top"}`}
          reviewId={review.id}
          focusComments={effectiveFocus}
          onClose={closeDiscussion}
        />
      ) : null}
    </>
  );
}
