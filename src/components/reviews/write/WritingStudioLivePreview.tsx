"use client";

import { ReviewStructuredBody } from "@/components/reviews/detail/ReviewStructuredBody";
import { ReviewVerdictChip } from "@/components/reviews/detail/ReviewVerdictChip";
import { cn } from "@/lib/utils";

interface WritingStudioLivePreviewProps {
  reviewTitle: string;
  reviewBody: string;
  rating: number;
  containsSpoilers: boolean;
  className?: string;
}

export function WritingStudioLivePreview({
  reviewTitle,
  reviewBody,
  rating,
  containsSpoilers,
  className,
}: WritingStudioLivePreviewProps) {
  if (!reviewBody.trim() && !reviewTitle.trim()) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--mv-border)] px-3 py-6 text-center text-sm text-[var(--mv-text-muted)]">
        Start writing to see a live salon preview here.
      </p>
    );
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--mv-border)] bg-white",
        className
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--mv-border)] bg-[linear-gradient(135deg,#FFFCF8_0%,#FFFFFF_55%,#F7F0FB_100%)] px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C89B4A]">
            Salon preview
          </p>
          <p className="mt-1 font-serif text-base font-semibold leading-snug text-[var(--mv-ink)]">
            {reviewTitle.trim() || "Untitled review"}
          </p>
        </div>
        {rating > 0 ? <ReviewVerdictChip rating={rating} /> : null}
      </header>

      <div className="px-4 py-4">
        {containsSpoilers ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950">
            Spoiler gate will appear before the body.
          </p>
        ) : null}
        <ReviewStructuredBody
          body={reviewBody.trim() || "Your review will appear here."}
          isLoggedIn
          forceExpanded
        />
      </div>
    </article>
  );
}
