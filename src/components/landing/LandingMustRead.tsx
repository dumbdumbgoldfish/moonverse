"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import type { ReviewListItem } from "@/types/review";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

interface LandingMustReadProps {
  reviews: ReviewListItem[];
}

export function LandingMustRead({ reviews }: LandingMustReadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const items = reviews.slice(0, 20);

  const scroll = (direction: "left" | "right") => {
    const amount = direction === "left" ? -600 : 600;
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <section className="relative overflow-hidden mv-zone-quote py-16 lg:py-24">
      {/* Oversized quotation motifs */}
      <Quote
        className="pointer-events-none absolute -left-4 top-10 size-40 rotate-180 text-primary/[0.06]"
        aria-hidden
      />
      <Quote
        className="pointer-events-none absolute bottom-8 right-4 size-52 text-[#f6c85f]/10"
        aria-hidden
      />

      <div className={cn(SITE_SHELL_CLASS, "relative")}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Editor and reader picks</p>
            <h2 className="mt-2 font-serif text-3xl font-black tracking-tight text-night-blue sm:text-4xl lg:text-5xl">
              Must read
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Highly rated stories worth clearing your schedule for.
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Scroll must read left"
              className="flex size-11 items-center justify-center rounded-full bg-muted text-night-blue transition mv-hover-signup focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Scroll must read right"
              className="flex size-11 items-center justify-center rounded-full bg-muted text-night-blue transition mv-hover-signup focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 scrollbar-hide"
          role="region"
          aria-label="Must read reviews"
          tabIndex={0}
        >
          {items.map((review) => {
            return (
              <Link
                key={review.id}
                href={`/reviews/${review.id}`}
                className="group relative flex w-[340px] shrink-0 snap-start gap-5 rounded-3xl border border-border/60 bg-gradient-to-br from-white to-moon-purple-soft/30 p-5 mv-hover-lift sm:w-[420px]"
              >
                <span className="mv-ribbon" aria-hidden />
                <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-xl shadow-lg sm:w-32">
                  <CoverImage
                    src={review.coverUrl}
                    alt={`Cover of ${review.novelTitle}`}
                    title={review.novelTitle}
                    sizes="128px"
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                    <Star className="size-3 fill-[var(--mv-star-gold)] text-[var(--mv-star-gold)]" aria-hidden />
                    {review.rating}
                  </span>
                  <h3 className="mt-2 line-clamp-1 font-serif text-lg font-bold text-night-blue">
                    {review.novelTitle}
                  </h3>
                  <p className="line-clamp-1 text-xs font-semibold text-primary">{review.genres.slice(0, 2).join(" · ")}</p>

                  <div className="relative mt-3 flex-1">
                    <Quote className="absolute -left-1 -top-1 size-4 text-primary/30" aria-hidden />
                    <p className="line-clamp-4 pl-4 text-sm leading-relaxed text-muted-foreground">
                      {review.excerpt}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-moon-purple-soft text-[10px] font-bold text-primary">
                      {review.reviewerAvatar}
                    </span>
                    <span className="truncate text-xs font-semibold text-night-blue">{review.reviewerName}</span>
                    <span className="ml-auto flex items-center gap-1 text-sm font-black text-[#a9821f]">
                      <Star className="size-3.5 fill-[var(--mv-star-gold)] text-[var(--mv-star-gold)]" aria-hidden />
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
