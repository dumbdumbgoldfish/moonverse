"use client";

import Link from "next/link";
import { Bookmark, Sparkles, Users } from "lucide-react";
import { getGenreIcon } from "@/components/browse/genre-icon";
import { CommunityReviewerFollowBatch } from "@/components/home/community/CommunityReviewerFollowBatch";
import { TasteExplainToggle } from "@/components/home/community/TasteExplainToggle";
import { FollowButton } from "@/components/users/FollowButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { genreStrengthLabel } from "@/lib/taste-signature";
import type { TasteInsightSnapshot } from "@/lib/taste-signature";
import type { ReadingTasteSnapshot } from "@/services/feed.service";
import type { TopReviewerPreview } from "@/types/discovery";
import { moonieLoggedInEntryHref } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";

interface LiteraryDiscoveryRailProps {
  taste: ReadingTasteSnapshot;
  tasteInsight: TasteInsightSnapshot;
  suggestedReviewers: TopReviewerPreview[];
  className?: string;
  variant?: "desktop" | "mobile";
}

function TasteBars({
  taste,
  insight,
}: {
  taste: ReadingTasteSnapshot;
  insight: TasteInsightSnapshot;
}) {
  const max = Math.max(...taste.topGenres.map((genre) => genre.count), 1);

  if (taste.topGenres.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-[var(--mv-text-muted)]">
        Save a few stories to unlock your taste signature. Moonie will start
        matching reviews to your orbit.
      </p>
    );
  }

  return (
    <div>
      <p className="mt-3 text-[12px] leading-relaxed text-[var(--mv-text-muted)]">
        Relative to your top genres
      </p>
      <ul className="mt-3 space-y-3.5">
        {taste.topGenres.map((genre) => {
          const GenreIcon = getGenreIcon(genre.slug);
          const width = Math.max(12, Math.round((genre.count / max) * 100));
          const strength = genreStrengthLabel(genre.count, max);
          return (
            <li key={genre.slug}>
              <Link
                href={`/browse/${genre.slug}`}
                className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-[var(--mv-ink)] group-hover:text-[var(--mv-plum)]">
                    <GenreIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                    <span className="truncate">{genre.name}</span>
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--mv-plum)]">
                    {strength}
                  </span>
                </div>
                <div
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--mv-paper)]"
                  aria-hidden
                >
                  <div
                    className="mv-taste-bar h-full rounded-full"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {insight.freshMatchCount > 0 ? (
        <p className="mt-3 text-[12px] font-medium leading-relaxed text-[var(--mv-ink)]">
          +{insight.freshMatchCount} new{" "}
          {insight.freshMatchCount === 1 ? "match" : "matches"} this week
        </p>
      ) : null}
    </div>
  );
}

function reviewerSubtitle(reviewer: TopReviewerPreview): string {
  if (reviewer.sharedGenreCount && reviewer.sharedGenreCount > 0) {
    return `${reviewer.sharedGenreCount} shared ${
      reviewer.sharedGenreCount === 1 ? "genre" : "genres"
    }`;
  }
  if (reviewer.highlightGenre) {
    return `Often reviews ${reviewer.highlightGenre}`;
  }
  return `${reviewer.reviewCount} reviews`;
}

