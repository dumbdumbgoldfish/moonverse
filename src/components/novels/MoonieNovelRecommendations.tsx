"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { Sparkles, Star } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { NovelCarouselArrow } from "@/components/novels/NovelCarouselArrow";
import { CoverImage } from "@/components/ui/CoverImage";
import {
  SALON_CARD,
  SALON_CHIP,
  SALON_EYEBROW,
  SALON_GLOW_GOLD,
  SALON_GLOW_PURPLE,
  SALON_SURFACE,
} from "@/lib/novels/salon-surface";
import { isMissingCoverUrl } from "@/lib/review-utils";
import { cn } from "@/lib/utils";
import type { NovelRecommendation } from "@/types/review";

interface MoonieNovelRecommendationsProps {
  recommendations: NovelRecommendation[];
  title: string;
}

const MAX_MATCHES = 12;

function MoonieMatchCard({ novel }: { novel: NovelRecommendation }) {
  const matchLabel =
    novel.matchingLabels[0] || novel.reason || "Similar catalogue match";

  return (
    <Link
      href={`/novels/${novel.id}`}
      className={cn(
        SALON_CARD,
        "group flex h-full min-h-[8.5rem] gap-3.5 p-3.5 sm:min-h-[9rem] sm:gap-4 sm:p-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A]"
      )}
    >
      <span className="relative h-[6.75rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-[#E8C36A]/25 sm:h-[7.25rem] sm:w-[4.85rem]">
        <CoverImage
          src={novel.coverUrl}
          alt=""
          title={novel.title}
          sizes="80px"
          compactFallback
          className="object-cover"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5 pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E8C36A]">
          {matchLabel}
        </span>
        <span className="line-clamp-2 font-serif text-[15px] font-medium leading-snug text-white group-hover:text-[#E8C36A] sm:text-base">
          {novel.title}
        </span>
        {novel.author ? (
          <span className="truncate text-sm text-[#9C95B3]">{novel.author}</span>
        ) : null}
        {novel.averageRating !== null ? (
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[#EDE8FF]">
            <Star
              className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]"
              aria-hidden
            />
            {novel.averageRating.toFixed(1)}
            {novel.reviewCount > 0 ? (
              <span className="font-normal text-[#8B84A3]">
                · {novel.reviewCount}{" "}
                {novel.reviewCount === 1 ? "review" : "reviews"}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="mt-auto text-sm text-[#8B84A3]">No score yet</span>
        )}
      </span>
    </Link>
  );
}

export function MoonieNovelRecommendations({
  recommendations,
}: MoonieNovelRecommendationsProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(
    () =>
      recommendations
        .filter((novel) => !isMissingCoverUrl(novel.coverUrl))
        .slice(0, MAX_MATCHES),
    [recommendations]
  );

  const recommendationLabels = [
    "Completed",
    "Official source",
    "Less angst",
  ] as const;

  const scrollRail = (direction: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: direction * Math.max(el.clientWidth * 0.72, 280),
      behavior: prefersReduced ? "auto" : "smooth",
    });
  };

  return (
    <section
      id="edition-similar"
      aria-labelledby="moonie-recommendations-heading"
      className={cn(SALON_SURFACE, "scroll-mt-28 rounded-[20px] p-5 sm:p-6")}
    >
      <div aria-hidden className={SALON_GLOW_PURPLE} />
      <div aria-hidden className={SALON_GLOW_GOLD} />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <MoonieMascot variant="thinking" size={48} display="clean" lightweight />
          <div>
            <p className={SALON_EYEBROW}>
              <Sparkles className="size-3.5" aria-hidden />
              Moonie
            </p>
            <h2
              id="moonie-recommendations-heading"
              className="mt-2 font-serif text-[1.35rem] font-medium leading-tight text-white sm:text-[1.65rem]"
            >
              If you liked this
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-[#B7B0CC] sm:text-[15px]">
              Similar novels based on shared genres, tropes, and catalogue
              signals.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {recommendationLabels.map((label) => (
            <span
              key={label}
              className={cn(
                SALON_CHIP,
                "cursor-default px-3.5 py-2 text-xs"
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="relative mt-6 rounded-2xl border border-dashed border-[#E8C36A]/30 bg-white/[0.04] px-5 py-8 text-sm leading-6 text-[#B7B0CC]">
          No close catalogue matches yet. Ask Moonie to interpret the vibe
          inside the catalog.
        </p>
      ) : (
        <div className="relative mt-6 flex items-stretch gap-2 sm:gap-3">
          <NovelCarouselArrow
            direction="prev"
            disabled={matches.length <= 1}
            onClick={() => scrollRail(-1)}
            label="Scroll recommendations left"
            tone="dark"
          />
          <div
            ref={railRef}
            className="discover-hscroll flex min-w-0 flex-1 snap-x snap-mandatory gap-3 sm:gap-3.5"
            role="region"
            aria-label="Similar novel recommendations"
            tabIndex={0}
          >
            {matches.map((novel) => (
              <div
                key={novel.id}
                className="w-[min(88vw,19.5rem)] shrink-0 snap-start sm:w-[18.5rem] lg:w-[20rem]"
              >
                <MoonieMatchCard novel={novel} />
              </div>
            ))}
          </div>
          <NovelCarouselArrow
            direction="next"
            disabled={matches.length <= 1}
            onClick={() => scrollRail(1)}
            label="Scroll recommendations right"
            tone="dark"
          />
        </div>
      )}
    </section>
  );
}
