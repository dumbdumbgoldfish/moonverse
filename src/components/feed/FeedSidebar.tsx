import { AskMoonieCard } from "@/components/feed/AskMoonieCard";
import { ReadingTasteCard } from "@/components/feed/ReadingTasteCard";
import { SuggestedReviewers } from "@/components/feed/SuggestedReviewers";
import { TrendingGenres } from "@/components/feed/TrendingGenres";
import { CommunityActivity } from "@/components/feed/CommunityActivity";
import type { ReadingTasteSnapshot } from "@/services/feed.service";
import type { ActivityPreview, TopReviewerPreview } from "@/types/discovery";
import type { GenreOption } from "@/types/review";

interface FeedSidebarProps {
  taste: ReadingTasteSnapshot;
  suggestedReviewers: TopReviewerPreview[];
  genres: GenreOption[];
  activity: ActivityPreview[];
}

export function FeedSidebar({
  taste,
  suggestedReviewers,
  genres,
  activity,
}: FeedSidebarProps) {
  return (
    <aside className="min-w-0 space-y-4 lg:sticky lg:top-[calc(var(--mv-nav-h)+20px)] lg:max-h-[calc(100vh-var(--mv-nav-h)-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:pb-4 lg:[-ms-overflow-style:none] lg:[scrollbar-width:thin]">
      <AskMoonieCard />
      <ReadingTasteCard taste={taste} />
      <SuggestedReviewers reviewers={suggestedReviewers} />
      <TrendingGenres genres={genres} />
      <CommunityActivity activity={activity} />
    </aside>
  );
}
