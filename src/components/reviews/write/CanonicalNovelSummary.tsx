"use client";

import { BookOpen, Link2, Lock, PencilLine } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/button";

export interface CanonicalNovelSummaryProps {
  title: string;
  author: string | null;
  coverUrl: string | null;
  genres?: string[];
  reviewCount?: number;
  verifiedSourceCount?: number;
  themeSeed?: string;
  onChange?: () => void;
  disabled?: boolean;
}

export function CanonicalNovelSummary({
  title,
  author,
  coverUrl,
  genres = [],
  reviewCount,
  verifiedSourceCount = 0,
  themeSeed,
  onChange,
  disabled = false,
}: CanonicalNovelSummaryProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--mv-plum)]/15 bg-gradient-to-br from-[var(--mv-surface-soft)] via-white to-[var(--mv-paper)] p-4 shadow-[0_12px_32px_-24px_rgba(36,22,48,0.35)] sm:p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--mv-gold)]/50 to-transparent"
      />

      <div className="flex gap-4">
        <div className="relative aspect-[2/3] w-[4.5rem] shrink-0 overflow-hidden rounded-xl shadow-[0_10px_24px_-14px_rgba(36,22,48,0.45)] ring-1 ring-[var(--mv-plum)]/15 sm:w-20">
          <CoverImage
            src={coverUrl ?? ""}
            alt={`Cover of ${title}`}
            title={title}
            author={author ?? undefined}
            themeSeed={themeSeed ?? title}
            sizes="80px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--mv-plum)]/15 bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--mv-plum)]">
              <Lock className="size-3" aria-hidden />
              Catalogue title
            </span>
            {typeof reviewCount === "number" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--mv-text-muted)]">
                <BookOpen className="size-3" aria-hidden />
                {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </span>
            ) : null}
          </div>

          <p className="mt-2 font-serif text-xl font-semibold leading-snug text-[var(--mv-ink)]">
            {title}
          </p>
          <p className="mt-0.5 text-sm text-[var(--mv-text-muted)]">
            {author ? `by ${author}` : "Author not listed"}
          </p>

          {genres.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {genres.slice(0, 4).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-[var(--mv-plum)]/12 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--mv-plum)]"
                >
                  {genre}
                </span>
              ))}
            </div>
          ) : null}

          {verifiedSourceCount > 0 ? (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
                <Link2 className="size-3" aria-hidden />
                Verified reading sources
              </span>
            </div>
          ) : null}

          {onChange ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onChange}
              disabled={disabled}
              className="mt-4 min-h-10 gap-1.5 rounded-xl border-[var(--mv-border)] bg-white/80"
            >
              <PencilLine className="size-3.5" aria-hidden />
              Change novel
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
