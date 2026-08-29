"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { cn } from "@/lib/utils";
import type { SearchWorkHit } from "@/types/search";

interface SearchHeroMatchesProps {
  works: SearchWorkHit[];
  onPreview?: (work: SearchWorkHit) => void;
  className?: string;
}

export function SearchHeroMatches({
  works,
  onPreview,
  className,
}: SearchHeroMatchesProps) {
  if (works.length === 0) return null;

  return (
    <section className={cn("space-y-3", className)} aria-label="Best matches">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E46C7]">
            Best matches
          </p>
          <h2 className="font-serif text-xl font-medium tracking-tight text-[#1A1224]">
            Top catalogue hits
          </h2>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
        {works.map((work, index) => {
          const score = work.averageRating
            ? work.averageRating.toFixed(1)
            : null;
          return (
            <article
              key={work.id}
              className="group w-[148px] shrink-0 snap-start sm:w-[164px]"
            >
              <div className="relative overflow-hidden rounded-2xl bg-[#1A1224]/5 shadow-[0_16px_32px_-20px_rgba(26,18,36,0.35)] ring-1 ring-[#1A1224]/10 transition-transform duration-200 group-hover:-translate-y-0.5">
                <Link
                  href={`/novels/${work.id}`}
                  className="relative block aspect-[2/3] w-full"
                  aria-label={`Open ${work.title}`}
                >
                  <CoverImage
                    src={work.coverUrl}
                    alt=""
                    title={work.title}
                    author={work.author}
                    themeSeed={work.id}
                    sizes="164px"
                    priority={index < 3}
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0818]/85 via-[#0B0818]/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <p className="line-clamp-2 font-serif text-[14px] font-semibold leading-snug">
                      {work.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-white/75">
                      {work.author}
                    </p>
                  </div>
                </Link>
                {onPreview ? (
                  <button
                    type="button"
                    onClick={() => onPreview(work)}
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6E46C7] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    Peek
                  </button>
                ) : null}
              </div>
              <div className="mt-2 space-y-1 px-0.5">
                {score ? (
                  <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1A1224]">
                    <Star
                      className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]"
                      aria-hidden
                    />
                    {score}
                  </p>
                ) : null}
                <p className="line-clamp-2 text-[11px] leading-snug text-[#6E46C7]">
                  {work.matchReason}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
