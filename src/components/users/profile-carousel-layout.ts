"use client";

import { useEffect, useState } from "react";

export const PROFILE_CAROUSEL_CARDS_PER_VIEW = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
} as const;

/** Profile tab section heading — matches Reading Lists shelf header. */
export const PROFILE_SECTION_TITLE_CLASS =
  "font-serif text-2xl font-bold text-[#1A1224]";

export const PROFILE_SECTION_HEADER_CLASS = "mb-6";

export function profileSectionByLabel(
  displayName: string,
  isOwnProfile: boolean
) {
  return isOwnProfile ? "you" : displayName;
}

/** Placeholder height for shelf load-more sentinel (not applied to cards). */
export const PROFILE_CAROUSEL_LOAD_MORE_MIN_HEIGHT = "min-h-[12rem]";

export const PROFILE_CAROUSEL_CARD_WIDTH_CLASS: Record<number, string> = {
  1: "w-full",
  2: "w-[calc((100%-1rem)/2)] min-w-[calc((100%-1rem)/2)] max-w-[calc((100%-1rem)/2)]",
  3: "w-[calc((100%-2rem)/3)] min-w-[calc((100%-2rem)/3)] max-w-[calc((100%-2rem)/3)]",
};

export const PROFILE_CAROUSEL_SHELL_CLASS =
  "group flex flex-col overflow-hidden rounded-[22px] border border-violet-100/90 bg-white shadow-[0_8px_28px_-14px_rgba(98,70,234,0.22)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_40px_-16px_rgba(98,70,234,0.32)] focus-within:ring-2 focus-within:ring-primary/35 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

export const PROFILE_CAROUSEL_INNER_CLASS = "flex flex-row gap-4 p-4";

export const PROFILE_CAROUSEL_COVER_CLASS =
  "relative h-[9rem] w-[6rem] shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-muted shadow-[0_8px_20px_-8px_rgba(26,16,51,0.35)] transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100";

export const PROFILE_CAROUSEL_CONTENT_CLASS =
  "flex min-h-0 min-w-0 flex-1 flex-col gap-2.5";

export const PROFILE_CAROUSEL_FOOTER_CLASS =
  "mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-violet-50 pt-2.5";

export const PROFILE_CAROUSEL_CTA_CLASS =
  "inline-flex h-9 min-h-9 items-center gap-1 rounded-full bg-primary/10 px-3.5 text-xs font-bold text-primary transition-colors mv-hover-signup focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function profileCarouselCardWidthClass(cardsPerView: number) {
  return (
    PROFILE_CAROUSEL_CARD_WIDTH_CLASS[
      Math.max(1, Math.min(3, cardsPerView))
    ] ?? PROFILE_CAROUSEL_CARD_WIDTH_CLASS[3]!
  );
}

export function useProfileCarouselCardsPerView() {
  const [cardsPerView, setCardsPerView] = useState<number>(
    PROFILE_CAROUSEL_CARDS_PER_VIEW.desktop
  );

  useEffect(() => {
    function update() {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setCardsPerView(PROFILE_CAROUSEL_CARDS_PER_VIEW.desktop);
      } else if (window.matchMedia("(min-width: 640px)").matches) {
        setCardsPerView(PROFILE_CAROUSEL_CARDS_PER_VIEW.tablet);
      } else {
        setCardsPerView(PROFILE_CAROUSEL_CARDS_PER_VIEW.mobile);
      }
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return cardsPerView;
}
