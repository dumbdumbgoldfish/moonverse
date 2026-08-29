import Link from "next/link";
import { BookMarked } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GenreOption } from "@/types/review";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";

interface PopularGenresSectionProps {
  genres: GenreOption[];
}

const genreColors = [
  "from-violet-100 to-purple-50 border-violet-200",
  "from-sky-100 to-blue-50 border-sky-200",
  "from-rose-100 to-pink-50 border-rose-200",
  "from-amber-100 to-orange-50 border-amber-200",
  "from-emerald-100 to-green-50 border-emerald-200",
  "from-indigo-100 to-violet-50 border-indigo-200",
  "from-fuchsia-100 to-pink-50 border-fuchsia-200",
  "from-cyan-100 to-sky-50 border-cyan-200",
];

export function PopularGenresSection({ genres }: PopularGenresSectionProps) {
  return (
    <section
      className="border-y border-border/60 bg-bg-warm py-16 sm:py-20"
      aria-labelledby="genres-heading"
    >
      <div className={SITE_SHELL_CLASS}>
        <div className="mb-8 flex items-center gap-2 text-primary">
          <BookMarked size={18} aria-hidden="true" />
          <span className="text-sm font-medium">Browse by genre</span>
        </div>
        <h2
          id="genres-heading"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Popular Genres
        </h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          From cultivation epics to litRPG adventures. Find reviews in your
          favourite genres.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {genres.map((genre, index) => (
            <Link
              key={genre.id}
              href={`/search?genre=${genre.slug}`}
              className={`group rounded-2xl border bg-gradient-to-br p-5 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${genreColors[index % genreColors.length]}`}
            >
              <h3 className="font-semibold text-foreground group-hover:text-primary">
                {genre.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {genre.reviewCount.toLocaleString()} reviews
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {genres.slice(0, 5).map((genre) => (
            <Badge
              key={genre.id}
              variant="outline"
              render={<Link href={`/search?genre=${genre.slug}`} />}
              className="cursor-pointer rounded-full border-primary/20 bg-white hover:bg-moon-purple-soft"
            >
              {genre.name}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
