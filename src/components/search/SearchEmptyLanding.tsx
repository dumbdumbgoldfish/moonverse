"use client";

import Link from "next/link";
import { Clock, Search, Star, TrendingUp } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatCompactCount } from "@/lib/format-utils";
import { starterSearchQueries } from "@/lib/search";
import { cn } from "@/lib/utils";
import type { SearchWorkHit } from "@/types/search";

interface SearchEmptyLandingProps {
  recents: string[];
  recentError: string | null;
  popular: SearchWorkHit[];
  onRecent: (query: string) => void;
  onClearRecents: () => void;
}

export function SearchEmptyLanding({
  recents,
  recentError,
  popular,
  onRecent,
  onClearRecents,
}: SearchEmptyLandingProps) {
  const starters = starterSearchQueries();

  return (
    <div className="space-y-6 pb-6 pt-1">
      <section className="overflow-hidden rounded-[1.25rem] border border-[#6E46C7]/15 bg-gradient-to-br from-[#0B0818] via-[#1a1033] to-[#241640] px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8C36A]">
              MoonVerse catalogue
            </p>
            <h1 className="mt-2 font-serif text-2xl font-medium tracking-tight text-white sm:text-[1.75rem]">
              Find your next obsession
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-white/65">
              Search from the navbar, then refine by genre, tropes, and community
              ratings.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
            {starters.slice(0, 4).map((query) => (
              <button
                key={query}
                type="button"
                onClick={() => onRecent(query)}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          <ExploreCard title="Popular searches" icon={Search}>
            <p className="text-[13px] leading-relaxed text-[#1A1224]/55">
              Try a title, author, trope, or reviewer handle.
            </p>
            <ChipGrid items={starters} onPick={onRecent} variant="primary" />
          </ExploreCard>

          {recents.length > 0 ? (
            <ExploreCard
              title="Recent searches"
              icon={Clock}
              action={
                <button
                  type="button"
                  onClick={onClearRecents}
                  className="text-[11px] font-semibold text-[#1A1224]/45 hover:text-[#6E46C7]"
                >
                  Clear
                </button>
              }
            >
              {recentError ? (
                <p
                  role="alert"
                  className="text-[12px] font-medium text-[#B42318]"
                >
                  {recentError}
                </p>
              ) : null}
              <ChipGrid items={recents} onPick={onRecent} variant="muted" />
            </ExploreCard>
          ) : null}
        </div>

        {popular.length > 0 ? (
          <section className="rounded-[1.25rem] border border-[#1A1224]/8 bg-white p-4 shadow-[0_20px_48px_-36px_rgba(26,18,36,0.2)] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E46C7]">
                  In the catalog
                </p>
                <h2 className="mt-1 font-serif text-xl font-medium tracking-tight text-[#1A1224]">
                  What readers are opening
                </h2>
                <p className="mt-1 text-[13px] text-[#1A1224]/55">
                  Ranked by recent activity across MoonVerse.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0B0818] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#E8C36A]">
                <TrendingUp className="size-3.5" aria-hidden />
                Live shelf
              </span>
            </div>

            <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {popular.slice(0, 6).map((work, index) => (
                <li key={work.id}>
                  <TrendingWorkCard work={work} rank={index + 1} />
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function ExploreCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof Search;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[#1A1224]/8 bg-white p-4 shadow-[0_12px_32px_-28px_rgba(26,18,36,0.18)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#6E46C7]">
          <Icon className="size-3.5" aria-hidden />
          {title}
        </p>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ChipGrid({
  items,
  onPick,
  variant,
}: {
  items: string[];
  onPick: (query: string) => void;
  variant: "primary" | "muted";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((query) => (
        <button
          key={query}
          type="button"
          onClick={() => onPick(query)}
          className={cn(
            "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
            variant === "primary"
              ? "bg-[#F4ECF8] text-[#4C35C4] ring-1 ring-[#6E46C7]/15 hover:bg-[#EDE4FF]"
              : "bg-[#FBF7F1] text-[#1A1224]/70 ring-1 ring-[#1A1224]/10 hover:ring-[#6E46C7]/25",
          )}
        >
          {query}
        </button>
      ))}
    </div>
  );
}

function TrendingWorkCard({
  work,
  rank,
}: {
  work: SearchWorkHit;
  rank: number;
}) {
  const score = work.averageRating ? work.averageRating.toFixed(1) : null;
  const genre = work.genres[0];

  return (
    <Link
      href={`/novels/${work.id}`}
      className="group flex h-full gap-3 rounded-2xl border border-[#1A1224]/8 bg-[#FBF7F1]/50 p-3 transition hover:border-[#6E46C7]/25 hover:bg-white hover:shadow-[0_12px_28px_-20px_rgba(110,70,199,0.35)]"
    >
      <div className="flex shrink-0 flex-col items-center gap-2">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-md text-[11px] font-bold tabular-nums",
            rank <= 3
              ? "bg-[#6E46C7] text-white"
              : "bg-[#1A1224]/8 text-[#1A1224]/50",
          )}
        >
          {rank}
        </span>
        <div className="relative h-[88px] w-[60px] overflow-hidden rounded-lg bg-[#1A1224]/5 ring-1 ring-[#1A1224]/10">
          <CoverImage
            src={work.coverUrl}
            alt=""
            title={work.title}
            sizes="60px"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="line-clamp-2 font-serif text-[14px] font-medium leading-snug text-[#1A1224] group-hover:text-[#6E46C7]">
          {work.title}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-[#1A1224]/50">
          {work.author}
        </p>
        {genre ? (
          <span className="mt-2 inline-flex w-fit rounded-full bg-[#6E46C7]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6E46C7]">
            {genre}
          </span>
        ) : null}
        <p className="mt-auto flex items-center gap-1.5 pt-2 text-[12px] text-[#1A1224]/65">
          {score ? (
            <>
              <Star
                className="size-3 fill-[var(--mv-star-gold)] text-[var(--mv-star-gold)]"
                aria-hidden
              />
              <span className="font-semibold tabular-nums text-[#1A1224]">
                {score}
              </span>
              <span className="text-[#1A1224]/40">·</span>
            </>
          ) : (
            <span className="font-medium text-[#1A1224]/45">New</span>
          )}
          <span>
            {formatCompactCount(work.reviewCount)}{" "}
            {work.reviewCount === 1 ? "review" : "reviews"}
          </span>
        </p>
      </div>
    </Link>
  );
}
