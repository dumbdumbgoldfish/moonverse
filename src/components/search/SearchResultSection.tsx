"use client";

import type { ReactNode } from "react";

interface SearchResultSectionProps {
  title: string;
  subtitle?: string;
  shown: number;
  total: number;
  onViewAll?: () => void;
  children: ReactNode;
}

export function SearchResultSection({
  title,
  subtitle,
  shown,
  total,
  onViewAll,
  children,
}: SearchResultSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-medium tracking-tight text-[#1A1224]">
            {title}
          </h2>
          <p className="text-[12px] text-[#1A1224]/50">
            {subtitle ?? (
              <>
                {shown.toLocaleString()} of {total.toLocaleString()} shown
              </>
            )}
          </p>
        </div>
        {onViewAll && total > shown ? (
          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 text-[12px] font-semibold text-[#6E46C7] underline-offset-2 hover:underline"
          >
            View all
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
