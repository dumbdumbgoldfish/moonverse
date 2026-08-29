"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedTagBarProps {
  tags: { name: string; slug: string }[];
  onRemove: (slug: string) => void;
  onClear?: () => void;
  className?: string;
}

export function SelectedTagBar({
  tags,
  onRemove,
  onClear,
  className,
}: SelectedTagBarProps) {
  if (tags.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className
      )}
      aria-label="Active tag filters"
    >
      {tags.map((tag) => (
        <button
          key={tag.slug}
          type="button"
          onClick={() => onRemove(tag.slug)}
          aria-label={`Remove ${tag.name} filter`}
          className={cn(
            "inline-flex h-6 items-center gap-0.5 rounded-full bg-primary/10 px-2 text-[11px] font-semibold text-primary",
            "ring-1 ring-primary/15 transition-colors hover:bg-primary/15",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          )}
        >
          {tag.name}
          <X className="size-2.5 opacity-80" aria-hidden />
        </button>
      ))}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            "inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold text-muted-foreground",
            "underline-offset-2 transition-colors hover:text-[#1a1033] hover:underline",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
