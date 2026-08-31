import Link from "next/link";
import { Timer } from "lucide-react";
import { NightAtmosphere } from "@/components/landing/LandingDecor";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { CoverImage } from "@/components/ui/CoverImage";
import { CatalogLink } from "@/components/ui/CatalogLink";
import {
  LANDING_GENRE_DOOR_SLUGS,
  LANDING_SLOW_BURN_SLUG,
  formatShelfCount,
  landingGenreBlurb,
  landingGenreHref,
} from "@/lib/landing-genres";
import {
  WEB_NOVEL_GENRES,
  type WebNovelGenre,
} from "@/lib/genres";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";
import type { LandingGenreCover, LandingGenreDoor } from "@/types/discovery";

const FEELING_PROMPT =
  "I only have a feeling. Recommend a web novel from the MoonVerse catalogue.";

type DoorView = LandingGenreDoor & {
  icon: WebNovelGenre["icon"];
  gradient: string;
};

function editorialDoors(): DoorView[] {
  const genres = LANDING_GENRE_DOOR_SLUGS.map((slug) =>
    WEB_NOVEL_GENRES.find((genre) => genre.slug === slug)
  ).filter((genre): genre is WebNovelGenre => Boolean(genre));

  return [
    ...genres.map((genre) => ({
      kind: "genre" as const,
      slug: genre.slug,
      name: genre.name,
      href: landingGenreHref(genre.slug),
      blurb: landingGenreBlurb(genre.slug),
      titleCount: 0,
      reviewCount: 0,
      covers: [],
      icon: genre.icon,
      gradient: genre.gradient,
    })),
    {
      kind: "tag",
      slug: LANDING_SLOW_BURN_SLUG,
      name: "Slow-burn",
      href: landingGenreHref(LANDING_SLOW_BURN_SLUG),
      blurb: landingGenreBlurb(LANDING_SLOW_BURN_SLUG),
      titleCount: 0,
      reviewCount: 0,
      covers: [],
      icon: Timer,
      gradient: "from-rose-400 to-violet-600",
    },
  ];
}

function mergeDoors(live: LandingGenreDoor[]): DoorView[] {
  const bySlug = new Map(live.map((door) => [door.slug, door]));
  return editorialDoors().map((door) => {
    const match = bySlug.get(door.slug);
    if (!match) return door;
    return {
      ...door,
      name: door.slug === LANDING_SLOW_BURN_SLUG ? "Slow-burn" : match.name,
      href: match.href,
      blurb: match.blurb || door.blurb,
      titleCount: match.titleCount,
      reviewCount: match.reviewCount,
      featuredTitle: match.featuredTitle,
      covers: match.covers,
    };
  });
}

function pickFeatured(doors: DoorView[]): string {
  return [...doors].sort(
    (a, b) =>
      b.titleCount - a.titleCount ||
      b.reviewCount - a.reviewCount ||
      a.name.localeCompare(b.name)
  )[0]?.slug ?? doors[0]?.slug;
}

