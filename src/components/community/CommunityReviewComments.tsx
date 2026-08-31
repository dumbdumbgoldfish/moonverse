"use client";

import { useState, useTransition, type RefObject } from "react";
import {
  deleteCommentAction,
  toggleCommentLikeAction,
  updateCommentAction,
} from "@/actions/interaction.actions";
import { useSignInPromptOptional } from "@/components/auth/SignInPromptProvider";
import { InlineCommentComposer } from "@/components/feed/InlineCommentComposer";
import {
  ThreadedCommentList,
  type ReplyTarget,
} from "@/components/reviews/ThreadedCommentList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { publishCommunityReviewSync } from "@/lib/community-feed-sync";
import { cn } from "@/lib/utils";
import type { CommentItem } from "@/types/review";

interface CommunityReviewCommentsProps {
  reviewId: string;
  initialComments: CommentItem[];
  commentCount: number;
  onCommentCountChange: (count: number) => void;
  isLoggedIn: boolean;
  currentUserId?: string;
  currentUserName?: string;
  currentUserImage?: string | null;
  currentUserInitials: string;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  layout?: "modal" | "page";
  signInCallbackUrl?: string;
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
    return {
      next: comments.filter((comment) => comment.id !== id),
      removed: 1 + top.replies.length,
    };
  }
  return {
    next: comments.map((comment) => ({
      ...comment,
      replies: comment.replies.filter((reply) => reply.id !== id),
    })),
    removed: 1,
  };
}

export function CommunityReviewComments({
  reviewId,
  initialComments,
  commentCount,
  onCommentCountChange,
  isLoggedIn,
  currentUserId,
  currentUserImage,
  currentUserInitials,
  composerRef,
  layout = "modal",
  signInCallbackUrl,
}: CommunityReviewCommentsProps) {
  const prompt = useSignInPromptOptional();
  const [comments, setComments] = useState(initialComments);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [, startTransition] = useTransition();

  function requireAuth() {
    prompt?.promptSignIn(signInCallbackUrl ?? "/community");
  }

  function handleReply(comment: CommentItem, parentId: string) {
    if (!isLoggedIn) {
      requireAuth();
      return;
    }
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
    requestAnimationFrame(() => composerRef.current?.focus());
  }

  function handleLike(commentId: string) {
    if (!isLoggedIn) {
      requireAuth();
      return;
    }
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
      if (!result.success || result.liked === undefined) {
        setComments(previous);
      }
    });
  }

  function handleDelete(commentId: string) {
    const previous = comments;
    const { next, removed } = removeComment(comments, commentId);
    const nextCount = Math.max(0, commentCount - removed);
    setComments(next);
    onCommentCountChange(nextCount);
    publishCommunityReviewSync({ reviewId, commentCount: nextCount });
    startTransition(async () => {
      const result = await deleteCommentAction(commentId, reviewId);
      if (!result.success) {
        setComments(previous);
        onCommentCountChange(commentCount);
        publishCommunityReviewSync({ reviewId, commentCount });
      }
    });
  }

  async function handleEdit(commentId: string, nextBody: string) {
    const previous = comments;
    setComments((current) =>
      patchComment(current, commentId, (comment) => ({
        ...comment,
        body: nextBody,
      }))
    );
    const result = await updateCommentAction(commentId, reviewId, nextBody);
    if (!result.success) {
      setComments(previous);
      return false;
    }
    return true;
  }

  return (
    <div>
      <div className="space-y-3">
        <p className="text-[13px] font-semibold text-[var(--mv-ink)]">Comments</p>

        {comments.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-[var(--mv-text-muted)]">
            No comments yet.
            <br />
            Be the first to comment.
          </p>
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
            onGuestAction={requireAuth}
            variant="social"
          />
        )}
      </div>

      <div
        id="community-review-composer"
        className={cn(
          "sticky bottom-0 z-10 border-t border-[var(--mv-border)] bg-[var(--mv-bg)] pt-3",
          layout === "modal"
            ? "-mx-4 px-4 pb-4 sm:-mx-6 sm:px-6"
            : "pb-4"
        )}
      >
        {isLoggedIn ? (
          <InlineCommentComposer
            reviewId={reviewId}
            avatarInitials={currentUserInitials}
            avatarUrl={currentUserImage}
            inputRef={composerRef}
            appearance="social"
            parentCommentId={replyTarget?.parentId}
            placeholder={
              replyTarget
                ? `Reply to ${replyTarget.authorName}…`
                : "Write a comment…"
            }
            onPosted={(comment) => {
              const nextCount = commentCount + 1;
              setComments((prev) => {
                if (comment.parentCommentId) {
                  return prev.map((item) =>
                    item.id === comment.parentCommentId
                      ? {
                          ...item,
                          replies: [...(item.replies ?? []), comment],
                        }
                      : item
                  );
                }
                return [...prev, comment];
              });
              onCommentCountChange(nextCount);
              publishCommunityReviewSync({
                reviewId,
                commentCount: nextCount,
                comment,
              });
              setReplyTarget(null);
            }}
            onCancel={replyTarget ? () => setReplyTarget(null) : undefined}
          />
        ) : (
          <button
            type="button"
            onClick={requireAuth}
            className="flex w-full items-center gap-2 rounded-full border border-[var(--mv-border)] bg-[var(--mv-paper)] px-3 py-2.5 text-left text-sm text-[var(--mv-text-muted)]"
          >
            <Avatar className="size-9 shrink-0">
              {currentUserImage ? (
                <AvatarImage src={currentUserImage} alt="" />
              ) : null}
              <AvatarFallback className="bg-[var(--mv-plum)]/15 text-[10px] font-bold text-[var(--mv-plum)]">
                {currentUserInitials}
              </AvatarFallback>
            </Avatar>
            Comment as a reader
          </button>
        )}
      </div>
    </div>
  );
}
