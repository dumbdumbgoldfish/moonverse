"use client";

import { useState } from "react";
import { Info } from "lucide-react";

interface TasteExplainToggleProps {
  explainText: string;
}

export function TasteExplainToggle({ explainText }: TasteExplainToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--mv-border)] bg-[var(--mv-surface-soft)] text-[var(--mv-ink)] transition hover:border-[var(--mv-plum)]/30 hover:bg-[var(--mv-paper)] hover:text-[var(--mv-plum)]"
        aria-expanded={open}
        aria-label="How taste profile is calculated"
        title="How this is calculated"
      >
        <Info className="size-3.5" aria-hidden />
      </button>
      {open ? (
        <p
          role="tooltip"
          className="absolute right-0 top-7 z-20 w-52 rounded-xl border border-[var(--mv-border)] bg-white p-2.5 text-[11px] leading-relaxed text-[var(--mv-text-muted)] shadow-lg"
        >
          {explainText}
        </p>
      ) : null}
    </div>
  );
}
