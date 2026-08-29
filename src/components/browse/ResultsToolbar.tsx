"use client";

import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { GenreSortSelect } from "@/components/browse/GenreSortTabs";
import { BrowseModeToggle } from "@/components/browse/BrowseModeToggle";
import { SelectedTagBar } from "@/components/browse/SelectedTagBar";
import { cn } from "@/lib/utils";
import type { GenreBrowseSort } from "@/lib/browse-sort";
import type { BrowseMode } from "@/types/browse";

interface ResultsToolbarProps {
  mode: BrowseMode;
  onModeChange: (mode: BrowseMode) => void;
  total: number;
  sort: GenreBrowseSort;
  onSortChange: (sort: GenreBrowseSort) => void;
  loading?: boolean;
  selectedTags?: { name: string; slug: string }[];
  onRemoveTag?: (slug: string) => void;
  onClearTags?: () => void;
  officialOnly?: boolean;
  onOfficialOnlyChange?: (value: boolean) => void;
  moonieHref?: string;
  isAuthenticated?: boolean;
  className?: string;
}

export function ResultsToolbar({
  mode,
  onModeChange,
  total,
  sort,
  onSortChange,
  loading,
  selectedTags = [],
  onRemoveTag,
  onClearTags,
  officialOnly,
  onOfficialOnlyChange,
  moonieHref,
  isAuthenticated,
  className,
}: ResultsToolbarProps) {
  const noun =
    mode === "works"
      ? total === 1
        ? "work"
        : "works"
      : total === 1
        ? "review"
        : "reviews";

  return (
    <div className={cn("space-y-2", className)} aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <BrowseModeToggle
            mode={mode}
            onModeChange={onModeChange}
            loading={loading}
          />
          <p className="text-sm font-semibold text-[#1a1033]">
            {loading && total === 0 ? (
              <span className="text-muted-foreground">Searching…</span>
            ) : (
              <>
                <span className="font-extrabold tabular-nums text-primary">
                  {total.toLocaleString()}
                </span>{" "}
                <span className="text-[#1a1033]/80">{noun}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOfficialOnlyChange ? (
            <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-full border border-[#1a1033]/10 bg-white px-3 text-xs font-semibold text-[#1a1033]/75">
              <input
                type="checkbox"
                className="size-3.5 rounded border-[#1a1033]/25 text-primary focus-visible:ring-primary"
                checked={Boolean(officialOnly)}
                disabled={loading}
                onChange={(event) => onOfficialOnlyChange(event.target.checked)}
              />
              Official link
            </label>
          ) : null}
          {moonieHref ? (
            <AskMoonieLink
              href={moonieHref}
              size="xs"
              className="min-h-8 px-3 text-xs font-bold"
            />
          ) : null}
          <GenreSortSelect
            sort={sort}
            onSortChange={onSortChange}
            loading={loading}
            mode={mode}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>

      {selectedTags.length > 0 && onRemoveTag && (
        <SelectedTagBar
          tags={selectedTags}
          onRemove={onRemoveTag}
          onClear={onClearTags}
        />
      )}
    </div>
  );
}
