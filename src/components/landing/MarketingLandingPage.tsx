import { LandingHero } from "@/components/landing/LandingHero";
import { DiscoverySection } from "@/components/landing/DiscoverySection";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingGenres } from "@/components/landing/LandingGenres";
import { LandingCommunity } from "@/components/landing/LandingCommunity";
import { LandingShelvesShowcase } from "@/components/landing/LandingShelvesShowcase";
import { LandingWritePromo } from "@/components/landing/LandingWritePromo";
import { MoonieCtaSection } from "@/components/landing/MoonieCtaSection";
import type {
  LandingGenreDoor,
  ReadingListPreview,
  TrendingNovelPreview,
} from "@/types/discovery";
import type { ReviewListItem } from "@/types/review";

interface MarketingLandingPageProps {
  trending: ReviewListItem[];
  mustRead: ReviewListItem[];
  discoverTrending?: TrendingNovelPreview[];
  discoverHighest?: TrendingNovelPreview[];
  readingLists?: ReadingListPreview[];
  genreDoors?: LandingGenreDoor[];
  isLoggedIn?: boolean;
}

/**
 * Guest landing (compact salon):
 * Hero → Discover → How it works → Genres → Community → Library → Write → Close
 */
export function MarketingLandingPage({
  trending,
  mustRead,
  discoverTrending = [],
  discoverHighest = [],
  readingLists = [],
  genreDoors = [],
  isLoggedIn = false,
}: MarketingLandingPageProps) {
  return (
    <div className="flex flex-1 flex-col bg-[#0b1024]">
      <main className="flex-1">
        <LandingHero reviews={[...trending, ...mustRead]} />
        <DiscoverySection trending={discoverTrending} highest={discoverHighest} />
        <LandingHowItWorks reviews={[...trending, ...mustRead]} />
        <LandingGenres doors={genreDoors} />
        {trending.length > 0 || mustRead.length > 0 ? (
          <LandingCommunity reviews={[...trending, ...mustRead]} />
        ) : null}
        <LandingShelvesShowcase lists={readingLists} isLoggedIn={isLoggedIn} />
        <LandingWritePromo reviews={[...trending, ...mustRead]} />
        <MoonieCtaSection />
      </main>
    </div>
  );
}