function DoorCovers({
  covers,
  hasTitles,
}: {
  covers: LandingGenreCover[];
  hasTitles: boolean;
}) {
  const shown = covers.slice(0, 3);
  if (shown.length === 0) {
    return (
      <div
        className="flex h-[8.5rem] items-center justify-center rounded-xl bg-gradient-to-b from-[#f4ecf8] to-[#fff6e8]"
        aria-hidden
      >
        <span className="px-3 text-center font-serif text-sm text-[#1a1033]/45">
          {hasTitles ? "Open to browse titles" : "Shelf warming up"}
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative h-[8.5rem] overflow-hidden rounded-xl bg-gradient-to-b from-[#2a1840]/8 via-[#f4ecf8] to-[#fff6e8]"
    >
      <div className="relative mx-auto h-full w-full max-w-[18rem]">
        {shown.map((cover, index) => {
          const offset = index - (shown.length - 1) / 2;
          return (
            <Link
              key={cover.novelId}
              href={`/novels/${cover.novelId}`}
              className="absolute top-2.5 aspect-[2/3] w-[4rem] overflow-hidden rounded-lg border-2 border-white shadow-[0_12px_20px_-10px_rgba(26,18,36,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_24px_-10px_rgba(26,18,36,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B4A] [&_p]:invisible"
              style={{
                left: `calc(50% + ${offset * 1.55}rem)`,
                transform: `translateX(-50%) rotate(${offset * 7}deg)`,
                zIndex: index === Math.floor(shown.length / 2) ? 4 : index + 1,
              }}
              aria-label={`${cover.title} by ${cover.author}`}
            >
              <CoverImage
                src={cover.coverUrl}
                alt=""
                title={cover.title}
                author={cover.author}
                themeSeed={cover.novelId}
                sizes="80px"
                compactFallback
              />
            </Link>
          );
        })}
        <div className="pointer-events-none absolute inset-x-6 bottom-0 h-8 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(200,155,74,0.35),transparent_70%)] blur-md" />
      </div>
    </div>
  );
}

function DoorCard({
  door,
  fullest = false,
}: {
  door: DoorView;
  fullest?: boolean;
}) {
  const Icon = door.icon;
  const shelf = formatShelfCount(door.titleCount, door.reviewCount);
  const featuredTitle = door.featuredTitle ?? door.covers[0]?.title;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-[#FFFBFF] p-4",
        "border border-white/70 shadow-[0_22px_50px_-30px_rgba(26,18,36,0.75)]",
        "transition duration-300 hover:-translate-y-1 hover:border-[#C89B4A]/55",
        "motion-reduce:transform-none motion-reduce:transition-none"
      )}
    >
      <span
        className="absolute inset-x-8 top-0 h-1 rounded-b-full bg-gradient-to-r from-violet-400 via-[#C89B4A] to-violet-400"
        aria-hidden
      />
      <span
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br opacity-25 blur-2xl",
          door.gradient
        )}
        aria-hidden
      />

      <Link
        href={door.href}
        aria-label={`${door.name}. ${shelf}.`}
        className="relative flex items-start gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B4A]"
      >
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md",
            door.gradient
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-xl font-bold tracking-tight text-[#1a1033]">
            {door.name}
          </h3>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.14em] text-[#8f711e]">
            {shelf}
          </p>
          {fullest ? (
            <span className="mt-1 inline-flex rounded-full border border-[#C89B4A]/40 bg-[#fff6e8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8f711e]">
              Fullest shelf
            </span>
          ) : null}
        </div>
      </Link>

      <div className="relative mt-3.5">
        <DoorCovers covers={door.covers} hasTitles={door.titleCount > 0} />
      </div>

      <Link
        href={door.href}
        className="relative mt-3 flex flex-1 flex-col rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B4A]"
      >
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
          {door.blurb}
        </p>

        {featuredTitle ? (
          <p className="mt-2.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600">
              On the shelf
            </span>
            <span className="mt-1 block line-clamp-1 font-serif text-[0.95rem] font-bold text-[#1a1033]">
              {featuredTitle}
            </span>
          </p>
        ) : (
          <p className="mt-2.5 text-sm text-slate-500">
            {door.titleCount > 0
              ? "Open this door to browse live titles on the shelf."
              : "This door is waiting for catalogue titles."}
          </p>
        )}
      </Link>
    </article>
  );
}

export function GenreCarousel({ doors = [] }: { doors?: LandingGenreDoor[] }) {
  const resolved = mergeDoors(doors);
  const fullestSlug = pickFeatured(resolved);

  return (
    <section id="doorways" className="mv-land text-white">
      <NightAtmosphere intensity="soft" />
      <div
        className="pointer-events-none absolute left-1/2 top-8 h-28 w-[60%] -translate-x-1/2 rounded-[100%] bg-[#C89B4A]/10 blur-3xl"
        aria-hidden
      />

      <div className="mv-land-shell">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F6C85F]/90">
              Doorways in the library
            </p>
            <h2 className="mv-land-title text-white">
              Browse by genre
            </h2>
            <p className="mv-land-copy text-white/65">
              Start with the doors readers use most. Each slip shows titles
              already on the MoonVerse shelf.
            </p>
          </div>
          <CatalogLink href="/browse" tone="night" size="compact">
            Browse the full catalogue
          </CatalogLink>
        </div>

        <div
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Featured genres"
        >
          {resolved.map((door) => (
            <DoorCard
              key={door.slug}
              door={door}
              fullest={door.slug === fullestSlug && door.titleCount > 0}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-col items-start justify-between gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-sm text-white/70">
            Only have a feeling, not a genre? Moonie ranks in-catalogue titles
            only.
          </p>
          <AskMoonieLink
            href={moonieEntryHref(FEELING_PROMPT)}
            size="sm"
            className="text-sm font-semibold"
          />
        </div>
      </div>
    </section>
  );
}
