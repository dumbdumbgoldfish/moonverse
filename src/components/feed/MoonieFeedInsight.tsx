import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { moonieVariantFor } from "@/lib/moonie/variants";
import type { ReviewListItem } from "@/types/review";

interface MoonieFeedInsightProps {
  review: ReviewListItem;
  message?: string;
}

export function MoonieFeedInsight({ review, message }: MoonieFeedInsightProps) {
  const insight =
    message ??
    `Moonie spotted a ${review.genres[0]?.toLowerCase() ?? "great"} pick. Readers are loving this review.`;

  return (
    <div className="flex gap-3 rounded-2xl border border-[var(--mv-border)] bg-[var(--mv-dark-surface,#21172F)] px-4 py-3.5 text-[var(--mv-ivory,#FCF9F2)]">
      <div className="shrink-0">
        <MoonieMascot
          variant={moonieVariantFor("dailyPick")}
          size={44}
          display="badge"
          lightweight
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--mv-gold,#C99B45)]">
          Moonie insight
        </p>
        <p className="mt-1 text-sm leading-snug text-[var(--mv-ivory)]/90">
          {insight}
        </p>
        <CatalogLink
          href={`/reviews/${review.id}`}
          size="compact"
          tone="night"
          className="mt-2"
        >
          Read “{review.title}”
        </CatalogLink>
      </div>
    </div>
  );
}
