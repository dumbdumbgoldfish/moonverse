"use client";

import { RefreshCw } from "lucide-react";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { MoonieDailyPick } from "@/components/moonie/MoonieDailyPick";
import { MoonieMoodPicker } from "@/components/moonie/MoonieMoodPicker";
import { NovelCoverCard } from "@/components/discovery/NovelCoverCard";
import { PageContainer, PageHero, PrimaryCtaLink } from "@/components/layout/PageContainer";
import { limitCarouselItems } from "@/lib/moonie/performance";
import type { ReviewListItem } from "@/types/review";

interface ForYouViewProps {
  recommended: ReviewListItem[];
  trending: ReviewListItem[];
  translatedCn?: ReviewListItem[];
  royalRoad?: ReviewListItem[];
  displayName?: string;
}

export function ForYouView({
  recommended,
  trending,
  translatedCn = [],
  royalRoad = [],
  displayName,
}: ForYouViewProps) {
  const picks = limitCarouselItems(recommended, 8);
  const hero = picks[0] ?? trending[0];
  const greeting = displayName?.split(" ")[0] ?? "reader";

  return (
    <PageContainer narrow>
      <PageHero>
        <p className="text-sm font-medium text-primary">Personal picks</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          For you, {greeting}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Moonie curates novels and reviews based on community ratings and your reading mood.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <AskMoonieLink size="sm">
            Ask Moonie for more
          </AskMoonieLink>
          <PrimaryCtaLink href="/" variant="outline">
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="size-4" aria-hidden />
              Back to feed
            </span>
          </PrimaryCtaLink>
        </div>
      </PageHero>

      {hero && (
        <section className="mb-6">
          <MoonieDailyPick review={hero} />
        </section>
      )}

      <div className="mt-2">
        <MoonieMoodPicker recommended={recommended} trending={trending} />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Picked for your shelf</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {picks.map((review) => (
            <NovelCoverCard
              key={review.id}
              href={`/reviews/${review.id}`}
              coverUrl={review.coverUrl}
              title={review.novelTitle}
              subtitle={review.title}
              viewCount={review.likeCount}
              tags={review.genres}
              size="md"
            />
          ))}
        </div>
      </section>

      {translatedCn.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-lg font-bold">Translated from Chinese</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Discover Chinese web fiction available to English-language readers.
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {translatedCn.map((review) => (
              <NovelCoverCard
                key={review.id}
                href={`/reviews/${review.id}`}
                coverUrl={review.coverUrl}
                title={review.novelTitle}
                subtitle={review.novelAuthor}
                tags={review.genres}
                size="md"
                showTitle
              />
            ))}
          </div>
        </section>
      )}

      {royalRoad.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-lg font-bold">English web originals</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Popular original English-language web fiction selected for MoonVerse readers.
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {royalRoad.map((review) => (
              <NovelCoverCard
                key={review.id}
                href={`/reviews/${review.id}`}
                coverUrl={review.coverUrl}
                title={review.novelTitle}
                subtitle={review.novelAuthor}
                tags={review.genres}
                size="md"
                showTitle
              />
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  );
}
