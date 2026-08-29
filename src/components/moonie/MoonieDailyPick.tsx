import Link from "next/link";
import { Star } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { moonieVariantFor } from "@/lib/moonie/variants";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";
import { CoverImage } from "@/components/ui/CoverImage";

interface MoonieDailyPickProps {
  review: ReviewListItem;
  /** Sidebar / embedded. no outer page padding */
  compact?: boolean;
}

function buildReason(review: ReviewListItem): string {
  if (review.genres.length > 0) {
    return `${review.genres.slice(0, 2).join(" · ")} · ${review.rating}★ from @${review.reviewerUsername}`;
  }
  return `${review.rating}★ community review by @${review.reviewerUsername}`;
}

export function MoonieDailyPick({ review, compact = false }: MoonieDailyPickProps) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <MoonieMascot
          variant={moonieVariantFor("dailyPick")}
          size={compact ? 40 : 48}
          display="badge"
          lightweight
        />
        <h2 className={cn("font-bold", compact ? "text-base" : "text-lg")}>
          Recommended by Moonie
        </h2>
      </div>

      <Link
        href={`/reviews/${review.id}`}
        className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border/50 transition-shadow hover:shadow-md"
      >
        <div className={cn("flex gap-3", compact ? "p-3" : "gap-4 p-4")}>
          <div
            className={cn(
              "relative shrink-0 overflow-hidden rounded-lg bg-muted",
              compact ? "h-[100px] w-[68px]" : "h-[140px] w-[94px]"
            )}
          >
            <CoverImage
              src={review.coverUrl}
              alt={`Cover of ${review.novelTitle}`}
              title={review.novelTitle}
              sizes={compact ? "68px" : "94px"}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">
              {review.novelTitle}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">by {review.novelAuthor}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {buildReason(review)}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-foreground">
              <Star className="size-3.5 fill-[var(--mv-star-gold)] text-[var(--mv-star-gold)]" />
              {review.rating} community score
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
