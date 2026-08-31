import Link from "next/link";
import { CheckCircle2, Sparkles, Star } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import {
  FloatingMoon,
  NightAtmosphere,
} from "@/components/landing/LandingDecor";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/button";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { pickLandingHeroReviews } from "@/lib/landing-reviews";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

interface LandingHeroProps {
  reviews: ReviewListItem[];
}

const TRUST =
  "Reviews and shelves from readers. Moonie only recommends titles already in the catalogue.";

function HeroCover({
  review,
  className,
  priority,
  size = "md",
}: {
  review: ReviewListItem;
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const genre = review.genres[0];
  const rating = review.novelAverageRating ?? review.rating;

  return (
    <Link
      href={`/novels/${review.novelId}`}
      className={cn(
        "group relative block aspect-[2/3] overflow-hidden rounded-xl border border-white/20",
        "shadow-[0_18px_36px_-18px_rgba(0,0,0,0.85)]",
        "transition duration-300 hover:-translate-y-1 hover:border-[#F6C85F]/45",
        "motion-reduce:transform-none motion-reduce:transition-none",
        className
      )}
    >
      <div className="absolute inset-0 [&_p]:invisible">
        <CoverImage
          src={review.coverUrl}
          alt={`${review.novelTitle} cover`}
          title={review.novelTitle}
          author={review.novelAuthor}
          themeSeed={review.novelId}
          sizes={size === "lg" ? "200px" : "140px"}
          priority={priority}
          compactFallback
        />
      </div>
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
        aria-hidden
      />
      <span className="absolute inset-x-0 bottom-0 p-2 pt-8 sm:p-2.5">
        {genre ? (
          <span className="mb-1.5 inline-flex rounded-full border border-[#C89B4A]/45 bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#E6D2A3] backdrop-blur-sm">
            {genre}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-bold text-[#F6C85F] backdrop-blur-sm">
            <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
            {rating.toFixed(1)}
          </span>
        </span>
        <span className="mt-1.5 block line-clamp-2 text-xs font-bold leading-snug text-white sm:text-sm">
          {review.novelTitle}
        </span>
        <span className="mt-0.5 block line-clamp-1 text-[11px] text-white/65">
          {review.novelAuthor}
        </span>
      </span>
    </Link>
  );
}

export function LandingHero({ reviews }: LandingHeroProps) {
  const covers = pickLandingHeroReviews(reviews, 3);
  const featured = covers[0];

  return (
    <section id="night" className="mv-land mv-land-hero-fill text-white">
      <NightAtmosphere intensity="rich" />
      <FloatingMoon
        size={140}
        className="absolute -right-8 top-6 opacity-25 sm:right-4 sm:top-8"
        float="slower"
      />
      <div
        className="pointer-events-none absolute left-[-8%] top-[18%] size-64 rounded-full bg-[#6246ea]/22 blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-8%] right-[8%] size-52 rounded-full bg-[#F6C85F]/10 blur-[70px]"
        aria-hidden
      />

      <div className="mv-land-shell grid items-center gap-4 sm:gap-5 lg:flex-1 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 xl:gap-10">
        <div className="max-w-2xl lg:max-w-none">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F6C85F]">
            <Sparkles className="size-3.5" aria-hidden />
            Read · Review · Discover
          </p>
          <h1 className="mt-1.5 font-serif text-[2rem] font-black leading-[1.06] tracking-tight sm:text-[2.35rem] lg:text-[2.65rem] xl:text-[2.85rem]">
            Find web novels{" "}
            <span className="bg-gradient-to-r from-white via-white to-[#F6C85F] bg-clip-text text-transparent">
              worth your night.
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-white/75 sm:text-base">
            A quiet place for thoughtful reviews, curated shelves and Moonie
            recommendations shaped by real readers.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:mt-5 sm:gap-3">
            <Button
              size="lg"
              className="mv-nav-signup h-11 rounded-full border-0 px-6 text-base font-bold text-white sm:h-12 sm:px-7"
              render={<Link href="/browse" />}
            >
              Browse the stacks
            </Button>
            <AskMoonieLink
              size="lg"
              className="h-11 px-5 text-base font-bold sm:h-12 sm:px-6"
            />
            <CatalogLink href="/#doorways" tone="night" size="compact">
              Browse by genre
            </CatalogLink>
          </div>

          <p className="mt-3 flex max-w-lg items-start gap-2 text-sm font-medium leading-relaxed text-white/65 sm:mt-3.5">
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-[#F6C85F]"
              aria-hidden
            />
            {TRUST}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div
            className="pointer-events-none absolute left-1/2 top-[6%] size-48 -translate-x-1/2 rounded-full bg-[#a78bfa]/35 blur-3xl sm:size-56 lg:size-60"
            aria-hidden
          />

          <div className="relative flex justify-center">
            <MoonieMascot
              size={188}
              variant="waving"
              display="hero"
              priority
              showGlow
              className="relative z-[2] origin-bottom animate-moonie-float motion-reduce:animate-none max-sm:scale-[0.82] lg:max-h-[11.5rem] lg:w-auto lg:scale-[0.92]"
            />
          </div>

          {covers.length > 0 ? (
            <div className="relative z-[3] mx-auto -mt-2 max-w-md sm:-mt-2 lg:max-w-none">
              <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[#F6C85F]/85">
                On the desk tonight
              </p>
              <div className="flex items-end justify-center gap-1 sm:gap-2.5">
                {covers[1] ? (
                  <HeroCover
                    review={covers[1]}
                    className="hidden w-[24%] -rotate-[7deg] translate-y-3 sm:block"
                  />
                ) : null}
                {featured ? (
                  <HeroCover
                    review={featured}
                    priority
                    size="lg"
                    className="z-[1] w-[48%] sm:w-[32%]"
                  />
                ) : null}
                {covers[2] ? (
                  <HeroCover
                    review={covers[2]}
                    className="hidden w-[24%] rotate-[7deg] translate-y-3 sm:block"
                  />
                ) : null}
              </div>

              <div className="pointer-events-none relative mt-0 px-4" aria-hidden>
                <div className="h-px bg-gradient-to-r from-transparent via-[#F6C85F]/60 to-transparent" />
                <div className="mx-auto h-4 w-[80%] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(246,200,95,0.32),rgba(98,70,234,0.2)_40%,transparent_72%)] blur-md" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
