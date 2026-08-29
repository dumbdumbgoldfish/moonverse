"use client";

import { useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewPreview } from "@/components/reviews/write/ReviewPreview";
import { cn } from "@/lib/utils";

interface WritingStudioPublishDrawerProps {
  open: boolean;
  onClose: () => void;
  canPublish: boolean;
  isPending: boolean;
  onPublish: () => void;
  publishLabel?: string;
  publishError?: string | null;
  preview: {
    novelTitle: string;
    novelAuthor: string | null;
    coverUrl: string | null;
    userName: string;
    userUsername?: string;
    userImage?: string | null;
    rating: number;
    reviewTitle: string;
    reviewBody: string;
    containsSpoilers: boolean;
    genreNames: string[];
    tagNames: string[];
    readingSources: string[];
    onEditNovel: () => void;
    onEditReview: () => void;
  };
}

export function WritingStudioPublishDrawer({
  open,
  onClose,
  canPublish,
  isPending,
  onPublish,
  publishLabel = "Publish review",
  publishError = null,
  preview,
}: WritingStudioPublishDrawerProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.documentElement.classList.add("overflow-hidden", "mv-write-publish-open");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.documentElement.classList.remove("overflow-hidden", "mv-write-publish-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-[#1a1033]/40 backdrop-blur-[2px]"
        aria-label="Close publish preview"
        onClick={onClose}
      />
      <aside
        className={cn(
          "relative flex h-full w-full max-w-xl flex-col bg-[var(--mv-paper)] shadow-2xl",
          "animate-in slide-in-from-right duration-200"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Publish review"
      >
        <header className="flex items-center justify-between gap-3 border-b border-[var(--mv-border)] bg-white px-4 py-3 sm:px-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mv-plum)]">
              Review preview
            </p>
            <h2 className="font-serif text-lg font-semibold text-[var(--mv-ink)]">
              Salon preview
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--mv-border)] bg-white text-[var(--mv-ink)] hover:text-[var(--mv-plum)]"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <ReviewPreview
            {...preview}
            actionsDisabled={isPending}
          />
        </div>

        <footer className="safe-bottom-pad border-t border-[var(--mv-border)] bg-white px-4 py-3 sm:px-5">
          {publishError ? (
            <p
              className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {publishError}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="min-h-11 rounded-xl border-[var(--mv-border)]"
            >
              Keep editing
            </Button>
            <Button
              type="button"
              onClick={onPublish}
              disabled={isPending || !canPublish}
              className="min-h-11 rounded-xl bg-[var(--mv-deep-plum)] font-semibold text-white hover:bg-[var(--mv-plum)]"
            >
              {isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
              ) : null}
              {isPending ? "Publishing…" : publishLabel}
            </Button>
          </div>
          {!canPublish ? (
            <p className="mt-2 text-center text-xs text-[var(--mv-text-muted)] sm:text-right">
              Complete your novel, rating, title, and review body to publish.
            </p>
          ) : null}
        </footer>
      </aside>
    </div>
  );
}
