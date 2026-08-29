"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Library,
  Sparkles,
  Star,
} from "lucide-react";
import {
  FloatingMoon,
  Starfield,
  TwoToneCurve,
} from "@/components/landing/LandingDecor";
import { DefaultNovelCover } from "@/components/novels/DefaultNovelCover";
import { isMissingCoverUrl, canUseNextImageCover, shouldSkipCoverOptimizer } from "@/lib/review-utils";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { cn } from "@/lib/utils";
import type { ReadingListPreview, TrendingNovelPreview } from "@/types/discovery";
import type { ReviewListItem } from "@/types/review";

type DiscoverLane = "trending" | "must-read" | "shelves";

interface LandingDiscoverRailProps {
  novels: TrendingNovelPreview[];
  mustRead: ReviewListItem[];
  readingLists: ReadingListPreview[];
}

type RailItem = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  meta?: string;
  quote?: string;
};

function novelToRail(novel: TrendingNovelPreview): RailItem {
  return {
    id: novel.novelId,
    href: `/novels/${novel.novelId}`,
    title: novel.title,
    subtitle: novel.author,
    coverUrl: novel.coverUrl,
    meta: `${novel.averageRating.toFixed(1)} · ${novel.reviewCount} reviews`,
    quote: novel.communityQuote,
  };
}

function reviewToRail(review: ReviewListItem): RailItem {
  return {
    id: review.novelId,
    href: `/novels/${review.novelId}`,
    title: review.novelTitle,
    subtitle: review.novelAuthor || review.reviewerName,
    coverUrl: review.coverUrl,
    meta: `★ ${review.rating} · ${review.reviewerName}`,
    quote: review.excerpt,
  };
}

