"use client";

import { useState } from "react";
import Link from "next/link";
import { FollowButton } from "@/components/users/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CatalogLink } from "@/components/ui/CatalogLink";
import type { MoonieCardDensity } from "@/lib/moonie/presentation";
import { cn } from "@/lib/utils";
import type { MoonieReviewerResult } from "@/types/moonie";

interface MoonieReviewerResultsProps {
  reviewers: MoonieReviewerResult[];
  density?: MoonieCardDensity;
  isLoggedIn?: boolean;
  className?: string;
}

const WIDGET_INITIAL_LIMIT = 5;

function reviewerMetaLine(reviewer: MoonieReviewerResult): string {
  return `@${reviewer.username} · ${reviewer.reviewCount} review${
    reviewer.reviewCount === 1 ? "" : "s"
  } · ${reviewer.followerCount} follower${
    reviewer.followerCount === 1 ? "" : "s"
  }`;
}

function WidgetReviewerRow({
  reviewer,
  rank,
  isLoggedIn,
}: {
  reviewer: MoonieReviewerResult;
  rank: number;
  isLoggedIn: boolean;
}) {
  const profileHref = `/users/${reviewer.username}`;

  return (
    <li className="grid grid-cols-[0.875rem_auto_minmax(0,1fr)_auto] items-center gap-x-1.5 py-1.5">
      <span
        className="self-start pt-1 text-[10px] font-semibold tabular-nums leading-none text-slate-400"
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
          {reviewer.avatarUrl ? (
            <AvatarImage src={reviewer.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback className="bg-[#F4ECF8] text-[8px] font-semibold text-[#6E46C7]">
            {reviewer.avatarInitials}
          </AvatarFallback>
        </Avatar>
      </Link>

      <Link
        href={profileHref}
        className="group min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] focus-visible:ring-offset-1"
      >
        <p
          className="truncate text-xs font-semibold leading-tight text-[#1A1224] group-hover:text-[#6E46C7]"
          title={reviewer.displayName}
        >
          {reviewer.displayName}
        </p>
        <p
          className="mt-0.5 truncate text-[10px] leading-snug text-slate-500"
          title={reviewerMetaLine(reviewer)}
        >
          {reviewerMetaLine(reviewer)}
        </p>
      </Link>

      {isLoggedIn ? (
        <div className="self-center pl-0.5">
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

function DeskReviewerRow({
  reviewer,
  rank,
  isLoggedIn,
}: {
  reviewer: MoonieReviewerResult;
  rank: number;
  isLoggedIn: boolean;
}) {
  const profileHref = `/users/${reviewer.username}`;

  return (
    <li className="grid grid-cols-[1.75rem_auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl border border-violet-100 bg-white px-3 py-2.5">
      <span
        className="text-xs font-semibold tabular-nums text-slate-400"
        aria-hidden
      >
        {rank}
      </span>

      <Link
        href={profileHref}
        className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] focus-visible:ring-offset-2"
        aria-label={`View ${reviewer.displayName}'s profile`}
      >
        <Avatar className="size-10 ring-1 ring-violet-100">
          {reviewer.avatarUrl ? (
            <AvatarImage src={reviewer.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback className="bg-[#F4ECF8] text-[10px] font-semibold text-[#6E46C7]">
            {reviewer.avatarInitials}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0">
        <Link
          href={profileHref}
          className="block truncate text-sm font-semibold text-[#1A1224] hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
          title={reviewer.displayName}
        >
          {reviewer.displayName}
        </Link>
        <p className="truncate text-xs text-slate-500">@{reviewer.username}</p>
        <p className="mt-1 text-[11px] text-slate-600">
          {reviewer.reviewCount} review{reviewer.reviewCount === 1 ? "" : "s"} ·{" "}
          {reviewer.followerCount} follower
          {reviewer.followerCount === 1 ? "" : "s"}
        </p>
        <CatalogLink href={profileHref} size="compact" className="mt-1.5 inline-flex">
          View profile
        </CatalogLink>
      </div>

      {isLoggedIn ? (
        <FollowButton
          userId={reviewer.id}
          username={reviewer.username}
          initialFollowing={reviewer.isFollowing ?? false}
          appearance="subtle"
          isLoggedIn={isLoggedIn}
        />
      ) : null}
    </li>
  );
}

export function MoonieReviewerResults({
  reviewers,
  density = "desk",
  isLoggedIn = false,
  className,
}: MoonieReviewerResultsProps) {
  const isWidget = density === "widget";
  const [expanded, setExpanded] = useState(false);
  const canCollapse = isWidget && reviewers.length > WIDGET_INITIAL_LIMIT;
  const visible =
    canCollapse && !expanded
      ? reviewers.slice(0, WIDGET_INITIAL_LIMIT)
      : reviewers;

  if (reviewers.length === 0) {
    return null;
  }

  if (isWidget) {
    return (
      <article
        className={cn(
          "overflow-hidden rounded-xl border border-violet-100/80 bg-[#FFFBFF]/95 px-2 py-1",
          className
        )}
      >
        <ol className="divide-y divide-violet-100/70">
          {visible.map((reviewer, index) => (
            <WidgetReviewerRow
              key={reviewer.id}
              reviewer={reviewer}
              rank={index + 1}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </ol>

        {canCollapse && !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-1 w-full rounded-md px-2 py-1.5 text-center text-[11px] font-semibold text-[#6E46C7] transition hover:bg-violet-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
          >
            View all {reviewers.length} reviewers
          </button>
        ) : null}
      </article>
    );
  }

  return (
    <article
      className={cn(
        "rounded-2xl border border-violet-100 bg-[#FFFBFF] px-4 py-4 ring-1 ring-violet-50",
        className
      )}
    >
      <ol className="space-y-2">
        {visible.map((reviewer, index) => (
          <DeskReviewerRow
            key={reviewer.id}
            reviewer={reviewer}
            rank={index + 1}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </ol>
    </article>
  );
}
