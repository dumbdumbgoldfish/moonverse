import Link from "next/link";
import { Star } from "lucide-react";
import { FloatingMoonie } from "@/components/brand/FloatingMoonie";
import type { ReviewListItem } from "@/types/review";
import { CoverImage } from "@/components/ui/CoverImage";

interface MoonieOpinionPanelProps {
  similarReviews: ReviewListItem[];
}

export function MoonieOpinionPanel({ similarReviews }: MoonieOpinionPanelProps) {
  if (similarReviews.length === 0) return null;

  return (
    <section className="relative mx-4 mb-6 overflow-visible">
      <div className="mb-3 flex items-start gap-2">
        <FloatingMoonie context="opinionPanel" size={64} />
        <div className="pt-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Moonie&apos;s opinion
          </p>
          <p className="mt-0.5 text-sm leading-snug text-foreground">
            Readers who enjoyed this review also liked these stories.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {similarReviews.slice(0, 3).map((review) => (
          <Link
            key={review.id}
            href={`/reviews/${review.id}`}
            className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-border/30 transition-colors active:bg-muted/40 dark:bg-card"
          >
            <div className="relative h-[64px] w-[44px] shrink-0 overflow-hidden rounded-md bg-muted">
              <CoverImage src={review.coverUrl} alt="" title={review.novelTitle} sizes="44px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-bold">{review.novelTitle}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {review.title}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Star className="size-3 fill-[var(--mv-star-gold)] text-[var(--mv-star-gold)]" />
                {review.rating}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
