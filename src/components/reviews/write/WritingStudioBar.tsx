"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { BookMarked, Eye, Loader2, PenLine } from "lucide-react";
import { FocusModeToggle } from "@/components/reviews/write/WritingStudioFocusShell";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

interface WritingStudioBarProps {
  focusMode?: boolean;
  onFocusToggle?: () => void;
  showFocusToggle?: boolean;
  subtitle?: string | null;
  saveHint?: string | null;
  progress?: number;
  onShip?: () => void;
  canShip?: boolean;
  isPending?: boolean;
  /** Hide the header My reviews link (e.g. when the draft entry panel already has one). */
  showMyReviewsLink?: boolean;
}

export function WritingStudioBar({
  focusMode = false,
  onFocusToggle,
  showFocusToggle = false,
  subtitle = null,
  saveHint = null,
  progress = 0,
  onShip,
  canShip = false,
  isPending = false,
  showMyReviewsLink = true,
}: WritingStudioBarProps) {
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncBarHeight = () => {
      document.documentElement.style.setProperty(
        "--mv-studio-bar-h",
        `${header.offsetHeight}px`
      );
    };

    syncBarHeight();
    const observer = new ResizeObserver(syncBarHeight);
    observer.observe(header);

    return () => {
      observer.disconnect();
      document.documentElement.style.setProperty("--mv-studio-bar-h", "4.25rem");
    };
  }, [saveHint, subtitle]);

  return (
    <header
      ref={headerRef}
      className="sticky top-[var(--mv-nav-offset)] z-30 border-b border-[var(--mv-plum)]/10 bg-[#fefaff]/97 backdrop-blur-md"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--mv-violet)]/22 to-transparent"
      />
      <div className={cn(SITE_SHELL_CLASS, "flex items-center gap-3 py-3")}>
        <div
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--mv-surface-soft)] ring-1 ring-[var(--mv-plum)]/12"
          aria-hidden
        >
          <svg viewBox="0 0 36 36" className="size-11 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              className="stroke-[var(--mv-plum)]/16"
              strokeWidth="2.5"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              className="stroke-[var(--mv-plum)] transition-all duration-500"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${progress} ${100 - progress}`}
              pathLength={100}
              style={{ opacity: progress > 0 ? 1 : 0 }}
            />
          </svg>
          <PenLine className="absolute size-4 text-[var(--mv-violet)]" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--mv-violet)]">
            Writing studio
          </p>
          <h1 className="truncate font-serif text-base font-semibold text-[var(--mv-ink)] sm:text-lg">
            {subtitle?.trim() || "New review"}
          </h1>
          {saveHint ? (
            <p className="truncate text-xs text-[var(--mv-text-muted)]">{saveHint}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {showFocusToggle && onFocusToggle ? (
            <FocusModeToggle active={focusMode} onToggle={onFocusToggle} />
          ) : null}
          {showMyReviewsLink ? (
            <Link
              href="/my-reviews"
              className="hidden h-9 items-center gap-1.5 rounded-full border border-[var(--mv-border)] bg-white px-3 text-[12px] font-semibold text-[var(--mv-ink)] transition hover:border-[var(--mv-plum)]/35 hover:text-[var(--mv-plum)] sm:inline-flex"
            >
              <BookMarked className="size-3.5 text-[var(--mv-plum)]" aria-hidden />
              My reviews
            </Link>
          ) : null}
          {onShip ? (
            <button
              type="button"
              onClick={onShip}
              disabled={isPending}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[12px] font-semibold transition",
                canShip
                  ? "bg-[var(--mv-deep-plum)] text-white hover:bg-[var(--mv-plum)]"
                  : "border border-[var(--mv-border)] bg-white text-[var(--mv-ink)] hover:border-[var(--mv-plum)]/35"
              )}
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Eye className="size-3.5" aria-hidden />
              )}
              Preview
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
