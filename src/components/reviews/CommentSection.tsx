"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createCommentAction } from "@/actions/interaction.actions";
import { FacebookCommentList } from "@/components/reviews/FacebookCommentList";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/lib/validation";
import type { CommentItem } from "@/types/review";

interface CommentSectionProps {
  reviewId: string;
  comments: CommentItem[];
  commentCount: number;
  currentUserId?: string;
  isLoggedIn: boolean;
}

function CommentForm({
  reviewId,
  parentCommentId,
  placeholder,
  submitLabel,
  onCancel,
}: {
  reviewId: string;
  parentCommentId?: string;
  placeholder: string;
  submitLabel: string;
  onCancel?: () => void;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createCommentAction(reviewId, body, parentCommentId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setBody("");
      onCancel?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={2}
        required
        minLength={LIMITS.commentBody.min}
        maxLength={LIMITS.commentBody.max}
        disabled={isPending}
        aria-label={placeholder}
        className="rounded-2xl bg-muted/50"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
          {isPending ? "Posting…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function CommentSection({
  reviewId,
  comments,
  commentCount,
  currentUserId,
  isLoggedIn,
}: CommentSectionProps) {
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  function handleReply(commentId: string) {
    if (!commentId) {
      setReplyingToId(null);
      return;
    }
    setReplyingToId((prev) => (prev === commentId ? null : commentId));
  }

  return (
    <section id="comments" aria-labelledby="comments-heading" className="mt-8">
      <h2 id="comments-heading" className="text-lg font-semibold">
        Comments ({commentCount})
      </h2>

      <div className="mt-4 rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
        <FacebookCommentList
          comments={comments}
          reviewId={reviewId}
          currentUserId={currentUserId}
          isLoggedIn={isLoggedIn}
          replyingToId={replyingToId}
          onReply={handleReply}
          getReplyForm={(parentId, onCancel) => (
            <CommentForm
              reviewId={reviewId}
              parentCommentId={parentId}
              placeholder="Write a reply…"
              submitLabel="Post reply"
              onCancel={onCancel}
            />
          )}
        />
      </div>

      <div className="mt-6">
        {isLoggedIn ? (
          <CommentForm
            reviewId={reviewId}
            placeholder="Write a comment…"
            submitLabel="Post comment"
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-bg-warm p-4 text-center text-sm text-muted-foreground">
            <Link
              href={`/login?callbackUrl=/reviews/${reviewId}`}
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Log in
            </Link>{" "}
            to join the conversation.
          </div>
        )}
      </div>
    </section>
  );
}
