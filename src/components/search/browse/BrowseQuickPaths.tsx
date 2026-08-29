"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { getGenrePresentation } from "@/lib/genre-presentation";
import { WEB_NOVEL_GENRES } from "@/lib/genres";
import { DISCOVERY_MOOD_CHIPS } from "@/lib/moonie/constants";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";
import type { DiscoverTagPreview } from "@/types/discovery";
import type { GenreOption } from "@/types/review";

interface BrowseQuickPathsProps {
  genres: GenreOption[];
  popularTags: DiscoverTagPreview[];
  activeGenre: string | null;
  activeTags: string[];
  onSelectGenre: (slug: string | null) => void;
  onToggleTag: (slug: string) => void;
}

function genreIcon(slug: string) {
  return WEB_NOVEL_GENRES.find((g) => g.slug === slug)?.icon ?? LayoutGrid;
}

export function BrowseQuickPaths({
  genres,
  popularTags,
  activeGenre,
  activeTags,
  onSelectGenre,
  onToggleTag,
}: BrowseQuickPathsProps) {
  const topGenres = genres.slice(0, 8);
  const topTags = popularTags.slice(0, 8);

  return (
    <section aria-label="Quick paths" className="space-y-4 py-5">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1A1224]/45">
          Genres
        </p>
        <div className="discover-hscroll -mx-4 flex gap-2 px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          <button
            type="button"
            onClick={() => onSelectGenre(null)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
              !activeGenre
                ? "mv-nav-signup border-0 text-white"
                : "bg-white text-[#1A1224] ring-1 ring-[#1A1224]/10 hover:ring-[#6E46C7]/25"
            )}
          >
            <LayoutGrid className="size-3.5" aria-hidden />
            All
          </button>
          {topGenres.map((genre) => {
            const Icon = genreIcon(genre.slug);
            const active = activeGenre === genre.slug;
            return (
              <button
                key={genre.slug}
                type="button"
                onClick={() => onSelectGenre(genre.slug)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
                  active
                    ? "mv-nav-signup border-0 text-white"
                    : cn(
                        "bg-white ring-1 ring-[#1A1224]/10 hover:ring-[#6E46C7]/25",
                        getGenrePresentation(genre.slug)?.accentClass ??
                          "text-[#1A1224]"
                      )
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {genre.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1A1224]/45">
          Moods
        </p>
        <div className="discover-hscroll -mx-4 flex gap-2 px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {DISCOVERY_MOOD_CHIPS.map((mood) => (
            <Link
              key={mood.label}
              href={moonieEntryHref(mood.prompt)}
              className="inline-flex shrink-0 items-center rounded-full border border-[#6E46C7]/15 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1A1224] transition-colors hover:border-[#6E46C7]/35"
            >
              {mood.label}
            </Link>
          ))}
        </div>
      </div>

      {topTags.length > 0 ? (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1A1224]/45">
            Trending tropes
          </p>
          <div className="discover-hscroll -mx-4 flex gap-2 px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            {topTags.map((tag) => {
              const active = activeTags.includes(tag.slug);
              return (
                <button
                  key={tag.slug}
                  type="button"
                  onClick={() => onToggleTag(tag.slug)}
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    active
                      ? "bg-[#C89B4A]/20 text-[#8A6A1A] ring-1 ring-[#C89B4A]/40"
                      : "bg-white text-[#1A1224]/80 ring-1 ring-[#1A1224]/10 hover:ring-[#C89B4A]/30"
                  )}
                >
                  {tag.name}
                  {tag.novelCount ? (
                    <span className="ml-1.5 tabular-nums text-[10px] opacity-60">
                      {tag.novelCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
