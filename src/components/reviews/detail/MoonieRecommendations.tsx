"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import {
  Sparkles,
  Star,
} from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { NovelCarouselArrow } from "@/components/novels/NovelCarouselArrow";
import { CoverImage } from "@/components/ui/CoverImage";
import { ReviewMoonieAskButton } from "@/components/reviews/detail/ReviewMoonieAskButton";
import { isMissingCoverUrl } from "@/lib/review-utils";
import { cn } from "@/lib/utils";
import type { NovelRecommendation } from "@/types/review";

const MAX_MATCHES = 25;

interface MoonieRecommendationsProps {
  picks: NovelRecommendation[];
  readingMood?: string;
  novelTitle?: string;
  tags?: string[];
  className?: string;
  isLoggedIn?: boolean;
  embedded?: boolean;
}

export function MoonieRecommendations({
  picks,
  readingMood,
  novelTitle,
  tags = [],
  className,
  isLoggedIn = true,
  embedded = false,
}: MoonieRecommendationsProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const uniquePicks = useMemo(
    () =>
      Array.from(new Map(picks.map((novel) => [novel.id, novel])).values())
        .filter((novel) => !isMissingCoverUrl(novel.coverUrl))
        .slice(0, MAX_MATCHES),
    [picks]
  );

  if (uniquePicks.length === 0) return null;

  const scroll = (direction: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: direction * el.clientWidth * 0.75,
      behavior: prefersReduced ? "auto" : "smooth",
    });
  };

  return (
    <section
      aria-labelledby="moonie-recs-heading"
      className={cn(
        !embedded &&
          "rounded-[1.5rem] border border-[#1a1033]/8 bg-[linear-gradient(135deg,#fffdfa_0%,#faf8ff_55%,#f4ecf8_100%)] px-5 py-6 sm:px-7",
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center">
            <MoonieMascot
              size={40}
              variant="recommending"
              display="clean"
              lightweight
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0 max-w-2xl">
                <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#C89B4A]">
                  <Sparkles className="size-3.5" aria-hidden />
                  Moonie suggestions
                </p>
                <h2
                  id="moonie-recs-heading"
                  className="mt-1.5 font-heading text-xl font-semibold leading-tight text-[#1a1033] sm:text-2xl"
                >
                  If you liked this review
                </h2>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {novelTitle ? (
                  <ReviewMoonieAskButton
                    novelTitle={novelTitle}
                    tags={tags}
                    variant="compact"
                    isLoggedIn={isLoggedIn}
                  />
                ) : null}
                {uniquePicks.length > 0 ? (
                  <>
                    <NovelCarouselArrow
                      direction="prev"
                      disabled={false}
                      onClick={() => scroll(-1)}
                      label="Previous recommendations"
                    />
                    <NovelCarouselArrow
                      direction="next"
                      disabled={false}
                      onClick={() => scroll(1)}
                      label="Next recommendations"
                    />
                  </>
                ) : null}
              </div>
            </div>

            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#5a4d72]">
              {readingMood ??
                "Chosen from shared genres, tags and community reading patterns."}
            </p>
          </div>
        </div>

        <div
          ref={railRef}
          className="discover-hscroll flex snap-x snap-mandatory gap-3"
          role="region"
          aria-label="Moonie recommendations"
          tabIndex={0}
        >
          {uniquePicks.map((novel) => (
            <Link
              key={novel.id}
              href={`/novels/${novel.id}`}
              className={cn(
                "group flex w-[min(88vw,19.5rem)] shrink-0 snap-start gap-3.5 rounded-[1.1rem] border border-[#1a1033]/8 bg-[#FFFBFF] p-3.5",
                "transition hover:border-[#6E46C7]/25 hover:shadow-[0_10px_24px_-18px_rgba(110,70,199,0.28)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
                "sm:w-[19rem]"
              )}
            >
              <div className="relative h-[6.75rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-[#F4ECF8] ring-1 ring-[#1a1033]/8">
                <CoverImage
                  src={novel.coverUrl}
                  alt={`Cover of ${novel.title}`}
                  title={novel.title}
                  author={novel.author ?? undefined}
                  themeSeed={novel.id}
                  sizes="72px"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[#1a1033] group-hover:text-[#6E46C7]">
                  {novel.title}
                </h3>
                {novel.author ? (
                  <p className="line-clamp-1 text-xs text-[#7a7284]">
                    {novel.author}
                  </p>
                ) : null}
                {novel.averageRating != null && novel.averageRating > 0 ? (
                  <span className="inline-flex w-fit items-center gap-1 text-[11px] font-bold text-[#8f711e]">
                    <Star
                      className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]"
                      aria-hidden
                    />
                    {novel.averageRating.toFixed(1)}
                  </span>
                ) : null}
                <p className="mt-auto line-clamp-2 text-xs leading-5 text-[#5a4d72]">
                  {novel.reason || novel.matchingLabels[0]}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
