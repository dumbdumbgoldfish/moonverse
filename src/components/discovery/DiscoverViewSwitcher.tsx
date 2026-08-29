"use client";

import { AlignJustify, LayoutGrid, Rows3 } from "lucide-react";
import type { DiscoverLayout } from "@/lib/discover";
import { cn } from "@/lib/utils";

const OPTIONS: { value: DiscoverLayout; label: string; Icon: typeof Rows3 }[] = [
  { value: "comfortable", label: "Comfortable", Icon: Rows3 },
  { value: "compact", label: "Compact", Icon: AlignJustify },
  { value: "covers", label: "Covers", Icon: LayoutGrid },
];

interface DiscoverViewSwitcherProps {
  value: DiscoverLayout;
  onChange: (layout: DiscoverLayout) => void;
}

export function DiscoverViewSwitcher({
  value,
  onChange,
}: DiscoverViewSwitcherProps) {
  return (
    <div
      className="inline-flex items-center rounded-full bg-white p-0.5 ring-1 ring-[#1A1224]/12"
      role="group"
      aria-label="Layout"
    >
      {OPTIONS.map(({ value: option, label, Icon }) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(option)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
              active
                ? "mv-nav-signup border-0 text-white"
                : "text-[#1A1224]/55 hover:text-[#1A1224]"
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
