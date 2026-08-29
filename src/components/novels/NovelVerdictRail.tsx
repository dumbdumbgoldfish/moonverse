import { Star } from "lucide-react";
import {
  EDITION_PANEL,
  EDITION_PANEL_BODY,
  EDITION_PANEL_EYEBROW,
  EDITION_PANEL_TITLE,
} from "@/components/novels/edition-panel";
import { cn } from "@/lib/utils";
import {
  scoreConfidence,
  scoreHonestyLabel,
} from "@/lib/novels/verdict";
import type { NovelDetail } from "@/types/review";

interface NovelVerdictRailProps {
  novel: NovelDetail;
  selectedRating: number | null;
  onSelectRating: (rating: number | null) => void;
}

export function NovelVerdictRail({
  novel,
  selectedRating,
  onSelectRating,
}: NovelVerdictRailProps) {
  const confidence = scoreConfidence(novel.reviewCount);
  const hasDistribution = novel.ratingDistribution.some((row) => row.count > 0);
  const maxCount = Math.max(
    ...novel.ratingDistribution.map((row) => row.count),
    1
  );

  return (
    <section aria-labelledby="community-verdict-heading" className={EDITION_PANEL}>
      <p className={EDITION_PANEL_EYEBROW}>Community verdict</p>
      <h2 id="community-verdict-heading" className={cn(EDITION_PANEL_TITLE, "mt-0.5")}>
        What the community thinks
      </h2>

      {novel.averageRating === null || confidence === "empty" ? (
        <p className={cn(EDITION_PANEL_BODY, "mt-2.5")}>
          No community score yet. The first finished-reader review sets the
          signal.
        </p>
      ) : (
        <>
          <div className="mt-2 flex items-end gap-1.5">
            <span className="font-serif text-[1.75rem] font-bold leading-none tracking-tight text-[#1a1033]">
              {novel.averageRating.toFixed(1)}
            </span>
            <span className="pb-0.5 text-[12px] text-[#5c5670]">/ 5</span>
          </div>
          <div
            className="mt-1 flex gap-0.5"
            aria-label={`Average rating ${novel.averageRating.toFixed(1)} out of 5`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={
                  star <= Math.round(novel.averageRating ?? 0)
                    ? "size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]"
                    : "size-3.5 text-[#E4DCF4]"
                }
                aria-hidden
              />
            ))}
          </div>
          <p
            className={cn(
              EDITION_PANEL_BODY,
              "mt-1 font-medium",
              confidence === "low" && "text-[#6E46C7]"
            )}
          >
            {scoreHonestyLabel(novel.reviewCount)}
          </p>
        </>
      )}

      {hasDistribution ? (
        <div className="mt-auto space-y-0.5 pt-2.5">
          {[...novel.ratingDistribution]
            .slice()
            .sort((a, b) => b.rating - a.rating)
            .map((row) => {
              const active = selectedRating === row.rating;
              return (
                <button
                  key={row.rating}
                  type="button"
                  onClick={() => onSelectRating(active ? null : row.rating)}
                  className={cn(
                    "grid w-full grid-cols-[1rem_1fr_1.25rem] items-center gap-1.5 rounded-md px-0.5 py-1 text-left text-[11px]",
                    "text-[#5c5670] hover:bg-[#F4ECF8]/80",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
                    active && "bg-[#F4ECF8] text-[#4C35C4]"
                  )}
                  aria-pressed={active}
                  aria-label={`Filter ${row.rating} star reviews, ${row.count}`}
                >
                  <span className="tabular-nums">{row.rating}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-[#EDE8FF]">
                    <span
                      className="block h-full rounded-full bg-[#6E46C7]"
                      style={{ width: `${(row.count / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="text-right tabular-nums">{row.count}</span>
                </button>
              );
            })}
        </div>
      ) : null}
    </section>
  );
}
