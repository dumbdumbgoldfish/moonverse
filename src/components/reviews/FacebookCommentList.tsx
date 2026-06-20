"use client";

import { Trash2 } from "lucide-react";
import { deleteCommentAction } from "@/actions/interaction.actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CommentItem } from "@/types/review";
import { useTransition } from "react";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

interface FacebookCommentItemProps {
  comment: CommentItem;
  reviewId: string;
  currentUserId?: string;
  isReply?: boolean;
  onReply: (commentId: string) => void;
  replyingToId: string | null;
  isLoggedIn: boolean;
  replyForm?: React.ReactNode;
}

export function FacebookCommentItem({
  comment,
  reviewId,
  currentUserId,
  isReply = false,
  onReply,
  replyingToId,
  isLoggedIn,
  replyForm,
}: FacebookCommentItemProps) {
  const [isPending, startTransition] = useTransition();
  const isOwner = currentUserId === comment.userId;

  function handleDelete() {
    if (!window.confirm("Delete this comment?")) return;
    startTransition(async () => {
      await deleteCommentAction(comment.id, reviewId);
    });
  }

  return (
    <li className={cn(isReply && "ml-8 sm:ml-12")}>
      <div className="flex gap-2">
        <Avatar size="sm" className="mt-1 shrink-0">
          <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
            {comment.authorAvatar}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
            <p className="text-sm font-semibold text-foreground">
              {comment.authorName}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground/90">
              {comment.body}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 px-1">
            <time
              dateTime={comment.createdAt}
              className="text-xs font-medium text-muted-foreground"
            >
              {formatDate(comment.createdAt)}
            </time>
            {!isReply && isLoggedIn && (
              <button
                type="button"
                onClick={() => onReply(comment.id)}
                className="text-xs font-semibold text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                Reply
              </button>
            )}
            {isOwner && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 px-1 text-xs text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isPending}
                aria-label="Delete comment"
              >
                <Trash2 size={12} aria-hidden="true" />
              </Button>
            )}
          </div>

          {replyingToId === comment.id && replyForm && (
            <div className="mt-3">{replyForm}</div>
          )}

          {comment.replies.length > 0 && (
            <ul className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <FacebookCommentItem
                  key={reply.id}
                  comment={reply}
                  reviewId={reviewId}
                  currentUserId={currentUserId}
                  isReply
                  onReply={onReply}
                  replyingToId={replyingToId}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

interface FacebookCommentListProps {
  comments: CommentItem[];
  reviewId: string;
  currentUserId?: string;
  isLoggedIn: boolean;
  replyingToId: string | null;
  onReply: (commentId: string) => void;
  getReplyForm: (parentCommentId: string, onCancel: () => void) => React.ReactNode;
}

export function FacebookCommentList({
  comments,
  reviewId,
  currentUserId,
  isLoggedIn,
  replyingToId,
  onReply,
  getReplyForm,
}: FacebookCommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No comments yet. Be the first to share your thoughts.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <FacebookCommentItem
          key={comment.id}
          comment={comment}
          reviewId={reviewId}
          currentUserId={currentUserId}
          onReply={onReply}
          replyingToId={replyingToId}
          isLoggedIn={isLoggedIn}
          replyForm={
            replyingToId === comment.id
              ? getReplyForm(comment.id, () => onReply(""))
              : undefined
          }
        />
      ))}
    </ul>
  );
}
