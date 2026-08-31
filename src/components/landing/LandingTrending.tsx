"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Star,
} from "lucide-react";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { cn } from "@/lib/utils";
import { CoverImage } from "@/components/ui/CoverImage";
import { FloatingMoon } from "@/components/landing/LandingDecor";
import type { TrendingNovelPreview } from "@/types/discovery";

interface LandingTrendingProps {
  novels: TrendingNovelPreview[];
}

function TrendingCover({
  novel,
  priority,
}: {
  novel: TrendingNovelPreview;
  priority: boolean;
}) {
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden bg-violet-100">
      <CoverImage
        src={novel.coverUrl}
        alt={`Cover of ${novel.title}`}
        title={novel.title}
        author={novel.author}
        genres={novel.primaryGenre ? [novel.primaryGenre] : []}
        rating={novel.averageRating}
        reviewCount={novel.reviewCount}
        themeSeed={novel.novelId}
        sizes="(max-width: 640px) 210px, 230px"
        priority={priority}
        compactFallback
      />
    </div>
  );
}

function TrendingNovelCard({
  novel,
  rank,
}: {
  novel: TrendingNovelPreview;
  rank: number;
}) {
  return (
    <Link
      href={`/novels/${novel.novelId}`}
      className={cn(
        "group w-[210px] shrink-0 snap-start overflow-hidden rounded-[20px] border border-violet-100 bg-white shadow-sm",
        "transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "motion-reduce:transform-none motion-reduce:transition-none sm:w-[230px]"
      )}
    >
      <div className="relative">
        <TrendingCover novel={novel} priority={rank <= 5} />

        {rank <= 3 && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700 shadow-sm backdrop-blur-sm">
            <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
            Trending
          </span>
        )}

        {novel.primaryGenre && (
          <span className="absolute bottom-3 left-3 z-10 rounded-lg bg-slate-950/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {novel.primaryGenre}
          </span>
        )}
      </div>

      <div className="flex min-h-[174px] flex-col p-4">
        <h3 className="line-clamp-2 min-h-10 text-base font-bold leading-snug text-slate-950 transition-colors group-hover:text-violet-700">
          {novel.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
          {novel.author}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-slate-600">
          <span
            className="inline-flex items-center gap-1 text-[#8f711e]"
            aria-label={`Average rating ${novel.averageRating.toFixed(1)} out of 5`}
          >
            <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
            {novel.averageRating.toFixed(1)}
          </span>
          <span>{novel.reviewCount} {novel.reviewCount === 1 ? "review" : "reviews"}</span>
          {novel.totalComments > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3.5 text-violet-500" aria-hidden />
              {novel.totalComments}
            </span>
          )}
        </div>

        {novel.communityQuote && (
          <p className="mt-3 line-clamp-2 text-xs italic leading-5 text-slate-600">
            “{novel.communityQuote}”
          </p>
        )}

        <CatalogLink as="span" size="compact" className="mt-auto self-start">
          View novel
        </CatalogLink>
      </div>
    </Link>
  );
}

export function LandingTrending({ novels }: LandingTrendingProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const items = useMemo(() => {
    const unique = new Map<string, TrendingNovelPreview>();
    novels.forEach((novel) => {
      if (!unique.has(novel.novelId)) unique.set(novel.novelId, novel);
    });
    return Array.from(unique.values()).slice(0, 20);
  }, [novels]);

  const updateControls = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    setCanScrollLeft(element.scrollLeft > 4);
    setCanScrollRight(
      element.scrollLeft + element.clientWidth < element.scrollWidth - 4
    );
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    updateControls();
    const observer = new ResizeObserver(updateControls);
    observer.observe(element);
    element.addEventListener("scroll", updateControls, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", updateControls);
    };
  }, [items.length, updateControls]);

  const scroll = (direction: "left" | "right") => {
    const element = scrollRef.current;
    if (!element) return;
    const groupWidth = Math.max(230, element.clientWidth * 0.8);
    element.scrollBy({
      left: direction === "left" ? -groupWidth : groupWidth,
      behavior: "smooth",
    });
  };

  if (items.length === 0) return null;

  return (
    <section className="relative overflow-hidden mv-zone-cream px-4 py-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
      {/* Floating circle motifs */}
      <div className="pointer-events-none absolute left-[6%] top-16 size-24 rounded-full bg-[#f6c85f]/15 mv-float-slow" aria-hidden />
      <div className="pointer-events-none absolute right-[10%] top-28 size-16 rounded-full bg-[#ff7733]/10 mv-float-slower" aria-hidden />
      <div className="pointer-events-none absolute left-[40%] bottom-24 size-10 rounded-full bg-primary/10 mv-float-slow" aria-hidden />
      <FloatingMoon className="absolute -right-10 bottom-16 opacity-40" size={130} float="slower" />

      <div className="relative z-[2] mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[#b65d22]">
              What readers are talking about
            </p>
            <h2 className="mt-2 font-serif text-3xl font-black tracking-tight text-night-blue sm:text-4xl lg:text-5xl">
              Trending now
            </h2>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">
              Web novels gaining attention across the MoonVerse community.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CatalogLink href="/discover">View all</CatalogLink>
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous trending novels"
              disabled={!canScrollLeft}
              className="flex size-11 items-center justify-center rounded-xl border border-violet-200 bg-white text-slate-800 transition-colors hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Next trending novels"
              disabled={!canScrollRight}
              className="flex size-11 items-center justify-center rounded-xl border border-violet-200 bg-white text-slate-800 transition-colors hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="mt-9 flex snap-x snap-mandatory items-start gap-5 overflow-x-auto scroll-smooth pb-5 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden motion-reduce:scroll-auto"
          role="region"
          aria-label="Trending novels"
          tabIndex={0}
        >
          {items.map((novel, index) => (
            <TrendingNovelCard
              key={novel.novelId}
              novel={novel}
              rank={index + 1}
            />
          ))}
        </div>

        {items.length < 5 && (
          <p className="mt-2 text-sm text-slate-500">
            More novels will appear as the community shares new reviews.
          </p>
        )}
      </div>
    </section>
  );
}
