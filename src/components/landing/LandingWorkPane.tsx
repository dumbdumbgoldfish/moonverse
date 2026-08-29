"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Star, X } from "lucide-react";
import { AuthRequiredLink } from "@/components/auth/AuthRequiredLink";
import { CoverImage } from "@/components/ui/CoverImage";

type LandingInspectWork = {
  novelId: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  genres?: string[];
  rating?: number | null;
  origin?: "moonie" | "keyword" | "desk";
  sourceHost?: string | null;
  sourceLabel?: string | null;
  reason?: string | null;
  containsSpoilers?: boolean;
  reviewExcerpt?: string | null;
  reviewerName?: string | null;
  reviewId?: string | null;
};

interface LandingWorkPaneProps {
  work: LandingInspectWork | null;
  onClose: () => void;
}

export function LandingWorkPane({ work, onClose }: LandingWorkPaneProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!work) return;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [work, onClose]);

  if (!work) return null;

  const sourceLine = work.sourceHost
    ? work.sourceLabel
      ? `${work.sourceLabel} · ${work.sourceHost}`
      : work.sourceHost
    : "No source yet";

  return (
    <div className="fixed inset-0 z-40 lg:pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-[#1A1224]/35 lg:hidden"
        aria-label="Close work pane"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="landing-inspect-title"
        className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto border-t border-[#1A1224]/10 bg-[#FFFBFF] p-5 shadow-[0_-18px_40px_-24px_rgba(26,18,36,0.45)] lg:pointer-events-auto lg:inset-y-0 lg:top-[var(--mv-nav-h)] lg:right-0 lg:left-auto lg:bottom-0 lg:w-[24rem] lg:border-l lg:border-t-0 lg:shadow-[-18px_0_40px_-24px_rgba(26,18,36,0.35)]"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6E46C7]">
            {work.origin === "moonie"
              ? "Moonie pick"
              : work.origin === "keyword"
                ? "Keyword hit"
                : "On the desk"}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-sm text-[#1A1224] hover:bg-[#F4ECF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="mt-3 flex gap-4">
          <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-sm ring-1 ring-[#1A1224]/10">
            <CoverImage
              src={work.coverUrl}
              alt=""
              title={work.title}
              author={work.author ?? undefined}
              genres={work.genres}
              rating={work.rating ?? undefined}
              sizes="96px"
              compactFallback
            />
          </div>
          <div className="min-w-0">
            <h2
              id="landing-inspect-title"
              className="font-serif text-xl font-semibold leading-snug text-[#1A1224]"
            >
              {work.title}
            </h2>
            {work.author ? (
              <p className="mt-1 text-sm text-[#7A7284]">{work.author}</p>
            ) : null}
            {typeof work.rating === "number" && work.rating > 0 ? (
              <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#1A1224]">
                <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
                {work.rating.toFixed(1)}
              </p>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-sm text-[#1A1224]/75">
          <span className="font-semibold text-[#1A1224]">Reading source. </span>
          {sourceLine}. MoonVerse does not host chapter text.
        </p>

        {work.reason ? (
          <p className="mt-3 text-sm leading-relaxed text-[#1A1224]/70">{work.reason}</p>
        ) : null}

        <div className="mt-4 border-t border-[#1A1224]/8 pt-4">
          <p className="text-sm font-semibold text-[#1A1224]">Community review</p>
          {work.containsSpoilers ? (
            <p className="mt-2 text-sm text-[#1A1224]/70">
              This review is marked as containing spoilers. Open it on the review page.
            </p>
          ) : work.reviewExcerpt ? (
            <blockquote className="mt-2 text-sm leading-relaxed text-[#1A1224]/75">
              {work.reviewExcerpt}
              {work.reviewerName ? (
                <footer className="mt-2 text-xs text-[#7A7284]">
                  {work.reviewerName}
                </footer>
              ) : null}
            </blockquote>
          ) : (
            <p className="mt-2 text-sm text-[#1A1224]/70">
              No review excerpt loaded for this title yet. Moonie does not write reviews.
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/novels/${work.novelId}`}
            className="mv-nav-login inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-bold"
          >
            Open novel
          </Link>
          {work.reviewId ? (
            <AuthRequiredLink
              href={`/reviews/${work.reviewId}`}
              className="mv-catalog-link"
            >
              Read full review
            </AuthRequiredLink>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
