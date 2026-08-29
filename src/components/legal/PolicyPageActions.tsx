"use client";

import { Printer } from "lucide-react";
import { BackToTopButton } from "@/components/layout/BackToTopButton";
import { cn } from "@/lib/utils";

interface PolicyPageActionsProps {
  showPrint?: boolean;
  /** When true, renders a page-local back-to-top control (site footer already has one by default). */
  showBackToTop?: boolean;
}

export function PolicyPrintButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(
        "inline-flex h-11 min-h-[44px] items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-700",
        "transition-colors hover:border-violet-300 hover:bg-violet-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "print:hidden",
        className
      )}
    >
      <Printer className="size-4" aria-hidden />
      Print
    </button>
  );
}

export function PolicyPageActions({
  showPrint = false,
  showBackToTop = false,
}: PolicyPageActionsProps) {
  return (
    <>
      {showPrint ? (
        <div className="mb-4 flex justify-end print:hidden">
          <PolicyPrintButton />
        </div>
      ) : null}
      {showBackToTop ? <BackToTopButton /> : null}
    </>
  );
}

// Kept for any legacy imports — prefer BackToTopButton from @/components/layout/BackToTopButton
export { BackToTopButton } from "@/components/layout/BackToTopButton";
