"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flag,
  Link2,
  MoreHorizontal,
  PencilLine,
  Trash2,
  EyeOff,
} from "lucide-react";
import { deleteReviewAction } from "@/actions/review.actions";
import { ReviewDeleteConfirmDialog } from "@/components/reviews/ReviewDeleteConfirmDialog";
import { NovelAttachment } from "@/components/feed/NovelAttachment";
import { ReviewExcerpt } from "@/components/feed/ReviewExcerpt";
import { ReviewActionBar } from "@/components/feed/ReviewActionBar";
import { InlineCommentList } from "@/components/feed/InlineCommentList";
import { InlineCommentComposer } from "@/components/feed/InlineCommentComposer";
import { FollowButton } from "@/components/users/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { FolderListItem } from "@/types/folder";
import type { CommentItem, ReviewListItem } from "@/types/review";

interface ReviewPostCardProps {
  review: ReviewListItem;
  initialLiked: boolean;
  initialFollowing: boolean;
  initialComments: CommentItem[];
  folders: FolderListItem[];
  savedFolderIds: string[];
  currentUserId: string;
  currentUserInitials: string;
}

export function ReviewPostCard({
  review,
  initialLiked,
  initialFollowing,
  initialComments,
  folders,
  savedFolderIds,
  currentUserId,
  currentUserInitials,
}: ReviewPostCardProps) {
  const router = useRouter();
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [comments, setComments] = useState(initialComments);
  const [commentCount, setCommentCount] = useState(review.commentCount);
  const [expandedAll, setExpandedAll] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const isOwner = Boolean(
    review.reviewerId && review.reviewerId === currentUserId
  );

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  if (hidden) return null;

  const visibleTags = review.tags
    .filter((tag) => {
      if (review.genres.length === 1 && tag === review.genres[0]) return false;
      return !/spoiler/i.test(tag);
    })
    .slice(0, 4);
  const extraTagCount = Math.max(
    0,
    review.tags.filter((tag) => !/spoiler/i.test(tag)).length - visibleTags.length
  );

  const engagementParts: string[] = [];
  if (review.likeCount > 0) {
    engagementParts.push(
      `${review.likeCount} like${review.likeCount === 1 ? "" : "s"}`
    );
  }
  if (commentCount > 0) {
    engagementParts.push(
      `${commentCount} comment${commentCount === 1 ? "" : "s"}`
    );
  }
  if (review.shareCount > 0) {
    engagementParts.push(
      `${review.shareCount} share${review.shareCount === 1 ? "" : "s"}`
    );
  }

  async function copyLink() {
    const url = `${window.location.origin}/reviews/${review.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback("Link copied");
    } catch {
      setCopyFeedback("Unable to copy");
    }
    setMenuOpen(false);
    window.setTimeout(() => setCopyFeedback(null), 2000);
  }

  async function loadAllComments() {
    if (expandedAll) {
      setExpandedAll(false);
      setComments(initialComments);
      return;
    }
    setLoadingAll(true);
    try {
      const response = await fetch(`/api/reviews/${review.id}/comments`);
      if (!response.ok) throw new Error("Failed");
      const data = (await response.json()) as { comments: CommentItem[] };
      setComments(data.comments);
      setExpandedAll(true);
    } catch {
      router.push(`/reviews/${review.id}#comments`);
    } finally {
      setLoadingAll(false);
    }
  }

  function focusComposer() {
    composerRef.current?.focus({ preventScroll: true });
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <article className="overflow-hidden rounded-[20px] border border-[var(--mv-border,#E6DFF8)] bg-white shadow-sm">
      <div className="flex items-start gap-2.5 px-3.5 pt-3.5 sm:px-4 sm:pt-4">
        <Link
          href={`/users/${review.reviewerUsername}`}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Avatar className="size-11">
            {review.reviewerAvatarUrl ? (
              <AvatarImage
                src={review.reviewerAvatarUrl}
                alt=""
              />
            ) : null}
            <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
              {review.reviewerAvatar}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link
              href={`/users/${review.reviewerUsername}`}
              className="truncate text-sm font-bold text-[var(--mv-ink,#201738)] hover:text-primary"
            >
              {review.reviewerName}
            </Link>
            <span className="truncate text-xs text-[var(--mv-muted,#6F6884)]">
              @{review.reviewerUsername}
            </span>
            <span className="text-xs text-slate-400" aria-hidden>
              ·
            </span>
            <time
              dateTime={review.createdAt}
              className="text-xs text-[var(--mv-muted,#6F6884)]"
            >
              {formatRelativeTime(review.createdAt)}
            </time>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!isOwner && review.reviewerId ? (
            <FollowButton
              userId={review.reviewerId}
              username={review.reviewerUsername}
              initialFollowing={initialFollowing}
            />
          ) : null}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="More actions"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex size-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-violet-50 hover:text-night-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <MoreHorizontal className="size-5" aria-hidden />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-violet-100 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-violet-50"
                  onClick={copyLink}
                >
                  <Link2 className="size-4" aria-hidden />
                  Copy link
                </button>
                <Link
                  href="/reporting-abuse"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-violet-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <Flag className="size-4" aria-hidden />
                  Report review
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-violet-50"
                  onClick={() => {
                    setHidden(true);
                    setMenuOpen(false);
                  }}
                >
                  <EyeOff className="size-4" aria-hidden />
                  Hide review
                </button>
                {isOwner ? (
                  <>
                    <Link
                      href={`/reviews/${review.id}/edit`}
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-violet-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <PencilLine className="size-4" aria-hidden />
                      Edit review
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={isDeleting}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-red-50"
                      onClick={() => {
                        setDeleteError(null);
                        setMenuOpen(false);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Delete review
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {copyFeedback ? (
        <p className="px-4 pt-2 text-xs font-semibold text-primary" role="status">
          {copyFeedback}
        </p>
      ) : null}

      <div className="px-3.5 pt-2.5 sm:px-4">
        <Link
          href={`/reviews/${review.id}`}
          className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <h2 className="line-clamp-2 text-[15px] font-bold leading-snug text-[var(--mv-ink,#201738)] hover:text-primary">
            {review.title}
          </h2>
        </Link>

        <NovelAttachment
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
        />

        {visibleTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <Link
                key={tag}
                href={`/search?tags=${encodeURIComponent(tag)}`}
                className="rounded-md bg-[var(--mv-surface-soft,#F3EFFF)] px-2 py-0.5 text-[11px] font-semibold text-primary transition hover:bg-violet-100"
              >
                {tag}
              </Link>
            ))}
            {extraTagCount > 0 ? (
              <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                +{extraTagCount}
              </span>
            ) : null}
          </div>
        ) : null}

        {engagementParts.length > 0 ? (
          <p className="mt-2 text-xs font-semibold text-[var(--mv-muted,#6F6884)]">
            {engagementParts.join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="mt-1.5 border-y border-[var(--mv-border,#E6DFF8)] px-1.5">
        <ReviewActionBar
          reviewId={review.id}
          reviewTitle={review.title}
          likeCount={review.likeCount}
          commentCount={commentCount}
          saveCount={review.saveCount}
          shareCount={review.shareCount}
          initialLiked={initialLiked}
          folders={folders}
          savedFolderIds={savedFolderIds}
          onCommentClick={focusComposer}
        />
      </div>

      <div className="space-y-2.5 px-3.5 pb-3.5 pt-2.5 sm:px-4">
        <InlineCommentList
          comments={comments}
          reviewId={review.id}
          currentUserInitials={currentUserInitials}
          onReplyPosted={(comment) => {
            setComments((prev) =>
              prev.map((item) =>
                item.id === comment.parentCommentId
                  ? {
                      ...item,
                      replies: [...(item.replies ?? []), comment],
                    }
                  : item
              )
            );
            setCommentCount((count) => count + 1);
          }}
        />

        {commentCount > comments.length || expandedAll ? (
          <button
            type="button"
            onClick={loadAllComments}
            disabled={loadingAll}
            className={cn(
              "text-[13px] font-bold text-primary hover:underline disabled:opacity-60"
            )}
          >
            {loadingAll
              ? "Loading comments…"
              : expandedAll
                ? "Show fewer comments"
                : `View all ${commentCount} comments`}
          </button>
        ) : null}

        <InlineCommentComposer
          reviewId={review.id}
          avatarInitials={currentUserInitials}
          inputRef={composerRef}
          onPosted={(comment) => {
            setComments((prev) => [comment, ...prev].slice(0, expandedAll ? 50 : 2));
            setCommentCount((count) => count + 1);
          }}
        />
      </div>

      <ReviewDeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          setDeleteError(null);
          startDelete(async () => {
            const result = await deleteReviewAction(review.id);
            if (!result.success) {
              setDeleteError(result.error);
              return;
            }
            setDeleteDialogOpen(false);
            router.refresh();
          });
        }}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </article>
  );
}
