import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialReviewCard } from "@/components/reviews/SocialReviewCard";
import type { ReviewListItem } from "@/types/review";

interface TrendingReviewsSectionProps {
  reviews: ReviewListItem[];
}

export function TrendingReviewsSection({ reviews }: TrendingReviewsSectionProps) {
  return (
    <section className="bg-white py-16 sm:py-20" aria-labelledby="trending-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-accent">
              <TrendingUp size={18} aria-hidden="true" />
              <span className="text-sm font-medium">Trending now</span>
            </div>
            <h2
              id="trending-heading"
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Trending Reviews
            </h2>
            <p className="mt-2 text-muted-foreground">
              The most-loved reviews from the MoonVerse community this week.
            </p>
          </div>
          <Button
            variant="ghost"
            className="hidden sm:inline-flex"
            render={<Link href="/reviews" />}
          >
            View all
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>

        <div className="mt-8 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
          {reviews.map((review) => (
            <div key={review.id} className="w-[300px] shrink-0 snap-start">
              <SocialReviewCard review={review} variant="compact" />
            </div>
          ))}
        </div>

        <div className="mt-4 sm:hidden">
          <Button variant="outline" className="w-full" render={<Link href="/reviews" />}>
            View all reviews
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </section>
  );
}
