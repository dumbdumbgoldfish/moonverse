"use client";

import {
  FilePlus2,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverImage } from "@/components/ui/CoverImage";
import { WritingStudioChecklistCompact } from "@/components/reviews/write/WritingStudioChecklistCompact";
import type { ChecklistItem } from "@/components/reviews/write/writing-studio.types";

interface WritingStudioContextRailProps {
  checklist: ChecklistItem[];
  missingLabels: string[];
  canPublish: boolean;
  isPending: boolean;
  isSavingDraft?: boolean;
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
  showDraftTools?: boolean;
}

export function WritingStudioContextRail({
  checklist,
  missingLabels,
  canPublish,
  isPending,
  isSavingDraft = false,
  confirmDiscard,
  hasDiscardableContent,
  selectedSummary,
  onSaveDraft,
  onDiscardDraft,
  onCancelDiscard,
  onStartNewReview,
  showDraftTools = true,
}: WritingStudioContextRailProps) {
  const doneCount = checklist.filter((item) => item.complete).length;
  const progress =
    checklist.length === 0
      ? 0
      : Math.round((doneCount / checklist.length) * 100);

  return (
    <aside className="lg:sticky lg:top-[calc(var(--mv-nav-offset)+var(--mv-studio-bar-h))] lg:max-h-[calc(100dvh-var(--mv-nav-offset)-var(--mv-studio-bar-h)-1rem)] lg:self-start lg:overflow-y-auto">
      <div className="space-y-3 rounded-2xl border border-[var(--mv-border)] bg-white p-4 shadow-[var(--mv-card-shadow)]">
        {selectedSummary ? (
          <div className="flex gap-3">
            <div className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-[var(--mv-border)]">
              <CoverImage
                src={selectedSummary.coverUrl ?? ""}
                alt=""
                title={selectedSummary.title}
                themeSeed={selectedSummary.title}
                sizes="44px"
                compactFallback
              />
            </div>
            <div className="min-w-0 self-center">
              <p className="truncate text-sm font-semibold text-[var(--mv-ink)]">
                {selectedSummary.title}
              </p>
              <p className="truncate text-xs text-[var(--mv-text-muted)]">
                {selectedSummary.author
                  ? `by ${selectedSummary.author}`
                  : "Author not listed"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--mv-text-muted)]">
            Attach a novel to unlock the editor.
          </p>
        )}

        <WritingStudioChecklistCompact
          checklist={checklist}
          missingLabels={missingLabels}
          canPublish={canPublish}
          progress={progress}
        />

        {showDraftTools ? (
          confirmDiscard ? (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-950">Clear draft?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onCancelDiscard}>
                  Keep
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={onDiscardDraft}>
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 border-t border-[var(--mv-border)] pt-3">
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={isPending || isSavingDraft}
                className="flex min-h-10 flex-col items-center justify-center gap-1 rounded-xl border border-[var(--mv-border)] text-[11px] font-semibold text-[var(--mv-ink)]"
              >
                {isSavingDraft ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Save className="size-3.5" aria-hidden />
                )}
                {isSavingDraft ? "Saving…" : "Save draft"}
              </button>
              <button
                type="button"
                onClick={onDiscardDraft}
                disabled={isPending || !hasDiscardableContent}
                className="flex min-h-10 flex-col items-center justify-center gap-1 rounded-xl border border-[var(--mv-border)] text-[11px] font-semibold text-[var(--mv-ink)]"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Clear
              </button>
              <button
                type="button"
                onClick={onStartNewReview}
                disabled={isPending}
                className="flex min-h-10 flex-col items-center justify-center gap-1 rounded-xl border border-[var(--mv-border)] text-[11px] font-semibold text-[var(--mv-ink)]"
              >
                <FilePlus2 className="size-3.5" aria-hidden />
                New
              </button>
            </div>
          )
        ) : null}
      </div>
    </aside>
  );
}
