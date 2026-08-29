"use client";

import { Check } from "lucide-react";
import type { ChecklistItem } from "@/components/reviews/write/writing-studio.types";
import { cn } from "@/lib/utils";

interface WritingStudioChecklistCompactProps {
  checklist: ChecklistItem[];
  missingLabels: string[];
  canPublish: boolean;
  progress: number;
  showProgressBar?: boolean;
  className?: string;
}

export function WritingStudioChecklistCompact({
  checklist,
  missingLabels,
  canPublish,
  progress,
  showProgressBar = true,
  className,
}: WritingStudioChecklistCompactProps) {
  const doneCount = checklist.filter((item) => item.complete).length;
  const incomplete = checklist.filter((item) => !item.complete);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[var(--mv-ink)]">
          {canPublish ? "Ready to publish" : "Still needed"}
        </p>
        <span className="text-xs font-semibold tabular-nums text-[var(--mv-plum)]">
          {doneCount}/{checklist.length}
        </span>
      </div>

      {showProgressBar ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--mv-paper)]">
          <div
            className="mv-taste-bar h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {canPublish ? (
        <p className="flex items-center gap-1.5 text-xs text-emerald-700">
          <Check className="size-3.5 shrink-0" aria-hidden />
          Checklist complete. Open Preview when you are happy.
        </p>
      ) : incomplete.length > 0 ? (
        <ul className="space-y-1">
          {incomplete.slice(0, 4).map((item) => (
            <li
              key={item.id}
              className="rounded-lg px-2 py-1.5 text-sm text-[var(--mv-text-muted)]"
            >
              {item.label}
            </li>
          ))}
          {incomplete.length > 4 ? (
            <li className="px-2 text-xs text-[var(--mv-text-muted)]">
              +{incomplete.length - 4} more
            </li>
          ) : null}
        </ul>
      ) : null}

      {!canPublish && missingLabels[0] ? (
        <p className="text-xs text-[var(--mv-text-muted)]">Next: {missingLabels[0]}</p>
      ) : null}
    </div>
  );
}