function CoverArt({
  item,
  priority,
  className,
}: {
  item: RailItem;
  priority: boolean;
  className?: string;
}) {
  const useFallback = isMissingCoverUrl(item.coverUrl);

  return (
    <div className={cn("relative overflow-hidden bg-[#1e1636]", className)}>
      {useFallback ? (
        <DefaultNovelCover
          title={item.title}
          author={item.subtitle}
          themeSeed={item.id}
          className="absolute inset-0"
        />
      ) : canUseNextImageCover(item.coverUrl) ? (
        <Image
          src={item.coverUrl}
          alt=""
          fill
          sizes="280px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          priority={priority}
          unoptimized={shouldSkipCoverOptimizer(item.coverUrl)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- host not in next/image allowlist
        <img
          src={item.coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          loading={priority ? "eager" : "lazy"}
        />
      )}
    </div>
  );
}

function OrbitNovelCard({
  item,
  index,
  showHot,
}: {
  item: RailItem;
  index: number;
  showHot: boolean;
}) {
  const featured = index === 0;
  const brandedFallback = isMissingCoverUrl(item.coverUrl);
  const tilt =
    index % 3 === 0 ? "-rotate-[2.5deg]" : index % 3 === 1 ? "rotate-[2deg]" : "rotate-[-1deg]";

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative shrink-0 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C85F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1024]",
        featured ? "w-[240px] sm:w-[280px]" : "w-[170px] sm:w-[190px]",
        index % 2 === 0 ? "lg:mt-2" : "lg:mt-10"
      )}
    >
      {/* Glow under the floating cover */}
      <span
        className="pointer-events-none absolute -bottom-2 left-1/2 h-8 w-4/5 -translate-x-1/2 rounded-full bg-[#6246ea]/35 blur-xl transition group-hover:bg-[#F6C85F]/35"
        aria-hidden
      />

      <div
        className={cn(
          "relative overflow-hidden shadow-[0_28px_50px_-20px_rgba(0,0,0,0.75)] ring-1 ring-white/20 transition duration-500",
          "group-hover:-translate-y-2 group-hover:ring-[#F6C85F]/45",
          "motion-reduce:transition-none motion-reduce:group-hover:translate-y-0",
          featured ? "mv-curve-panel aspect-[3/4]" : "mv-curve-tile aspect-[2/3]",
          tilt
        )}
      >
        <CoverArt
          item={item}
          priority={index < 4}
          className="absolute inset-0"
        />

        {!brandedFallback ? (
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_10%,rgba(246,200,95,0.18),transparent_45%),linear-gradient(180deg,transparent_35%,rgba(11,16,36,0.88)_100%)]"
            aria-hidden
          />
        ) : null}

        {showHot ? (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#F6C85F] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#1a1033] shadow-lg">
            <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
            Hot
          </span>
        ) : null}

        {!brandedFallback ? (
          <div className="absolute inset-x-0 bottom-0 z-10 p-3.5 sm:p-4">
            <h3
              className={cn(
                "line-clamp-2 font-serif font-bold leading-snug text-white drop-shadow",
                featured ? "text-xl sm:text-2xl" : "text-base"
              )}
            >
              {item.title}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs text-white/70">{item.subtitle}</p>
            {item.meta ? (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-semibold text-[#F6C85F] backdrop-blur-sm">
                <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
                {item.meta}
              </p>
            ) : null}
            {featured && item.quote ? (
              <p className="mt-2 line-clamp-2 text-xs italic text-white/65">
                “{item.quote}”
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function ShelfCard({ list }: { list: ReadingListPreview }) {
  const covers = list.coverUrls.filter((url) => !isMissingCoverUrl(url)).slice(0, 3);
  const href = list.href ?? `/folders/${list.id}`;

  return (
    <Link
      href={href}
      className="mv-curve-panel-alt group relative w-[230px] shrink-0 snap-start border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-4 text-white shadow-[0_24px_48px_-24px_rgba(0,0,0,0.7)] transition hover:-translate-y-1 hover:border-[#F6C85F]/35 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C85F]"
    >
      <span
        className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full bg-[#6246ea]/25 blur-2xl"
        aria-hidden
      />
      <div className="relative mx-auto h-36 w-[9.5rem]">
        {covers.length === 0 ? (
          <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_20%,#8b7cf7,#1e1636)]" />
        ) : (
          covers.map((url, index) => (
            <div
              key={`${list.id}-${url}-${index}`}
              className="absolute aspect-[2/3] w-[4.5rem] overflow-hidden rounded-lg border border-white/25 shadow-lg"
              style={{
                left: `${index * 28}px`,
                top: `${12 - index * 4}px`,
                zIndex: covers.length - index,
                transform: `rotate(${(index - 1) * 6}deg)`,
              }}
            >
              {canUseNextImageCover(url) ? (
                <Image src={url} alt="" fill className="object-cover" sizes="72px" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- host not in next/image allowlist
                <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
            </div>
          ))
        )}
      </div>
      <p className="mt-3 line-clamp-2 font-serif text-base font-bold">{list.name}</p>
      <p className="mt-1 text-xs text-white/55">
        {list.reviewCount} stories · {list.ownerName}
      </p>
    </Link>
  );
}

function OrbitGuides() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1400 220"
      className="pointer-events-none absolute inset-x-0 top-24 hidden h-48 w-full lg:block"
      fill="none"
    >
      <path
        d="M40,140 C260,40 520,200 760,90 C980,0 1180,160 1380,80"
        stroke="#F6C85F"
        strokeOpacity="0.28"
        strokeWidth="1.5"
        strokeDasharray="4 10"
      />
      <path
        d="M20,180 C300,100 560,210 840,130 C1080,60 1240,190 1400,120"
        stroke="#8b7cf7"
        strokeOpacity="0.25"
        strokeWidth="1.5"
        strokeDasharray="3 9"
      />
    </svg>
  );
}

export function LandingDiscoverRail({
  novels,
  mustRead,
  readingLists,
}: LandingDiscoverRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lane, setLane] = useState<DiscoverLane | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const trendingItems = useMemo(() => {
    const unique = new Map<string, TrendingNovelPreview>();
    novels.forEach((novel) => {
      if (!unique.has(novel.novelId)) unique.set(novel.novelId, novel);
    });
    return Array.from(unique.values()).slice(0, 16).map(novelToRail);
  }, [novels]);

  const mustReadItems = useMemo(() => {
    const unique = new Map<string, ReviewListItem>();
    mustRead.forEach((review) => {
      if (!unique.has(review.novelId)) unique.set(review.novelId, review);
    });
    return Array.from(unique.values()).slice(0, 16).map(reviewToRail);
  }, [mustRead]);

  const lanes = useMemo(() => {
    const available: { id: DiscoverLane; label: string; icon: typeof Star }[] = [];
    if (trendingItems.length > 0) {
      available.push({ id: "trending", label: "Trending", icon: Star });
    }
    if (mustReadItems.length > 0) {
      available.push({ id: "must-read", label: "Must read", icon: Sparkles });
    }
    if (readingLists.length > 0) {
      available.push({ id: "shelves", label: "Shelves", icon: Library });
    }
    return available;
  }, [trendingItems.length, mustReadItems.length, readingLists.length]);

  const activeLane: DiscoverLane =
    lane && lanes.some((item) => item.id === lane)
      ? lane
      : (lanes[0]?.id ?? "trending");

  const railItems =
    activeLane === "must-read"
      ? mustReadItems
      : activeLane === "trending"
        ? trendingItems
        : [];

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
    element.scrollTo({ left: 0 });
    updateControls();
    const observer = new ResizeObserver(updateControls);
    observer.observe(element);
    element.addEventListener("scroll", updateControls, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", updateControls);
    };
  }, [activeLane, railItems.length, readingLists.length, updateControls]);

  const scroll = (direction: "left" | "right") => {
    const element = scrollRef.current;
    if (!element) return;
    const groupWidth = Math.max(260, element.clientWidth * 0.72);
    element.scrollBy({
      left: direction === "left" ? -groupWidth : groupWidth,
      behavior: "smooth",
    });
  };

  if (lanes.length === 0) return null;

  const copy =
    activeLane === "shelves"
      ? {
          eyebrow: "Curated constellations",
          title: "Shelves among the stars",
          body: "Reading lists gathered by people who live for the next chapter.",
        }
      : activeLane === "must-read"
        ? {
            eyebrow: "Highest rated",
            title: "Must-read tonight",
            body: "Stories the community keeps recommending when nothing else will do.",
          }
        : {
            eyebrow: "Live from the community",
            title: "Discover the orbit",
            body: "Web novels gaining attention across MoonVerse right now.",
          };

  return (
    <section className="relative overflow-hidden px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
      <TwoToneCurve pair="night-gold" shape="scoop" glow="gold" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_15%_20%,rgba(98,70,234,0.32),transparent_50%),radial-gradient(55%_45%_at_90%_80%,rgba(246,200,95,0.14),transparent_45%)]"
        aria-hidden
      />
      <Starfield accents={6} />
      <FloatingMoon
        className="absolute -right-10 top-8 opacity-35"
        size={150}
        float="slower"
        shape="crescent"
        color="#F6C85F"
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 size-[22rem] mv-blob-2 bg-[#6246ea]/22 blur-3xl"
        aria-hidden
      />

      <div className="relative z-[2] mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F6C85F]/90">
              <Sparkles className="size-3.5" aria-hidden />
              {copy.eyebrow}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-black tracking-tight sm:text-4xl lg:text-[2.75rem]">
              {copy.title}
            </h2>
            <p className="mt-3 max-w-xl text-base text-white/60 sm:text-lg">{copy.body}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 flex rounded-full border border-white/15 bg-black/20 p-1 backdrop-blur-sm">
              {lanes.map((item) => {
                const Icon = item.icon;
                const active = activeLane === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLane(item.id)}
                    className={cn(
                      "inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition",
                      active
                        ? "bg-[#F6C85F] text-[#1a1033] shadow-[0_0_20px_rgba(246,200,95,0.35)]"
                        : "text-white/70 hover:text-white"
                    )}
                    aria-pressed={active}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <CatalogLink href="/discover" tone="night" size="compact">
              View all
            </CatalogLink>
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous"
              disabled={!canScrollLeft}
              className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:border-[#F6C85F]/40 hover:bg-white/10 disabled:opacity-35"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Next"
              disabled={!canScrollRight}
              className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:border-[#F6C85F]/40 hover:bg-white/10 disabled:opacity-35"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="relative mt-10">
          <OrbitGuides />
          <div
            ref={scrollRef}
            className="relative flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-8 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden motion-reduce:scroll-auto"
            role="region"
            aria-label={copy.title}
            tabIndex={0}
          >
          {activeLane === "shelves"
            ? readingLists.slice(0, 10).map((list) => (
                <ShelfCard key={list.id} list={list} />
              ))
            : railItems.map((item, index) => (
                  <OrbitNovelCard
                    key={item.id}
                    item={item}
                    index={index}
                    showHot={index < 3 && activeLane === "trending"}
                  />
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
