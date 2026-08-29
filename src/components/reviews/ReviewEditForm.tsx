"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PenLine, Trash2 } from "lucide-react";
import {
  deleteReviewAction,
  updateReviewAction,
} from "@/actions/review.actions";
import { Button } from "@/components/ui/button";
import { CanonicalNovelSummary } from "@/components/reviews/write/CanonicalNovelSummary";
import { ReviewComposeFields } from "@/components/reviews/write/ReviewComposeFields";
import { WritingStudioBackdrop } from "@/components/reviews/write/WritingStudioChrome";
import { WritingStudioBar } from "@/components/reviews/write/WritingStudioBar";
import { WritingStudioCommandPalette } from "@/components/reviews/write/WritingStudioCommandPalette";
import { WritingStudioContextRail } from "@/components/reviews/write/WritingStudioContextRail";
import {
  FocusModePrimaryButton,
  FocusModeSecondaryButton,
  WritingStudioFocusShell,
} from "@/components/reviews/write/WritingStudioFocusShell";
import { WritingStudioMobileActions } from "@/components/reviews/write/WritingStudioMobileActions";
import { WritingStudioMobileSheet } from "@/components/reviews/write/WritingStudioMobileSheet";
import { WritingStudioPublishDrawer } from "@/components/reviews/write/WritingStudioPublishDrawer";
import { useWritingStudioCommandPalette } from "@/components/reviews/write/useWritingStudioCommandPalette";
import type { WritingStudioCommand } from "@/components/reviews/write/writing-studio-commands";
import type { ChecklistItem } from "@/components/reviews/write/writing-studio.types";
import { REVIEW_SECTION_TEMPLATES } from "@/lib/review-sections";
import { withActionTimeout } from "@/lib/action-timeout";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import { LIMITS } from "@/lib/validation";
import type { ReviewDetail } from "@/types/review";

interface ReviewEditFormProps {
  review: ReviewDetail;
}

