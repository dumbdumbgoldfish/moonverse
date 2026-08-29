import Link from "next/link";
import { Heart, MessageCircle, Star } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { PaperAtmosphere } from "@/components/landing/LandingDecor";
import { CoverImage } from "@/components/ui/CoverImage";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { formatRelativeTime } from "@/lib/date-utils";
import {
  displayReviewTitle,
  pickLandingCommunityReviews,
  reviewQuote,
} from "@/lib/landing-reviews";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

interface LandingCommunityProps {
  reviews: ReviewListItem[];
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-bold text-[#8f711e]"
      aria-label={`Rating ${rating.toFixed(1)} out of 5`}
    >
      <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
      {rating.toFixed(1)}
    </span>
  );
}

function ReviewSlip({
  review,
  featured = false,
}: {
  review: ReviewListItem;
  featured?: boolean;
}) {
  const quote = reviewQuote(review);
  const title = displayReviewTitle(review.title);
  const genre = review.genres[0];

  return (
    <Link
      href={`/reviews/${review.id}`}
      className={cn(
        "group flex gap-3.5 rounded-2xl border border-violet-100/80 bg-white/95 p-4",
        "shadow-[0_12px_28px_-22px_rgba(76,29,149,0.45)] transition duration-200",
        "hover:border-[#C89B4A]/50 hover:bg-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B4A]",
        "motion-reduce:transition-none",
        featured && "ring-1 ring-[#C89B4A]/30"
      )}
    >
      <div className="relative h-[6.5rem] w-[4.35rem] shrink-0 overflow-hidden rounded-xl ring-1 ring-violet-100 [&_p]:invisible">
        <CoverImage
          src={review.coverUrl}
          alt=""
          title={review.novelTitle}
          author={review.novelAuthor}
          themeSeed={review.novelId}
          sizes="70px"
          compactFallback
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {featured ? (
            <Avatar size="sm">
              {review.reviewerAvatarUrl ? (
                <AvatarImage src={review.reviewerAvatarUrl} alt="" />
              ) : null}
              <AvatarFallback className="bg-violet-100 text-[10px] font-bold text-violet-700">
                {review.reviewerAvatar}
              </AvatarFallback>
            </Avatar>
          ) : null}
          <p className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-[0.12em] text-violet-600">
            {review.novelTitle}
          </p>
          <Stars rating={review.rating} />
        </div>

        <h3 className="mt-1.5 line-clamp-2 font-serif text-base font-bold leading-snug text-[#1a1033] sm:text-[1.05rem]">
          {title}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-[0.95rem] leading-snug text-slate-600">
          {review.containsSpoilers
            ? "Marked as containing spoilers."
            : quote}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-slate-500">
          <span className="truncate">
            {review.reviewerName}
            {review.reviewerUsername ? ` · @${review.reviewerUsername}` : ""}
          </span>
          <time dateTime={review.createdAt}>
            {formatRelativeTime(review.createdAt)}
          </time>
          {genre ? (
            <span className="rounded-full border border-[#C89B4A]/30 bg-[#fff6e8] px-1.5 py-px text-[10px] font-bold uppercase tracking-[0.1em] text-[#8f711e]">
              {genre}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3" aria-hidden />
            {review.likeCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3" aria-hidden />
            {review.commentCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function LandingCommunity({ reviews }: LandingCommunityProps) {
  const picked = pickLandingCommunityReviews(reviews, 4, {
    catalogueOnly: true,
  });
  if (picked.length === 0) return null;

  return (
    <section id="voices" className="mv-land">
      <PaperAtmosphere tone="lavender" />
      <div
        className="pointer-events-none absolute left-1/2 top-8 h-28 w-[60%] -translate-x-1/2 rounded-[100%] bg-[#C89B4A]/10 blur-3xl"
        aria-hidden
      />

      <div className="mv-land-shell">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-600">
              Voices in the stacks
            </p>
            <h2 className="mv-land-title text-[#1a1033]">
              Straight from the community
            </h2>
            <p className="mv-land-copy text-slate-600">
              Readers arguing about pacing, tropes and payoff. These are human
              notes, not a star dump.
            </p>
          </div>
          <CatalogLink href="/discover" size="compact">
            Explore all reviews
          </CatalogLink>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {picked.map((review, index) => (
            <ReviewSlip
              key={review.id}
              review={review}
              featured={index === 0}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100/80 bg-white/70 px-4 py-3.5">
          <p className="text-[0.95rem] text-slate-600">
            Have a take of your own? Write about a title already on the shelf.
          </p>
          <CatalogLink href="/write" size="compact">
            Write a review
          </CatalogLink>
        </div>
      </div>
    </section>
  );
}
