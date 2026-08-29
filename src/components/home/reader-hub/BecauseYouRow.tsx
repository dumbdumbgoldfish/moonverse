import { DeskCard } from "@/components/home/reader-hub/DeskCard";
import { HomeModuleHeader } from "@/components/home/reader-hub/HomeModuleHeader";
import type { DiscoveryShelfData } from "@/types/shelves";

interface BecauseYouRowProps {
  shelf: DiscoveryShelfData;
  limit?: number;
}

export function BecauseYouRow({ shelf, limit = 4 }: BecauseYouRowProps) {
  const items = shelf.reviews.slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={`because-${shelf.id}`}>
      <HomeModuleHeader
        title={shelf.title}
        subtitle={shelf.subtitle}
        action={
          shelf.seeAllHref
            ? { href: shelf.seeAllHref, label: "See all" }
            : undefined
        }
      />
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((review, index) => (
          <DeskCard
            key={review.id}
            href={`/reviews/${review.id}`}
            coverUrl={review.coverUrl}
            title={review.novelTitle}
            subtitle={review.reviewerName}
            reason={review.feedReason}
            priority={index === 0}
          />
        ))}
      </div>
    </section>
  );
}
