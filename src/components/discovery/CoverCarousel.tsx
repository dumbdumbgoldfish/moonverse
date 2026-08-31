"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoverCarouselProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  accentClass?: string;
}

export function CoverCarousel({
  title,
  subtitle,
  action,
  children,
  className,
  icon: Icon,
  accentClass = "text-primary",
}: CoverCarouselProps) {
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
  }, [children]);

  function scrollByDirection(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = Math.max(240, Math.floor(node.clientWidth * 0.75));
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  const scroller = (
    <div className="relative md:px-10">
      <div
        ref={scrollerRef}
        className="flex gap-3.5 overflow-x-auto overscroll-x-contain pb-1 scrollbar-hide snap-x snap-mandatory"
      >
        {children}
      </div>

      <button
        type="button"
        aria-label="Scroll left"
        disabled={!canPrev}
        onClick={() => scrollByDirection(-1)}
        className="absolute left-0 top-[38%] z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#1a1233] shadow-md transition fine-hover:border-violet-200 fine-hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:inline-flex disabled:opacity-40"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        disabled={!canNext}
        onClick={() => scrollByDirection(1)}
        className="absolute right-0 top-[38%] z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#1a1233] shadow-md transition fine-hover:border-violet-200 fine-hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:inline-flex disabled:opacity-40"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </div>
  );

  if (!title && !subtitle) {
    return <section className={cn("py-2", className)}>{scroller}</section>;
  }

  return (
    <section className={cn("py-1", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {subtitle ? (
            <p className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-[#8A8494]">
              {Icon ? (
                <Icon
                  className={cn("size-3.5 shrink-0", accentClass)}
                  aria-hidden
                />
              ) : null}
              <span className="truncate">{subtitle}</span>
            </p>
          ) : null}
          <h2 className="truncate text-[1.55rem] font-bold leading-tight tracking-tight text-[#171329] sm:text-[1.75rem]">
            {title}
          </h2>
        </div>
        {action ? <div className="shrink-0 pb-0.5">{action}</div> : null}
      </div>
      {scroller}
    </section>
  );
}
