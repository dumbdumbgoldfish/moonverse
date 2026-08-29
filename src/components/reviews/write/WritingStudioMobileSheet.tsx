"use client";

import { useState } from "react";
import { ChevronDown, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WritingStudioChecklistCompact } from "@/components/reviews/write/WritingStudioChecklistCompact";
import type { ChecklistItem } from "@/components/reviews/write/writing-studio.types";
import { cn } from "@/lib/utils";

interface WritingStudioMobileSheetProps {
  checklist: ChecklistItem[];
  missingLabels: string[];
  canPublish: boolean;
  progress: number;
  isSavingDraft?: boolean;
  onSaveDraft: () => void;
  onDiscardDraft: () => void;
  confirmDiscard: boolean;
  onCancelDiscard: () => void;
  hasDiscardableContent: boolean;
  onStartNewReview: () => void;
  showDraftTools?: boolean;
}

export function WritingStudioMobileSheet({
  checklist,
  missingLabels,
  canPublish,
  progress,
  isSavingDraft = false,
  onSaveDraft,
  onDiscardDraft,
  confirmDiscard,
  onCancelDiscard,
  hasDiscardableContent,
  onStartNewReview,
  showDraftTools = true,
}: WritingStudioMobileSheetProps) {
  const [open, setOpen] = useState(false);
  const doneCount = checklist.filter((item) => item.complete).length;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--mv-border)] bg-white px-4 py-3 text-left shadow-[var(--mv-card-shadow)]"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--mv-surface-soft)] text-[var(--mv-plum)]">
            <ListChecks className="size-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--mv-text-muted)]">
              Writing coach
            </span>
            <span className="block truncate text-sm font-semibold text-[var(--mv-ink)]">
              {progress}% ready · {doneCount}/{checklist.length} done
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[var(--mv-text-muted)] transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="mt-3 space-y-3 rounded-2xl border border-[var(--mv-border)] bg-white p-4 shadow-[var(--mv-card-shadow)]">
          <WritingStudioChecklistCompact
            checklist={checklist}
            missingLabels={missingLabels}
            canPublish={canPublish}
            progress={progress}
            showProgressBar={false}
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
              <div className="flex flex-wrap gap-2 border-t border-[var(--mv-border)] pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onSaveDraft}
                  disabled={isSavingDraft}
                  className="h-9 rounded-lg border-[var(--mv-border)]"
                >
                  {isSavingDraft ? "Saving…" : "Save draft"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDiscardDraft}
                  disabled={!hasDiscardableContent}
                  className="h-9 rounded-lg text-[var(--mv-text-muted)]"
                >
                  Clear draft
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onStartNewReview}
                  className="h-9 rounded-lg text-[var(--mv-text-muted)]"
                >
                  Start new
                </Button>
              </div>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
