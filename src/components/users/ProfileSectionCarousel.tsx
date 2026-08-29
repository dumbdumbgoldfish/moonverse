"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { NovelCarouselArrow } from "@/components/novels/NovelCarouselArrow";
import {
  PROFILE_CAROUSEL_CARDS_PER_VIEW,
  PROFILE_SECTION_HEADER_CLASS,
  PROFILE_SECTION_TITLE_CLASS,
  profileCarouselCardWidthClass,
} from "@/components/users/profile-carousel-layout";
import { cn } from "@/lib/utils";

export type ProfileSectionSortOrder = "newest" | "oldest";

export interface ProfileSectionCardsPerView {
  mobile?: number;
  tablet?: number;
  desktop?: number;
}

const DEFAULT_CARDS_PER_VIEW: Required<ProfileSectionCardsPerView> =
  PROFILE_CAROUSEL_CARDS_PER_VIEW;

function useCardsPerView(config: ProfileSectionCardsPerView = {}) {
  const mobile = config.mobile ?? DEFAULT_CARDS_PER_VIEW.mobile;
  const tablet = config.tablet ?? DEFAULT_CARDS_PER_VIEW.tablet;
  const desktop = config.desktop ?? DEFAULT_CARDS_PER_VIEW.desktop;
  const [cardsPerView, setCardsPerView] = useState(desktop);

  useEffect(() => {
    function update() {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setCardsPerView(desktop);
      } else if (window.matchMedia("(min-width: 640px)").matches) {
        setCardsPerView(tablet);
      } else {
        setCardsPerView(mobile);
      }
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [desktop, mobile, tablet]);

  return cardsPerView;
}

function gridColsClass(cardsPerView: number) {
  const cols = Math.max(1, Math.min(6, cardsPerView));
  return (
    {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    } as const
  )[cols];
}

const EXTENDED_SCROLL_CARD_WIDTH_CLASS: Record<number, string> = {
  4: "w-[calc((100%-3rem)/4)] min-w-[calc((100%-3rem)/4)] max-w-[calc((100%-3rem)/4)]",
  5: "w-[calc((100%-4rem)/5)] min-w-[calc((100%-4rem)/5)] max-w-[calc((100%-4rem)/5)]",
  6: "w-[calc((100%-5rem)/6)] min-w-[calc((100%-5rem)/6)] max-w-[calc((100%-5rem)/6)]",
};

function scrollCardWidthClass(cardsPerView: number) {
  if (cardsPerView <= 3) {
    return profileCarouselCardWidthClass(cardsPerView);
  }
  return (
    EXTENDED_SCROLL_CARD_WIDTH_CLASS[Math.max(4, Math.min(6, cardsPerView))] ??
    EXTENDED_SCROLL_CARD_WIDTH_CLASS[6]!
  );
}

export function ProfileSectionSortToggle({
  value,
  onChange,
  label = "Sort items",
}: {
  value: ProfileSectionSortOrder;
  onChange: (value: ProfileSectionSortOrder) => void;
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-full border border-violet-100 bg-[#FFFBFF] p-0.5"
    >
      {(
        [
          { id: "newest" as const, label: "Newest" },
          { id: "oldest" as const, label: "Oldest" },
        ] as const
      ).map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
            value === option.id
              ? "bg-[#FFF8E8] text-[#8A6520] ring-1 ring-[#C89B4A]/40"
              : "text-muted-foreground hover:text-[#1A1224]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface ProfileSectionCarouselProps<T> {
  title: string;
  subtitle?: string;
  ariaLabel: string;
  items: T[];
  getItemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  sortControl?: ReactNode;
  previousLabel?: string;
  nextLabel?: string;
  cardsPerView?: ProfileSectionCardsPerView;
}

export function ProfileSectionCarousel<T>({
  title,
  subtitle,
  ariaLabel,
  items,
  getItemKey,
  renderItem,
  sortControl,
  previousLabel = "Show previous items",
  nextLabel = "Show next items",
  cardsPerView: cardsPerViewConfig,
}: ProfileSectionCarouselProps<T>) {
  const cardsPerView = useCardsPerView(cardsPerViewConfig);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  function updateArrows() {
    const node = scrollerRef.current;
    if (!node) return;
    const maxScroll = node.scrollWidth - node.clientWidth;
    setCanPrev(node.scrollLeft > 8);
    setCanNext(maxScroll > 8 && node.scrollLeft < maxScroll - 8);
  }

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollLeft = 0;
    updateArrows();
    const onScroll = () => updateArrows();
    node.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(() => updateArrows());
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [items, cardsPerView]);

  function scrollByPage(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth, behavior: "smooth" });
  }

  const showArrows = items.length > cardsPerView;
  const fitsOnePage = items.length <= cardsPerView;

  return (
    <section aria-label={ariaLabel} className="overflow-visible px-4">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3",
          PROFILE_SECTION_HEADER_CLASS
        )}
      >
        <div className="min-w-0">
          <h2 className={PROFILE_SECTION_TITLE_CLASS}>{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-[#1A1224]/55">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sortControl}
          {showArrows ? (
            <>
              <NovelCarouselArrow
                direction="prev"
                disabled={!canPrev}
                onClick={() => scrollByPage(-1)}
                label={previousLabel}
              />
              <NovelCarouselArrow
                direction="next"
                disabled={!canNext}
                onClick={() => scrollByPage(1)}
                label={nextLabel}
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="px-1.5 py-1">
        <div
          ref={scrollerRef}
          className={cn(
            fitsOnePage
              ? cn("grid gap-4 py-2", gridColsClass(cardsPerView))
              : cn(
                  "flex items-start gap-4 overflow-x-auto overscroll-x-contain py-2 scrollbar-hide",
                  "snap-x snap-mandatory scroll-smooth",
                  "[-webkit-overflow-scrolling:touch]"
                )
          )}
        >
          {items.map((item) => (
            <div
              key={getItemKey(item)}
              className={cn(
                fitsOnePage ? "min-w-0" : "shrink-0 snap-start",
                !fitsOnePage && scrollCardWidthClass(cardsPerView)
              )}
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
