"use client";

import { BookOpen, FilePlus2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NovelModeSelectorProps {
  value: "existing" | "new";
  onChange: (mode: "existing" | "new") => void;
  disableExisting?: boolean;
  disabled?: boolean;
}

export function NovelModeSelector({
  value,
  onChange,
  disableExisting = false,
  disabled = false,
}: NovelModeSelectorProps) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2"
      role="radiogroup"
      aria-label="Novel selection mode"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "existing"}
        onClick={() => onChange("existing")}
        disabled={disabled || disableExisting}
        className={cn(
          "flex min-h-[4.5rem] flex-col items-start gap-1 rounded-2xl border px-4 py-3.5 text-left transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)] disabled:opacity-50",
          value === "existing"
            ? "border-[var(--mv-plum)]/25 bg-[var(--mv-surface-soft)] shadow-[0_10px_28px_-22px_rgba(36,22,48,0.35)] ring-1 ring-[var(--mv-plum)]/10"
            : "border-[var(--mv-border)] bg-white hover:border-[var(--mv-plum)]/20"
        )}
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--mv-ink)]">
          <BookOpen className="size-4 text-[var(--mv-plum)]" aria-hidden />
          Existing novel
        </span>
        <span className="text-xs leading-relaxed text-[var(--mv-text-muted)]">
          Search the catalogue. Genres and tags stay canonical.
        </span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "new"}
        onClick={() => onChange("new")}
        disabled={disabled}
        className={cn(
          "flex min-h-[4.5rem] flex-col items-start gap-1 rounded-2xl border px-4 py-3.5 text-left transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]",
          value === "new"
            ? "border-[var(--mv-plum)]/25 bg-[var(--mv-surface-soft)] shadow-[0_10px_28px_-22px_rgba(36,22,48,0.35)] ring-1 ring-[var(--mv-plum)]/10"
            : "border-[var(--mv-border)] bg-white hover:border-[var(--mv-plum)]/20"
        )}
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--mv-ink)]">
          <FilePlus2 className="size-4 text-[var(--mv-plum)]" aria-hidden />
          New novel
        </span>
        <span className="text-xs leading-relaxed text-[var(--mv-text-muted)]">
          Add a title with genres, tags, and reading sources.
        </span>
      </button>
    </div>
  );
}
