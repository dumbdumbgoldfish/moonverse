import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { getGenreIcon } from "@/components/browse/genre-icon";
import type { GenreOption } from "@/types/review";

interface TrendingGenresProps {
  genres: GenreOption[];
}

export function TrendingGenres({ genres }: TrendingGenresProps) {
  if (genres.length === 0) return null;

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-night-blue">
        <TrendingUp className="size-4 text-primary" aria-hidden />
        Trending genres
      </h2>
      <ul className="mt-3 space-y-1">
        {genres.slice(0, 5).map((genre) => {
          const Icon = getGenreIcon(genre.slug);
          return (
            <li key={genre.id}>
              <Link
                href={`/browse/${genre.slug}`}
                className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-violet-50 text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-night-blue">
                  {genre.name}
                </span>
                {genre.reviewCount > 0 ? (
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-500">
                    {genre.reviewCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
