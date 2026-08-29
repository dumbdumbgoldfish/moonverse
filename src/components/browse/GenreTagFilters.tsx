"use client";

import { Tags } from "lucide-react";
import { GenreTagGroups } from "@/components/browse/GenreTagGroups";
import { cn } from "@/lib/utils";

interface BrowseTag {
  name: string;
  slug: string;
}

interface GenreTagFiltersProps {
  genreSlug: string;
  tags: BrowseTag[];
  selectedTags: string[];
  maxTags: number;
  onToggle: (slug: string) => void;
  className?: string;
  softBackgroundClass?: string;
}

export function GenreTagFilters({
  genreSlug,
  tags,
  selectedTags,
  maxTags,
  onToggle,
  className,
  softBackgroundClass,
}: GenreTagFiltersProps) {
  if (tags.length === 0) return null;

  const selectedCount = selectedTags.length;

  return (
    <section
      id="browse-tag-filters"
      aria-labelledby="genre-tag-filters-heading"
      className={cn(
        "rounded-2xl border border-[#1a1033]/10 px-3.5 py-3 shadow-[0_10px_28px_-22px_rgba(26,16,51,0.35)]",
        softBackgroundClass ?? "bg-gradient-to-br from-white to-[#f4ecf8]/80",
        className
      )}
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="genre-tag-filters-heading"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#6b4bb5]"
        >
          <Tags className="size-3.5" aria-hidden />
          Refine by tag
        </h2>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            selectedCount > 0
              ? "bg-primary/10 text-primary"
              : "bg-white/70 text-muted-foreground"
          )}
        >
          {selectedCount}/{maxTags} selected
        </span>
      </div>

      <GenreTagGroups
        genreSlug={genreSlug}
        tags={tags}
        selectedTags={selectedTags}
        maxTags={maxTags}
        onToggle={onToggle}
        flat
      />
    </section>
  );
}
