"use client";

import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moonieLoggedInEntryHref } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";
import type { MoonieCardDensity } from "@/lib/moonie/presentation";
import type { MoonieSeriesInfo } from "@/types/moonie";

interface MoonieSeriesPanelProps {
  series: MoonieSeriesInfo;
  density?: MoonieCardDensity;
  onOpenNovel?: (novelId: string) => void;
}

export function MoonieSeriesPanel({
  series,
  density = "desk",
  onOpenNovel,
}: MoonieSeriesPanelProps) {
  const isWidget = density === "widget";
  const highlighted = new Set(series.highlightedNovelIds ?? []);
  const title =
    series.focusKind === "reading_order" || series.focusKind === "full_series"
      ? "Reading order"
      : "Series";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-violet-100 bg-white",
        "shadow-[0_12px_32px_-20px_rgba(36,22,48,0.35)]",
        isWidget ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">
            {title}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-slate-900">
            {series.name}
          </h3>
          {!series.readingOrderComplete &&
          (series.focusKind === "reading_order" ||
            series.focusKind === "full_series") ? (
            <p className="mt-1 text-xs text-amber-700">
              MoonVerse doesn&apos;t have a complete verified reading order for
              this series yet.
            </p>
          ) : null}
        </div>
        {!isWidget ? (
          <Link
            href={`/novels/${series.currentNovelId ?? series.entries[0]?.novelId ?? ""}`}
            className="text-xs font-semibold text-violet-700 hover:text-violet-900"
          >
            Open full series
          </Link>
        ) : null}
      </div>

      <ol className={cn("mt-3 space-y-2", isWidget ? "text-xs" : "text-sm")}>
        {series.entries.map((entry, index) => {
          const active =
            highlighted.has(entry.novelId) ||
            entry.novelId === series.currentNovelId;
          return (
            <li
              key={entry.novelId}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2",
                active
                  ? "border-violet-200 bg-violet-50/70"
                  : "border-slate-100 bg-slate-50/50"
              )}
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900">
                  {index + 1}. {entry.title}
                </p>
                {!isWidget && entry.author ? (
                  <p className="text-xs text-slate-500">{entry.author}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-lg px-2"
                  render={
                    <Link
                      href={`/novels/${entry.novelId}`}
                      onClick={() => onOpenNovel?.(entry.novelId)}
                    />
                  }
                >
                  <BookOpen className="size-3.5" aria-hidden />
                  {!isWidget ? "View" : null}
                </Button>
                {!isWidget ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg px-2"
                    render={<Link href={`/novels/${entry.novelId}`} />}
                  >
                    Reviews
                    <ExternalLink className="size-3.5" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {isWidget ? (
        <div className="mt-3">
          <Link
            href={moonieLoggedInEntryHref()}
            className="text-xs font-semibold text-violet-700 hover:text-violet-900"
          >
            Open full series
          </Link>
        </div>
      ) : null}
    </article>
  );
}
