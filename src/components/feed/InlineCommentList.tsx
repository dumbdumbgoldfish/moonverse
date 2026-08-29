"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ViewRepliesToggle } from "@/components/community/ViewRepliesToggle";
import { formatCompactRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { CommentItem } from "@/types/review";
import { InlineCommentComposer } from "@/components/feed/InlineCommentComposer";

interface InlineCommentListProps {
  comments: CommentItem[];
  reviewId: string;
  currentUserInitials: string;
  onReplyPosted: (comment: CommentItem) => void;
  previewOnly?: boolean;
}

function CommentAvatar({
  comment,
  className,
}: {
  comment: CommentItem;
  className?: string;
}) {
  return (
    <Avatar className={cn("shrink-0", className)}>
      {comment.authorAvatarUrl ? (
        <AvatarImage src={comment.authorAvatarUrl} alt="" />
      ) : null}
      <AvatarFallback className="bg-[#F4ECF8] text-[11px] font-bold text-[#6E46C7]">
        {comment.authorAvatar}
      </AvatarFallback>
    </Avatar>
  );
}

function ReplyBubble({ comment }: { comment: CommentItem }) {
  return (
    <div className="min-w-0 flex-1 rounded-[18px] bg-[#F0F2F5] px-3 py-2">
      <p className="text-[13px] font-semibold text-[#1a1033]">
        {comment.authorName}
        <span className="ml-1.5 font-medium text-[#65676B]">
          {formatCompactRelativeTime(comment.createdAt)}
        </span>
      </p>
      <p className="mt-0.5 whitespace-pre-line text-[13px] leading-snug text-[#050505]">
        {comment.body}
      </p>
    </div>
  );
}

export function InlineCommentList({
  comments,
  reviewId,
  currentUserInitials,
  onReplyPosted,
  previewOnly = false,
}: InlineCommentListProps) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>(
    {}
  );

  if (comments.length === 0) return null;

  function toggleReplies(commentId: string) {
    setExpandedReplies((current) => ({
      ...current,
      [commentId]: !current[commentId],
    }));
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => {
        const replyCount = comment.replies?.length ?? 0;
        const repliesOpen = Boolean(expandedReplies[comment.id]);

        return (
          <li key={comment.id}>
            <div className="flex gap-2.5">
              <CommentAvatar comment={comment} className="mt-0.5 size-8" />
              <div className="min-w-0 flex-1">
                <div className="rounded-[18px] bg-[#F0F2F5] px-3 py-2">
                  <p className="text-[13px] font-semibold text-[#1a1033]">
                    {comment.authorName}
                    <span className="ml-1.5 font-medium text-[#65676B]">
                      {formatCompactRelativeTime(comment.createdAt)}
                    </span>
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-[13px] leading-snug text-[#050505]">
                    {comment.body}
                  </p>
                </div>

                {!previewOnly ? (
                  <div className="mt-1 px-1">
                    <button
                      type="button"
                      className="text-[12px] font-semibold text-[#65676B] hover:underline"
                      onClick={() =>
                        setReplyTo((current) =>
                          current === comment.id ? null : comment.id
                        )
                      }
                    >
                      Reply
                    </button>
                  </div>
                ) : null}

                {replyCount > 0 ? (
                  <div className="mt-0.5 px-1">
                    <ViewRepliesToggle
                      count={replyCount}
                      expanded={repliesOpen}
                      onClick={() => toggleReplies(comment.id)}
                    />
                  </div>
                ) : null}

                {!previewOnly && replyTo === comment.id ? (
                  <div className="mt-2">
                    <InlineCommentComposer
                      reviewId={reviewId}
                      avatarInitials={currentUserInitials}
                      parentCommentId={comment.id}
                      placeholder={`Reply to ${comment.authorName}…`}
                      autoFocus
                      onCancel={() => setReplyTo(null)}
                      onPosted={(posted) => {
                        onReplyPosted(posted);
                        setReplyTo(null);
                      }}
                    />
                  </div>
                ) : null}

                {replyCount > 0 && repliesOpen ? (
                  <ul className="mt-2 space-y-2 pl-2">
                    {comment.replies!.map((reply) => (
                      <li key={reply.id} className="flex gap-2.5">
                        <CommentAvatar comment={reply} className="mt-0.5 size-7" />
                        <ReplyBubble comment={reply} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