export function ReviewEditForm({ review }: ReviewEditFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isPending = isSaving || isDeleting;
  const [error, setError] = useState<string | null>(null);
  const [publishDrawerOpen, setPublishDrawerOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title);
  const [body, setBody] = useState(review.body);
  const [containsSpoilers, setContainsSpoilers] = useState(
    review.containsSpoilers
  );
  const commandPalette = useWritingStudioCommandPalette(true);

  const titleLength = title.trim().length;
  const bodyLength = body.trim().length;
  const wordCount = useMemo(
    () => body.trim().split(/\s+/).filter(Boolean).length,
    [body]
  );

  const canSave =
    rating >= 1 &&
    titleLength >= LIMITS.reviewTitle.min &&
    bodyLength >= LIMITS.reviewBody.min;

  const selectedSummary = {
    title: review.novelTitle,
    author: review.novelAuthor,
    coverUrl: review.coverUrl,
  };

  const checklist: ChecklistItem[] = useMemo(
    () => [
      { id: "rating", label: "Rating", complete: rating > 0 },
      {
        id: "title",
        label: "Headline",
        complete: titleLength >= LIMITS.reviewTitle.min,
      },
      {
        id: "body",
        label: "Review body",
        complete: bodyLength >= LIMITS.reviewBody.min,
      },
    ],
    [rating, titleLength, bodyLength]
  );

  const missingLabels = checklist
    .filter((item) => !item.complete)
    .map((item) => item.label);

  const workspaceProgress = useMemo(() => {
    const done = checklist.filter((item) => item.complete).length;
    return Math.round((done / checklist.length) * 100);
  }, [checklist]);

  function insertAtCursor(text: string) {
    const textarea = document.getElementById(
      focusMode ? "review-body-focus" : "review-body"
    ) as HTMLTextAreaElement | null;
    const start = textarea?.selectionStart ?? body.length;
    const end = textarea?.selectionEnd ?? body.length;
    const prefix =
      body.length > 0 && start > 0 && !body.slice(0, start).endsWith("\n\n")
        ? "\n\n"
        : "";
    const next = body.slice(0, start) + prefix + text + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      if (!textarea) return;
      const cursor = start + prefix.length + text.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function insertQuote() {
    const textarea = document.getElementById(
      focusMode ? "review-body-focus" : "review-body"
    ) as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.slice(start, end);
    const quoted = (selected || "Quote here")
      .split("\n")
      .map((line) => (line.startsWith("> ") ? line : `> ${line}`))
      .join("\n");
    const next = body.slice(0, start) + quoted + body.slice(end);
    setBody(next);
  }

  function insertSection(text: string) {
    insertAtCursor(text);
  }

  async function handleUpdate() {
    if (isSaving) return;
    setError(null);

    if (!canSave) {
      setError("Complete your rating, title, and review body before saving.");
      setPublishDrawerOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      const result = await withActionTimeout(
        updateReviewAction({
          reviewId: review.id,
          title: title.trim(),
          body: body.trim(),
          rating,
          containsSpoilers,
        }),
        30_000,
        "Saving timed out. Check your connection and try again."
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setPublishDrawerOpen(false);
      router.push(`/reviews/${review.id}`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update review. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review? This action cannot be undone."
    );
    if (!confirmed) return;

    setError(null);
    setIsDeleting(true);
    try {
      const result = await deleteReviewAction(review.id);
      if (!result.success) {
        setError(result.error);
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete review. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const studioCommands = useMemo((): WritingStudioCommand[] => {
    return [
      ...REVIEW_SECTION_TEMPLATES.map((section) => ({
        id: `insert-${section.id}`,
        label: `Insert ${section.label.toLowerCase()}`,
        group: "Insert" as const,
        disabled: isPending,
        onSelect: () => insertSection(section.insert),
      })),
      {
        id: "insert-quote",
        label: "Insert quote",
        group: "Insert",
        disabled: isPending,
        onSelect: insertQuote,
      },
      {
        id: "toggle-spoilers",
        label: containsSpoilers ? "Remove spoiler flag" : "Mark as spoilers",
        group: "Writing",
        disabled: isPending,
        onSelect: () => setContainsSpoilers((value) => !value),
      },
      {
        id: "focus-mode",
        label: "Enter focus mode",
        group: "Studio",
        disabled: focusMode || isPending,
        onSelect: () => setFocusMode(true),
      },
      {
        id: "preview-changes",
        label: "Preview changes",
        hint: "⌘⇧P",
        group: "Publish",
        disabled: isPending,
        onSelect: () => setPublishDrawerOpen(true),
      },
      {
        id: "save-changes",
        label: "Save changes",
        group: "Publish",
        disabled: isPending || !canSave,
        onSelect: handleUpdate,
      },
    ];
  }, [isPending, containsSpoilers, focusMode, canSave]);

  return (
    <div className="safe-bottom-pad relative min-h-[70vh] bg-[var(--mv-paper)] pb-24 lg:pb-8">
      <WritingStudioBackdrop className="opacity-60" />

      <WritingStudioBar
        subtitle={review.novelTitle}
        progress={workspaceProgress}
        showFocusToggle={!focusMode}
        onFocusToggle={() => setFocusMode(true)}
        onShip={() => setPublishDrawerOpen(true)}
        canShip={canSave}
        isPending={isPending}
      />

      <main className={cn(SITE_SHELL_CLASS, "relative py-5 lg:py-6")}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          <div className="min-w-0 w-full space-y-4">
            {error ? (
              <p
                className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <section className="rounded-2xl border border-[var(--mv-border)] bg-white p-4 shadow-[var(--mv-card-shadow)]">
              <p className="mb-3 text-sm font-semibold text-[var(--mv-ink)]">
                Attached novel
              </p>
              <CanonicalNovelSummary
                title={review.novelTitle}
                author={review.novelAuthor}
                coverUrl={review.coverUrl}
                genres={review.genres}
                themeSeed={review.novelId}
              />
            </section>

            <section
              className="rounded-2xl border border-[var(--mv-border)] bg-white shadow-[var(--mv-card-shadow)]"
              aria-label="Edit your review"
            >
              <div className="border-b border-[var(--mv-border)] px-5 py-4">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mv-plum)]">
                  <PenLine className="size-3.5" aria-hidden />
                  Compose
                </p>
                <h2 className="mt-1 font-serif text-xl font-semibold text-[var(--mv-ink)]">
                  Update your review
                </h2>
                <p className="mt-1 text-sm text-[var(--mv-text-muted)]">
                  Novel metadata stays read-only. You can change rating, headline, body, and spoilers.
                </p>
              </div>
              <div className="px-5 py-5">
                <ReviewComposeFields
                  selectedSummary={selectedSummary}
                  rating={rating}
                  onRatingChange={setRating}
                  containsSpoilers={containsSpoilers}
                  onSpoilersChange={setContainsSpoilers}
                  reviewTitle={title}
                  onReviewTitleChange={setTitle}
                  reviewBody={body}
                  onReviewBodyChange={setBody}
                  titleLength={titleLength}
                  bodyLength={bodyLength}
                  wordCount={wordCount}
                  isPending={isPending}
                  showNovelChip={false}
                />
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-[var(--mv-border)] pt-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
                className="min-h-11 rounded-xl"
              >
                <Trash2 className="mr-1.5 size-4" aria-hidden />
                Delete review
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                className="min-h-11 rounded-xl border-[var(--mv-border)]"
                onClick={() => router.push(`/reviews/${review.id}`)}
              >
                Cancel
              </Button>
            </div>

            <WritingStudioMobileSheet
              checklist={checklist}
              missingLabels={missingLabels}
              canPublish={canSave}
              progress={workspaceProgress}
              onSaveDraft={() => {}}
              onDiscardDraft={() => {}}
              confirmDiscard={false}
              onCancelDiscard={() => {}}
              hasDiscardableContent={false}
              onStartNewReview={() => {}}
              showDraftTools={false}
            />
          </div>

          <div className="hidden lg:block">
            <WritingStudioContextRail
              checklist={checklist}
              missingLabels={missingLabels}
              canPublish={canSave}
              isPending={isPending}
              confirmDiscard={false}
              hasDiscardableContent={false}
              selectedSummary={selectedSummary}
              onSaveDraft={() => {}}
              onDiscardDraft={() => {}}
              onCancelDiscard={() => {}}
              onStartNewReview={() => {}}
              showDraftTools={false}
            />
          </div>
        </div>
      </main>

      {!focusMode ? (
        <WritingStudioMobileActions
          show
          drawerOpen={publishDrawerOpen}
          canPublish={canSave}
          isPending={isPending}
          onShip={() => setPublishDrawerOpen(true)}
          onCloseDrawer={() => setPublishDrawerOpen(false)}
          onPublish={handleUpdate}
          publishLabel="Save"
        />
      ) : null}

      <WritingStudioPublishDrawer
        open={publishDrawerOpen}
        onClose={() => setPublishDrawerOpen(false)}
        canPublish={canSave}
        isPending={isPending}
        onPublish={handleUpdate}
        publishLabel="Save changes"
        publishError={error}
        preview={{
          novelTitle: review.novelTitle,
          novelAuthor: review.novelAuthor,
          coverUrl: review.coverUrl,
          userName: review.reviewerName,
          userUsername: review.reviewerUsername,
          userImage: review.reviewerAvatarUrl,
          rating,
          reviewTitle: title.trim(),
          reviewBody: body.trim(),
          containsSpoilers,
          genreNames: review.genres,
          tagNames: review.tags,
          readingSources: [],
          onEditNovel: () => setPublishDrawerOpen(false),
          onEditReview: () => setPublishDrawerOpen(false),
        }}
      />

      <WritingStudioFocusShell
        open={focusMode}
        title={review.novelTitle}
        novelAuthor={review.novelAuthor}
        coverUrl={review.coverUrl}
        wordCount={wordCount}
        onClose={() => setFocusMode(false)}
        footer={
          <>
            <FocusModeSecondaryButton
              deskSize="sm"
              onClick={() => setFocusMode(false)}
            >
              Done writing
            </FocusModeSecondaryButton>
            <FocusModePrimaryButton
              deskSize="sm"
              onClick={() => {
                setFocusMode(false);
                setPublishDrawerOpen(true);
              }}
              disabled={!canSave || isPending}
            >
              Preview changes
            </FocusModePrimaryButton>
          </>
        }
      >
        <ReviewComposeFields
          selectedSummary={selectedSummary}
          rating={rating}
          onRatingChange={setRating}
          containsSpoilers={containsSpoilers}
          onSpoilersChange={setContainsSpoilers}
          reviewTitle={title}
          onReviewTitleChange={setTitle}
          reviewBody={body}
          onReviewBodyChange={setBody}
          titleLength={titleLength}
          bodyLength={bodyLength}
          wordCount={wordCount}
          isPending={isPending}
          variant="focus"
          showNovelChip={false}
        />
      </WritingStudioFocusShell>

      <WritingStudioCommandPalette
        open={commandPalette.open}
        onOpenChange={commandPalette.setOpen}
        commands={studioCommands}
      />
    </div>
  );
}
