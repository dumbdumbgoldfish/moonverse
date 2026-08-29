"use client";

import Link from "next/link";
import { FollowButton } from "@/components/users/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CatalogLink } from "@/components/ui/CatalogLink";
import type { MoonieCardDensity } from "@/lib/moonie/presentation";
import { cn } from "@/lib/utils";
import type { MoonieReviewerGroupOverview } from "@/types/moonie";

interface MoonieReviewerGroupDetailProps {
  overview: MoonieReviewerGroupOverview;
  density?: MoonieCardDensity;
  isLoggedIn?: boolean;
  className?: string;
}

type GroupReviewer = MoonieReviewerGroupOverview["reviewers"][number];

const WIDGET_LIMIT = 3;
const DESK_LIMIT = 5;
const WIDGET_GENRE_LIMIT = 2;
const DESK_GENRE_LIMIT = 3;

function reviewerMetaLine(reviewer: GroupReviewer): string {
  return `@${reviewer.username} · ${reviewer.reviewCount} review${
    reviewer.reviewCount === 1 ? "" : "s"
  } · ${reviewer.followerCount} follower${reviewer.followerCount === 1 ? "" : "s"}`;
}

function GenreChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#F4ECF8] px-2 py-0.5 text-[10px] font-medium text-[#6E46C7] ring-1 ring-violet-100/80">
      {label}
    </span>
  );
}

