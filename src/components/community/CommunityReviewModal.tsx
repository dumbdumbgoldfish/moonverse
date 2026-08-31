"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { CommunityReviewDetail } from "@/components/community/CommunityReviewDetail";
import type { CommunityReviewModalData } from "@/lib/community-review-modal.types";

interface CommunityReviewModalProps {
  data: CommunityReviewModalData;
  focusComments?: boolean;
  onClose: () => void;
}

export function CommunityReviewModal({
  data,
  focusComments = false,
  onClose,
}: CommunityReviewModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { review } = data;

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("mv-review-modal-open");
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const nestedDialog = document.querySelector(
        "[data-slot='dialog-overlay'], [data-slot='dialog-content']"
      );
      if (nestedDialog) return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      html.classList.remove("mv-review-modal-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (!focusComments) return;
    const frame = window.requestAnimationFrame(() => {
      const composer = document.getElementById("community-review-composer");
      composer?.scrollIntoView({ block: "end", behavior: "smooth" });
      const textarea = composer?.querySelector<HTMLTextAreaElement>("textarea");
      textarea?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusComments]);

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close review"
        className="absolute inset-0 bg-[var(--mv-overlay)]"
        onClick={onClose}
      />

      <div className="pointer-events-none relative flex h-full items-stretch justify-center sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="community-review-modal-title"
          className="pointer-events-auto flex h-full w-full max-w-[780px] flex-col overflow-hidden bg-[var(--mv-bg)] shadow-[0_28px_80px_-28px_rgba(8,6,24,0.72)] sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
        >
          <header className="relative sticky top-0 z-20 flex shrink-0 items-center justify-center border-b border-[var(--mv-border)] bg-[var(--mv-bg)] px-12 py-3">
            <p
              id="community-review-modal-title"
              className="truncate text-center text-[16px] font-semibold text-[var(--mv-ink)]"
            >
              {review.reviewerName}&apos;s Review
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="absolute right-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--mv-surface-soft)] text-[var(--mv-text-muted)] transition hover:bg-[var(--mv-paper)] hover:text-[var(--mv-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-violet)]"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </header>

          <div
            ref={panelRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <CommunityReviewDetail data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
