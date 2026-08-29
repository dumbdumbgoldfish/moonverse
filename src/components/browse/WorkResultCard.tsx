"use client";

import Link from "next/link";
import { BookOpen, ExternalLink, Star } from "lucide-react";
import { BrowseRankWhy } from "@/components/browse/BrowseRankWhy";
import { CoverImage } from "@/components/ui/CoverImage";
import { cn } from "@/lib/utils";
import type { BrowseWorkItem } from "@/types/browse";

interface WorkResultCardProps {
  work: BrowseWorkItem;
  priority?: boolean;
  onPreview?: (work: BrowseWorkItem) => void;
  compared?: boolean;
  onToggleCompare?: (work: BrowseWorkItem) => void;
  focused?: boolean;
  cardRef?: (node: HTMLElement | null) => void;
  className?: string;
}

export function WorkResultCard({
  work,
  priority,
  onPreview,
  compared,
  onToggleCompare,
  focused,
  cardRef,
  className,
}: WorkResultCardProps) {
  const ratingLabel =
    work.reviewCount > 0 ? work.averageRating.toFixed(1) : "-";
  const lowEvidence = work.reviewCount > 0 && work.reviewCount < 3;
  const chips = [
    ...work.genres
      .slice(0, 2)
      .map((name) => ({ key: `g:${name}`, label: name })),
    ...work.tags.slice(0, 2).map((name) => ({ key: `t:${name}`, label: name })),
  ];

  return (
    <article
      ref={cardRef}
      data-browse-work={work.novelId}
      tabIndex={focused ? 0 : -1}
      className={cn(
        "group relative flex gap-4 overflow-visible rounded-2xl border border-primary/10",
        "bg-white p-4 shadow-[0_8px_24px_-12px_rgba(98,70,234,0.22)]",
        "transition-[transform,box-shadow,border-color] duration-200",
        "hover:-translate-y-0.5 hover:border-primary/25",
        "hover:shadow-[0_16px_40px_-16px_rgba(98,70,234,0.35)]",
        "focus-within:ring-2 focus-within:ring-primary/40",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        focused && "border-primary ring-2 ring-primary/35",
        compared && "border-emerald-300",
        className,
      )}
    >
      <div className="relative shrink-0 overflow-hidden">
        <button
          type="button"
          onClick={() => onPreview?.(work)}
          className={cn(
            "relative h-[168px] w-[120px] overflow-hidden rounded-xl bg-muted shadow-md sm:h-[200px] sm:w-[140px]",
            "ring-1 ring-black/5 transition-transform duration-300",
            "group-hover:scale-[1.03] motion-reduce:group-hover:scale-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          )}
          aria-label={`Preview ${work.title}`}
        >
          <CoverImage
            src={work.coverUrl}
            alt=""
            title={work.title}
            author={work.author}
            themeSeed={work.novelId}
            sizes="(max-width: 640px) 120px, 140px"
            priority={priority}
            compactFallback
            className="object-cover"
          />
        </button>
        {onToggleCompare ? (
          <label className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1a1033] shadow-sm">
            <input
              type="checkbox"
              className="size-3 rounded border-[#1a1033]/25 text-primary"
              checked={Boolean(compared)}
              onChange={() => onToggleCompare(work)}
              aria-label={`Compare ${work.title}`}
            />
            Compare
          </label>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-start gap-1">
              <button
                type="button"
                onClick={() => onPreview?.(work)}
                className="line-clamp-2 text-left text-[15px] font-bold leading-snug tracking-tight text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
              >
                {work.title}
              </button>
              <BrowseRankWhy explain={work.rankExplain} />
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              by {work.author}
            </p>
          </div>
          <div
            className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-800 ring-1 ring-amber-200/80"
            aria-label={
              work.reviewCount > 0
                ? `Rated ${ratingLabel} from ${work.reviewCount} reviews`
                : "No ratings yet"
            }
          >
            <Star
              className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]"
              aria-hidden
            />
            <span className="text-xs font-bold tabular-nums">
              {ratingLabel}
            </span>
          </div>
        </div>

        {(chips.length > 0 || lowEvidence || work.hasOfficialLink) && (
          <div className="flex flex-wrap gap-1">
            {lowEvidence ? (
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200/80">
                Few reviews
              </span>
            ) : null}
            {work.hasOfficialLink ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                <ExternalLink className="size-3" aria-hidden />
                Official
              </span>
            ) : null}
            {chips.map((chip) => (
              <span
                key={chip.key}
                className="rounded-md bg-moon-purple-soft px-1.5 py-0.5 text-[10px] font-medium text-primary"
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {work.reviewCount > 0
            ? `${work.reviewCount} community review${work.reviewCount === 1 ? "" : "s"}`
            : "No community reviews yet"}
          {work.bayesianRating > 0
            ? ` · Bayesian ${work.bayesianRating.toFixed(2)}`
            : null}
        </p>

        {work.synopsis ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-foreground/75">
            {work.synopsis}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => onPreview?.(work)}
            className="shrink-0 text-xs font-semibold text-primary underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Preview
          </button>
          <Link
            href={work.href}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1033] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#2a1848] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <BookOpen className="size-3.5" aria-hidden />
            Open work
          </Link>
        </div>
      </div>
    </article>
  );
}
