"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

interface DiscoverHeroProps {
  kicker: string;
  title: string;
  blurb: string;
  featured: ReviewListItem | null;
  isLoggedIn: boolean;
  loading?: boolean;
  /** Default editorial copy when no filters are active */
  showDefaultPitch?: boolean;
}

export function DiscoverHero({
  kicker,
  title,
  blurb,
  featured,
  isLoggedIn,
  loading = false,
  showDefaultPitch = false,
}: DiscoverHeroProps) {
  const registerHref = featured
    ? `/register?callbackUrl=${encodeURIComponent(`/reviews/${featured.id}`)}`
    : "/register?callbackUrl=/discover";

  return (
    <header
      className={cn(
        "grid gap-8 border-b border-[#1A1224]/8 py-8 md:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] md:items-end md:py-10",
        loading && "opacity-70"
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6E46C7]">
          {showDefaultPitch ? "MoonVerse discover" : kicker}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[#1A1224] sm:text-4xl">
          {showDefaultPitch
            ? "Discover honest reads from readers who finish the chapter"
            : title}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#1A1224]/70">
          {showDefaultPitch
            ? "Browse spoiler-aware reviews, compare works, and ask Moonie when you want a nudge toward your next binge."
            : blurb}
        </p>
        {!isLoggedIn ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              className="mv-nav-signup h-9 rounded-full border-0 px-5 font-bold text-white"
              render={<Link href={registerHref} />}
            >
              {featured ? "Join to save this review" : "Join free"}
            </Button>
            <Button
              variant="outline"
              className="h-9 rounded-full px-5 font-semibold"
              render={<Link href="#browse-feed" />}
            >
              Browse reviews
            </Button>
          </div>
        ) : null}
      </div>

      {featured ? (
        <Link
          href={`/reviews/${featured.id}`}
          className="group hidden min-w-0 gap-4 rounded-2xl bg-white/50 p-3 ring-1 ring-[#1A1224]/8 transition-colors duration-150 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] md:flex"
        >
          <div className="relative h-[168px] w-[112px] shrink-0 overflow-hidden rounded-lg bg-[#1A1224]/5 ring-1 ring-[#1A1224]/8">
            <CoverImage
              src={featured.coverUrl}
              alt=""
              title={featured.novelTitle}
              sizes="112px"
              priority
              className="object-cover"
            />
          </div>
          <div className="min-w-0 self-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C89B4A]">
              Editor&apos;s pick
            </p>
            <p className="mt-1 line-clamp-2 font-serif text-lg leading-snug text-[#1A1224] group-hover:text-[#6E46C7]">
              {featured.novelTitle}
            </p>
            <p className="mt-1 truncate text-sm text-[#1A1224]/55">
              {featured.novelAuthor}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#1A1224]/70">
              <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
              {Number(featured.novelAverageRating ?? featured.rating).toFixed(1)}
              {featured.feedReason ? (
                <span className="ml-1 text-[#6E46C7]">{featured.feedReason}</span>
              ) : null}
            </p>
          </div>
        </Link>
      ) : null}
    </header>
  );
}
