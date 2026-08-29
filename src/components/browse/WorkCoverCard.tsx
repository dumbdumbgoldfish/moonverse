"use client";

import { CoverImage } from "@/components/ui/CoverImage";
import { cn } from "@/lib/utils";
import type { BrowseWorkItem } from "@/types/browse";

interface WorkCoverCardProps {
  work: BrowseWorkItem;
  priority?: boolean;
  onPreview?: (work: BrowseWorkItem) => void;
  onPrefetchPreview?: (novelId: string) => void;
  compared?: boolean;
  onToggleCompare?: (work: BrowseWorkItem) => void;
  focused?: boolean;
  cardRef?: (node: HTMLElement | null) => void;
  className?: string;
}

/** Cover-wall density: cover-first tile with minimal chrome. */
export function WorkCoverCard({
  work,
  priority,
  onPreview,
  onPrefetchPreview,
  compared,
  onToggleCompare,
  focused,
  cardRef,
  className,
}: WorkCoverCardProps) {
  return (
    <article
      ref={cardRef}
      data-browse-work={work.novelId}
      tabIndex={focused ? 0 : -1}
      onMouseEnter={() => onPrefetchPreview?.(work.novelId)}
      onFocus={() => onPrefetchPreview?.(work.novelId)}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[#1a1033]/10 bg-[#f4ecf8]",
        "transition-[transform,box-shadow,border-color] duration-200",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_28px_-18px_rgba(26,16,51,0.45)]",
        "focus-within:ring-2 focus-within:ring-primary/40",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        focused && "border-primary ring-2 ring-primary/35",
        compared && "border-emerald-300",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onPreview?.(work)}
        className="relative aspect-[2/3] w-full overflow-hidden"
        aria-label={`Preview ${work.title}`}
      >
        <CoverImage
          src={work.coverUrl}
          alt=""
          title={work.title}
          author={work.author}
          themeSeed={work.novelId}
          sizes="(max-width: 640px) 33vw, 160px"
          priority={priority}
          compactFallback
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1a1033]/90 via-[#1a1033]/45 to-transparent px-2 pb-2 pt-8">
          <span className="line-clamp-2 text-left text-[11px] font-bold leading-snug text-white">
            {work.title}
          </span>
        </span>
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
          Cmp
        </label>
      ) : null}
    </article>
  );
}
