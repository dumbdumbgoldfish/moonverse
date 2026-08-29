"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { createCommentAction } from "@/actions/interaction.actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LIMITS } from "@/lib/validation";
import type { CommentItem } from "@/types/review";

interface InlineCommentComposerProps {
  reviewId: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  parentCommentId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onPosted: (comment: CommentItem) => void;
  onCancel?: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  appearance?: "default" | "social";
}

export function InlineCommentComposer({
  reviewId,
  avatarInitials,
  avatarUrl,
  parentCommentId,
  placeholder = "Write a comment…",
  autoFocus,
  onPosted,
  onCancel,
  inputRef,
  appearance = "default",
}: InlineCommentComposerProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createCommentAction(
        reviewId,
        body,
        parentCommentId
      );
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (result.comment) {
        onPosted(result.comment);
      }
      setBody("");
      onCancel?.();
    });
  }

  return (
    <div className="flex gap-2.5">
      <Avatar
        className={cn(
          "mt-1 shrink-0",
          appearance === "social" ? "size-9" : "size-8"
        )}
      >
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback
          className={cn(
            "bg-primary/15 font-bold text-primary",
            appearance === "social" ? "text-[11px]" : "text-[10px]"
          )}
        >
          {avatarInitials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        {error ? (
          <p className="mb-1 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div
          className={
            appearance === "social"
              ? "flex items-end gap-1.5 rounded-full border border-[var(--mv-border)] bg-[#F4ECF8] px-3.5 py-2 focus-within:border-[#6E46C7]/40 focus-within:ring-1 focus-within:ring-[#6E46C7]/30"
              : "flex items-end gap-1.5 rounded-2xl border border-violet-100 bg-[#faf8ff] px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          }
        >
          <textarea
            ref={inputRef}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={placeholder}
            rows={1}
            autoFocus={autoFocus}
            disabled={isPending}
            maxLength={LIMITS.commentBody.max}
            aria-label={placeholder}
            className="max-h-28 min-h-[1.5rem] flex-1 resize-none bg-transparent text-sm text-night-blue outline-none placeholder:text-slate-400"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="shrink-0 text-primary hover:bg-violet-100"
            disabled={isPending || !body.trim()}
            onClick={submit}
            aria-label="Send comment"
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="mt-1 text-xs font-semibold text-slate-500 hover:text-primary"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
