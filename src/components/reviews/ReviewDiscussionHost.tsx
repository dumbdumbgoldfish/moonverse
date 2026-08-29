"use client";

import { useEffect, useRef, useState } from "react";
import { ReportTargetType } from "@prisma/client";
import { CommunityReviewModalLoader } from "@/components/community/CommunityReviewModalLoader";
import { ReviewActionBar } from "@/components/feed/ReviewActionBar";
import { ReportButton } from "@/components/moderation/ReportButton";
import { subscribeCommunityReviewSync } from "@/lib/community-feed-sync";
import type { FolderListItem } from "@/types/folder";
import type { CommentItem, ReviewDetail } from "@/types/review";

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
}

export function ReviewDiscussionHost({
  review,
  isLoggedIn,
  isOwner,
  initialLiked,
  folders,
  savedFolderIds,
}: ReviewDiscussionHostProps) {
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [focusComments, setFocusComments] = useState(false);
  const [commentCount, setCommentCount] = useState(review.commentCount);
  const [likeCount, setLikeCount] = useState(review.likeCount);
  const [saveCount, setSaveCount] = useState(review.saveCount);
  const [localSavedIds, setLocalSavedIds] = useState(savedFolderIds);
  const savedIdsRef = useRef(savedFolderIds);

  useEffect(() => {
    savedIdsRef.current = localSavedIds;
  }, [localSavedIds]);

  useEffect(() => {
    return subscribeCommunityReviewSync((detail) => {
      if (detail.reviewId !== review.id) return;
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
    setFocusComments(shouldFocusComments);
    setDiscussionOpen(true);
  }

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#comments" || hash === "#discussion") {
      openDiscussion(true);
    }
  }, []);

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
          initialLiked={initialLiked}
          folders={folders}
          savedFolderIds={localSavedIds}
          isLoggedIn={isLoggedIn}
          onCommentClick={() => openDiscussion(true)}
          onLikeChange={(_liked, nextCount) => setLikeCount(nextCount)}
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

      {discussionOpen ? (
        <CommunityReviewModalLoader
          key={`${review.id}:${focusComments ? "comments" : "top"}`}
          reviewId={review.id}
          focusComments={focusComments}
          onClose={() => setDiscussionOpen(false)}
        />
      ) : null}
    </>
  );
}
