import Link from "next/link";
import { limitCarouselItems } from "@/lib/moonie/performance";
import { CoverCarousel } from "@/components/discovery/CoverCarousel";
import { DiscoveryShelf } from "@/components/discovery/DiscoveryShelf";
import { ReadingListCard } from "@/components/discovery/ReadingListCard";
import { ActivityFeedItem } from "@/components/discovery/ActivityFeedItem";
import { HomeTopBar } from "@/components/home/HomeTopBar";
import { DesktopHomeHero } from "@/components/home/DesktopHomeHero";
import { MoonieGreetingHeader } from "@/components/home/MoonieGreetingHeader";
import { MoonieContinueEncouragement } from "@/components/moonie/MoonieContinueEncouragement";
import { MoonieDailyPick } from "@/components/moonie/MoonieDailyPick";
import { MoonieMoodPicker } from "@/components/moonie/MoonieMoodPicker";
import { NovelCoverCard } from "@/components/discovery/NovelCoverCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SITE_PAGE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import type {
  ActivityPreview,
  ReadingListPreview,
  TopReviewerPreview,
} from "@/types/discovery";
import type { DiscoveryShelfData } from "@/types/shelves";
import type { GenreOption, ReviewListItem } from "@/types/review";

interface CommunityHomeFeedProps {
  continueReading: ReviewListItem[];
  trending: ReviewListItem[];
  recommended: ReviewListItem[];
  genres: GenreOption[];
  readingLists: ReadingListPreview[];
  topReviewers: TopReviewerPreview[];
  activity: ActivityPreview[];
  shelves: DiscoveryShelfData[];
  username?: string;
  displayName?: string;
}

export function CommunityHomeFeed({
  continueReading,
  trending,
  recommended,
  genres,
  readingLists,
  topReviewers,
  activity,
  shelves,
  username,
  displayName,
}: CommunityHomeFeedProps) {
  const dailyPick = recommended[0] ?? trending[0];
  const continueItem = continueReading[0];

  return (
    <div className={cn(SITE_PAGE_SHELL_CLASS, "bg-background")}>
      <HomeTopBar displayName={displayName} username={username} />

      <div className="md:hidden">
        <MoonieGreetingHeader displayName={displayName} />
        <MoonieMoodPicker recommended={recommended} trending={trending} />
      </div>

      <div className="mt-4 hidden md:block">
        <DesktopHomeHero displayName={displayName} picks={recommended} />
      </div>

      {dailyPick && (
        <div className="md:hidden">
          <MoonieDailyPick review={dailyPick} />
        </div>
      )}

      {continueReading.length > 0 && (
        <>
          <MoonieContinueEncouragement
            progress={35 + (continueReading.length % 4) * 15}
            novelTitle={continueItem?.novelTitle}
          />
          <CoverCarousel title="Continue reading">
            {limitCarouselItems(continueReading).map((review, i) => (
              <NovelCoverCard
                key={review.id}
                href={`/reviews/${review.id}`}
                coverUrl={review.coverUrl}
                title={review.novelTitle}
                subtitle={`Continue · ${review.title.slice(0, 24)}`}
                viewCount={review.likeCount}
                tags={review.genres}
                progress={35 + (i % 4) * 15}
                size="md"
              />
            ))}
          </CoverCarousel>
        </>
      )}

      {shelves.map((shelf) => (
        <DiscoveryShelf
          key={shelf.id}
          shelf={shelf}
          size={shelf.id === "moonie" ? "xl" : "lg"}
        />
      ))}

      <section className="py-4">
        <h2 className="mb-3 text-lg font-bold">Browse by genre</h2>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              href={`/search?genre=${genre.slug}`}
              className="shrink-0 rounded-full bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-moon-purple-soft hover:text-primary"
            >
              {genre.name}
            </Link>
          ))}
        </div>
      </section>

      {readingLists.length > 0 && (
        <CoverCarousel
          subtitle="Curated collections from readers"
          title="Reading lists from the community"
        >
          {limitCarouselItems(readingLists).map((list) => (
            <ReadingListCard key={list.id} list={list} />
          ))}
        </CoverCarousel>
      )}

      {activity.length > 0 && (
        <section className="pb-6">
          <h2 className="mb-1 text-lg font-bold">Community pulse</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Compact updates. Story discovery comes first
          </p>
          <div className="overflow-hidden rounded-2xl ring-1 ring-border/40">
            {activity.slice(0, 4).map((item) => (
              <ActivityFeedItem key={item.id} activity={item} compact />
            ))}
          </div>
        </section>
      )}

      <CoverCarousel title="Top reviewers" className="hidden md:block">
        {limitCarouselItems(topReviewers, 8).map((reviewer) => (
          <Link
            key={reviewer.id}
            href={`/users/${reviewer.username}`}
            className="flex w-[88px] shrink-0 snap-start flex-col items-center gap-1.5"
          >
            <Avatar className="size-14">
              <AvatarFallback className="bg-moon-purple-soft text-xs text-primary">
                {reviewer.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <p className="line-clamp-1 text-center text-[11px] font-semibold">
              {reviewer.displayName}
            </p>
          </Link>
        ))}
      </CoverCarousel>
    </div>
  );
}
