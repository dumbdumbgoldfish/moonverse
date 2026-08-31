"use client";

import { CatalogLink } from "@/components/ui/CatalogLink";
import { moonieLoggedInEntryHref } from "@/lib/moonie/open-moonie";
import { buildCompareWidgetSummary } from "@/lib/moonie/compare-widget-summary";
import { cn } from "@/lib/utils";
import type { MoonieCompareRow } from "@/types/moonie";

export function MoonieCompareWidgetSummary({
  rows,
  className,
}: {
  rows: MoonieCompareRow[];
  className?: string;
}) {
  const summary = buildCompareWidgetSummary(rows);
  if (!summary) return null;

  return (
    <article
      className={cn(
        "rounded-2xl border border-violet-100 bg-[#FFFBFF] px-3 py-2.5 ring-1 ring-violet-50",
        className
      )}
    >
      <h3 className="font-[family-name:var(--font-source-serif)] text-sm font-semibold leading-snug text-[#1A1224]">
        {summary.titleLine}
      </h3>

      {summary.bullets.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-slate-700">
          {summary.bullets.map((bullet) => (
            <li key={`${bullet.label}-${bullet.title}`}>
              <span className="font-semibold text-[#4C2A67]">{bullet.label}</span>
              <span className="text-slate-500"> — </span>
              <span>{bullet.title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-xs text-slate-600">
          Both titles are verified on MoonVerse. Open the full desk for detailed
          tags and ratings.
        </p>
      )}

      <CatalogLink href={moonieLoggedInEntryHref()} size="compact" className="mt-2.5 inline-flex">
        Open full comparison
      </CatalogLink>
    </article>
  );
}
