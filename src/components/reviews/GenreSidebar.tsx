"use client";

import { cn } from "@/lib/utils";
import type { GenreOption } from "@/types/review";
import { mockTags } from "@/lib/mock-data";

interface GenreSidebarProps {
  genres: GenreOption[];
  selectedGenreSlug: string | null;
  selectedTagSlug?: string | null;
  onGenreSelect: (slug: string | null) => void;
  onTagSelect: (slug: string | null) => void;
}

export function GenreSidebar({
  genres,
  selectedGenreSlug,
  selectedTagSlug,
  onGenreSelect,
  onTagSelect,
}: GenreSidebarProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Genres</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Browse reviews by genre
        </p>
        <ul className="mt-3 space-y-1">
          <li>
            <button
              type="button"
              onClick={() => onGenreSelect(null)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selectedGenreSlug === null && !selectedTagSlug
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              All genres
            </button>
          </li>
          {genres.map((genre) => (
            <li key={genre.id}>
              <button
                type="button"
                onClick={() => onGenreSelect(genre.slug)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selectedGenreSlug === genre.slug
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span>{genre.name}</span>
                <span className="text-xs tabular-nums opacity-70">
                  {genre.reviewCount}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Popular tags</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mockTags.slice(0, 8).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() =>
                onTagSelect(selectedTagSlug === tag.slug ? null : tag.slug)
              }
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selectedTagSlug === tag.slug
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
