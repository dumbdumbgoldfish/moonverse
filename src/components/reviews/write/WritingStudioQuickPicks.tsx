"use client";

import { BookmarkCheck, BookOpen } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import type { ReadingStatusNovel } from "@/services/reading-status.service";
import { cn } from "@/lib/utils";

interface WritingStudioQuickPicksProps {
  currentlyReading: ReadingStatusNovel | null;
  recentlyFinished: ReadingStatusNovel[];
  catalogIds: Set<string>;
  selectedNovelId: string;
  onSelect: (novelId: string) => void;
  className?: string;
}

function QuickPickCard({
  novel,
  badge,
  onSelect,
  selected,
}: {
  novel: ReadingStatusNovel;
  badge: string;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-w-[148px] max-w-[180px] shrink-0 flex-col rounded-xl border p-2.5 text-left transition",
        selected
          ? "border-[var(--mv-plum)]/40 bg-[var(--mv-plum)]/[0.08] ring-1 ring-[var(--mv-plum)]/20"
          : "border-[var(--mv-border)] bg-white hover:border-[var(--mv-plum)]/30 hover:bg-[var(--mv-surface-soft)]/50"
      )}
    >
      <div className="relative mx-auto aspect-[2/3] w-14 overflow-hidden rounded-md ring-1 ring-[var(--mv-border)]">
        <CoverImage
          src={novel.coverUrl}
          alt=""
          title={novel.novelTitle}
          author={novel.novelAuthor ?? ""}
          themeSeed={novel.novelId}
          sizes="56px"
          compactFallback
        />
      </div>
      <p className="mt-2 line-clamp-2 text-[12px] font-semibold leading-snug text-[var(--mv-ink)]">
        {novel.novelTitle}
      </p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--mv-plum)]">
        {badge}
      </p>
    </button>
  );
}

export function WritingStudioQuickPicks({
  currentlyReading,
  recentlyFinished,
  catalogIds,
  selectedNovelId,
  onSelect,
  className,
}: WritingStudioQuickPicksProps) {
  const readingPick =
    currentlyReading && catalogIds.has(currentlyReading.novelId)
      ? currentlyReading
      : null;

  const finishedPicks = recentlyFinished.filter((novel) =>
    catalogIds.has(novel.novelId)
  );

  if (!readingPick && finishedPicks.length === 0) return null;

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--mv-text-muted)]">
          From your library
        </p>
      </div>

      {readingPick ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--mv-plum)]/20 bg-[var(--mv-plum)]/[0.06] p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-md ring-1 ring-[var(--mv-border)]">
              <CoverImage
                src={readingPick.coverUrl}
                alt=""
                title={readingPick.novelTitle}
                author={readingPick.novelAuthor ?? ""}
                themeSeed={readingPick.novelId}
                sizes="44px"
                compactFallback
              />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--mv-plum)]">
                <BookOpen className="size-3" aria-hidden />
                Currently reading
              </p>
              <p className="truncate text-sm font-semibold text-[var(--mv-ink)]">
                {readingPick.novelTitle}
              </p>
              {readingPick.novelAuthor ? (
                <p className="truncate text-[12px] text-[var(--mv-text-muted)]">
                  by {readingPick.novelAuthor}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(readingPick.novelId)}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-[var(--mv-deep-plum)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--mv-plum)]"
          >
            Review this title
          </button>
        </div>
      ) : null}

      {finishedPicks.length > 0 ? (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--mv-text-muted)]">
            <BookmarkCheck className="size-3.5 text-[var(--mv-plum)]" aria-hidden />
            Recently finished
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {finishedPicks.map((novel) => (
              <QuickPickCard
                key={novel.novelId}
                novel={novel}
                badge="Finished"
                selected={selectedNovelId === novel.novelId}
                onSelect={() => onSelect(novel.novelId)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
