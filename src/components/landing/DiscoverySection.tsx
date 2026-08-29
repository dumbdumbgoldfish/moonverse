"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import {
  FloatingMoon,
  NightAtmosphere,
} from "@/components/landing/LandingDecor";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/button";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { cn } from "@/lib/utils";
import type { TrendingNovelPreview } from "@/types/discovery";

type DiscoverTab = "trending" | "highest";

interface DiscoverySectionProps {
  trending: TrendingNovelPreview[];
  highest: TrendingNovelPreview[];
}

type DiscoverCard = {
  id: string;
  href: string;
  title: string;
  author: string;
  coverUrl: string;
  genre?: string;
  rating: number;
  reviewCount: number;
  quote?: string;
};

function fromNovel(novel: TrendingNovelPreview): DiscoverCard {
  return {
    id: novel.novelId,
    href: `/novels/${novel.novelId}`,
    title: novel.title,
    author: novel.author,
    coverUrl: novel.coverUrl,
    genre: novel.primaryGenre,
    rating: novel.averageRating,
    reviewCount: novel.reviewCount,
    quote: novel.communityQuote,
  };
}

function ShelfCard({
  item,
  index,
}: {
  item: DiscoverCard;
  index: number;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative w-[148px] shrink-0 snap-start sm:w-[168px] lg:w-[184px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C85F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1024]"
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-xl",
          "border border-white/15 bg-[#1a1033]",
          "shadow-[0_18px_40px_-18px_rgba(0,0,0,0.85),0_0_0_1px_rgba(167,139,250,0.08)]",
          "transition duration-300 ease-out",
          "group-hover:-translate-y-1.5 group-hover:rotate-[-1deg] group-hover:border-[#F6C85F]/45",
          "group-hover:shadow-[0_28px_50px_-16px_rgba(98,70,234,0.55),0_0_32px_-8px_rgba(246,200,95,0.35)]",
          "motion-reduce:transform-none motion-reduce:transition-none"
        )}
      >
          <div className="absolute inset-0 [&_p]:invisible">
            <CoverImage
              src={item.coverUrl}
              alt={`${item.title} cover`}
              title={item.title}
              author={item.author}
              themeSeed={item.id}
              sizes="140px"
              compactFallback
            />
          </div>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1024]/90 via-black/20 to-transparent opacity-90 transition group-hover:opacity-100"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 p-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-bold text-[#F6C85F] backdrop-blur-sm">
            <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
            {item.rating.toFixed(1)}
          </span>
          {item.reviewCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-white/75 backdrop-blur-sm">
              {item.reviewCount}{" "}
              {item.reviewCount === 1 ? "review" : "reviews"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-2 px-0.5">
        {item.genre ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F6C85F]/85">
            {item.genre}
          </p>
        ) : null}
        <h3 className="mt-1 line-clamp-2 font-serif text-sm font-bold leading-snug text-white transition group-hover:text-[#F6C85F]">
          {item.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-white/45">
          {item.author}
        </p>
      </div>
    </Link>
  );
}

