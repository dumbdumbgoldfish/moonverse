import Link from "next/link";
import { Star } from "lucide-react";
import { HomeModuleHeader } from "@/components/home/reader-hub/HomeModuleHeader";
import { HOME_SURFACE } from "@/lib/home-atelier";
import type { ReviewListItem } from "@/types/review";

interface HomeReviewHighlightsProps {
  reviews: ReviewListItem[];
}

export function HomeReviewHighlights({ reviews }: HomeReviewHighlightsProps) {
  if (reviews.length === 0) return null;

  return (
    <section aria-labelledby="home-review-highlights">
      <HomeModuleHeader
        title="Worth your time"
        subtitle="Short reads from reviewers in your taste lane"
        action={{
          href: "/community?feed=for-you",
          label: "Open feed",
        }}
      />
      <ul className="mt-4 space-y-3">
        {reviews.map((review) => (
          <li key={review.id}>
            <Link
              href={`/reviews/${review.id}`}
              className={`group block px-4 py-4 transition hover:shadow-[0_20px_48px_-32px_rgba(26,18,36,0.35)] ${HOME_SURFACE}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-serif text-lg font-medium leading-snug text-[#1A1224] group-hover:text-[#6E46C7]">
                    {review.novelTitle}
                  </p>
                  <p className="mt-0.5 text-sm text-[#1A1224]/55">
                    Review by {review.reviewerName}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#C89B4A]/15 px-2 py-0.5 text-[11px] font-bold text-[#8a6520]">
                  <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
                  {review.rating.toFixed(1)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#1A1224]/65">
                {review.excerpt}
              </p>
              {review.feedReason ? (
                <p className="mt-2 text-[11px] font-semibold text-[#6E46C7]">
                  {review.feedReason}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
