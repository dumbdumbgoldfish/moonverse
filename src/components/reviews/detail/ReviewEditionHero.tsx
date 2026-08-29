import Link from "next/link";
import { BookOpen, Star } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { ReviewMoonieAskButton } from "@/components/reviews/detail/ReviewMoonieAskButton";
import { genreBrowseHref } from "@/lib/genres";
import { genreSlugFromName } from "@/lib/genre-slug";
import {
  SALON_CHIP,
  SALON_GLOW_GOLD,
  SALON_GLOW_PURPLE,
  SALON_OUTLINE_BTN,
  SALON_SURFACE,
} from "@/lib/novels/salon-surface";
import { excerpt } from "@/lib/review-utils";
import { communityDeltaCopy } from "@/lib/review-verdict";
import { cn } from "@/lib/utils";
import type { NovelReviewStats } from "@/services/review.service";
import type { ReviewDetail } from "@/types/review";

interface ReviewEditionHeroProps {
  review: ReviewDetail;
  stats: NovelReviewStats;
  isLoggedIn?: boolean;
  className?: string;
}

export function ReviewEditionHero({
  review,
  stats,
  isLoggedIn = true,
  className,
}: ReviewEditionHeroProps) {
  const chips = [...review.genres, ...review.tags]
    .filter(
      (value, index, values) =>
        values.findIndex(
          (candidate) => candidate.toLowerCase() === value.toLowerCase()
        ) === index
    )
    .slice(0, 6);
  const deltaCopy = communityDeltaCopy(review.rating, stats.average, stats.total);
  const summary = excerpt(review.excerpt || review.body, 150);

  return (
    <header className={cn(SALON_SURFACE, "rounded-2xl", className)}>
      <div aria-hidden className={SALON_GLOW_PURPLE} />
      <div aria-hidden className={SALON_GLOW_GOLD} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E8C36A]/70 to-transparent"
      />

      <div className="relative grid gap-4 p-5 sm:gap-5 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-6">
        <div className="shrink-0">
          <div className="relative aspect-[2/3] w-[7.5rem] overflow-hidden rounded-xl bg-white/5 shadow-[0_16px_36px_-16px_rgba(0,0,0,0.65)] ring-1 ring-[#E8C36A]/25 sm:w-[8.75rem]">
            <CoverImage
              src={review.coverUrl}
              alt=""
              title={review.novelTitle}
              author={review.novelAuthor}
              genres={review.genres}
              themeSeed={review.novelId}
              sizes="(max-width: 640px) 120px, 140px"
              priority
              className="object-cover"
            />
          </div>
        </div>

        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[#E8C36A]/55 bg-[#E8C36A]/8 px-3 py-1.5 text-xs font-semibold tracking-[0.14em] text-[#E8C36A]">Community review</p>

          <h1 className="mt-3 font-heading text-[clamp(1.65rem,3vw,2.35rem)] font-semibold leading-[1.12] tracking-tight text-white">
            <Link
              href={`/novels/${review.novelId}`}
              className="rounded-sm hover:text-[#E8C36A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A]"
            >
              {review.novelTitle}
            </Link>
          </h1>

          <p className="mt-2 font-serif text-lg italic leading-snug text-[#EDE8FF] sm:text-xl">
            {review.title}
          </p>

          <p className="mt-1.5 text-[15px] text-[#B7B0CC]">by {review.novelAuthor}</p>

          {summary ? (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#C9C2DC]">
              {summary}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {stats.total > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-sm font-semibold text-white">
                <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
                {stats.average.toFixed(1)} community
                <span className="font-medium text-[#B7B0CC]">
                  · {stats.total} {stats.total === 1 ? "review" : "reviews"}
                </span>
              </span>
            ) : null}
            <span className="inline-flex items-center rounded-full border border-[#E8C36A]/35 bg-[#E8C36A]/12 px-3 py-1.5 text-sm font-bold text-[#E8C36A]">
              This take: {review.rating}★
            </span>
            {review.containsSpoilers ? (
              <span className="rounded-full bg-amber-50/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[#E8C36A] ring-1 ring-[#E8C36A]/30">
                Spoilers
              </span>
            ) : null}
          </div>

          {deltaCopy ? (
            <p className="mt-2.5 text-sm font-medium text-[#B7B0CC]">{deltaCopy}</p>
          ) : null}

          {chips.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {chips.map((chip) => {
                const slug = genreSlugFromName(chip);
                const label = chip.replace(/-/g, " ");
                return (
                  <li key={chip}>
                    {slug ? (
                      <Link href={genreBrowseHref(slug)} className={SALON_CHIP}>
                        {label}
                      </Link>
                    ) : (
                      <span className={SALON_CHIP}>{label}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link href={`/novels/${review.novelId}`} className={SALON_OUTLINE_BTN}>
              <BookOpen className="size-4" aria-hidden />
              Novel page
            </Link>
            <ReviewMoonieAskButton
              novelTitle={review.novelTitle}
              tags={review.tags}
              isLoggedIn={isLoggedIn}
              tone="dark"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
