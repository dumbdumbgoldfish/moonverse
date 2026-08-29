"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Clock3,
  Heart,
  MessageCircle,
  Star,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { AuthRequiredLink } from "@/components/auth/AuthRequiredLink";
import { EDITION_CHIP, EDITION_REVIEW_CTA } from "@/components/novels/edition-panel";
import { formatRelativeTime } from "@/lib/date-utils";
import { formatCompactCount } from "@/lib/format-utils";
import type { ReviewListItem } from "@/types/review";

interface CommunityReviewCardProps {
  review: ReviewListItem;
}

function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function CommunityReviewCard({ review }: CommunityReviewCardProps) {
  const [spoilersOpen, setSpoilersOpen] = useState(false);
  const chips = [...review.genres, ...review.tags]
    .filter(
      (value, index, values) =>
        values.findIndex(
          (candidate) => candidate.toLowerCase() === value.toLowerCase()
        ) === index
    )
    .slice(0, 4);

  return (
    <article className="flex h-full min-h-[21rem] flex-col rounded-[18px] border border-[#6E46C7]/12 bg-white p-4 text-[#1a1033] shadow-[0_10px_28px_-24px_rgba(110,70,199,0.14)]">
      <header className="flex items-start justify-between gap-3">
        <Link
          href={`/users/${review.reviewerUsername}`}
          className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/40"
        >
          <Avatar>
            {review.reviewerAvatarUrl && (
              <AvatarImage src={review.reviewerAvatarUrl} alt="" />
            )}
            <AvatarFallback className="bg-[#F4ECF8] font-bold text-[#6E46C7]">
              {review.reviewerAvatar}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-[#1a1033]">
              {review.reviewerName}
            </span>
            <span className="block truncate text-xs text-[#4a4458]">
              @{review.reviewerUsername} ·{" "}
              <span suppressHydrationWarning>
                {formatRelativeTime(review.createdAt)}
              </span>
            </span>
          </span>
        </Link>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200"
          aria-label={`Rated ${review.rating} out of 5`}
        >
          <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
          {review.rating}
        </span>
      </header>

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <Link
          href={`/reviews/${review.id}`}
          className="line-clamp-2 font-serif text-base font-bold leading-snug text-[#1a1033] hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/40"
        >
          {review.title}
        </Link>
        {review.containsSpoilers && !spoilersOpen ? (
          <button
            type="button"
            onClick={() => setSpoilersOpen(true)}
            className="mt-2 min-h-11 w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm font-semibold text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/40"
          >
            This review contains spoilers. Reveal for this session.
          </button>
        ) : (
          <p className="mt-2 line-clamp-4 text-sm leading-6 text-[#4a4458]">
            {review.body || review.excerpt}
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-3">
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span key={chip} className={EDITION_CHIP}>
                {chip}
              </span>
            ))}
          </div>
        ) : null}

        <footer className="flex flex-col gap-2.5 border-t border-[#6E46C7]/10 pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4a4458]">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5" aria-hidden />
            {formatCompactCount(review.likeCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" aria-hidden />
            {formatCompactCount(review.commentCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bookmark className="size-3.5" aria-hidden />
            {formatCompactCount(review.saveCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3.5" aria-hidden />
            {readingTime(review.body)} min read
          </span>
        </div>
        <AuthRequiredLink
          href={`/reviews/${review.id}`}
          className={EDITION_REVIEW_CTA}
        >
          Read full review
        </AuthRequiredLink>
        </footer>
      </div>
    </article>
  );
}
