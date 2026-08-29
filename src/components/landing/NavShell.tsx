"use client";

import type { ReactNode } from "react";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

interface NavShellProps {
  scrolled: boolean;
  bar: ReactNode;
  belowBar?: ReactNode;
  /** Kept for call-site compatibility; shell width matches the footer. */
  maxWidth?: "guest" | "app";
}

export function NavShell({ scrolled, bar, belowBar }: NavShellProps) {
  return (
    <>
      <header
        id="moonverse-nav"
        className={cn(
          "mv-nav-shell fixed inset-x-0 top-0 z-50 overflow-visible border-b backdrop-blur-xl transition-[height,box-shadow,background-color,border-color,backdrop-filter] duration-300 motion-reduce:transition-none",
          scrolled ? "mv-nav-shell--scrolled" : "mv-nav-shell--top"
        )}
      >
        <div
          className={cn(
            SITE_SHELL_CLASS,
            "flex items-center gap-3 transition-[height] duration-300 motion-reduce:transition-none sm:gap-4 lg:gap-6",
            scrolled ? "h-[var(--mv-nav-h-scrolled)]" : "h-[var(--mv-nav-h)]"
          )}
        >
          {bar}
        </div>
        {belowBar}
      </header>
      {/* Reserve full nav height so content does not jump when the bar compresses. */}
      <div className="h-[var(--mv-nav-h)]" aria-hidden />
    </>
  );
}
