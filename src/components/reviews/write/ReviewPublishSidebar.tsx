"use client";

import {
  Check,
  Circle,
  Eye,
  FilePlus2,
  Loader2,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DraftStatus } from "@/components/reviews/write/DraftStatus";
import { CoverImage } from "@/components/ui/CoverImage";
import { cn } from "@/lib/utils";
import type { WriteStep } from "@/components/reviews/write/ReviewStepIndicator";

export type { ChecklistItem } from "@/components/reviews/write/writing-studio.types";
import type { ChecklistItem } from "@/components/reviews/write/writing-studio.types";

interface ReviewPublishSidebarProps {
  step: WriteStep;
  checklist: ChecklistItem[];
  missingLabels: string[];
  canPublish: boolean;
  canPreview: boolean;
  isPending: boolean;
  draftSavedAt: string | null;
  draftRestored: boolean;
  draftJustSaved: boolean;
  confirmDiscard: boolean;
  hasDiscardableContent: boolean;
  selectedSummary?: {
    title: string;
    author: string | null;
    coverUrl: string | null;
  } | null;
  onSaveDraft: () => void;
  onDiscardDraft: () => void;
  onCancelDiscard: () => void;
  onStartNewReview: () => void;
  onPreview: () => void;
  onPublish: () => void;
  variant?: "sidebar" | "inline";
}

const STEP_LABELS: Record<WriteStep, string> = {
  1: "Novel",
  2: "Review",
  3: "Preview",
};

