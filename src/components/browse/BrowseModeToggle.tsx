"use client";

import { BookOpen, MessageSquareText } from "lucide-react";
import type { BrowseMode } from "@/types/browse";
import { cn } from "@/lib/utils";

interface BrowseModeToggleProps {
  mode: BrowseMode;
  onModeChange: (mode: BrowseMode) => void;
  loading?: boolean;
  className?: string;
}

const OPTIONS: {
  value: BrowseMode;
  label: string;
  icon: typeof BookOpen;
}[] = [
  { value: "works", label: "Works", icon: BookOpen },
  { value: "reviews", label: "Reviews", icon: MessageSquareText },
];

export function BrowseModeToggle({
  mode,
  onModeChange,
  loading,
  className,
}: BrowseModeToggleProps) {
  const activeIndex = mode === "reviews" ? 1 : 0;

  return (
    <div
      className={cn(
        "relative inline-grid grid-cols-2 rounded-full border border-[#1a1033]/10 bg-white p-0.5",
        className
      )}
      role="group"
      aria-label="Browse results mode"
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-[#1a1033]",
          "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "motion-reduce:transition-none",
          activeIndex === 1 && "translate-x-full"
        )}
      />
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            disabled={loading}
            aria-pressed={active}
            onClick={() => onModeChange(value)}
            className={cn(
              "relative z-10 inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold",
              "transition-colors duration-300 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "motion-reduce:transition-none",
              active
                ? "text-white"
                : "text-[#1a1033]/65 hover:text-[#1a1033]",
              loading && "opacity-60"
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
