"use client";

import Link from "next/link";
import { Star, TrendingUp } from "lucide-react";
import { getGenreIcon } from "@/components/browse/genre-icon";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatCompactCount } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import type { GenreOption, ReviewListItem } from "@/types/review";

interface ReviewsSalonPulseAsideProps {
  genres: GenreOption[];
  spotlightReview: ReviewListItem | null;
  activeGenre: string | null;
  onSelectGenre: (slug: string) => void;
  className?: string;
}

export function ReviewsSalonPulseAside({
  genres,
  spotlightReview,
  activeGenre,
  onSelectGenre,
  className,
}: ReviewsSalonPulseAsideProps) {
  const trendingGenres = [...genres]
    .sort((a, b) => b.reviewCount - a.reviewCount || a.name.localeCompare(b.name))
    .slice(0, 5);

  return (
    <div className={cn("space-y-4", className)}>
      {trendingGenres.length > 0 ? (
        <section
          aria-label="Trending genres"
          className="rounded-[1.25rem] bg-white/75 p-4 ring-1 ring-[#1A1224]/8"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#C89B4A]/12 text-[#8A6A1A]">
              <TrendingUp className="size-3.5" aria-hidden />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1A1224]/45">
                Trending genres
              </p>
              <p className="text-[11px] text-[#1A1224]/50">Popular this week in the salon</p>
            </div>
          </div>

          <ol className="mt-3 space-y-1">
            {trendingGenres.map((genre, index) => {
              const Icon = getGenreIcon(genre.slug);
              const active = activeGenre === genre.slug;

              return (
                <li key={genre.slug}>
                  <button
                    type="button"
                    onClick={() => onSelectGenre(genre.slug)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors",
                      active
                        ? "bg-[#6E46C7]/8 ring-1 ring-[#6E46C7]/20"
                        : "fine-hover:bg-[#1A1224]/4"
                    )}
                  >
                    <span className="w-4 shrink-0 text-[11px] font-bold tabular-nums text-[#1A1224]/30">
                      {index + 1}
                    </span>
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#1A1224]/5 text-[#6E46C7]">
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[#1A1224]">
                      {genre.name}
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-[#1A1224]/45">
                      {formatCompactCount(genre.reviewCount)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <Link
            href="/browse"
            className="mt-3 block text-center text-[11px] font-semibold text-[#6E46C7] underline-offset-2 fine-hover:underline"
          >
            Browse all genres
          </Link>
        </section>
      ) : null}

      {spotlightReview ? (
        <section
          aria-label="Community spotlight"
          className="overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#fff8ee]/90 via-white/80 to-[#f5efff]/70 p-4 ring-1 ring-[#C89B4A]/20"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A6A1A]">
            Community spotlight
          </p>
          <Link
            href={`/reviews/${spotlightReview.id}`}
            className="group mt-3 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
          >
            <div className="flex gap-3">
              <div className="relative h-[72px] w-[48px] shrink-0 overflow-hidden rounded-lg bg-[#1A1224]/5 ring-1 ring-[#1A1224]/8">
                <CoverImage
                  src={spotlightReview.coverUrl}
                  alt=""
                  title={spotlightReview.novelTitle}
                  author={spotlightReview.novelAuthor}
                  genres={spotlightReview.genres}
                  sizes="48px"
                  compactFallback
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-serif text-[15px] leading-snug text-[#1A1224] transition-colors fine-group-hover:text-[#6E46C7]">
                  {spotlightReview.novelTitle}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[#1A1224]/55">
                  {spotlightReview.novelAuthor}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#1A1224]/60">
                  <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
                  {Number(spotlightReview.rating).toFixed(1)}
                  <span className="text-[#1A1224]/35">·</span>
                  {spotlightReview.reviewerName}
                </p>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[#1A1224]/65">
              {spotlightReview.containsSpoilers
                ? "Marked as containing spoilers."
                : spotlightReview.excerpt || spotlightReview.title}
            </p>
            <span className="mt-2 inline-block text-[11px] font-semibold text-[#6E46C7]">
              Read full review →
            </span>
          </Link>
        </section>
      ) : null}
    </div>
  );
}