function FeaturedSpotlight({ item }: { item: DiscoverCard }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.09] via-white/[0.03] to-transparent p-4 shadow-[0_20px_48px_-32px_rgba(98,70,234,0.65)] backdrop-blur-md">
      <div
        className="pointer-events-none absolute -left-16 top-1/2 size-56 -translate-y-1/2 rounded-full bg-[#6246ea]/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 bottom-0 size-44 rounded-full bg-[#F6C85F]/15 blur-3xl"
        aria-hidden
      />

      <div className="relative grid items-center gap-5 sm:grid-cols-[140px_1fr] lg:grid-cols-[168px_1fr] lg:gap-7">
        <Link
          href={item.href}
          className={cn(
            "group relative mx-auto block aspect-[2/3] w-[128px] overflow-hidden rounded-xl sm:mx-0 sm:w-full",
            "border border-white/20 shadow-[0_18px_36px_-18px_rgba(0,0,0,0.9)]",
            "transition duration-300 hover:-translate-y-1 hover:border-[#F6C85F]/50",
            "motion-reduce:transform-none motion-reduce:transition-none"
          )}
        >
          <div className="absolute inset-0 [&_p]:invisible">
            <CoverImage
              src={item.coverUrl}
              alt={`${item.title} cover`}
              title={item.title}
              author={item.author}
              themeSeed={item.id}
              sizes="168px"
              compactFallback
            />
          </div>
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"
            aria-hidden
          />
        </Link>

        <div className="min-w-0 text-center sm:text-left">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F6C85F]">
            Tonight&apos;s spotlight
            {item.genre ? (
              <>
                <span className="text-white/25" aria-hidden>
                  ·
                </span>
                <span className="text-white/55">{item.genre}</span>
              </>
            ) : null}
          </p>
          <h3 className="mt-2 font-serif text-2xl font-black tracking-tight text-white sm:text-[1.75rem]">
            <Link
              href={item.href}
              className="transition hover:text-[#F6C85F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C85F]"
            >
              {item.title}
            </Link>
          </h3>
          <p className="mt-1.5 text-sm text-white/50">by {item.author}</p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F6C85F]/30 bg-[#F6C85F]/12 px-3 py-1 text-sm font-bold text-[#F6C85F]">
              <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
              {item.rating.toFixed(1)}
            </span>
            {item.reviewCount > 0 ? (
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-semibold text-white/70">
                {item.reviewCount}{" "}
                {item.reviewCount === 1 ? "review" : "reviews"}
              </span>
            ) : null}
          </div>

          {item.quote ? (
            <blockquote className="mt-3 border-l-2 border-[#F6C85F]/50 pl-3 text-left">
              <p className="line-clamp-3 font-serif text-sm leading-relaxed text-white/75">
                <span className="text-[#F6C85F]/80" aria-hidden>
                  “
                </span>
                {item.quote}
                <span className="text-[#F6C85F]/80" aria-hidden>
                  ”
                </span>
              </p>
            </blockquote>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Button
              size="lg"
              className="mv-nav-signup h-9 rounded-full border-0 px-4 text-sm font-bold text-white"
              render={<Link href={item.href} />}
            >
              Open novel
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function DiscoverySection({
  trending,
  highest,
}: DiscoverySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<DiscoverTab | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const trendingCards = useMemo(
    () => trending.map(fromNovel),
    [trending]
  );

  const highestCards = useMemo(
    () => highest.map(fromNovel),
    [highest]
  );

  const activeTab: DiscoverTab =
    tab ?? (trendingCards.length > 0 ? "trending" : "highest");
  const cards = activeTab === "trending" ? trendingCards : highestCards;
  const featured = cards[0];
  const shelfCards = cards.slice(1);
  const hasTabs = trendingCards.length > 0 || highestCards.length > 0;

  const updateControls = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    updateControls();
    const observer = new ResizeObserver(updateControls);
    observer.observe(el);
    el.addEventListener("scroll", updateControls, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateControls);
    };
  }, [activeTab, shelfCards.length, updateControls]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: dir === "left" ? -el.clientWidth * 0.75 : el.clientWidth * 0.75,
      behavior: prefersReduced ? "auto" : "smooth",
    });
  };

  const onShelfKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = prefersReduced ? "auto" : "smooth";

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scroll("left");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      scroll("right");
    } else if (event.key === "Home") {
      event.preventDefault();
      el.scrollTo({ left: 0, behavior });
    } else if (event.key === "End") {
      event.preventDefault();
      el.scrollTo({ left: el.scrollWidth, behavior });
    }
  };

  if (!hasTabs || !featured) return null;

  return (
    <section id="shelves" className="mv-land text-white">
      <NightAtmosphere intensity="rich" />
      <FloatingMoon
        size={96}
        className="absolute right-[-12px] top-6 opacity-18 sm:right-8"
        float="slower"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[42%] h-40 w-[90%] -translate-x-1/2 rounded-[100%] bg-[#6246ea]/20 blur-3xl"
        aria-hidden
      />

      <div className="mv-land-shell relative z-[2]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F6C85F]/90">
              On the shelves tonight
            </p>
            <h2 className="mv-land-title text-white">
              Discover what readers are loving
            </h2>
            <p className="mv-land-copy text-white/60">
              Live catalogue titles, ranked by community reviews. MoonVerse
              does not host novel text.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CatalogLink href="/browse" tone="night" size="compact">
                Open the catalogue
              </CatalogLink>
              <CatalogLink href="/#voices" tone="night" size="compact">
                Read community voices
              </CatalogLink>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-white/15 bg-black/25 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
              {trendingCards.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setTab("trending")}
                  className={cn(
                    "h-8 rounded-full px-3 text-xs font-semibold transition",
                    activeTab === "trending"
                      ? "bg-[#F6C85F] text-[#1a1033] shadow-sm"
                      : "text-white/70 hover:text-white"
                  )}
                  aria-pressed={activeTab === "trending"}
                >
                  Trending
                </button>
              ) : null}
              {highestCards.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setTab("highest")}
                  className={cn(
                    "h-8 rounded-full px-3 text-xs font-semibold transition",
                    activeTab === "highest"
                      ? "bg-[#F6C85F] text-[#1a1033] shadow-sm"
                      : "text-white/70 hover:text-white"
                  )}
                  aria-pressed={activeTab === "highest"}
                >
                  Highest rated
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <FeaturedSpotlight item={featured} />
        </div>

        {shelfCards.length > 0 ? (
          <div className="relative mt-6">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                More on this shelf
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scroll("left")}
                  disabled={!canLeft}
                  aria-label="Show previous novels"
                  aria-controls="landing-discover-shelf"
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white",
                    "transition hover:border-[#F6C85F]/40 hover:bg-white/10",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C85F]",
                    "disabled:pointer-events-none disabled:opacity-35"
                  )}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => scroll("right")}
                  disabled={!canRight}
                  aria-label="Show next novels"
                  aria-controls="landing-discover-shelf"
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white",
                    "transition hover:border-[#F6C85F]/40 hover:bg-white/10",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C85F]",
                    "disabled:pointer-events-none disabled:opacity-35"
                  )}
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            </div>

            <div className="relative">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-[#0b1024] to-transparent sm:w-14"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-[#0b1024] to-transparent sm:w-14"
                aria-hidden
              />

              <div
                id="landing-discover-shelf"
                ref={scrollRef}
                className={cn(
                  "flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-4 pt-1.5",
                  "scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                  "motion-reduce:scroll-auto"
                )}
                role="region"
                aria-label="More novels on this shelf. Use arrow keys to scroll."
                tabIndex={0}
                onKeyDown={onShelfKeyDown}
              >
                {shelfCards.map((item, index) => (
                  <ShelfCard
                    key={`${activeTab}-${item.id}`}
                    item={item}
                    index={index}
                  />
                ))}
              </div>

              {/* Luminous shelf ledge */}
              <div className="pointer-events-none relative -mt-4 px-2" aria-hidden>
                <div className="h-px bg-gradient-to-r from-transparent via-[#F6C85F]/55 to-transparent" />
                <div className="mx-auto mt-0 h-5 w-[88%] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(246,200,95,0.28),rgba(98,70,234,0.18)_45%,transparent_70%)] blur-md" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
