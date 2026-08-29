"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Heart, MessageCircle, Send, Star, X } from "lucide-react";
import {
  createCommentAction,
  deleteCommentAction,
  toggleCommentLikeAction,
  updateCommentAction,
} from "@/actions/interaction.actions";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ThreadedCommentList,
  type ReplyTarget,
} from "@/components/reviews/ThreadedCommentList";
import { excerpt } from "@/lib/review-utils";
import { cn } from "@/lib/utils";
import { LIMITS } from "@/lib/validation";
import type { CommentItem } from "@/types/review";

export interface DiscussionReviewContext {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  rating: number;
  likeCount: number;
  commentCount: number;
  reviewerName: string;
  reviewerUsername: string;
  reviewerAvatar: string;
  reviewerAvatarUrl?: string;
}

interface ReviewDiscussionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: DiscussionReviewContext;
  comments: CommentItem[];
  commentCount: number;
  onCommentCountDelta: (delta: number) => void;
  isLoggedIn: boolean;
  currentUserId?: string;
  currentUserName?: string;
  currentUserImage?: string | null;
  currentUserInitials?: string;
}

function patchComment(
  comments: CommentItem[],
  id: string,
  patch: (comment: CommentItem) => CommentItem
): CommentItem[] {
  return comments.map((comment) => {
    if (comment.id === id) return patch(comment);
    if (comment.replies.length === 0) return comment;
    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        reply.id === id ? patch(reply) : reply
      ),
    };
  });
}

function removeComment(
  comments: CommentItem[],
  id: string
): { next: CommentItem[]; removed: number } {
  const top = comments.find((comment) => comment.id === id);
  if (top) {
    return { next: comments.filter((comment) => comment.id !== id), removed: 1 + top.replies.length };
  }
  return {
    next: comments.map((comment) => ({
      ...comment,
      replies: comment.replies.filter((reply) => reply.id !== id),
    })),
    removed: 1,
  };
}

