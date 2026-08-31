"use client";

import Link from "next/link";
import type { MoonieCompareRow } from "@/types/moonie";
import { cn } from "@/lib/utils";

export function MoonieComparePanel({
  rows,
  conclusion,
  className,
}: {
  rows: MoonieCompareRow[];
  conclusion?: string;
  className?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-violet-100 bg-white",
        className
      )}
    >
      <div className="border-b border-violet-50 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Verified comparison
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Catalogue facts only. Missing fields are labelled.
        </p>
      </div>

      <div className="divide-y divide-violet-50">
        {rows.map((row) => (
          <div key={row.novelId} className="px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link
                  href={`/novels/${row.novelId}`}
                  className="font-[family-name:var(--font-source-serif)] text-base font-semibold text-[#1A1224] hover:text-primary"
                >
                  {row.title}
                </Link>
                {row.author ? (
                  <p className="text-sm text-slate-500">by {row.author}</p>
                ) : null}
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {row.averageRating != null
                  ? `${row.averageRating.toFixed(1)} ★ · ${row.reviewCount} reviews`
                  : `${row.reviewCount} reviews`}
              </span>
            </div>

            <dl className="mt-3 grid gap-1.5 text-xs text-slate-700 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-500">Status</dt>
                <dd>{row.publicationStatus ?? "Not listed"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Reading source</dt>
                <dd>
                  {row.hasVerifiedSource
                    ? "Verified on MoonVerse"
                    : row.sourceStatus === "pending"
                      ? "Pending verification"
                      : "Not verified yet"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-slate-500">Genres</dt>
                <dd>{row.genres.join(", ") || "Not listed"}</dd>
              </div>
              {row.tags.length > 0 ? (
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-slate-500">Tags</dt>
                  <dd>{row.tags.join(", ")}</dd>
                </div>
              ) : null}
              {row.toneSignals.length > 0 ? (
                <div>
                  <dt className="font-semibold text-slate-500">Tone (tags)</dt>
                  <dd>{row.toneSignals.join(", ")}</dd>
                </div>
              ) : null}
              {row.romanceSignals.length > 0 ? (
                <div>
                  <dt className="font-semibold text-slate-500">Romance (tags)</dt>
                  <dd>{row.romanceSignals.join(", ")}</dd>
                </div>
              ) : null}
              {row.pacingSignals.length > 0 ? (
                <div>
                  <dt className="font-semibold text-slate-500">Pacing (tags)</dt>
                  <dd>{row.pacingSignals.join(", ")}</dd>
                </div>
              ) : null}
            </dl>

            {row.missing.length > 0 ? (
              <p className="mt-2 text-[11px] text-slate-500">
                Not available: {row.missing.join(", ")}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {conclusion ? (
        <div className="border-t border-violet-50 bg-[#FBF6FC] px-4 py-3 text-sm leading-relaxed text-[#1A1224]">
          {conclusion.replace(/\*\*/g, "")}
        </div>
      ) : null}
    </div>
  );
}
