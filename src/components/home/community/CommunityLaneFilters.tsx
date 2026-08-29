"use client";

import { cn } from "@/lib/utils";
import type { CommunityLane } from "@/lib/community-lanes";

interface CommunityLaneFiltersProps {
  lanes: CommunityLane[];
  value: string | null;
  onChange: (laneId: string | null) => void;
}

export function CommunityLaneFilters({
  lanes,
  value,
  onChange,
}: CommunityLaneFiltersProps) {
  if (lanes.length === 0) return null;

  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Filter the feed by genre or mood"
    >
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[12px] font-semibold transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]",
          value == null
            ? "bg-[var(--mv-deep-plum)] text-white"
            : "border border-[var(--mv-border)] bg-white text-[var(--mv-text-muted)] hover:text-[var(--mv-ink)]"
        )}
      >
        All
      </button>
      {lanes.map((lane) => {
        const active = value === lane.id;
        return (
          <button
            key={lane.id}
            type="button"
            onClick={() => onChange(active ? null : lane.id)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[12px] font-semibold transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]",
              active
                ? "bg-[var(--mv-plum)]/12 text-[var(--mv-deep-plum)]"
                : "border border-[var(--mv-border)] bg-white text-[var(--mv-text-muted)] hover:text-[var(--mv-ink)]"
            )}
          >
            {lane.label}
          </button>
        );
      })}
    </div>
  );
}
