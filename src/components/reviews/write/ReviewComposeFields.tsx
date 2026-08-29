"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  handleReviewBodySlashKeyDown,
  ReviewBodySlashMenu,
} from "@/components/reviews/write/ReviewBodySlashMenu";
import { StarRatingInput } from "@/components/reviews/write/StarRatingInput";
import { WritingStudioFormSection } from "@/components/reviews/write/WritingStudioFormSection";
import { WritingStudioNovelChip } from "@/components/reviews/write/WritingStudioNovelChip";
import { FocusModeHint } from "@/components/reviews/write/WritingStudioFocusShell";
import { cn } from "@/lib/utils";
import { LIMITS } from "@/lib/validation";

interface ReviewComposeFieldsProps {
  selectedSummary: {
    title: string;
    author: string | null;
    coverUrl: string | null;
  } | null;
  rating: number;
  onRatingChange: (value: number) => void;
  containsSpoilers: boolean;
  onSpoilersChange: (value: boolean) => void;
  reviewTitle: string;
  onReviewTitleChange: (value: string) => void;
  reviewBody: string;
  onReviewBodyChange: (value: string) => void;
  titleLength: number;
  bodyLength: number;
  wordCount: number;
  isPending: boolean;
  onChangeNovel?: () => void;
  variant?: "default" | "focus";
  showNovelChip?: boolean;
}

function ComposeSection({
  isFocus,
  eyebrow,
  title,
  description,
  badge,
  children,
  bodyClassName,
}: {
  isFocus: boolean;
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: "required" | "optional" | "read-only";
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  if (isFocus) {
    return (
      <section className={cn("space-y-4", bodyClassName)}>
        <div className="border-b border-[var(--mv-border)]/80 pb-3">
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--mv-plum)]">
              {eyebrow}
            </p>
          ) : null}
          <h3
            className={cn(
              "font-serif text-xl font-semibold text-[var(--mv-ink)]",
              eyebrow && "mt-0.5"
            )}
          >
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-sm text-[var(--mv-text-muted)]">{description}</p>
          ) : null}
        </div>
        {children}
      </section>
    );
  }

  return (
    <WritingStudioFormSection
      eyebrow={eyebrow}
      title={title}
      description={description}
      badge={badge}
      bodyClassName={bodyClassName}
    >
      {children}
    </WritingStudioFormSection>
  );
}

