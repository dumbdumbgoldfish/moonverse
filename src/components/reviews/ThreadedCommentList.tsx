"use client";

import { useState, useTransition } from "react";
import { Heart, Pencil, Trash2 } from "lucide-react";
import { ReportTargetType } from "@prisma/client";
import { ReportButton } from "@/components/moderation/ReportButton";
import { ViewRepliesToggle } from "@/components/community/ViewRepliesToggle";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCompactRelativeTime,
  formatRelativeTime,
} from "@/lib/date-utils";
import { formatEngagementCount } from "@/lib/format-engagement-count";
import { cn } from "@/lib/utils";
import { LIMITS } from "@/lib/validation";
import type { CommentItem } from "@/types/review";

export type ReplyTarget = {
  parentId: string;
  commentId: string;
  authorName: string;
  authorUsername?: string;
};

interface ThreadedCommentListProps {
  comments: CommentItem[];
  currentUserId?: string;
  isLoggedIn: boolean;
  replyTarget: ReplyTarget | null;
  onReply: (comment: CommentItem, parentId: string) => void;
  onLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, body: string) => Promise<boolean>;
  onGuestAction: () => void;
  variant?: "default" | "social";
}

export function ThreadedCommentList({
  comments,
  currentUserId,
  isLoggedIn,
  replyTarget,
  onReply,
  onLike,
  onDelete,
  onEdit,
  onGuestAction,
  variant = "default",
}: ThreadedCommentListProps) {
  if (comments.length === 0) return null;

  return (
    <ul className={variant === "social" ? "space-y-2" : "divide-y divide-[#6E46C7]/8"}>
      {comments.map((comment) => (
        <ThreadedCommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          isLoggedIn={isLoggedIn}
          threadRootId={comment.id}
          replyTarget={replyTarget}
          onReply={onReply}
          onLike={onLike}
          onDelete={onDelete}
          onEdit={onEdit}
          onGuestAction={onGuestAction}
          variant={variant}
        />
      ))}
    </ul>
  );
}