export function ReviewPublishSidebar({
  step,
  checklist,
  missingLabels,
  canPublish,
  canPreview,
  isPending,
  draftSavedAt,
  draftRestored,
  draftJustSaved,
  confirmDiscard,
  hasDiscardableContent,
  selectedSummary,
  onSaveDraft,
  onDiscardDraft,
  onCancelDiscard,
  onStartNewReview,
  onPreview,
  onPublish,
  variant = "sidebar",
}: ReviewPublishSidebarProps) {
  const doneCount = checklist.filter((item) => item.complete).length;
  const totalCount = checklist.length;
  const progress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  return (
    <aside
      className={cn(
        "overflow-hidden rounded-[24px] border border-violet-100/90 bg-white shadow-[0_18px_44px_-34px_rgba(76,29,149,0.5)]",
        variant === "sidebar" &&
          "lg:sticky lg:top-[calc(var(--mv-nav-h)+1.5rem)] lg:self-start"
      )}
    >
      {/* Progress header */}
      <div className="border-b border-violet-100 bg-[linear-gradient(145deg,#f7f3ff_0%,#fffdf9_100%)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="relative flex size-14 shrink-0 items-center justify-center"
            aria-hidden
          >
            <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                className="stroke-violet-100"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                className="stroke-primary transition-[stroke-dashoffset] duration-500"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progress} ${100 - progress}`}
                pathLength={100}
                style={{ opacity: progress > 0 ? 1 : 0 }}
              />
            </svg>
            <span className="absolute font-serif text-sm font-bold text-night-blue">
              {doneCount}/{totalCount}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              Publish status
            </p>
            <h2 className="font-serif text-lg font-bold leading-tight text-night-blue">
              {canPublish
                ? "Ready to publish"
                : step === 3
                  ? "Almost there"
                  : `Step ${step} · ${STEP_LABELS[step]}`}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {canPublish
                ? "All required fields are complete"
                : `${missingLabels.length} item${missingLabels.length === 1 ? "" : "s"} left`}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Novel / empty state */}
        {selectedSummary ? (
          <div className="flex gap-3 rounded-2xl bg-[#faf8ff] p-2.5 ring-1 ring-violet-100">
            <div className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-lg bg-violet-100">
              <CoverImage
                src={selectedSummary.coverUrl ?? ""}
                alt=""
                title={selectedSummary.title}
                themeSeed={selectedSummary.title}
                sizes="44px"
              />
            </div>
            <div className="min-w-0 self-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                Reviewing
              </p>
              <p className="truncate text-sm font-bold text-night-blue">
                {selectedSummary.title}
              </p>
              <p className="truncate text-xs text-slate-500">
                {selectedSummary.author
                  ? `by ${selectedSummary.author}`
                  : "Author not listed"}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-[#fffdf9] px-3 py-3 text-center">
            <p className="text-sm font-semibold text-slate-600">
              No novel selected yet
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Finish step 1 on the left first
            </p>
          </div>
        )}

        {/* Compact checklist: single source of truth, no duplicate yellow list */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Checklist
          </p>
          <ul className="space-y-1.5">
            {checklist.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm",
                  item.complete
                    ? "bg-emerald-50/80 text-emerald-900"
                    : "bg-slate-50 text-slate-500"
                )}
              >
                {item.complete ? (
                  <Check
                    className="size-4 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                ) : (
                  <Circle
                    className="size-4 shrink-0 text-slate-300"
                    aria-hidden
                  />
                )}
                <span className={cn(item.complete && "font-medium")}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <DraftStatus
          savedAt={draftSavedAt}
          restored={draftRestored}
          justSaved={draftJustSaved}
          compact
        />

        {confirmDiscard ? (
          <div
            className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3"
            role="alertdialog"
            aria-labelledby="discard-draft-title"
          >
            <div>
              <p
                id="discard-draft-title"
                className="text-sm font-bold text-amber-950"
              >
                Clear browser draft?
              </p>
              <p className="mt-1 text-xs text-amber-900/90">
                Resets the form. Published reviews stay safe.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancelDiscard}
                disabled={isPending}
                className="min-h-11 rounded-xl"
              >
                Keep editing
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={onDiscardDraft}
                disabled={isPending}
                className="min-h-11 gap-1.5 rounded-xl"
              >
                <Trash2 className="size-4" aria-hidden />
                Clear
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Primary actions: clear hierarchy */}
            <div className="space-y-2">
              <Button
                type="button"
                onClick={onPublish}
                disabled={isPending || !canPublish}
                className="h-12 w-full justify-center gap-2 rounded-2xl text-sm font-bold shadow-[0_12px_28px_-14px_rgba(98,70,234,0.75)]"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
                {isPending ? "Publishing…" : "Publish review"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onPreview}
                disabled={isPending || !canPreview}
                className="h-11 w-full justify-center gap-2 rounded-2xl"
                title={
                  canPreview
                    ? "See how this will look publicly"
                    : "Complete the checklist to unlock preview"
                }
              >
                <Eye className="size-4" aria-hidden />
                {step === 3 ? "View preview" : "Preview first"}
              </Button>

              {!canPublish ? (
                <p className="px-1 text-center text-[11px] leading-relaxed text-slate-500">
                  Complete the checklist above to unlock preview and publish.
                </p>
              ) : (
                <p className="px-1 text-center text-[11px] leading-relaxed text-slate-500">
                  Preview is optional: publish when you are happy with it.
                </p>
              )}
            </div>

            {/* Secondary draft tools: compact icon row, not a button wall */}
            <div className="rounded-2xl bg-[#faf8ff] p-2 ring-1 ring-violet-100">
              <p className="px-1.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Draft tools
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={onSaveDraft}
                  disabled={isPending}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-white text-[11px] font-bold text-night-blue ring-1 ring-violet-100 transition",
                    "hover:bg-violet-50 hover:text-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    "disabled:opacity-50"
                  )}
                >
                  <Save className="size-4 text-primary" aria-hidden />
                  Save
                </button>
                <button
                  type="button"
                  onClick={onDiscardDraft}
                  disabled={isPending || !hasDiscardableContent}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-white text-[11px] font-bold text-night-blue ring-1 ring-violet-100 transition",
                    "hover:bg-rose-50 hover:text-rose-700",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    "disabled:opacity-50"
                  )}
                  title={
                    hasDiscardableContent
                      ? "Clear the browser draft"
                      : "Nothing to discard yet"
                  }
                >
                  <Trash2 className="size-4 text-rose-500" aria-hidden />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={onStartNewReview}
                  disabled={isPending}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-white text-[11px] font-bold text-night-blue ring-1 ring-violet-100 transition",
                    "hover:bg-violet-50 hover:text-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    "disabled:opacity-50"
                  )}
                  title="Clear draft and start a blank review"
                >
                  <FilePlus2 className="size-4 text-primary" aria-hidden />
                  New
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
