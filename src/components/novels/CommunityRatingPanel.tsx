import { BarChart3, Star, Users } from "lucide-react";
import type { NovelDetail } from "@/types/review";

interface CommunityRatingPanelProps {
  averageRating: NovelDetail["averageRating"];
  reviewCount: number;
  distribution: NovelDetail["ratingDistribution"];
}

export function CommunityRatingPanel({
  averageRating,
  reviewCount,
  distribution,
}: CommunityRatingPanelProps) {
  const hasDistribution = distribution.some((row) => row.count > 0);

  return (
    <section
      aria-labelledby="community-rating-heading"
      className="rounded-[22px] border border-primary/10 bg-white p-4 text-[#1a1033] shadow-[0_12px_35px_-28px_rgba(26,16,51,0.45)] sm:p-5"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100/70 text-amber-800">
          <BarChart3 className="size-4" aria-hidden />
        </span>
        <div>
          <h2
            id="community-rating-heading"
            className="font-serif text-xl font-bold text-[#1a1033]"
          >
            Community rating
          </h2>
          <p className="text-xs text-[#4a4458]">Based only on published reviews.</p>
        </div>
      </div>

      {averageRating === null ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-4 text-sm text-[#3f3a50]">
          No community rating yet. Be the first reader to review this novel.
        </div>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-[150px_1fr]">
          <div>
            <div className="flex items-end gap-2">
              <span className="font-serif text-5xl font-bold leading-none text-[#1a1033]">
                {averageRating.toFixed(1)}
              </span>
              <span className="pb-1 text-sm text-[#4a4458]">/ 5</span>
            </div>
            <div
              className="mt-3 flex gap-1"
              aria-label={`Average rating ${averageRating.toFixed(1)} out of 5`}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={
                    star <= Math.round(averageRating)
                      ? "size-4 fill-[var(--mv-gold)] text-[var(--mv-gold)]"
                      : "size-4 text-slate-300"
                  }
                  aria-hidden
                />
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[#4a4458]">
              <Users className="size-3.5" aria-hidden />
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </p>
          </div>

          {hasDistribution && (
            <div className="space-y-1.5">
              {distribution.map((row) => {
                const percentage =
                  reviewCount > 0 ? (row.count / reviewCount) * 100 : 0;
                return (
                  <div
                    key={row.rating}
                    className="grid grid-cols-[16px_1fr_24px] items-center gap-2 text-xs text-[#4a4458]"
                  >
                    <span>{row.rating}</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-[#F6C85F]"
                        style={{ width: `${percentage}%` }}
                      />
                    </span>
                    <span className="text-right tabular-nums">{row.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {reviewCount > 0 && reviewCount < 2 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Early signal: this score is based on a single review.
        </p>
      )}
    </section>
  );
}
