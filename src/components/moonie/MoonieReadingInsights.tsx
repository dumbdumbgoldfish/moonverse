import { FloatingMoonie } from "@/components/brand/FloatingMoonie";
import type { ReviewListItem } from "@/types/review";

interface MoonieReadingInsightsProps {
  reviews: ReviewListItem[];
  displayName: string;
}

function topGenres(reviews: ReviewListItem[], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    for (const genre of review.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre]) => genre);
}

export function MoonieReadingInsights({
  reviews,
  displayName,
}: MoonieReadingInsightsProps) {
  const genres = topGenres(reviews);

  if (reviews.length === 0) {
    return (
      <div className="relative mx-4 mb-4 flex items-start gap-2 overflow-visible">
        <FloatingMoonie variant="thinking" size={64} />
        <div className="pt-2">
          <p className="text-xs font-semibold text-primary">Moonie says</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {displayName} hasn&apos;t shared reviews yet. Moonie is curious what
            they&apos;ll discover first.
          </p>
        </div>
      </div>
    );
  }

  const genreText =
    genres.length >= 2
      ? `${genres.slice(0, -1).join(", ")} and ${genres[genres.length - 1]}`
      : genres[0] ?? "many genres";

  return (
    <div className="relative mx-4 mb-4 flex items-start gap-2 overflow-visible">
      <FloatingMoonie variant="happy" size={64} />
      <div className="pt-2">
        <p className="text-xs font-semibold text-primary">Moonie says</p>
        <p className="mt-1 text-sm leading-relaxed">
          You read mostly <span className="font-semibold">{genreText.toLowerCase()}</span>
          {reviews.length >= 3 && ". Moonie thinks you love immersive worldbuilding."}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {reviews.length} review{reviews.length === 1 ? "" : "s"} · reading insights
        </p>
      </div>
    </div>
  );
}
