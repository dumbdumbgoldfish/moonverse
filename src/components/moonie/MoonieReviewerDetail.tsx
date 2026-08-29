"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FollowButton } from "@/components/users/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CatalogLink } from "@/components/ui/CatalogLink";
import type { MoonieCardDensity } from "@/lib/moonie/presentation";
import { cn } from "@/lib/utils";
import type { MoonieReviewerOverview } from "@/types/moonie";

interface MoonieReviewerDetailProps {
  overview: MoonieReviewerOverview;
  density?: MoonieCardDensity;
  isLoggedIn?: boolean;
  className?: string;
}

const WIDGET_REVIEW_LIMIT = 2;
const DESK_REVIEW_LIMIT = 4;
const WIDGET_GENRE_LIMIT = 3;
const DESK_GENRE_LIMIT = 6;

function SectionLabel({
  children,
  isWidget,
  className,
}: {
  children: ReactNode;
  isWidget: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-semibold uppercase tracking-wide text-slate-500",
        isWidget ? "text-[9px]" : "text-[10px]",
        className
      )}
    >
      {children}
    </p>
  );
}

function GenreChip({
  label,
  isWidget,
}: {
  label: string;
  isWidget: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[#F4ECF8] font-medium text-[#6E46C7] ring-1 ring-violet-100/80",
        isWidget ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-0.5 text-[11px]"
      )}
    >
      {label}
    </span>
  );
}

function statsLine(overview: MoonieReviewerOverview, includeFollowing: boolean): string {
  const parts = [
    `${overview.reviewCount} review${overview.reviewCount === 1 ? "" : "s"}`,
    `${overview.followerCount} follower${overview.followerCount === 1 ? "" : "s"}`,
  ];
  if (includeFollowing && overview.followingCount > 0) {
    parts.push(
      `${overview.followingCount} following`
    );
  }
  return parts.join(" · ");
}

export function MoonieReviewerDetail({
  overview,
  density = "desk",
  isLoggedIn = false,
  className,
}: MoonieReviewerDetailProps) {
  const isWidget = density === "widget";
  const profileHref = `/users/${overview.username}`;
  const reviews = overview.recentReviews.slice(
    0,
    isWidget ? WIDGET_REVIEW_LIMIT : DESK_REVIEW_LIMIT
  );
  const genres = overview.topGenres.slice(
    0,
    isWidget ? WIDGET_GENRE_LIMIT : DESK_GENRE_LIMIT
  );

  return (
    <article
      className={cn(
        "rounded-xl border border-violet-100/80 bg-[#FFFBFF]/95 ring-1 ring-violet-50",
        isWidget ? "px-2.5 py-2.5" : "px-4 py-4",
        className
      )}
    >
      {/* Identity */}
      <header className="flex items-start gap-2.5">
        <Link
          href={profileHref}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] focus-visible:ring-offset-1"
          aria-label={`View ${overview.displayName}'s profile`}
        >
          <Avatar className={cn("ring-1 ring-violet-100", isWidget ? "size-9" : "size-12")}>
            {overview.avatarUrl ? (
              <AvatarImage src={overview.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback
              className={cn(
                "bg-[#F4ECF8] font-semibold text-[#6E46C7]",
                isWidget ? "text-[9px]" : "text-[11px]"
              )}
            >
              {overview.avatarInitials}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={profileHref}
            className={cn(
              "block truncate font-semibold text-[#1A1224] hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
              isWidget ? "text-sm leading-tight" : "text-base"
            )}
          >
            {overview.displayName}
          </Link>
          <p
            className={cn(
              "truncate text-slate-500",
              isWidget ? "text-[10px]" : "text-xs"
            )}
          >
            @{overview.username}
          </p>
        </div>
      </header>

      {/* Key stats */}
      <p
        className={cn(
          "text-slate-600",
          isWidget ? "mt-2 text-[10px] leading-snug" : "mt-3 text-xs"
        )}
      >
        {statsLine(overview, true)}
      </p>
      {!isWidget && overview.averageRatingGiven != null ? (
        <p className="mt-1 text-[11px] text-slate-500">
          {overview.averageRatingGiven.toFixed(1)} average rating given
        </p>
      ) : null}

      {/* About */}
      {overview.bio ? (
        <section className={cn(isWidget ? "mt-2.5" : "mt-4")}>
          <SectionLabel isWidget={isWidget}>About</SectionLabel>
          <p
            className={cn(
              "mt-1 text-slate-600",
              isWidget
                ? "line-clamp-2 text-[10px] leading-snug"
                : "text-sm leading-relaxed"
            )}
          >
            {overview.bio}
          </p>
        </section>
      ) : null}

      {/* Main review interests */}
      {genres.length > 0 ? (
        <section className={cn(isWidget ? "mt-2.5" : "mt-4")}>
          <SectionLabel isWidget={isWidget}>Reviews mostly</SectionLabel>
          <div className={cn("mt-1.5 flex flex-wrap gap-1", !isWidget && "gap-1.5")}>
            {genres.map((genre) => (
              <GenreChip key={genre} label={genre} isWidget={isWidget} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Recent reviews */}
      {reviews.length > 0 ? (
        <section className={cn(isWidget ? "mt-2.5" : "mt-4")}>
          <SectionLabel isWidget={isWidget}>Recent reviews</SectionLabel>
          <ul className={cn(isWidget ? "mt-1.5 space-y-2" : "mt-2 space-y-2.5")}>
            {reviews.map((review) => (
              <li key={review.id}>
                <Link
                  href={`/reviews/${review.id}`}
                  className={cn(
                    "block rounded-md transition hover:bg-violet-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
                    isWidget ? "px-1 py-0.5" : "px-1.5 py-1"
                  )}
                >
                  <div className="flex min-w-0 items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "min-w-0 truncate font-semibold text-[#6E46C7]",
                        isWidget ? "text-[10px]" : "text-xs"
                      )}
                      title={review.novelTitle}
                    >
                      {review.novelTitle}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-semibold tabular-nums text-amber-700",
                        isWidget ? "text-[10px]" : "text-xs"
                      )}
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      ★{review.rating}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 text-slate-600",
                      isWidget
                        ? "line-clamp-1 text-[10px] leading-snug"
                        : "line-clamp-2 text-xs leading-snug"
                    )}
                    title={review.title}
                  >
                    {review.title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Profile / follow actions */}
      <footer
        className={cn(
          "flex flex-wrap items-center gap-2 border-t border-violet-100/80",
          isWidget ? "mt-2.5 pt-2" : "mt-4 pt-3"
        )}
      >
        <CatalogLink href={profileHref} size="compact">
          View profile
        </CatalogLink>
        {isLoggedIn ? (
          <FollowButton
            userId={overview.id}
            username={overview.username}
            initialFollowing={overview.isFollowing ?? false}
            appearance="pill"
            isLoggedIn={isLoggedIn}
          />
        ) : null}
      </footer>
    </article>
  );
}
