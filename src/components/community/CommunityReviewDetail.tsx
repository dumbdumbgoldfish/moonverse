"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ReportTargetType } from "@prisma/client";
import { CommunityReviewComments } from "@/components/community/CommunityReviewComments";
import { PremiumNovelAttachment } from "@/components/home/community/PremiumNovelAttachment";
import { ReviewActionBar } from "@/components/feed/ReviewActionBar";
import { ReviewSpoilerGate } from "@/components/reviews/detail/ReviewSpoilerGate";
import { ReviewStructuredBody } from "@/components/reviews/detail/ReviewStructuredBody";
import { ReviewVerdictChip } from "@/components/reviews/detail/ReviewVerdictChip";
import { FollowButton } from "@/components/users/FollowButton";
import { ReportButton } from "@/components/moderation/ReportButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { subscribeCommunityReviewSync } from "@/lib/community-feed-sync";
import { formatCompactRelativeTime } from "@/lib/date-utils";
import { getInitials } from "@/lib/review-utils";
import type { CommunityReviewModalData } from "@/lib/community-review-modal.types";

interface CommunityReviewDetailProps {
  data: CommunityReviewModalData;
}

export function CommunityReviewDetail({ data }: CommunityReviewDetailProps) {
  const {
    review,
    comments,
    isLoggedIn,
    isOwner,
    initialLiked,
    initialFollowing,
    folders,
    savedFolderIds,
    currentUserId,
    currentUserName,
    currentUserImage,
  } = data;
  const [likeCount, setLikeCount] = useState(review.likeCount);
  const [commentCount, setCommentCount] = useState(review.commentCount);
  const [saveCount, setSaveCount] = useState(review.saveCount);
  const [likedByMe, setLikedByMe] = useState(initialLiked);
  const [localSavedIds, setLocalSavedIds] = useState(savedFolderIds);
  const savedIdsRef = useRef(savedFolderIds);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const initials = getInitials(currentUserName ?? "You");

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

  return (
    <article className="px-4 pt-4 pb-0 sm:px-6">
      <header className="flex items-start gap-3">
        <Link
          href={`/users/${review.reviewerUsername}`}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-violet)]"
        >
          <Avatar className="size-10 ring-1 ring-[var(--mv-border)]">
            {review.reviewerAvatarUrl ? (
              <AvatarImage src={review.reviewerAvatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-[var(--mv-surface-soft)] text-xs font-semibold text-[var(--mv-violet)]">
              {review.reviewerAvatar}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <Link
              href={`/users/${review.reviewerUsername}`}
              className="truncate text-[15px] font-semibold text-[var(--mv-ink)] hover:text-[var(--mv-violet)]"
            >
              {review.reviewerName}
            </Link>
            {!isOwner && review.userId ? (
              <FollowButton
                userId={review.userId}
                username={review.reviewerUsername}
                initialFollowing={initialFollowing}
                isLoggedIn={isLoggedIn}
                appearance="subtle"
              />
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-[var(--mv-text-muted)]">
            <span>@{review.reviewerUsername}</span>
            <span aria-hidden> · </span>
            <time dateTime={review.createdAt}>
              {formatCompactRelativeTime(review.createdAt)}
            </time>
          </p>
        </div>
      </header>

      <h1 className="mt-3 text-[17px] font-semibold leading-snug text-[var(--mv-ink)]">
        {review.title}
      </h1>

      <div className="mt-2.5">
        <ReviewVerdictChip rating={review.rating} size="md" />
      </div>

      <PremiumNovelAttachment
        novelId={review.novelId}
        title={review.novelTitle}
        author={review.novelAuthor}
        coverUrl={review.coverUrl}
        rating={review.rating}
        genres={review.genres}
      />

      <div className="mt-4">
        <ReviewSpoilerGate containsSpoilers={review.containsSpoilers}>
          <ReviewStructuredBody
            body={review.body}
            isLoggedIn={isLoggedIn}
            forceExpanded={isLoggedIn}
            className="[&_p]:text-[15px] [&_p]:leading-[1.7] sm:[&_p]:text-[16px]"
          />
        </ReviewSpoilerGate>
      </div>

      {review.tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {review.tags
            .filter((tag) => !/spoiler/i.test(tag))
            .slice(0, 8)
            .map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-[var(--mv-border)] bg-[var(--mv-paper)] px-2 py-0.5 text-[11px] font-medium text-[var(--mv-ink)]"
              >
                {tag}
              </li>
            ))}
        </ul>
      ) : null}

      <div className="mt-4 space-y-2">
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
          onCommentClick={() => {
            document
              .getElementById("community-review-composer")
              ?.scrollIntoView({ block: "end", behavior: "smooth" });
            composerRef.current?.focus();
          }}
          onLikeChange={(liked, nextCount) => {
            setLikedByMe(liked);
            setLikeCount(nextCount);
          }}
          variant="literary"
        />

        {!isOwner && isLoggedIn ? (
          <div className="flex justify-end border-t border-[var(--mv-border)]/80 pt-2">
            <ReportButton
              targetType={ReportTargetType.REVIEW}
              targetId={review.id}
              isLoggedIn={isLoggedIn}
              variant="text"
            />
          </div>
        ) : null}
      </div>

      <div id="community-review-comments" className="mt-4">
        <CommunityReviewComments
          reviewId={review.id}
          initialComments={comments}
          commentCount={commentCount}
          onCommentCountChange={setCommentCount}
          isLoggedIn={isLoggedIn}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserImage={currentUserImage}
          currentUserInitials={initials}
          composerRef={composerRef}
          signInCallbackUrl={`/reviews/${review.id}#comments`}
        />
      </div>
    </article>
  );
}
