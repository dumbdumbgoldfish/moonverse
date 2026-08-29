"use client";

import Link from "next/link";
import { FilterX, RotateCcw, Undo2 } from "lucide-react";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { Button } from "@/components/ui/button";
import { MoonieEmptyState } from "@/components/moonie/MoonieEmptyState";
import { genreBrowseHref } from "@/lib/genres";

interface BrowseEmptyStateProps {
  genreName: string;
  genreSlug: string;
  mode?: "works" | "reviews";
  hasActiveFilters?: boolean;
  canRelax?: boolean;
  moonieHref?: string;
  onClearFilters: () => void;
  onRelaxFilters?: () => void;
}

export function BrowseEmptyState({
  genreName,
  genreSlug,
  mode = "works",
  hasActiveFilters = false,
  canRelax = false,
  moonieHref,
  onClearFilters,
  onRelaxFilters,
}: BrowseEmptyStateProps) {
  const noun = mode === "works" ? "works" : "reviews";

  return (
    <MoonieEmptyState
      variant="confused"
      title={
        hasActiveFilters
          ? `No ${genreName} ${noun} match these filters`
          : `Moonie could not find ${genreName} ${noun}`
      }
      description={
        hasActiveFilters
          ? "Relax one filter at a time, or ask Moonie when the shelf shape is clearer as a feeling than as tags."
          : "Try another sort, switch mode, or browse a neighbouring genre."
      }
      className="rounded-2xl border border-violet-100/90 bg-gradient-to-b from-violet-50/30 to-white py-10 shadow-sm"
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          {hasActiveFilters && canRelax && onRelaxFilters ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-full font-bold"
              onClick={onRelaxFilters}
            >
              <Undo2 className="size-4" aria-hidden />
              Relax last filter
            </Button>
          ) : null}
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-full font-bold"
              onClick={onClearFilters}
            >
              <FilterX className="size-4" aria-hidden />
              Clear filters
            </Button>
          ) : null}
          <Button
            className="min-h-11 rounded-full font-bold"
            render={<Link href={genreBrowseHref(genreSlug)} />}
          >
            <RotateCcw className="size-4" aria-hidden />
            Browse all {genreName}
          </Button>
          {moonieHref ? (
            <AskMoonieLink
              href={moonieHref}
              size="md"
              className="min-h-11 font-bold"
            />
          ) : null}
        </div>
      }
    />
  );
}
