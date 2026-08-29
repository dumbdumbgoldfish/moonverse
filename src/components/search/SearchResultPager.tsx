"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResultPagerProps {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  disabled?: boolean;
  label?: string;
}

export function SearchResultPager({
  page,
  pageCount,
  onPage,
  disabled = false,
  label = "Search result groups",
}: SearchResultPagerProps) {
  if (pageCount < 1) return null;

  const atStart = page <= 1;
  const atEnd = page >= pageCount;

  return (
    <nav
      className="flex items-center justify-center gap-3 pt-5"
      aria-label={label}
    >
      <PagerButton
        label="Previous result group"
        disabled={disabled || atStart}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft className="size-5" aria-hidden />
      </PagerButton>
      <p
        className="min-w-[7.5rem] text-center text-[13px] tabular-nums text-[#1A1224]/70"
        aria-live="polite"
      >
        <span className="font-semibold text-[#1A1224]">{page}</span>
        <span className="mx-1 text-[#1A1224]/35">/</span>
        <span>{pageCount}</span>
        <span className="sr-only">
          {`Page ${page} of ${pageCount}`}
        </span>
      </p>
      <PagerButton
        label="Next result group"
        disabled={disabled || atEnd}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight className="size-5" aria-hidden />
      </PagerButton>
    </nav>
  );
}

function PagerButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-11 items-center justify-center rounded-full bg-white text-[#1A1224] ring-1 ring-[#1A1224]/12",
        "transition-colors duration-150",
        "hover:enabled:bg-[#F4ECF8] hover:enabled:ring-[#6E46C7]/35",
        "disabled:cursor-not-allowed disabled:opacity-35"
      )}
    >
      {children}
    </button>
  );
}