function WidgetGroupReviewerRow({
  reviewer,
  rank,
  isLoggedIn,
  showRecentReview,
}: {
  reviewer: GroupReviewer;
  rank: number;
  isLoggedIn: boolean;
  showRecentReview: boolean;
}) {
  const profileHref = `/users/${reviewer.username}`;
  const genres = reviewer.topGenres.slice(0, WIDGET_GENRE_LIMIT).join(" · ");
  const showBio = Boolean(reviewer.bio?.trim()) && !showRecentReview;

  return (
    <li className="grid grid-cols-[0.875rem_auto_minmax(0,1fr)_auto] items-start gap-x-1.5 py-1">
      <span
        className="pt-0.5 text-[9px] font-semibold tabular-nums leading-none text-slate-400"
        aria-hidden
      >
        {rank}
      </span>

      <Link
        href={profileHref}
        className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] focus-visible:ring-offset-1"
        aria-label={`View ${reviewer.displayName}'s profile`}
      >
        <Avatar className="size-6 ring-1 ring-violet-100/90">
          {reviewer.avatarUrl ? <AvatarImage src={reviewer.avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-[#F4ECF8] text-[8px] font-semibold text-[#6E46C7]">
            {reviewer.avatarInitials}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0">
        <div className="flex min-w-0 items-start justify-between gap-1">
          <Link
            href={profileHref}
            className="min-w-0 truncate text-xs font-semibold leading-tight text-[#1A1224] hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
            title={reviewer.displayName}
          >
            {reviewer.displayName}
          </Link>
        </div>
        <p
          className="mt-0.5 truncate text-[9px] leading-snug text-slate-500"
          title={reviewerMetaLine(reviewer)}
        >
          {reviewerMetaLine(reviewer)}
        </p>
        {genres ? (
          <p className="mt-0.5 truncate text-[9px] leading-snug text-slate-600" title={genres}>
            {genres}
          </p>
        ) : null}
        {showBio ? (
          <p
            className="mt-0.5 line-clamp-1 text-[9px] leading-snug text-slate-500"
            title={reviewer.bio ?? undefined}
          >
            {reviewer.bio}
          </p>
        ) : null}
        {showRecentReview && reviewer.recentReview ? (
          <Link
            href={`/reviews/${reviewer.recentReview.id}`}
            className="mt-0.5 block truncate text-[9px] leading-snug text-slate-500 hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
            title={`${reviewer.recentReview.novelTitle} · ${reviewer.recentReview.title}`}
          >
            <span className="font-medium text-[#6E46C7]">
              {reviewer.recentReview.novelTitle}
            </span>
            <span> · ★{reviewer.recentReview.rating}</span>
          </Link>
        ) : null}
      </div>

      {isLoggedIn ? (
        <div className="self-start pt-0.5 pl-0.5">
          <FollowButton
            userId={reviewer.id}
            username={reviewer.username}
            initialFollowing={reviewer.isFollowing ?? false}
            appearance="subtle"
            isLoggedIn={isLoggedIn}
          />
        </div>
      ) : (
        <span className="w-0" aria-hidden />
      )}
    </li>
  );
}

function DeskGroupReviewerRow({
  reviewer,
  rank,
  isLoggedIn,
  showRecentReview,
}: {
  reviewer: GroupReviewer;
  rank: number;
  isLoggedIn: boolean;
  showRecentReview: boolean;
}) {
  const profileHref = `/users/${reviewer.username}`;
  const genres = reviewer.topGenres.slice(0, DESK_GENRE_LIMIT);

  return (
    <li className="rounded-lg border border-violet-100 px-3 py-3">
      <div className="flex items-start gap-3">
        <span
          className="pt-1.5 text-[10px] font-semibold tabular-nums text-slate-400"
          aria-hidden
        >
          {rank}
        </span>

        <Link
          href={profileHref}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] focus-visible:ring-offset-1"
          aria-label={`View ${reviewer.displayName}'s profile`}
        >
          <Avatar className="size-10 ring-1 ring-violet-100">
            {reviewer.avatarUrl ? <AvatarImage src={reviewer.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-[#F4ECF8] text-[10px] font-semibold text-[#6E46C7]">
              {reviewer.avatarInitials}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={profileHref}
            className="block truncate text-sm font-semibold text-[#1A1224] hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
          >
            {reviewer.displayName}
          </Link>
          <p className="truncate text-[11px] text-slate-500">{reviewerMetaLine(reviewer)}</p>
          {reviewer.bio ? (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-600">
              {reviewer.bio}
            </p>
          ) : null}
          {genres.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {genres.map((genre) => (
                <GenreChip key={genre} label={genre} />
              ))}
            </div>
          ) : null}
          {showRecentReview && reviewer.recentReview ? (
            <Link
              href={`/reviews/${reviewer.recentReview.id}`}
              className="mt-1.5 block text-[11px] text-slate-600 transition hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
            >
              <span className="font-medium text-[#6E46C7]">
                {reviewer.recentReview.novelTitle}
              </span>
              <span className="text-slate-500">
                {" "}
                · ★{reviewer.recentReview.rating} · {reviewer.recentReview.title}
              </span>
            </Link>
          ) : null}
          <CatalogLink href={profileHref} size="compact" className="mt-1.5 inline-flex">
            View profile
          </CatalogLink>
        </div>

        {isLoggedIn ? (
          <FollowButton
            userId={reviewer.id}
            username={reviewer.username}
            initialFollowing={reviewer.isFollowing ?? false}
            appearance="pill"
            isLoggedIn={isLoggedIn}
          />
        ) : null}
      </div>
    </li>
  );
}

export function MoonieReviewerGroupDetail({
  overview,
  density = "desk",
  isLoggedIn = false,
  className,
}: MoonieReviewerGroupDetailProps) {
  const isWidget = density === "widget";
  const reviewers = overview.reviewers.slice(0, isWidget ? WIDGET_LIMIT : DESK_LIMIT);
  const showRecentReview = Boolean(overview.emphasizeAuthoredReviews);

  if (reviewers.length === 0) return null;

  if (isWidget) {
    return (
      <article
        className={cn(
          "overflow-hidden rounded-xl border border-violet-100/80 bg-[#FFFBFF]/95 px-2 py-1",
          className
        )}
      >
        <ol className="divide-y divide-violet-100/70">
          {reviewers.map((reviewer, index) => (
            <WidgetGroupReviewerRow
              key={reviewer.id}
              reviewer={reviewer}
              rank={index + 1}
              isLoggedIn={isLoggedIn}
              showRecentReview={showRecentReview}
            />
          ))}
        </ol>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "rounded-xl border border-violet-100/80 bg-[#FFFBFF]/95 px-4 py-4 ring-1 ring-violet-50",
        className
      )}
    >
      <ol className="space-y-2">
        {reviewers.map((reviewer, index) => (
          <DeskGroupReviewerRow
            key={reviewer.id}
            reviewer={reviewer}
            rank={index + 1}
            isLoggedIn={isLoggedIn}
            showRecentReview={showRecentReview}
          />
        ))}
      </ol>
    </article>
  );
}
