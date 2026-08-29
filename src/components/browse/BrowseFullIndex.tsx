import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LayoutGrid } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { genreBrowseHref } from "@/lib/genres";
import { cn } from "@/lib/utils";

interface GenreRow {
  name: string;
  slug: string;
  icon: LucideIcon;
  gradient?: string;
}

interface BrowseFullIndexProps {
  genres: GenreRow[];
  className?: string;
}

/** Colourful genre directory with icon chips. */
export function BrowseFullIndex({ genres, className }: BrowseFullIndexProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-[#1a1033]/10 bg-gradient-to-br from-white via-[#faf7ff] to-[#f4ecf8]/60 px-4 py-4 sm:px-5 sm:py-5",
        className,
      )}
      aria-labelledby="browse-index-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b4bb5]">
            <LayoutGrid className="size-3.5" aria-hidden />
            Full index
          </p>
          <h2
            id="browse-index-heading"
            className="mt-1 font-heading text-xl font-semibold text-[#1a1033]"
          >
            All genres
          </h2>
          <p className="mt-1 text-sm text-[#7a7284]">
            Every shelf in the catalogue, one tap away.
          </p>
        </div>
        <MoonieMascot
          size={72}
          variant="waving"
          display="clean"
          lightweight
          className="hidden shrink-0 sm:block"
        />
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {genres.map((genre) => {
          const Icon = genre.icon;
          const gradient =
            genre.gradient ?? "from-[#6b4bb5] to-[#1a1033]";

          return (
            <li key={genre.slug}>
              <Link
                href={genreBrowseHref(genre.slug)}
                className={cn(
                  "group flex min-h-11 items-center gap-2.5 rounded-xl border border-[#1a1033]/8 bg-white/80 px-2.5 py-2",
                  "transition-[transform,border-color,background-color,box-shadow] duration-200",
                  "hover:-translate-y-0.5 hover:border-[#6b4bb5]/25 hover:bg-white hover:shadow-[0_10px_24px_-16px_rgba(26,16,51,0.25)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b4bb5]",
                  "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                    gradient,
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-[#1a1033] group-hover:text-[#6b4bb5]">
                  {genre.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
