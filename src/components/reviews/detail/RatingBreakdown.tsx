import { BarChart3, Star } from "lucide-react";
import type { NovelReviewStats } from "@/services/review.service";
import { cn } from "@/lib/utils";

interface RatingBreakdownProps {
  stats: NovelReviewStats;
  className?: string;
  variant?: "card" | "plain";
  animated?: boolean;
  hideHeading?: boolean;
}

export function RatingBreakdown({
  stats,
  className,
  variant = "card",
  animated = false,
  hideHeading = false,
}: RatingBreakdownProps) {
  if (stats.total === 0) return null;

  const rows = [5, 4, 3, 2, 1] as const;
  const showHistogram = stats.total >= 5;

  return (
    <section
      aria-labelledby="rating-breakdown-heading"
      className={cn(
        variant === "card" &&
          "rounded-[18px] border border-violet-100/80 bg-white p-4",
        className,
      )}
    >
      {hideHeading ? (
        <h2 id="rating-breakdown-heading" className="sr-only">
          Community rating
        </h2>
      ) : (
        <h2
          id="rating-breakdown-heading"
          className={cn(
            "inline-flex items-center gap-2 font-serif font-bold text-[#1a1033]",
            variant === "card" ? "text-lg" : "text-sm",
          )}
        >
          <BarChart3 className="size-4 text-[#6b4bb5]" aria-hidden />
          Community rating
        </h2>
      )}

      <div className={cn("flex items-end gap-3", !hideHeading && "mt-4")}>
        <p className="font-serif text-3xl font-black leading-none text-[#1a1033]">
          {stats.average.toFixed(1)}
        </p>
        <div className="pb-0.5">
          <div className="flex items-center gap-0.5" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-3.5",
                  i < Math.round(stats.average)
                    ? "fill-[var(--mv-gold)] text-[var(--mv-gold)]"
                    : "fill-transparent text-slate-300",
                )}
              />
            ))}
          </div>
          <p className="mt-1 text-sm font-semibold text-[#5a4d72]">
            {stats.total} {stats.total === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      {showHistogram ? (
        <div className="mt-4 space-y-1.5">
          {rows.map((star) => {
            const count = stats.distribution[star];
            const pct =
              stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 shrink-0 text-xs font-semibold text-[#7a7284]">
                  {star}
                </span>
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f4ecf8]"
                  role="img"
                  aria-label={`${star} stars: ${count} reviews`}
                >
                  <div
                    className={cn(
                      "h-full rounded-full bg-[#6b4bb5]",
                      animated &&
                        "transition-[width] duration-700 ease-out motion-reduce:transition-none",
                    )}
                    style={{ width: `${animated ? pct : 0}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-[#7a7284]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-[#7a7284]">
          Not enough ratings for a detailed breakdown yet.
        </p>
      )}
    </section>
  );
}
