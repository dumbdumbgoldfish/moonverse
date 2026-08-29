"use client";

import Link from "next/link";
import {
  BookOpen,
  Compass,
  Library,
  PenLine,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { AuthRequiredLink } from "@/components/auth/AuthRequiredLink";
import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { MoonieCharacter } from "@/components/moonie/MoonieCharacter";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatCompactCount } from "@/lib/format-utils";
import { scrollToSectionId } from "@/lib/scroll-to-section";
import { cn } from "@/lib/utils";
import type { CommunityStats } from "@/services/community.service";
import type { TopReviewerPreview } from "@/types/discovery";
import type { ReviewListItem } from "@/types/review";
import { ReviewVerdictBadge } from "./ReviewVerdictBadge";

interface ReviewsSalonMastheadProps {
  kicker: string;
  title: string;
  blurb: string;
  featured: ReviewListItem | null;
  stats?: CommunityStats;
  topReviewers?: TopReviewerPreview[];
  isLoggedIn: boolean;
  loading?: boolean;
  showDefaultPitch?: boolean;
}

const ASK_MOONIE_PROMPT =
  "Recommend spoiler-aware novel reviews from the MoonVerse salon that match what I might binge next.";

export function ReviewsSalonMasthead({
  kicker,
  title,
  blurb,
  featured,
  stats,
  topReviewers = [],
  isLoggedIn,
  loading = false,
  showDefaultPitch = false,
}: ReviewsSalonMastheadProps) {
  const registerHref = featured
    ? `/register?callbackUrl=${encodeURIComponent(`/reviews/${featured.id}`)}`
    : "/register?callbackUrl=/discover";

  const headline = showDefaultPitch
    ? "Discover reads worth finishing the chapter for"
    : title;
  const subcopy = showDefaultPitch
    ? "Browse spoiler-aware reviews, compare works, and ask Moonie when you want a nudge toward your next binge."
    : blurb;
  const eyebrow = showDefaultPitch ? "MoonVerse discover" : kicker;

  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-[28px] bg-[#0B0818] text-[#F4F0FF]",
        "shadow-[0_28px_64px_-32px_rgba(8,6,24,0.85)]",
        loading && "opacity-80"
      )}
    >
      <div
        className="pointer-events-none absolute -left-24 top-[-80px] size-[320px] rounded-full bg-[#6E46C7]/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-[-90px] size-[280px] rounded-full bg-[#C89B4A]/12 blur-3xl"
        aria-hidden
      />

      <div className="relative grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,22rem)]">
        <div className="flex flex-col gap-5 px-5 py-6 sm:px-8 sm:py-8 lg:pr-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#E8C36A]/55 bg-[#E8C36A]/8 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#E8C36A]">
              <Sparkles className="size-3.5" aria-hidden />
              {eyebrow}
            </p>
            <p className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-[#C4B8E4]">
              <ShieldCheck className="size-3 text-[#E8C36A]" aria-hidden />
              Spoiler-aware
            </p>
          </div>

          <div>
            <h1 className="max-w-xl font-serif text-[2rem] font-medium leading-[1.12] tracking-tight text-white sm:text-[2.55rem]">
              {headline}
            </h1>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#B7B0CC] sm:text-[15px]">
              {subcopy}
            </p>
          </div>

          {stats ? (
            <ul className="grid gap-2.5 sm:grid-cols-3">
              {[
                {
                  icon: BookOpen,
                  value: stats.totalReviews,
                  label: stats.totalReviews === 1 ? "review" : "reviews",
                },
                {
                  icon: Library,
                  value: stats.totalNovels,
                  label: stats.totalNovels === 1 ? "work" : "works",
                },
                {
                  icon: Users,
                  value: stats.totalUsers,
                  label: stats.totalUsers === 1 ? "reader" : "readers",
                },
              ].map(({ icon: Icon, value, label }) => (
                <li
                  key={label}
                  className="rounded-2xl border border-white/8 bg-white/[0.04] px-3.5 py-3"
                >
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-white">
                    <Icon className="size-3.5 text-[#E8C36A]" aria-hidden />
                    <span className="tabular-nums">{formatCompactCount(value)}</span>
                    {label}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {topReviewers.length > 0 ? (
            <div>
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8B84A3]">
                Top reviewers
              </p>
              <ul className="flex flex-wrap gap-2">
                {topReviewers.slice(0, 4).map((user) => (
                  <li key={user.id}>
                    <Link
                      href={`/users/${user.username}`}
                      title={user.displayName}
                      className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] pl-1 pr-3 text-[12px] font-semibold text-[#EDE8FF] transition fine-hover:border-[#E8C36A]/40 fine-hover:bg-white/8"
                    >
                      <span className="flex size-6 items-center justify-center rounded-full bg-[#6E46C7]/40 text-[9px] font-bold text-[#E8C36A]">
                        {user.avatarInitials}
                      </span>
                      {user.displayName.split(" ")[0]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <AskMoonieButton
              prompt={ASK_MOONIE_PROMPT}
              size="md"
              className="min-h-10 px-5 text-[13px] font-bold focus-visible:ring-[#E8C36A]"
            />
            {isLoggedIn ? (
              <AuthRequiredLink
                href="/reviews/new"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/20 px-4 text-[13px] font-semibold text-white transition fine-hover:border-white/40 fine-hover:bg-white/8"
              >
                <PenLine className="size-3.5" aria-hidden />
                Write a review
              </AuthRequiredLink>
            ) : (
              <Link
                href={registerHref}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/20 px-4 text-[13px] font-semibold text-white transition fine-hover:border-white/40 fine-hover:bg-white/8"
              >
                {featured ? "Join to save picks" : "Join the salon"}
              </Link>
            )}
            <button
              type="button"
              onClick={() => scrollToSectionId("review-stream")}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold",
                "border border-[#E8C36A]/35 bg-[#E8C36A]/8 text-[#EDE8FF]",
                "shadow-[0_0_16px_rgba(232,195,106,0.12)]",
                "transition fine-hover:border-[#E8C36A]/55 fine-hover:bg-[#E8C36A]/14 fine-hover:text-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A]"
              )}
            >
              <Compass className="size-3.5 text-[#E8C36A]" aria-hidden />
              Explore stream
            </button>
          </div>
        </div>

        <SalonSpotlightPanel featured={featured} />
      </div>
    </header>
  );
}

function SalonSpotlightPanel({ featured }: { featured: ReviewListItem | null }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-4 border-t border-white/8 px-5 py-8 lg:border-l lg:border-t-0 lg:px-6">
      <div className="relative flex size-[120px] shrink-0 items-end justify-center">
        <div
          className="pointer-events-none absolute inset-0 rounded-full border border-dashed border-[#E8C36A]/35"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-[18%] rounded-full border border-dashed border-[#E8C36A]/25"
          aria-hidden
        />
        <MoonieCharacter
          size={92}
          variant="waving"
          emotion="happy"
          priority
          lightweight
          display="clean"
          className="relative z-10 drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
        />
      </div>

      {featured ? (
        <Link
          href={`/reviews/${featured.id}`}
          className="group w-full max-w-[280px] touch-manipulation overflow-hidden rounded-2xl border border-[#E8C36A]/35 bg-white/[0.05] p-4 transition duration-200 fine-hover:-translate-y-0.5 fine-hover:border-[#E8C36A]/55 fine-hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A]"
        >
          <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#E8C36A]">
            <Sparkles className="size-3" aria-hidden />
            Editor&apos;s pick
          </p>
          <div className="mt-3 flex gap-3">
            <div className="relative h-[132px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
              <CoverImage
                src={featured.coverUrl}
                alt=""
                title={featured.novelTitle}
                sizes="88px"
                priority
                className="object-cover transition-transform duration-300 fine-group-hover:scale-[1.03]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-serif text-lg leading-snug text-white fine-group-hover:text-[#E8C36A]">
                {featured.novelTitle}
              </p>
              <p className="mt-1 truncate text-[13px] text-[#9C95B3]">
                {featured.novelAuthor}
              </p>
              <div className="mt-2.5">
                <ReviewVerdictBadge rating={featured.rating} size="sm" />
              </div>
            </div>
          </div>
          {featured.excerpt ? (
            <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-[#C4B8E4]">
              {featured.excerpt}
            </p>
          ) : null}
          <p className="mt-2 text-[11px] text-[#8B84A3]">
            {featured.reviewerName}
          </p>
        </Link>
      ) : (
        <p className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#C4B8E4]">
          <Sparkles className="size-3 text-[#E8C36A]" aria-hidden />
          Moonie is curating the salon
        </p>
      )}
    </div>
  );
}