export function ReviewComposeFields({
  selectedSummary,
  rating,
  onRatingChange,
  containsSpoilers,
  onSpoilersChange,
  reviewTitle,
  onReviewTitleChange,
  reviewBody,
  onReviewBodyChange,
  titleLength,
  bodyLength,
  wordCount,
  isPending,
  onChangeNovel,
  variant = "default",
  showNovelChip = true,
}: ReviewComposeFieldsProps) {
  const isFocus = variant === "focus";
  const [bodyCursor, setBodyCursor] = useState(reviewBody.length);
  const focusBodyRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (!isFocus) return;
    const el = focusBodyRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(180, el.scrollHeight)}px`;
  }, [reviewBody, isFocus]);

  function applyBodyEdit(nextBody: string, nextCursor: number) {
    onReviewBodyChange(nextBody);
    requestAnimationFrame(() => {
      const el = document.getElementById(
        isFocus ? "review-body-focus" : "review-body"
      ) as HTMLTextAreaElement | null;
      if (!el) return;
      el.focus();
      el.setSelectionRange(nextCursor, nextCursor);
      setBodyCursor(nextCursor);
    });
  }

  const spoilerControl = (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--mv-border)] bg-[var(--mv-paper)]/60 px-4 py-3.5">
      <div>
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--mv-ink)]">
          <ShieldAlert className="size-4 text-[var(--mv-plum)]" aria-hidden />
          Contains spoilers
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--mv-text-muted)]">
          Readers will see a spoiler warning before the review body.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={containsSpoilers}
        disabled={isPending}
        onClick={() => onSpoilersChange(!containsSpoilers)}
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]",
          containsSpoilers
            ? "bg-[var(--mv-deep-plum)]"
            : "bg-[var(--mv-border)]"
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-6 rounded-full bg-white shadow transition",
            containsSpoilers ? "left-7" : "left-1"
          )}
        />
        <span className="sr-only">Toggle spoiler warning</span>
      </button>
    </div>
  );

  return (
    <div className={cn("space-y-5", isFocus && "space-y-8")}>
      {showNovelChip && selectedSummary ? (
        <WritingStudioNovelChip
          title={selectedSummary.title}
          author={selectedSummary.author}
          coverUrl={selectedSummary.coverUrl}
          onChange={onChangeNovel}
        />
      ) : null}

      <ComposeSection
        isFocus={isFocus}
        title="Your verdict"
        description="Set an honest rating and flag spoilers if needed."
        badge="required"
        bodyClassName="space-y-4"
      >
        <StarRatingInput
          value={rating}
          onChange={onRatingChange}
          disabled={isPending}
          error={rating === 0 ? "Choose a rating from 1 to 5." : null}
        />
        {spoilerControl}
      </ComposeSection>

      <ComposeSection
        isFocus={isFocus}
        title="Headline"
        description="A sharp title helps readers scan the salon."
        badge="required"
        bodyClassName="space-y-3"
      >
        <div className="flex items-end justify-between gap-3">
          <Label htmlFor={isFocus ? "review-title-focus" : "review-title"} className="sr-only">
            Review title
          </Label>
          <span className="text-xs text-[var(--mv-text-muted)]">
            {titleLength}/{LIMITS.reviewTitleRecommended.max} recommended
          </span>
        </div>
        <Input
          id={isFocus ? "review-title-focus" : "review-title"}
          value={reviewTitle}
          onChange={(e) => onReviewTitleChange(e.target.value)}
          placeholder="A slow start that becomes unforgettable"
          disabled={isPending}
          maxLength={LIMITS.reviewTitle.max}
          aria-invalid={
            reviewTitle.length > 0 && titleLength < LIMITS.reviewTitle.min
              ? true
              : undefined
          }
          aria-describedby={
            reviewTitle.length > 0 && titleLength < LIMITS.reviewTitle.min
              ? "review-title-error"
              : undefined
          }
          className={cn(
            "h-12 rounded-xl border-[var(--mv-border)] bg-white font-serif shadow-sm focus-visible:ring-[var(--mv-plum)]",
            isFocus ? "text-xl" : "text-lg"
          )}
        />
        {reviewTitle.length > 0 && titleLength < LIMITS.reviewTitle.min ? (
          <p id="review-title-error" className="text-sm text-destructive" role="alert">
            Review title needs at least {LIMITS.reviewTitle.min} characters.
          </p>
        ) : !isFocus ? (
          <p className="text-xs text-[var(--mv-text-muted)]">
            e.g. “A slow burn that pays off in the final arc.”
          </p>
        ) : null}
      </ComposeSection>

      <ComposeSection
        isFocus={isFocus}
        title="Your review"
        description="Write freely. Readers see this in the salon."
        badge="required"
        bodyClassName="space-y-3"
      >
        <div className="flex items-end justify-between gap-3">
          <Label htmlFor={isFocus ? "review-body-focus" : "review-body"} className="sr-only">
            Review body
          </Label>
          <span className="text-xs text-[var(--mv-text-muted)]">
            {wordCount} words
            {wordCount > 0
              ? ` · ~${Math.max(1, Math.ceil(wordCount / 200))} min read`
              : null}{" "}
            · {bodyLength}/{LIMITS.reviewBody.max}
          </span>
        </div>
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-[var(--mv-border)] bg-white",
            isFocus
              ? "shadow-[0_16px_40px_-28px_rgba(36,22,48,0.4)] ring-1 ring-[var(--mv-plum)]/8"
              : "shadow-[0_10px_30px_-24px_rgba(36,22,48,0.25)]"
          )}
        >
          <div className="relative">
            <Textarea
              ref={isFocus ? focusBodyRef : undefined}
              id={isFocus ? "review-body-focus" : "review-body"}
              value={reviewBody}
              onChange={(e) => {
                onReviewBodyChange(e.target.value);
                setBodyCursor(e.target.selectionStart ?? e.target.value.length);
              }}
              onClick={(e) =>
                setBodyCursor(
                  (e.target as HTMLTextAreaElement).selectionStart ?? reviewBody.length
                )
              }
              onKeyUp={(e) =>
                setBodyCursor(
                  (e.target as HTMLTextAreaElement).selectionStart ?? reviewBody.length
                )
              }
              onKeyDown={(e) => {
                if (
                  handleReviewBodySlashKeyDown(e, reviewBody, applyBodyEdit)
                ) {
                  return;
                }
              }}
              placeholder="Share what stood out, what dragged, and who should read this next…"
              disabled={isPending}
              rows={isFocus ? 6 : 12}
              maxLength={LIMITS.reviewBody.max}
              aria-invalid={
                reviewBody.length > 0 && bodyLength < LIMITS.reviewBody.min
                  ? true
                  : undefined
              }
              aria-describedby={
                reviewBody.length > 0 && bodyLength < LIMITS.reviewBody.min
                  ? "review-body-error"
                  : undefined
              }
              className={cn(
                "rounded-none border-0 bg-white font-serif text-[17px] leading-[1.75] text-[var(--mv-ink)] focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]/30",
                isFocus
                  ? "min-h-[11rem] resize-none overflow-hidden shadow-none"
                  : "min-h-[280px] max-h-[520px] resize-y"
              )}
              autoFocus={isFocus}
            />
            <ReviewBodySlashMenu
              body={reviewBody}
              cursor={bodyCursor}
              onInsert={applyBodyEdit}
            />
          </div>
        </div>
        {reviewBody.length > 0 && bodyLength < LIMITS.reviewBody.min ? (
          <p id="review-body-error" className="text-sm text-destructive" role="alert">
            Review body needs at least {LIMITS.reviewBody.min} characters (
            {bodyLength} so far).
          </p>
        ) : (
          <p className="text-xs text-[var(--mv-text-muted)]">
            Minimum {LIMITS.reviewBody.min} characters.
          </p>
        )}
        {isFocus ? <FocusModeHint /> : null}
      </ComposeSection>
    </div>
  );
}
