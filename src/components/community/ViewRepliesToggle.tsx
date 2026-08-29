"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewRepliesToggleProps {
  count: number;
  expanded?: boolean;
  onClick: () => void;
  className?: string;
  label?: "reply" | "comment";
}

export function ViewRepliesToggle({
  count,
  expanded = false,
  onClick,
  className,
  label = "reply",
}: ViewRepliesToggleProps) {
  if (count <= 0) return null;

  const noun = label === "comment" ? "comment" : "reply";
  const plural = label === "comment" ? "comments" : "replies";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={cn(
        "inline-flex items-center gap-1 py-0.5 text-[13px] font-semibold text-[var(--mv-text-muted)] hover:text-[var(--mv-plum)] hover:underline",
        className
      )}
    >
      <ChevronDown
        className={cn(
          "size-4 shrink-0 transition-transform duration-200",
          expanded && "rotate-180"
        )}
        aria-hidden
      />
      {expanded
        ? `Hide ${count === 1 ? noun : plural}`
        : `View ${count} ${count === 1 ? noun : plural}`}
    </button>
  );
}
