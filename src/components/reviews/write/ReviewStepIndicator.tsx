"use client";

import { BookOpen, Check, Eye, PenLine } from "lucide-react";
import {
  WRITE_STEP_DESCRIPTIONS,
  WRITE_STEP_LABELS,
} from "@/components/reviews/write/writing-studio.types";
import { cn } from "@/lib/utils";

export type WriteStep = 1 | 2 | 3;

const STEPS: {
  id: WriteStep;
  title: string;
  icon: typeof BookOpen;
}[] = [
  { id: 1, title: WRITE_STEP_LABELS[1], icon: BookOpen },
  { id: 2, title: WRITE_STEP_LABELS[2], icon: PenLine },
  { id: 3, title: WRITE_STEP_LABELS[3], icon: Eye },
];

interface ReviewStepIndicatorProps {
  current: WriteStep;
  completed: WriteStep[];
  onSelect: (step: WriteStep) => void;
  canOpenPreview: boolean;
}

export function ReviewStepIndicator({
  current,
  completed,
  onSelect,
  canOpenPreview,
}: ReviewStepIndicatorProps) {
  const progress =
    completed.length === 0
      ? current === 1
        ? 12
        : current === 2
          ? 50
          : 88
      : Math.min(100, Math.round((completed.length / STEPS.length) * 100) + (current > Math.max(...completed, 0) ? 8 : 0));

  return (
    <nav
      aria-label="Review publishing steps"
      className="w-full overflow-hidden rounded-2xl border border-[var(--mv-border)] bg-white shadow-[var(--mv-card-shadow)]"
    >
      <div className="h-1 bg-[var(--mv-paper)]">
        <div
          className="mv-taste-bar h-full rounded-r-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      </div>

      <div className="px-3 py-3 sm:px-4">
        <ol className="flex items-stretch gap-1 sm:gap-2">
          {STEPS.map((step, index) => {
            const isComplete = completed.includes(step.id);
            const isCurrent = current === step.id;
            const isUpcoming = !isComplete && !isCurrent;
            const locked =
              step.id === 3 && !canOpenPreview && !isComplete && !isCurrent;
            const clickable =
              !locked && (isComplete || step.id <= current || step.id === 1);
            const Icon = step.icon;

            return (
              <li key={step.id} className="flex min-w-0 flex-1 items-center">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => onSelect(step.id)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "group flex min-w-0 flex-1 flex-col items-start gap-1 rounded-xl px-2 py-2 text-left transition sm:px-3",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]",
                    isCurrent &&
                      "bg-[var(--mv-surface-soft)] ring-1 ring-[var(--mv-plum)]/12",
                    isComplete && !isCurrent && "hover:bg-[var(--mv-paper)]/80",
                    locked && "cursor-not-allowed opacity-45"
                  )}
                >
                  <span className="flex w-full items-center gap-2">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition",
                        isCurrent
                          ? "border-[var(--mv-deep-plum)] bg-[var(--mv-deep-plum)] text-white shadow-[0_4px_12px_-4px_rgba(36,22,48,0.45)]"
                          : isComplete
                            ? "border-[var(--mv-plum)]/25 bg-white text-[var(--mv-plum)]"
                            : "border-[var(--mv-border)] bg-white text-[var(--mv-text-muted)]"
                      )}
                    >
                      {isComplete && !isCurrent ? (
                        <Check className="size-3.5" aria-hidden />
                      ) : (
                        <Icon className="size-3.5" strokeWidth={2} aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 hidden sm:block">
                      <span
                        className={cn(
                          "block truncate text-[13px] font-semibold leading-tight",
                          isCurrent
                            ? "text-[var(--mv-ink)]"
                            : isUpcoming
                              ? "text-[var(--mv-text-muted)]"
                              : "text-[var(--mv-plum)]"
                        )}
                      >
                        {step.title}
                      </span>
                      <span className="block truncate text-[11px] text-[var(--mv-text-muted)]">
                        {isCurrent
                          ? WRITE_STEP_DESCRIPTIONS[step.id]
                          : isComplete
                            ? "Complete"
                            : "Up next"}
                      </span>
                    </span>
                  </span>
                  <span className="truncate text-[11px] font-medium text-[var(--mv-text-muted)] sm:hidden">
                    {step.title}
                  </span>
                </button>
                {index < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      "mx-0.5 hidden h-px w-4 shrink-0 sm:block sm:w-6",
                      isComplete || current > step.id
                        ? "bg-[var(--mv-plum)]/35"
                        : "bg-[var(--mv-border)]"
                    )}
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