export function ReviewDiscussionDialog({
  open,
  onOpenChange,
  review,
  comments: initialComments,
  commentCount,
  onCommentCountDelta,
  isLoggedIn,
  currentUserId,
  currentUserName,
  currentUserImage,
  currentUserInitials = "YOU",
}: ReviewDiscussionDialogProps) {
  const titleId = useId();
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState(initialComments);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/reviews/${review.id}`)}`;
  const signupHref = `/register?callbackUrl=${encodeURIComponent(`/reviews/${review.id}`)}`;
  const summary = excerpt(review.excerpt || review.body, 96);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    if (!open) {
      setReplyTarget(null);
      setBody("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && replyTarget) {
      composerRef.current?.focus();
    }
  }, [open, replyTarget]);

  function focusComposer() {
    composerRef.current?.focus();
    composerRef.current?.scrollIntoView({ block: "nearest" });
  }

  function handleReply(comment: CommentItem, parentId: string) {
    setReplyTarget((prev) =>
      prev?.commentId === comment.id
        ? null
        : {
            parentId,
            commentId: comment.id,
            authorName: comment.authorName,
            authorUsername: comment.authorUsername,
          }
    );
  }

  function handleLike(commentId: string) {
    const previous = comments;
    setComments((current) =>
      patchComment(current, commentId, (comment) => {
        const liked = !comment.likedByMe;
        return {
          ...comment,
          likedByMe: liked,
          likeCount: Math.max(0, comment.likeCount + (liked ? 1 : -1)),
        };
      })
    );
    startTransition(async () => {
      const result = await toggleCommentLikeAction(commentId);
      if (!result.success || result.liked === undefined || result.likeCount === undefined) {
        setComments(previous);
        return;
      }
      setComments((current) =>
        patchComment(current, commentId, (comment) => ({
          ...comment,
          likedByMe: result.liked,
          likeCount: result.likeCount ?? comment.likeCount,
        }))
      );
    });
  }

  function handleDelete(commentId: string) {
    const previous = comments;
    const { next, removed } = removeComment(comments, commentId);
    setComments(next);
    onCommentCountDelta(-removed);
    startTransition(async () => {
      const result = await deleteCommentAction(commentId, review.id);
      if (!result.success) {
        setComments(previous);
        onCommentCountDelta(removed);
      }
    });
  }

  async function handleEdit(commentId: string, nextBody: string) {
    const previous = comments;
    setComments((current) =>
      patchComment(current, commentId, (comment) => ({ ...comment, body: nextBody }))
    );
    const result = await updateCommentAction(commentId, review.id, nextBody);
    if (!result.success) {
      setComments(previous);
      setError(result.error);
      return false;
    }
    if (result.comment) {
      setComments((current) =>
        patchComment(current, commentId, (comment) => ({
          ...comment,
          ...result.comment!,
          replies: comment.replies,
          likedByMe: comment.likedByMe,
          likeCount: comment.likeCount,
        }))
      );
    }
    return true;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextBody = body.trim();
    if (!nextBody || isPending) return;

    const parentId = replyTarget?.parentId;
    const optimistic: CommentItem = {
      id: `temp-${crypto.randomUUID()}`,
      reviewId: review.id,
      userId: currentUserId ?? "me",
      authorName: currentUserName ?? "You",
      authorAvatar: currentUserInitials,
      authorAvatarUrl: currentUserImage ?? undefined,
      body: nextBody,
      createdAt: new Date().toISOString(),
      parentCommentId: parentId,
      likeCount: 0,
      likedByMe: false,
      replies: [],
    };

    setError(null);
    setBody("");
    if (composerRef.current) composerRef.current.style.height = "auto";
    setComments((current) => {
      if (!parentId) return [...current, optimistic];
      return current.map((comment) =>
        comment.id === parentId
          ? { ...comment, replies: [...comment.replies, optimistic] }
          : comment
      );
    });
    onCommentCountDelta(1);
    setReplyTarget(null);

    requestAnimationFrame(() => {
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
    });

    startTransition(async () => {
      const result = await createCommentAction(review.id, nextBody, parentId);
      if (!result.success || !result.comment) {
        setComments((current) => removeComment(current, optimistic.id).next);
        onCommentCountDelta(-1);
        setError(result.success === false ? result.error : "Unable to post comment.");
        setBody(nextBody);
        return;
      }
      const saved = result.comment;
      setComments((current) => {
        if (!parentId) {
          return current.map((comment) =>
            comment.id === optimistic.id ? saved : comment
          );
        }
        return current.map((comment) =>
          comment.id === parentId
            ? {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === optimistic.id ? saved : reply
                ),
              }
            : comment
        );
      });
    });
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const replyLabel = replyTarget
    ? `Replying to @${replyTarget.authorUsername ?? replyTarget.authorName}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[70] bg-[#1a1033]/32 duration-[200ms] supports-backdrop-filter:backdrop-blur-[1.5px]" />
        <DialogPrimitive.Popup
          aria-labelledby={titleId}
          initialFocus={isLoggedIn ? composerRef : undefined}
          className={cn(
            "fixed z-[70] flex flex-col overflow-hidden bg-[#FFFCF8] text-[#1a1033] outline-none",
            "duration-[200ms] ease-out",
            "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
            "inset-x-0 bottom-0 top-[8%] rounded-t-[1.35rem] shadow-[0_-18px_48px_-24px_rgba(26,16,51,0.38)]",
            "data-open:slide-in-from-bottom-3 data-closed:slide-out-to-bottom-3",
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-[min(84vh,46rem)] sm:w-[min(46.5rem,calc(100vw-2.5rem))] sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:rounded-[1.35rem] sm:shadow-[0_24px_64px_-28px_rgba(26,16,51,0.42)]",
            "sm:data-open:zoom-in-[0.97] sm:data-closed:zoom-out-[0.97] sm:data-open:slide-in-from-bottom-0 sm:data-closed:slide-out-to-bottom-0"
          )}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#6E46C7]/12 bg-white/80 px-4 py-2.5 sm:px-5">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6E46C7]">
                Discussion
                <span className="font-semibold normal-case tracking-normal text-[#7a7284]">
                  · {commentCount} {commentCount === 1 ? "comment" : "comments"}
                </span>
              </p>
              <DialogTitle
                id={titleId}
                className="mt-0.5 truncate font-heading text-[0.95rem] font-semibold leading-snug"
              >
                {review.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Comments on this review. The review page stays open behind this window.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#5a4d72] transition hover:bg-[#F4ECF8] hover:text-[#1a1033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
              aria-label="Close discussion"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <div
            ref={threadRef}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#FFFCF8_0%,#F8F1FA_100%)]"
          >
            <article className="mx-4 mt-3 shrink-0 rounded-xl bg-white/90 p-2.5 ring-1 ring-[#6E46C7]/12 sm:mx-5">
              <div className="flex gap-2.5">
                <Avatar className="size-8 shrink-0">
                  {review.reviewerAvatarUrl ? (
                    <AvatarImage src={review.reviewerAvatarUrl} alt="" />
                  ) : null}
                  <AvatarFallback className="bg-[#F4ECF8] text-[10px] font-bold text-[#6E46C7]">
                    {review.reviewerAvatar}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="truncate text-[13px] font-bold text-[#1a1033]">
                      {review.reviewerName}
                    </p>
                    <span className="truncate text-[12px] font-medium text-[#7a7284]">
                      @{review.reviewerUsername}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#8f711e]">
                      <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                  <h3 className="mt-0.5 line-clamp-1 text-[13px] font-semibold leading-snug text-[#1a1033]">
                    {review.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#5a4d72]">
                    {summary}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] font-semibold text-[#7a7284]">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3" aria-hidden />
                      {review.likeCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="size-3" aria-hidden />
                      {commentCount}
                    </span>
                  </div>
                </div>
              </div>
            </article>

            <div className={cn("px-4 sm:px-5", comments.length === 0 ? "flex flex-1 items-center justify-center py-6" : "mt-2 pb-4")}>
              {comments.length === 0 ? (
                <div className="mx-auto max-w-sm px-2 text-center">
                  <div className="mx-auto flex size-[4.5rem] items-center justify-center rounded-full bg-white ring-1 ring-[#6E46C7]/12">
                    <MoonieMascot variant="waving" size={52} display="clean" lightweight />
                  </div>
                  <span className="mt-3 inline-flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6E46C7]">
                    <MessageCircle className="size-3.5" aria-hidden />
                    Start the thread
                  </span>
                  <p className="mt-2 font-heading text-lg font-semibold text-[#1a1033]">
                    Be the first to join the discussion
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#5a4d72]">
                    Share your thoughts about this review and start a conversation with other MoonVerse readers.
                  </p>
                </div>
              ) : (
                <ThreadedCommentList
                  comments={comments}
                  currentUserId={currentUserId}
                  isLoggedIn={isLoggedIn}
                  replyTarget={replyTarget}
                  onReply={handleReply}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onGuestAction={focusComposer}
                />
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-[#6E46C7]/12 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
            {isLoggedIn ? (
              <form onSubmit={handleSubmit} className="space-y-2">
                {replyLabel ? (
                  <div className="flex items-center justify-between gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#6E46C7] ring-1 ring-[#6E46C7]/15">
                    <span className="truncate">{replyLabel}</span>
                    <button
                      type="button"
                      onClick={() => setReplyTarget(null)}
                      className="shrink-0 text-[#7a7284] hover:text-[#1a1033]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="flex items-end gap-2">
                  <Avatar className="mb-0.5 size-8 shrink-0">
                    {currentUserImage ? (
                      <AvatarImage src={currentUserImage} alt="" />
                    ) : null}
                    <AvatarFallback className="bg-[#F4ECF8] text-[10px] font-bold text-[#6E46C7]">
                      {currentUserInitials}
                    </AvatarFallback>
                  </Avatar>
                  <label className="sr-only" htmlFor="discussion-composer">
                    Write a comment
                  </label>
                  <textarea
                    id="discussion-composer"
                    ref={composerRef}
                    value={body}
                    onChange={(event) => {
                      setBody(event.target.value);
                      event.target.style.height = "auto";
                      event.target.style.height = `${Math.min(event.target.scrollHeight, 112)}px`;
                    }}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Write a comment..."
                    rows={1}
                    required
                    minLength={LIMITS.commentBody.min}
                    maxLength={LIMITS.commentBody.max}
                    disabled={isPending}
                    className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border-0 bg-[#F8F1FA] px-3.5 py-2.5 text-sm text-[#1a1033] shadow-none ring-1 ring-[#6E46C7]/12 placeholder:text-[#7a7284] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="size-10 shrink-0 rounded-full"
                    disabled={isPending || !body.trim()}
                    aria-label="Send comment"
                  >
                    <Send className="size-4" aria-hidden />
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1a1033]">Join the conversation</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-[#5a4d72]">
                    Sign in to comment, reply, like comments, and participate in the MoonVerse community.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <Link
                    href={loginHref}
                    className="inline-flex h-9 items-center justify-center rounded-full border border-[#6E46C7]/22 bg-white px-3.5 text-[13px] font-semibold text-[#1a1033] hover:bg-[#F4ECF8]"
                  >
                    Log in
                  </Link>
                  <Link
                    href={signupHref}
                    className="mv-nav-signup inline-flex h-9 items-center justify-center rounded-full px-3.5 text-[13px] font-bold text-white"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
