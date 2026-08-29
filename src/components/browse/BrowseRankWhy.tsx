"use client";

import { useId, useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrowseRankExplain } from "@/types/browse";

interface BrowseRankWhyProps {
  explain: BrowseRankExplain;
  className?: string;
}

export function BrowseRankWhy({ explain, className }: BrowseRankWhyProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        onBlur={() => setOpen(false)}
        className="inline-flex size-7 items-center justify-center rounded-full text-[#1a1033]/45 hover:bg-[#f4ecf8] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Why this rank?"
      >
        <HelpCircle className="size-3.5" aria-hidden />
        <span className="sr-only">Why this rank?</span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="note"
          className="absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-xl border border-[#1a1033]/10 bg-white p-3 text-left shadow-[0_16px_36px_-20px_rgba(26,16,51,0.45)] sm:left-auto sm:right-0 sm:translate-x-0"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Why this rank?
          </p>
          <ul className="mt-2 space-y-1.5 text-xs leading-snug text-[#4c3d6e]">
            {explain.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
