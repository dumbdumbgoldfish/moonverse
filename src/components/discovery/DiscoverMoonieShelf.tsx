"use client";

import Link from "next/link";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";

const GUEST_PROMPTS = [
  {
    label: "Like Solo Leveling",
  },
  {
    label: "Spoiler-free romance",
  },
  {
    label: "Completed binge reads",
  },
] as const;

interface DiscoverMoonieShelfProps {
  className?: string;
  showGuestPrompts?: boolean;
}

export function DiscoverMoonieShelf({
  className,
  showGuestPrompts = false,
}: DiscoverMoonieShelfProps) {
  return (
    <aside
      className={cn(
        "rounded-2xl bg-gradient-to-r from-[#6E46C7]/8 via-white/70 to-[#C89B4A]/10 px-4 py-4 ring-1 ring-[#1A1224]/8",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6E46C7]">
            Moonie concierge
          </p>
          <p className="mt-1 text-[13px] leading-snug text-[#1A1224]/75">
            {showGuestPrompts
              ? "Not sure where to start? Try a prompt or ask from this shelf."
              : "Want a next read from this shelf?"}
          </p>
        </div>
        <AskMoonieLink
          size="sm"
          className="shrink-0 text-[13px] font-semibold"
        />
      </div>

      {showGuestPrompts ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {GUEST_PROMPTS.map((item) => (
            <Link
              key={item.label}
              href={moonieEntryHref()}
              className="inline-flex min-h-8 items-center rounded-full border border-[#6E46C7]/15 bg-white px-3 text-[12px] font-semibold text-[#1A1224] transition-colors hover:border-[#6E46C7]/35"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
