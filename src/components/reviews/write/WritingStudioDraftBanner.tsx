"use client";

import Link from "next/link";
import { BookMarked, FilePlus, HardDrive, PenLine } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import {
  DeskOutlineButton,
  DeskPrimaryButton,
  DeskSecondaryButton,
} from "@/components/reviews/write/WritingDeskButtons";
import type { ReviewDraftV1 } from "@/lib/review-draft";
import { cn } from "@/lib/utils";

interface WritingStudioDraftBannerProps {
  draft: ReviewDraftV1;
  draftCount?: number;
  savedAt?: string | null;
  onResume: () => void;
  onStartNew: () => void;
  onDismiss?: () => void;
}

function formatSavedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function WritingStudioDraftBanner({
  draft,
  draftCount = 1,
  savedAt,
  onResume,
  onStartNew,
  onDismiss,
}: WritingStudioDraftBannerProps) {
  const title = draft.reviewTitle.trim() || "Untitled draft";
  const novelLabel =
    draft.novelTitle.trim() ||
    (draft.novelMode === "existing" && draft.selectedNovelId
      ? "Novel attached"
      : "No novel attached yet");
  const resolvedSavedAt = savedAt ?? draft.savedAt;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-[var(--mv-plum)]/18 bg-[linear-gradient(145deg,#fffdf8_0%,#ffffff_42%,#f8f4ff_100%)] shadow-[0_24px_64px_-36px_rgba(76,29,149,0.5)]"
      role="status"
      aria-label="Saved draft entry"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-[var(--mv-gold)]/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 left-1/4 size-44 rounded-full bg-[var(--mv-plum)]/10 blur-3xl"
      />

      <div className="relative px-6 py-6 sm:px-8 sm:py-7 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex min-w-0 flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="relative shrink-0">
              <MoonieMascot
                variant="waving"
                size={96}
                display="clean"
                lightweight
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-[var(--mv-plum)]/[0.08] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--mv-plum)]">
                <HardDrive className="size-3.5" aria-hidden />
                Your writing desk
              </p>

              <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight text-[var(--mv-ink)] sm:text-3xl lg:text-[2rem]">
                {draftCount > 1
                  ? `${draftCount} saved drafts waiting`
                  : "A saved draft is ready"}
              </h2>

              <p className="mt-2 text-base text-[var(--mv-text-muted)]">
                Latest:{" "}
                <span className="font-semibold text-[var(--mv-ink)]">
                  {title}
                </span>
                <span className="mx-2 text-[var(--mv-border)]" aria-hidden>
                  ·
                </span>
                <span>{novelLabel}</span>
              </p>

              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--mv-text-muted)] sm:mx-0 sm:text-base">
                Resume to pick up exactly where you left off, or start a fresh
                review without losing your other drafts.
              </p>

              {resolvedSavedAt ? (
                <p className="mt-4 text-sm font-medium text-[var(--mv-plum)]/80">
                  Last saved {formatSavedAt(resolvedSavedAt)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2.5 sm:mx-auto sm:max-w-sm lg:mx-0 lg:w-[17.5rem] lg:shrink-0">
            <DeskPrimaryButton
              type="button"
              className="w-full justify-center"
              onClick={onResume}
            >
              <PenLine className="size-4" aria-hidden />
              Resume draft
            </DeskPrimaryButton>
            <DeskSecondaryButton
              type="button"
              className="w-full justify-center"
              onClick={onStartNew}
            >
              <FilePlus className="size-4" aria-hidden />
              Start new
            </DeskSecondaryButton>
            <DeskOutlineButton
              className="w-full justify-center"
              render={<Link href="/my-reviews" />}
            >
              <BookMarked className="size-4" aria-hidden />
              My reviews
            </DeskOutlineButton>
            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className={cn(
                  "inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold",
                  "text-[var(--mv-text-muted)] transition hover:bg-[var(--mv-paper)] hover:text-[var(--mv-ink)]"
                )}
              >
                Dismiss
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
