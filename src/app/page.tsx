import Link from "next/link";
import { WattpadHeroSection } from "@/components/home/WattpadHeroSection";
import { TrendingReviewsSection } from "@/components/home/TrendingReviewsSection";
import { PopularGenresSection } from "@/components/home/PopularGenresSection";
import { CommunitySection } from "@/components/home/CommunitySection";
import { MoonieHomePrompt } from "@/components/moonie/MoonieHomePrompt";
import { Button } from "@/components/ui/button";
import {
  getGenresWithReviewCounts,
  getTrendingReviews,
} from "@/services/review.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [trendingReviews, genres] = await Promise.all([
    getTrendingReviews(6),
    getGenresWithReviewCounts(),
  ]);

  return (
    <>
      <WattpadHeroSection />
      <TrendingReviewsSection reviews={trendingReviews} />
      <PopularGenresSection genres={genres} />
      <CommunitySection reviews={trendingReviews.slice(0, 3)} />
      <section className="border-t border-border/60 bg-bg-warm py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <MoonieHomePrompt variant="section" />
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border/60 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to share your first review?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join MoonVerse today and become part of a community that celebrates
            web novel storytelling.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/register" />}>
              Get started free
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/reviews" />}>
              Browse reviews
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
