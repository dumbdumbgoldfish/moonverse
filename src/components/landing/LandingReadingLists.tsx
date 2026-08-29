import Link from "next/link";
import Image from "next/image";
import { Layers, Quote, Star } from "lucide-react";
import { FloatingMoon } from "@/components/landing/LandingDecor";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { isMissingCoverUrl, shouldSkipCoverOptimizer } from "@/lib/review-utils";
import type { ReadingListPreview } from "@/types/discovery";
import { cn } from "@/lib/utils";

interface LandingReadingListsProps {
  lists: ReadingListPreview[];
}

function ShelfCover({
  url,
  title,
  index,
}: {
  url: string;
  title?: string;
  index: number;
}) {
  const isPlaceholder = isMissingCoverUrl(url);

  return (
    <div
      className="absolute left-1/2 top-0 aspect-[2/3] w-[88px] overflow-hidden rounded-xl border-2 border-white shadow-lg transition-transform duration-300 group-hover:-translate-y-1 sm:w-24"
      style={{
        transform: `translateX(calc(-50% + ${(index - 1) * 40}px)) rotate(${(index - 1) * 6}deg)`,
        zIndex: index + 1,
      }}
    >
      {isPlaceholder ? (
        <div className="flex h-full flex-col justify-between bg-gradient-to-br from-[#1e1636] via-[#3a2b6b] to-[#6246ea] p-2">
          <span className="text-[7px] font-black uppercase tracking-wider text-white/50">
            MV
          </span>
          <p className="line-clamp-4 font-serif text-[9px] font-bold leading-tight text-white">
            {title ?? "MoonVerse"}
          </p>
        </div>
      ) : (
        <Image
          src={url}
          alt={title ? `Cover of ${title}` : ""}
          fill
          className="object-cover"
          sizes="96px"
          loading="lazy"
          unoptimized={shouldSkipCoverOptimizer(url)}
        />
      )}
    </div>
  );
}

function ReadingListCard({ list }: { list: ReadingListPreview }) {
  const href = list.href ?? `/folders/${list.id}`;
  const covers = list.coverUrls.slice(0, 3);
  const titles = list.novelTitles ?? [];

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-violet-100/80 bg-white p-5 shadow-[0_16px_40px_-28px_rgba(76,29,149,0.35)]",
        "transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "motion-reduce:transform-none"
      )}
    >
      <div className="relative mx-auto h-36 w-full sm:h-40">
        {covers.map((url, index) => (
          <ShelfCover
            key={`${list.id}-${url}-${index}`}
            url={url}
            title={titles[index]}
            index={index}
          />
        ))}
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
          {list.curatorLabel ?? `by @${list.ownerUsername}`}
        </p>
        <h3 className="mt-1.5 text-lg font-black leading-snug text-night-blue transition-colors group-hover:text-violet-700">
          {list.name}
        </h3>
        {list.description && (
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {list.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5 text-violet-500" aria-hidden />
            {list.reviewCount} {list.reviewCount === 1 ? "story" : "stories"}
          </span>
          {typeof list.averageRating === "number" && list.averageRating > 0 && (
            <span className="inline-flex items-center gap-1 text-[#8f711e]">
              <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
              {list.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        {list.highlightQuote && (
          <blockquote className="mt-4 rounded-2xl border border-violet-50 bg-violet-50/60 px-3 py-2.5">
            <p className="line-clamp-2 text-xs italic leading-5 text-slate-600">
              <Quote
                className="mr-1 inline size-3 -translate-y-0.5 text-violet-400"
                aria-hidden
              />
              {list.highlightQuote}
            </p>
            {list.highlightReviewer && (
              <footer className="mt-1.5 text-[11px] font-semibold text-slate-500">
                · {list.highlightReviewer}
              </footer>
            )}
          </blockquote>
        )}

        <CatalogLink as="span" size="compact" className="mt-auto self-start">
          Open shelf
        </CatalogLink>
      </div>
    </Link>
  );
}

export function LandingReadingLists({ lists }: LandingReadingListsProps) {
  if (lists.length === 0) return null;

  return (
    <section className="relative overflow-hidden mv-zone-dawn px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div
        className="pointer-events-none absolute right-[8%] top-20 size-20 rounded-full bg-[#ff7733]/10 mv-float-slow"
        aria-hidden
      />
      <FloatingMoon
        className="absolute -left-12 bottom-12 text-primary opacity-25"
        size={150}
        shape="crescent"
        float="slower"
      />

      <div className="relative mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[#FF7733]">
              Curated shelves
            </p>
            <h2 className="mt-2 font-serif text-3xl font-black tracking-tight text-night-blue sm:text-4xl lg:text-5xl">
              Reading lists worth saving
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Real community shelves and themed picks, built from actual reviews
              and covers.
            </p>
          </div>
          <CatalogLink href="/lists">Browse all lists</CatalogLink>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ReadingListCard key={list.id} list={list} />
          ))}
        </div>
      </div>
    </section>
  );
}
