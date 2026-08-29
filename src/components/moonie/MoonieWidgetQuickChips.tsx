"use client";

import Link from "next/link";
import { MOONIE_WIDGET_CHIPS } from "@/lib/moonie/desk";
import { cn } from "@/lib/utils";

const chipClass =
  "flex h-8 min-w-0 flex-1 items-center justify-center rounded-full border border-violet-100 bg-white px-2 text-[11px] font-semibold text-[#4C2A67] shadow-sm transition hover:border-violet-200 hover:bg-[#F4ECF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/25 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50";

export function MoonieWidgetQuickChips({
  disabled,
  onSelect,
  hrefForPrompt,
  className,
}: {
  disabled?: boolean;
  onSelect?: (prompt: string) => void;
  hrefForPrompt?: (prompt: string) => string;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full gap-1.5", className)}>
      {MOONIE_WIDGET_CHIPS.map((chip) => {
        if (hrefForPrompt) {
          return (
            <Link
              key={chip.label}
              href={hrefForPrompt(chip.prompt)}
              className={chipClass}
            >
              {chip.label}
            </Link>
          );
        }

        return (
          <button
            key={chip.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.(chip.prompt)}
            className={chipClass}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