function ThreadedCommentItem({
  comment,
  currentUserId,
  isLoggedIn,
  isReply = false,
  threadRootId,
  replyTarget,
  onReply,
  onLike,
  onDelete,
  onEdit,
  onGuestAction,
  variant = "default",
}: {
  comment: CommentItem;
  currentUserId?: string;
  isLoggedIn: boolean;
  isReply?: boolean;
  threadRootId: string;
  replyTarget: ReplyTarget | null;
  onReply: (comment: CommentItem, parentId: string) => void;
  onLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, body: string) => Promise<boolean>;
  onGuestAction: () => void;
  variant?: "default" | "social";
}) {
  const isOwner = currentUserId === comment.userId;
  const isReplying = replyTarget?.commentId === comment.id;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const social = variant === "social";
  const displayName = social
    ? comment.authorName
    : comment.authorUsername
      ? `@${comment.authorUsername}`
      : comment.authorName;
  const stamp = social
    ? formatCompactRelativeTime(comment.createdAt)
    : formatRelativeTime(comment.createdAt);

  function handleLike() {
    if (!isLoggedIn) {
      onGuestAction();
      return;
    }
    onLike(comment.id);
  }

  function handleReply() {
    if (!isLoggedIn) {
      onGuestAction();
      return;
    }
    onReply(comment, threadRootId);
  }

  function handleDelete() {
    if (!window.confirm("Delete this comment?")) return;
    onDelete(comment.id);
  }

  function handleSaveEdit() {
    const next = draft.trim();
    if (!next || next === comment.body) {
      setEditing(false);
      setDraft(comment.body);
      return;
    }
    startTransition(async () => {
      const ok = await onEdit(comment.id, next);
      if (ok) setEditing(false);
    });
  }

  return (
    <li className={cn(isReply && (social ? "ml-8" : "ml-9 border-l border-[#6E46C7]/12 pl-3"))}>
      <div className={cn("flex", social ? "gap-3" : "gap-2.5", social ? "py-1" : isReply ? "py-2" : "py-3")}>
        <Avatar
          className={cn(
            "mt-0.5 shrink-0",
            social ? (isReply ? "size-8" : "size-9") : isReply ? "size-7" : "size-8"
          )}
        >
          {comment.authorAvatarUrl ? (
            <AvatarImage src={comment.authorAvatarUrl} alt="" />
          ) : null}
          <AvatarFallback
            className={cn(
              "bg-[#F4ECF8] font-bold text-[#6E46C7]",
              social ? "text-[11px]" : "text-[9px]"
            )}
          >
            {comment.authorAvatar}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {social && !editing ? (
            <div className="rounded-[18px] bg-[#F0F2F5] px-3 py-2">
              <p className="text-[13px] leading-snug">
                <span className="font-semibold text-[#1a1033]">{displayName}</span>
                <span className="text-[#c5bed4]"> · </span>
                <time
                  dateTime={comment.createdAt}
                  className="font-medium text-[#7a7284]"
                  suppressHydrationWarning
                >
                  {stamp}
                </time>
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[13px] leading-relaxed text-[#3d2f5c]",
                  isReplying && "text-[#6E46C7]"
                )}
              >
                {comment.body}
              </p>
            </div>
          ) : !social ? (
            <p className="text-[13px] leading-snug">
              <span className="font-bold text-[#1a1033]">{displayName}</span>
              <span className="text-[#c5bed4]"> · </span>
              <time
                dateTime={comment.createdAt}
                className="font-medium text-[#7a7284]"
                suppressHydrationWarning
              >
                {stamp}
              </time>
            </p>
          ) : null}
          {editing ? (
            <div className="mt-1.5 space-y-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                maxLength={LIMITS.commentBody.max}
                className="min-h-[4rem] rounded-xl border-[#6E46C7]/15 bg-white text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-full"
                  disabled={isPending || !draft.trim()}
                  onClick={handleSaveEdit}
                >
                  {isPending ? "Saving…" : "Save"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-full"
                  onClick={() => {
                    setEditing(false);
                    setDraft(comment.body);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : social ? null : (
            <p
              className={cn(
                "mt-0.5 text-[13px] leading-relaxed text-[#3d2f5c]",
                isReplying && "rounded-md bg-[#F4ECF8]/80 px-1.5 py-0.5"
              )}
            >
              {comment.body}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[12px] font-semibold">
            <button
              type="button"
              onClick={handleLike}
              aria-pressed={Boolean(comment.likedByMe)}
              className={cn(
                "inline-flex min-h-7 items-center gap-1",
                comment.likedByMe
                  ? "text-[#6E46C7]"
                  : "text-[#7a7284] hover:text-[#6E46C7]"
              )}
            >
              <Heart
                className={cn("size-3", comment.likedByMe && "fill-current")}
                aria-hidden
              />
              {comment.likeCount > 0
                ? formatEngagementCount(comment.likeCount)
                : "Like"}
            </button>
            <button
              type="button"
              onClick={handleReply}
              className={cn(
                "min-h-7 text-[#65676B] hover:underline",
                isReplying && "text-[#6E46C7]"
              )}
            >
              Reply
            </button>
            {isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(comment.body);
                    setEditing(true);
                  }}
                  className="inline-flex min-h-7 items-center gap-1 text-[#7a7284] hover:text-[#6E46C7]"
                >
                  <Pencil className="size-3" aria-hidden />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex min-h-7 items-center text-[#7a7284] hover:text-destructive"
                  aria-label="Delete comment"
                >
                  <Trash2 className="size-3" aria-hidden />
                </button>
              </>
            ) : isLoggedIn ? (
              <ReportButton
                targetType={ReportTargetType.COMMENT}
                targetId={comment.id}
                isLoggedIn={isLoggedIn}
                variant="text"
                className="min-h-7 px-0 py-0 text-[#65676B] hover:bg-transparent hover:underline"
              />
            ) : null}
          </div>

          {!isReply && comment.replies.length > 0 ? (
            <div className="mt-0.5">
              <ViewRepliesToggle
                count={comment.replies.length}
                expanded={repliesExpanded}
                onClick={() => setRepliesExpanded((value) => !value)}
              />
            </div>
          ) : null}

          {comment.replies.length > 0 && (isReply || repliesExpanded) ? (
            <ul className="mt-1">
              {comment.replies.map((reply) => (
                <ThreadedCommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  isLoggedIn={isLoggedIn}
                  isReply
                  threadRootId={threadRootId}
                  replyTarget={replyTarget}
                  onReply={onReply}
                  onLike={onLike}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onGuestAction={onGuestAction}
                  variant={variant}
                />
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </li>
  );
}
