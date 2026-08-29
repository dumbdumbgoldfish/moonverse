"use client";

import { BookOpen, PencilLine } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { cn } from "@/lib/utils";

interface WritingStudioNovelChipProps {
  title: string;
  author: string | null;
  coverUrl: string | null;
  onChange?: () => void;
  className?: string;
}

export function WritingStudioNovelChip({
  title,
  author,
  coverUrl,
  onChange,
  className,
}: WritingStudioNovelChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-[var(--mv-border)] bg-[var(--mv-surface-soft)]/80 px-3 py-2.5",
        className
      )}
    >
      <div className="relative aspect-[2/3] w-9 shrink-0 overflow-hidden rounded-md ring-1 ring-[var(--mv-border)]">
        <CoverImage
          src={coverUrl ?? ""}
          alt=""
          title={title}
          author={author ?? undefined}
          themeSeed={title}
          sizes="36px"
          compactFallback
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--mv-plum)]">
          <BookOpen className="size-3" aria-hidden />
          Reviewing
        </p>
        <p className="truncate text-sm font-semibold text-[var(--mv-ink)]">
          {title}
        </p>
        {author ? (
          <p className="truncate text-[12px] text-[var(--mv-text-muted)]">
            by {author}
          </p>
        ) : null}
      </div>
      {onChange ? (
        <button
          type="button"
          onClick={onChange}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--mv-border)] bg-white text-[var(--mv-plum)] transition hover:border-[var(--mv-plum)]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]"
          aria-label="Change novel"
        >
          <PencilLine className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
