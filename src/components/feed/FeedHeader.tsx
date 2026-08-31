import Link from "next/link";
import { PencilLine } from "lucide-react";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { Button } from "@/components/ui/button";
import type { ReadingTasteSnapshot } from "@/services/feed.service";

interface FeedHeaderProps {
  greetingName: string;
  taste: ReadingTasteSnapshot;
}

export function FeedHeader({ greetingName, taste }: FeedHeaderProps) {
  const genreLabel =
    taste.topGenres.length > 0
      ? taste.topGenres.map((g) => g.name).join(" · ")
      : "Still discovering";

  return (
    <header className="rounded-2xl border border-violet-100 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">
            Welcome back, {greetingName}
          </p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-night-blue sm:text-2xl">
            Your reading feed
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
            Discover reviews, follow readers, and talk about the stories you love.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-full"
            render={<Link href="/reviews/new" />}
          >
            <PencilLine className="size-4" aria-hidden />
            Write a review
          </Button>
          <AskMoonieLink size="sm" className="rounded-full" />
        </div>
      </div>

      <dl className="mt-4 hidden grid-cols-4 gap-3 border-t border-violet-50 pt-4 md:grid">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Reviews
          </dt>
          <dd className="mt-0.5 text-lg font-bold text-night-blue">
            {taste.reviewCount}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Saved
          </dt>
          <dd className="mt-0.5 text-lg font-bold text-night-blue">
            {taste.savedNovelCount}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Following
          </dt>
          <dd className="mt-0.5 text-lg font-bold text-night-blue">
            {taste.followingCount}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Favourite genres
          </dt>
          <dd className="mt-0.5 truncate text-sm font-semibold text-night-blue">
            {genreLabel}
          </dd>
        </div>
      </dl>
    </header>
  );
}
