"use client";

import { useEffect, useRef, useState } from "react";
import { NovelCarouselArrow } from "@/components/novels/NovelCarouselArrow";
import { cn } from "@/lib/utils";

interface ProfilePaginatedCarouselProps<T> {
  items: T[];
  getItemKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  previousLabel: string;
  nextLabel: string;
  regionLabel: string;
  className?: string;
}

export function ProfilePaginatedCarousel<T>({
  items,
  getItemKey,
  renderItem,
  previousLabel,
  nextLabel,
  regionLabel,
  className,
}: ProfilePaginatedCarouselProps<T>) {
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
  }, [items]);

  function scrollByPage(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  return (
    <section aria-label={regionLabel} className={cn("px-4", className)}>
      {items.length > 1 ? (
        <div className="mb-2 flex justify-end gap-2">
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
        </div>
      ) : null}

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 scrollbar-hide scroll-smooth [-webkit-overflow-scrolling:touch]"
      >
        {items.map((item) => (
          <div
            key={getItemKey(item)}
            className="w-full shrink-0 snap-start"
          >
            {renderItem(item)}
          </div>
        ))}
      </div>
    </section>
  );
}
