"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReportTargetType } from "@prisma/client";
import { Sparkles, Tag } from "lucide-react";
import { useCommunityReviewOverlayOptional } from "@/components/community/CommunityReviewOverlay";
import { CommunityPostMenu } from "@/components/community/CommunityPostMenu";
import { PremiumNovelAttachment } from "@/components/home/community/PremiumNovelAttachment";
import { ReviewExcerpt } from "@/components/feed/ReviewExcerpt";
import { ReviewActionBar } from "@/components/feed/ReviewActionBar";
import { FollowButton } from "@/components/users/FollowButton";
import { ReportButton } from "@/components/moderation/ReportButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { subscribeCommunityReviewSync } from "@/lib/community-feed-sync";
import { formatCompactRelativeTime } from "@/lib/date-utils";
import type { FolderListItem } from "@/types/folder";
import type { ReviewListItem } from "@/types/review";

interface LiteraryReviewCardProps {
  review: ReviewListItem;
  initialLiked: boolean;
  initialFollowing: boolean;
  folders: FolderListItem[];
  savedFolderIds: string[];
  currentUserId: string;
}

export function LiteraryReviewCard({
  review,
  initialLiked,
  initialFollowing,
  folders,
  savedFolderIds,
  currentUserId,
}: LiteraryReviewCardProps) {
  const router = useRouter();
  const overlay = useCommunityReviewOverlayOptional();
  const [commentCount, setCommentCount] = useState(review.commentCount);
  const [likeCount, setLikeCount] = useState(review.likeCount);
  const [saveCount, setSaveCount] = useState(review.saveCount);
  const [localSavedIds, setLocalSavedIds] = useState(savedFolderIds);
  const savedIdsRef = useRef(savedFolderIds);

  const isLoggedIn = Boolean(currentUserId);
  const isOwner = Boolean(
    review.reviewerId && review.reviewerId === currentUserId
  );
  const reviewHref = `/reviews/${review.id}`;
  const commentsHref = `/reviews/${review.id}#comments`;

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

  function openReview(event?: MouseEvent, focusComments = false) {
    if (event) {
      const target = event.target as HTMLElement;
      if (target.closest("a, button, textarea, input, [role='menu']")) return;
    }
    if (overlay) {
      overlay.openReview(review.id, { focusComments });
      return;
    }
    router.push(focusComments ? commentsHref : reviewHref, { scroll: false });
  }

  const visibleTags = review.tags
    .filter((tag) => {
      if (review.genres.length === 1 && tag === review.genres[0]) return false;
      return !/spoiler/i.test(tag);
    })
    .slice(0, 3);
  const extraTagCount = Math.max(
    0,
    review.tags.filter((tag) => !/spoiler/i.test(tag)).length - visibleTags.length
  );

  return (
    <article
      className="mv-community-card overflow-visible rounded-xl border border-[var(--mv-border)] bg-white shadow-[0_8px_24px_-20px_rgba(20,17,31,0.45)]"
      onMouseEnter={() => overlay?.prefetchReview(review.id)}
      onFocusCapture={() => overlay?.prefetchReview(review.id)}
    >
      <div className="flex items-start gap-3 px-4 pt-3 sm:px-4">
        <Link
          href={`/users/${review.reviewerUsername}`}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]"
        >
          <Avatar className="size-10">
            {review.reviewerAvatarUrl ? (
              <AvatarImage src={review.reviewerAvatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-[var(--mv-paper)] text-xs font-semibold text-[var(--mv-plum)]">
              {review.reviewerAvatar}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <Link
              href={`/users/${review.reviewerUsername}`}
              className="truncate text-[15px] font-semibold text-[var(--mv-ink)] hover:underline"
            >
              {review.reviewerName}
            </Link>
            {!isOwner && review.reviewerId ? (
              <FollowButton
                userId={review.reviewerId}
                username={review.reviewerUsername}
                initialFollowing={initialFollowing}
                appearance="subtle"
              />
            ) : null}
          </div>
          <time
            dateTime={review.createdAt}
            className="block text-[13px] text-[var(--mv-text-muted)]"
          >
            {formatCompactRelativeTime(review.createdAt)}
          </time>
          {review.feedReason ? (
            <p className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full border border-[var(--mv-plum)]/20 bg-[var(--mv-plum)]/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-[var(--mv-plum)]">
              <Sparkles className="size-3 shrink-0" aria-hidden />
              {review.feedReason}
            </p>
          ) : null}
        </div>
        {isOwner ? (
          <CommunityPostMenu
            reviewId={review.id}
            onSave={() => {
              document.getElementById(`save-review-${review.id}`)?.click();
            }}
          />
        ) : null}
      </div>

      <div className="px-4 pt-3 sm:px-5">
        <button
          type="button"
          onClick={() => openReview()}
          className="block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]"
        >
          <h2 className="line-clamp-3 text-[15px] font-semibold leading-snug text-[var(--mv-ink)] hover:text-[var(--mv-plum)]">
            {review.title}
          </h2>
        </button>

        <PremiumNovelAttachment
          novelId={review.novelId}
          title={review.novelTitle}
          author={review.novelAuthor}
          coverUrl={review.coverUrl}
          rating={review.rating}
          genres={review.genres}
        />

        <ReviewExcerpt
          body={review.body || review.excerpt}
          containsSpoilers={review.containsSpoilers}
          variant="literary"
          onContinueRead={() => openReview()}
        />

        {visibleTags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <Link
                key={tag}
                href={`/search?tags=${encodeURIComponent(tag)}`}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--mv-border)] bg-[var(--mv-paper)]/70 px-2 py-0.5 text-[11px] font-medium text-[var(--mv-ink)] transition hover:border-[var(--mv-plum)]/30"
              >
                <Tag className="size-2.5 text-[var(--mv-plum)]" aria-hidden />
                {tag}
              </Link>
            ))}
            {extraTagCount > 0 ? (
              <span className="rounded-md border border-[var(--mv-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--mv-text-muted)]">
                +{extraTagCount}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-2 px-4 pb-4 pt-2 sm:px-5">
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
          onCommentClick={() => openReview(undefined, true)}
          onLikeChange={(_liked, nextCount) => setLikeCount(nextCount)}
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
    </article>
  );
}
