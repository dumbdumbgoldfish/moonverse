"use client";

import { useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { WritingStudioBackdrop } from "@/components/reviews/write/WritingStudioChrome";
import {
  DeskOutlineButton,
} from "@/components/reviews/write/WritingDeskButtons";
import { WritingStudioNovelChip } from "@/components/reviews/write/WritingStudioNovelChip";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

export {
  DeskOutlineButton as FocusModeBackButton,
  DeskPrimaryButton as FocusModePrimaryButton,
  DeskSecondaryButton as FocusModeSecondaryButton,
} from "@/components/reviews/write/WritingDeskButtons";

interface WritingStudioFocusShellProps {
  open: boolean;
  title: string;
  subtitle?: string;
  novelAuthor?: string | null;
  coverUrl?: string | null;
  wordCount?: number;
  onClose: () => void;
  onChangeNovel?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function WritingStudioFocusShell({
  open,
  title,
  subtitle,
  novelAuthor,
  coverUrl = null,
  wordCount = 0,
  onClose,
  onChangeNovel,
  children,
  footer,
  className,
}: WritingStudioFocusShellProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.documentElement.classList.add("mv-write-focus-open");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.documentElement.classList.remove("mv-write-focus-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--mv-paper)]"
      role="dialog"
      aria-modal="true"
      aria-label="Focus writing mode"
    >
      <WritingStudioBackdrop className="opacity-50" />

      <header className="relative border-b border-[var(--mv-border)] bg-white/90 backdrop-blur-md">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--mv-gold)]/35 to-transparent"
        />
        <div className={cn(SITE_SHELL_CLASS, "flex items-center gap-3 py-3")}>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--mv-plum)]">
              Focus mode
            </p>
            <p className="truncate font-serif text-base font-semibold text-[var(--mv-ink)]">
              Writing your review
            </p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--mv-text-muted)]">
              Word count
            </p>
            <p className="font-serif text-lg font-semibold tabular-nums text-[var(--mv-ink)]">
              {wordCount}
            </p>
          </div>
        </div>
        <div className={cn(SITE_SHELL_CLASS, "border-t border-[var(--mv-border)]/70 py-2.5")}>
          <WritingStudioNovelChip
            title={title}
            author={novelAuthor ?? subtitle?.replace(/^by\s+/i, "") ?? null}
            coverUrl={coverUrl}
            onChange={onChangeNovel}
            className="w-full border-[var(--mv-plum)]/10 bg-white/80"
          />
        </div>
      </header>

      <div className={cn(SITE_SHELL_CLASS, "relative flex-1 overflow-y-auto py-5 lg:py-6")}>
        <div className={cn("space-y-6", className)}>
          {children}
        </div>
      </div>

      {footer ? (
        <footer className="safe-bottom-pad relative border-t border-[var(--mv-border)] bg-white/95 backdrop-blur-md">
          <div className={cn(SITE_SHELL_CLASS, "flex flex-col gap-3 py-3")}>
            <div className="flex items-center justify-between gap-3 sm:hidden">
              <p className="text-xs text-[var(--mv-text-muted)]">
                {wordCount} words
              </p>
              <FocusModeHint />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <DeskOutlineButton
                type="button"
                deskSize="sm"
                onClick={onClose}
              >
                Back
              </DeskOutlineButton>
              {footer}
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

interface FocusModeToggleProps {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function FocusModeToggle({
  active,
  onToggle,
  disabled = false,
}: FocusModeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition",
        active
          ? "border-[var(--mv-plum)]/35 bg-[var(--mv-plum)]/10 text-[var(--mv-plum)]"
          : "border-[var(--mv-border)] bg-white text-[var(--mv-ink)] hover:border-[var(--mv-plum)]/35 hover:text-[var(--mv-plum)]",
        disabled && "cursor-not-allowed opacity-50"
      )}
      aria-pressed={active}
    >
      {active ? (
        <Minimize2 className="size-3.5" aria-hidden />
      ) : (
        <Maximize2 className="size-3.5" aria-hidden />
      )}
      <span className="hidden sm:inline">
        {active ? "Exit focus" : "Focus"}
      </span>
    </button>
  );
}

export function FocusModeHint() {
  return (
    <p className="text-[11px] text-[var(--mv-text-muted)]">
      <kbd className="rounded border border-[var(--mv-border)] bg-[var(--mv-paper)] px-1.5 py-0.5 font-mono text-[10px]">
        Esc
      </kbd>{" "}
      to exit
    </p>
  );
}
