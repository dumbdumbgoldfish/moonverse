"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, Loader2, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthRequiredLink } from "@/components/auth/AuthRequiredLink";
import { CoverImage } from "@/components/ui/CoverImage";
import { cn } from "@/lib/utils";
import type { BrowseWorkItem, BrowseWorkPreview } from "@/types/browse";

interface WorkPreviewDrawerProps {
  work: BrowseWorkItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genreLabel?: string;
}

export function WorkPreviewDrawer({
  work,
  open,
  onOpenChange,
}: WorkPreviewDrawerProps) {
  const [preview, setPreview] = useState<BrowseWorkPreview | null>(null);
  const [previewForId, setPreviewForId] = useState<string | null>(null);

  const workId = work?.novelId ?? null;
  const loading = Boolean(open && workId && previewForId !== workId);

  useEffect(() => {
    if (!open || !work) return;

    let cancelled = false;
    const id = work.novelId;

    void (async () => {
      try {
        const response = await fetch(
          `/api/browse/preview?novelId=${encodeURIComponent(id)}`,
        );
        if (!response.ok) {
          if (!cancelled) {
            setPreview(null);
            setPreviewForId(id);
          }
          return;
        }
        const data = (await response.json()) as { preview: BrowseWorkPreview };
        if (!cancelled) {
          setPreview(data.preview);
          setPreviewForId(id);
        }
      } catch {
        if (!cancelled) {
          setPreview(null);
          setPreviewForId(id);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, work]);

  if (!open || !work) return null;

  const display = previewForId === work.novelId && preview ? preview : work;

  const ratingLabel =
    display.reviewCount > 0 ? display.averageRating.toFixed(1) : "-";
  const bayesLabel =
    display.bayesianRating > 0 ? display.bayesianRating.toFixed(2) : "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "fixed inset-y-0 right-0 top-0 left-auto flex h-dvh max-h-dvh w-full max-w-md translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-l border-[#1a1033]/10 bg-[#FBF7F1] p-0 shadow-[-24px_0_48px_-28px_rgba(26,16,51,0.35)] sm:max-w-md",
          "data-open:zoom-in-100 data-closed:zoom-out-100 data-open:slide-in-from-right-4 data-closed:slide-out-to-right-4",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-[#1a1033]/08 px-5 py-4 text-left">
          <DialogTitle className="font-serif text-xl text-[#1a1033]">
            {display.title}
          </DialogTitle>
          <DialogDescription className="text-[#1a1033]/55">
            {display.author}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex gap-4">
            <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-xl bg-[#f4ecf8]">
              <CoverImage
                src={display.coverUrl}
                alt=""
                title={display.title}
                author={display.author}
                themeSeed={display.novelId}
                sizes="112px"
                compactFallback
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="inline-flex items-center gap-1 text-sm font-semibold text-[#1a1033]">
                <Star
                  className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]"
                  aria-hidden
                />
                <span className="tabular-nums">{ratingLabel}</span>
                <span className="font-medium text-[#1a1033]/45">
                  ({display.reviewCount})
                </span>
              </p>
              <p className="text-xs text-[#4c3d6e]">
                Bayesian strength{" "}
                <span className="font-semibold tabular-nums text-[#1a1033]">
                  {bayesLabel}
                </span>
              </p>
              {display.publicationStatus ? (
                <p className="text-xs capitalize text-[#1a1033]/55">
                  {display.publicationStatus.replace(/_/g, " ")}
                </p>
              ) : null}
              {display.hasOfficialLink ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                  <ExternalLink className="size-3" aria-hidden />
                  Official link
                </span>
              ) : null}
            </div>
          </div>

          {display.genres.length > 0 || display.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {display.genres.map((genre) => (
                <li
                  key={genre}
                  className="rounded-md bg-[#f4ecf8] px-2 py-0.5 text-[11px] font-semibold text-[#4c3d6e]"
                >
                  {genre}
                </li>
              ))}
              {display.tags.slice(0, 5).map((tag) => (
                <li
                  key={tag}
                  className="rounded-md bg-[#fff6e8] px-2 py-0.5 text-[11px] font-medium text-[#6b5420]"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          {display.synopsis ? (
            <p className="mt-4 text-sm leading-relaxed text-[#4c3d6e]">
              {display.synopsis.length > 420
                ? `${display.synopsis.slice(0, 417).trimEnd()}…`
                : display.synopsis}
            </p>
          ) : (
            <p className="mt-4 text-sm text-[#1a1033]/45">
              No synopsis on file for this catalogue record.
            </p>
          )}

          <section className="mt-6" aria-labelledby="browse-preview-review">
            <h3
              id="browse-preview-review"
              className="text-xs font-bold uppercase tracking-[0.14em] text-primary"
            >
              Community sample
            </h3>
            {loading ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-[#1a1033]/50">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading review…
              </p>
            ) : preview?.sampleReview && previewForId === work.novelId ? (
              <blockquote className="mt-3 rounded-2xl border border-[#1a1033]/08 bg-white p-3.5">
                <p className="text-sm font-semibold text-[#1a1033]">
                  {preview.sampleReview.title}
                </p>
                <p className="mt-1 text-xs text-[#1a1033]/45">
                  {preview.sampleReview.rating}/5 · @
                  {preview.sampleReview.username}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#4c3d6e]">
                  {preview.sampleReview.excerpt}
                </p>
                <AuthRequiredLink
                  href={preview.sampleReview.href}
                  className="mt-3 inline-flex text-xs font-bold text-primary hover:underline"
                >
                  Read full review
                </AuthRequiredLink>
              </blockquote>
            ) : (
              <p className="mt-3 text-sm text-[#1a1033]/45">
                No approved review sample yet.
              </p>
            )}
          </section>
        </div>

        <div className="shrink-0 space-y-2 border-t border-[#1a1033]/08 bg-[#FBF7F1] px-5 py-4">
          <Link
            href={display.href}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1a1033] px-4 text-sm font-bold text-white hover:bg-[#2a1848] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <BookOpen className="size-4" aria-hidden />
            Open work page
          </Link>
          {preview?.officialLinkUrl && previewForId === work.novelId ? (
            <a
              href={preview.officialLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-900 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ExternalLink className="size-4" aria-hidden />
              Read on original platform
            </a>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
