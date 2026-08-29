"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { NotebookPen, PenLine } from "lucide-react";
import {
  isMeaningfulReviewDraft,
  loadReviewDrafts,
} from "@/lib/review-draft";

interface CommunityDeskCtaProps {
  userId: string;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("focus", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("focus", onStoreChange);
  };
}

export function CommunityDeskCta({ userId }: CommunityDeskCtaProps) {
  const draftTitle = useSyncExternalStore(
    subscribe,
    () => {
      const draft = loadReviewDrafts(userId)[0];
      if (!draft || !isMeaningfulReviewDraft(draft)) return null;
      return draft.novelTitle.trim() || draft.reviewTitle.trim() || "Untitled draft";
    },
    () => null
  );

  const latestDraftId = useSyncExternalStore(
    subscribe,
    () => loadReviewDrafts(userId)[0]?.id ?? null,
    () => null
  );

  if (draftTitle) {
    return (
      <div className="space-y-3">
        <Link
          href={
            latestDraftId
              ? `/reviews/new?resume=1&draft=${encodeURIComponent(latestDraftId)}`
              : "/reviews/new?resume=1"
          }
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--mv-deep-plum)] text-sm font-semibold text-white shadow-[0_12px_28px_-16px_rgba(36,22,48,0.65)] transition hover:bg-[var(--mv-plum)]"
        >
          <NotebookPen className="size-4" aria-hidden />
          Resume draft
        </Link>
        <p className="truncate px-1 text-center text-[12px] text-[var(--mv-text-muted)]">
          {draftTitle}
        </p>
        <Link
          href="/reviews/new"
          className="block text-center text-[12px] font-semibold text-[var(--mv-plum)] hover:underline"
        >
          Start a new review
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/reviews/new"
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--mv-deep-plum)] text-sm font-semibold text-white shadow-[0_12px_28px_-16px_rgba(36,22,48,0.65)] transition hover:bg-[var(--mv-plum)]"
    >
      <PenLine className="size-4" aria-hidden />
      Write a review
    </Link>
  );
}
