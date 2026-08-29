import Link from "next/link";
import { BarChart3, Star } from "lucide-react";
import {
  DETAIL_MODULE_LABEL,
  DETAIL_STAGE,
} from "@/lib/reviews/detail-surface";
import {
  scoreHonestyLabel,
  scoreConfidence,
} from "@/lib/novels/verdict";
import { cn } from "@/lib/utils";
import type { NovelReviewStats } from "@/services/review.service";

interface ReviewCommunityInsightProps {
  novelId: string;
  novelTitle: string;
  reviewRating: number;
  stats: NovelReviewStats;
  className?: string;
}

export function ReviewCommunityInsight({
  novelId,
  novelTitle,
  reviewRating,
  stats,
  className,
}: ReviewCommunityInsightProps) {
  const confidence = scoreConfidence(stats.total);
  const rows = [5, 4, 3, 2, 1] as const;
  const maxCount = Math.max(...rows.map((star) => stats.distribution[star]), 1);
  const hasScores = stats.total > 0;

  return (
    <section
      aria-labelledby="review-community-insight-heading"
      className={cn(DETAIL_STAGE, "flex h-full flex-col p-4 sm:p-5", className)}
    >
      <h2 id="review-community-insight-heading" className={DETAIL_MODULE_LABEL}>
        <BarChart3 className="size-3.5" aria-hidden />
        Community pulse
      </h2>
      <p className="mt-1 font-heading text-base font-semibold leading-snug text-[#1a1033]">
        How readers rated {novelTitle}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-[#5a4d72]">
        This take is{" "}
        <span className="font-semibold text-[#8f711e]">{reviewRating.toFixed(1)}★</span>
        {hasScores ? (
          <>
            {" "}
            · community average{" "}
            <span className="font-semibold text-[#1a1033]">
              {stats.average.toFixed(1)}★
            </span>
          </>
        ) : null}
      </p>

      {!hasScores ? (
        <p className="mt-3 text-sm leading-relaxed text-[#5a4d72]">
          No community score yet for this title.{" "}
          <Link
            href={`/novels/${novelId}`}
            className="font-semibold text-[#6E46C7] hover:underline"
          >
            See the novel page
          </Link>
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-heading text-3xl font-bold leading-none text-[#1a1033]">
              {stats.average.toFixed(1)}
            </span>
            <span className="pb-0.5 text-sm text-[#5a4d72]">/ 5</span>
          </div>

          <div
            className="mt-1 flex gap-0.5"
            aria-label={`Community average ${stats.average.toFixed(1)} out of 5`}
          >
            {rows.map((star) => (
              <Star
                key={star}
                className={
                  star <= Math.round(stats.average)
                    ? "size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]"
                    : "size-3.5 text-[#E4DCF4]"
                }
                aria-hidden
              />
            ))}
          </div>

          <p
            className={cn(
              "mt-1 text-xs font-medium text-[#5a4d72]",
              confidence === "low" && "text-[#6E46C7]",
            )}
          >
            {scoreHonestyLabel(stats.total)}
          </p>

          <div className="mt-auto space-y-1 pt-4">
            {rows.map((star) => {
              const count = stats.distribution[star];
              return (
                <div
                  key={star}
                  className="grid grid-cols-[1rem_1fr_1.25rem] items-center gap-2 text-[11px] text-[#5a4d72]"
                  aria-label={`${star} stars: ${count} reviews`}
                >
                  <span className="tabular-nums">{star}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-[#F4ECF8]">
                    <span
                      className="block h-full rounded-full bg-[#6E46C7]/80"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="text-right tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