function ReviewerRow({ reviewer }: { reviewer: TopReviewerPreview }) {
  const showMatch =
    reviewer.tasteMatch != null && reviewer.tasteMatch >= 25;

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-0.5">
      <Link href={`/users/${reviewer.username}`} className="shrink-0">
        <Avatar className="size-10 ring-1 ring-[var(--mv-border)]">
          <AvatarFallback className="bg-[var(--mv-paper)] text-[10px] font-semibold text-[var(--mv-plum)]">
            {reviewer.avatarInitials}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/users/${reviewer.username}`}
            className="truncate text-sm font-semibold text-[var(--mv-ink)] hover:text-[var(--mv-plum)]"
            title={reviewer.displayName}
          >
            {reviewer.displayName}
          </Link>
          {showMatch ? (
            <span className="shrink-0 rounded-full bg-[var(--mv-plum)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--mv-plum)]">
              {reviewer.tasteMatch}% match
            </span>
          ) : null}
        </div>
        <p
          className="mt-0.5 truncate text-[12px] leading-relaxed text-[var(--mv-text-muted)]"
          title={reviewerSubtitle(reviewer)}
        >
          {reviewerSubtitle(reviewer)}
        </p>
      </div>
      <FollowButton
        userId={reviewer.id}
        username={reviewer.username}
        initialFollowing={false}
        appearance="subtle"
      />
    </li>
  );
}

function IntelligencePanel({
  taste,
  tasteInsight,
  suggestedReviewers,
}: {
  taste: ReadingTasteSnapshot;
  tasteInsight: TasteInsightSnapshot;
  suggestedReviewers: TopReviewerPreview[];
}) {
  const reviewers = suggestedReviewers.slice(0, 3);

  return (
    <section className="rounded-2xl border border-[var(--mv-border)] bg-white px-4 py-5 shadow-[0_8px_24px_-22px_rgba(20,17,31,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--mv-plum)]">
            <Bookmark className="size-3.5" aria-hidden />
            Taste signature
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--mv-text-muted)]">
            Profile: {tasteInsight.maturityLabel}
          </p>
        </div>
        <TasteExplainToggle explainText={tasteInsight.explainText} />
      </div>

      <div className="mt-4">
        <TasteBars taste={taste} insight={tasteInsight} />
      </div>

      {taste.topTag ? (
        <p className="mt-4 text-[13px] leading-relaxed text-[var(--mv-text-muted)]">
          Favourite tag ·{" "}
          <Link
            href={`/search?tags=${encodeURIComponent(taste.topTag.slug)}`}
            className="font-semibold text-[var(--mv-ink)] hover:text-[var(--mv-plum)]"
          >
            {taste.topTag.name}
          </Link>
        </p>
      ) : null}

      <p className="mt-3 text-[13px] leading-relaxed text-[var(--mv-text-muted)]">
        {taste.savedNovelCount} saved{" "}
        {taste.savedNovelCount === 1 ? "story" : "stories"}
        {taste.reviewCount > 0
          ? ` · ${taste.reviewCount} ${taste.reviewCount === 1 ? "review" : "reviews"}`
          : null}
      </p>

      <Link
        href="/settings/preferences"
        className="mt-3 inline-block text-[13px] font-semibold text-[var(--mv-plum)] underline-offset-4 hover:underline"
      >
        Edit preferences
      </Link>

      {reviewers.length > 0 ? (
        <div className="mt-5 border-t border-[var(--mv-border)]/80 pt-5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-[var(--mv-text-muted)]">
              <Users className="size-3.5 shrink-0 text-[var(--mv-plum)]" aria-hidden />
              <span className="truncate">In your orbit</span>
            </p>
            {suggestedReviewers.length > 3 ? (
              <Link
                href="/search"
                className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-[var(--mv-plum)] underline-offset-2 hover:underline"
              >
                View all
              </Link>
            ) : null}
          </div>
          <ul className="mt-3.5 space-y-3">
            {reviewers.map((reviewer) => (
              <ReviewerRow key={reviewer.id} reviewer={reviewer} />
            ))}
          </ul>
          <CommunityReviewerFollowBatch reviewers={reviewers} />
        </div>
      ) : null}

      <Link
        href={moonieLoggedInEntryHref()}
        className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold leading-relaxed text-[var(--mv-plum)] hover:underline"
      >
        <Sparkles className="size-3.5" aria-hidden />
        Ask Moonie for a pick in your orbit
      </Link>
    </section>
  );
}

export function LiteraryDiscoveryRail({
  taste,
  tasteInsight,
  suggestedReviewers,
  className,
  variant = "desktop",
}: LiteraryDiscoveryRailProps) {
  const reviewers = suggestedReviewers.slice(0, 3);

  if (variant === "mobile") {
    return (
      <div className={cn("space-y-3", className)}>
        <IntelligencePanel
          taste={taste}
          tasteInsight={tasteInsight}
          suggestedReviewers={suggestedReviewers}
        />
        {reviewers.length > 0 ? (
          <ul className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {reviewers.map((reviewer) => (
              <li
                key={reviewer.id}
                className="w-[148px] shrink-0 rounded-xl border border-[var(--mv-border)] bg-white p-3"
              >
                <Link
                  href={`/users/${reviewer.username}`}
                  className="flex flex-col items-center text-center"
                >
                  <Avatar className="size-10 ring-1 ring-[var(--mv-border)]">
                    <AvatarFallback className="bg-[var(--mv-paper)] text-[10px] font-semibold text-[var(--mv-plum)]">
                      {reviewer.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="mt-2 line-clamp-1 text-sm font-semibold text-[var(--mv-ink)]">
                    {reviewer.displayName}
                  </span>
                </Link>
                <div className="mt-2 flex justify-center">
                  <FollowButton
                    userId={reviewer.id}
                    username={reviewer.username}
                    initialFollowing={false}
                    appearance="subtle"
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <aside className={cn("min-w-0", className)}>
      <IntelligencePanel
        taste={taste}
        tasteInsight={tasteInsight}
        suggestedReviewers={suggestedReviewers}
      />
    </aside>
  );
}
