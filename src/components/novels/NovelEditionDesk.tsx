"use client";

import { useState } from "react";
import { ReadingStatusValue } from "@prisma/client";
import { CommunityReviewsSection } from "@/components/novels/CommunityReviewsSection";
import { MoonieNovelRecommendations } from "@/components/novels/MoonieNovelRecommendations";
import { NovelDecisionBar } from "@/components/novels/NovelDecisionBar";
import { NovelHero } from "@/components/novels/NovelHero";
import { NovelTasteMap } from "@/components/novels/NovelTasteMap";
import { NovelVerdictRail } from "@/components/novels/NovelVerdictRail";
import { ReadingSources } from "@/components/novels/ReadingSources";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import type {
  NovelDetail,
  NovelRecommendation,
  ReviewListItem,
} from "@/types/review";

interface NovelEditionDeskProps {
  novel: NovelDetail;
  reviews: ReviewListItem[];
  recommendations: NovelRecommendation[];
  isLoggedIn: boolean;
  initialReadingStatus: ReadingStatusValue | null;
}

export function NovelEditionDesk({
  novel,
  reviews,
  recommendations,
  isLoggedIn,
  initialReadingStatus,
}: NovelEditionDeskProps) {
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const handleSelectRating = (rating: number | null) => {
    setRatingFilter(rating);
    document.getElementById("edition-reviews")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  return (
    <>
      <div className={cn(SITE_SHELL_CLASS, "space-y-5 pb-5 pt-4 sm:space-y-6 sm:pb-6 sm:pt-6")}>
        <NovelHero
          novel={novel}
          isLoggedIn={isLoggedIn}
          initialReadingStatus={initialReadingStatus}
        />

        <div className="grid items-stretch gap-2.5 lg:grid-cols-3 lg:gap-3">
          <NovelTasteMap novel={novel} />
          <NovelVerdictRail
            novel={novel}
            selectedRating={ratingFilter}
            onSelectRating={handleSelectRating}
          />
          <ReadingSources links={novel.readingLinks} showEmptyState compact />
        </div>

        <CommunityReviewsSection
          novelId={novel.id}
          reviews={reviews}
          ratingFilter={ratingFilter}
        />

        <MoonieNovelRecommendations
          recommendations={recommendations}
          title={novel.title}
        />
      </div>
      <NovelDecisionBar
        novelId={novel.id}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}
