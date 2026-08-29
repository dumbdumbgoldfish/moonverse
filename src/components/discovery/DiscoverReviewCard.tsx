"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Columns2, Heart, Star } from "lucide-react";
import { AddToFolderMenu } from "@/components/folders/AddToFolderMenu";
import { ReviewVerdictBadge } from "@/components/reviews/salon/ReviewVerdictBadge";
import { ReviewerCredibilityStrip } from "@/components/reviews/salon/ReviewerCredibilityStrip";
import { CoverImage } from "@/components/ui/CoverImage";
import { primarySocialSignal } from "@/lib/discover-reasons";
import { formatCompactCount } from "@/lib/format-utils";
import { trackReviewsEvent } from "@/lib/reviews-analytics";
import type { DiscoverLayout } from "@/lib/discover";
import { cn } from "@/lib/utils";
import { useHoverPreview } from "@/hooks/use-fine-pointer";
import type { FolderListItem } from "@/types/folder";
import type { ReviewListItem } from "@/types/review";

interface DiscoverReviewCardProps {
  review: ReviewListItem;
  layout?: DiscoverLayout;
  variant?: "standard" | "featured";
  highlighted?: boolean;
  priority?: boolean;
  isLoggedIn?: boolean;
  folders?: FolderListItem[];
  comparePinned?: boolean;
  className?: string;
  onPreview?: () => void;
  onAuthRequired?: () => void;
  onToggleCompare?: (review: ReviewListItem) => void;
}

function tropes(review: ReviewListItem): string[] {
  const primary = review.genres[0];
  const seen = new Set(
    [primary, "Spoilers"].filter(Boolean).map((name) => name!.toLowerCase())
  );
  const extras: string[] = [];
  for (const name of review.tags) {
    const key = name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    extras.push(name);
    if (extras.length >= 2) break;
  }
  return extras;
}

export function DiscoverReviewCard({
  review,
  layout = "comfortable",
  variant = "standard",
  highlighted = false,
  priority = false,
  isLoggedIn = false,
  folders = [],
  comparePinned = false,
  className,
  onPreview,
  onAuthRequired,
  onToggleCompare,
}: DiscoverReviewCardProps) {
  const hoverPreview = useHoverPreview(onPreview);

  if (layout === "covers") {
    return (
      <CoverTile
        review={review}
        highlighted={highlighted}
        priority={priority}
        hoverPreview={hoverPreview}
      />
    );
  }

  if (variant === "featured") {
    return (
      <FeaturedCard
        review={review}
        highlighted={highlighted}
        priority={priority}
        isLoggedIn={isLoggedIn}
        folders={folders}
        comparePinned={comparePinned}
        hoverPreview={hoverPreview}
        onAuthRequired={onAuthRequired}
        onToggleCompare={onToggleCompare}
      />
    );
  }

  const compact = layout === "compact";
  const extra = tropes(review);
  const signal = primarySocialSignal(review);
  const social = {
    Icon: signal.kind === "saves" ? Bookmark : Heart,
    count: signal.count,
    label: signal.label,
  };
  const community = Number(review.novelAverageRating ?? review.rating).toFixed(1);

  return (
    <article
      id={`discover-review-${review.id}`}
      data-discover-review-id={review.id}
      {...hoverPreview}
      className={cn(
        "group relative flex touch-manipulation gap-4 rounded-2xl bg-white/85 p-3 ring-1 ring-[#1A1224]/8",
        "shadow-[0_12px_32px_-28px_rgba(26,18,36,0.35)]",
        "transition-all duration-200 fine-hover:bg-white fine-hover:shadow-[0_20px_48px_-28px_rgba(26,18,36,0.4)]",
        "motion-reduce:transition-none",
        highlighted && "ring-2 ring-[#6E46C7] ring-offset-2 ring-offset-[#FBF7F1] bg-white",
        compact && "gap-3 p-2.5",
        className
      )}
    >
      <Link
        href={`/novels/${review.novelId}`}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg bg-[#1A1224]/5 ring-1 ring-[#1A1224]/8",
          compact ? "h-[72px] w-[48px]" : "h-[144px] w-[96px]"
        )}
        aria-label={`Open ${review.novelTitle}`}
      >
        <CoverImage
          src={review.coverUrl}
          alt=""
          title={review.novelTitle}
          sizes={compact ? "48px" : "96px"}
          priority={priority}
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <ReviewVerdictBadge rating={review.rating} />
              {review.containsSpoilers ? (
                <span className="rounded-full bg-[#1A1224]/6 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1A1224]/60">
                  Spoilers
                </span>
              ) : null}
              {review.hasOfficialLink ? (
                <span className="rounded-full bg-[#6E46C7]/8 px-2 py-0.5 text-[10px] font-semibold text-[#6E46C7]">
                  Official link
                </span>
              ) : null}
            </div>
            <Link
              href={`/novels/${review.novelId}`}
              className={cn(
                "line-clamp-2 font-serif text-[#1A1224] transition-colors duration-150 fine-hover:text-[#6E46C7]",
                compact ? "text-[15px] leading-snug" : "text-lg leading-snug"
              )}
              onClick={() => trackReviewsEvent("card_click", { reviewId: review.id })}
            >
              {review.novelTitle}
            </Link>
            <p className="mt-0.5 truncate text-[13px] text-[#1A1224]/55">
              {review.novelAuthor}
            </p>
          </div>
          <p
            className="inline-flex shrink-0 items-center gap-1 text-[13px] tabular-nums text-[#1A1224]"
            aria-label={`Community score ${community} out of 5`}
          >
            <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
            {community}
            {review.novelReviewCount ? (
              <span className="text-[#1A1224]/45">
                · {formatCompactCount(review.novelReviewCount)}
              </span>
            ) : null}
          </p>
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[#1A1224]/55">
          {review.genres[0] ? (
            <span className="font-medium text-[#1A1224]/80">{review.genres[0]}</span>
          ) : null}
          {extra.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </p>

        {!compact ? (
          <Excerpt review={review} />
        ) : (
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#1A1224]/70">
            {review.containsSpoilers
              ? "Marked as containing spoilers"
              : review.excerpt || review.title}
          </p>
        )}

        {!compact ? <ReviewerCredibilityStrip review={review} className="mt-2" /> : null}

        <div
          className={cn(
            "flex items-center justify-between gap-3",
            compact ? "mt-2 pt-1" : "mt-auto pt-2"
          )}
        >
          <p className="min-w-0 text-[12px] leading-snug text-[#1A1224]/55">
            {review.feedReason ? (
              <span
                className="block truncate text-[#6E46C7]"
                title="Why this review ranks here"
              >
                {review.feedReason}
              </span>
            ) : null}
            <span className="mt-0.5 block truncate">
              <Link
                href={`/users/${review.reviewerUsername}`}
                className="fine-hover:text-[#6E46C7]"
              >
                {review.reviewerName}
              </Link>
              {" · "}
              <span className="inline-flex items-center gap-1">
                <social.Icon className="size-3" aria-hidden />
                {formatCompactCount(social.count)} {social.label}
              </span>
            </span>
          </p>

          <div className="flex shrink-0 items-center gap-2">
            {onToggleCompare ? (
              <button
                type="button"
                aria-label={
                  comparePinned
                    ? `Remove ${review.novelTitle} from compare`
                    : `Pin ${review.novelTitle} to compare`
                }
                aria-pressed={comparePinned}
                onClick={() => {
                  onToggleCompare(review);
                  trackReviewsEvent("compare_pin", { reviewId: review.id });
                }}
                className={cn(
                  "rounded-full p-1.5 transition-colors",
                  comparePinned
                    ? "bg-[#6E46C7]/12 text-[#6E46C7]"
                    : "text-[#1A1224]/40 fine-hover:bg-[#1A1224]/5 fine-hover:text-[#6E46C7]"
                )}
              >
                <Columns2 className="size-3.5" aria-hidden />
              </button>
            ) : null}
            {isLoggedIn ? (
              <span data-discover-save={review.id}>
                <AddToFolderMenu
                  reviewId={review.id}
                  folders={folders}
                  savedFolderIds={[]}
                  isLoggedIn
                  appearance="toolbar"
                />
              </span>
            ) : (
              <button
                type="button"
                data-discover-save={review.id}
                onClick={onAuthRequired}
                className="text-[12px] font-medium text-[#6E46C7]"
              >
                Save
              </button>
            )}
            <Link
              href={`/reviews/${review.id}`}
              className="text-[12px] font-medium text-[#6E46C7] underline-offset-2 fine-hover:underline"
            >
              Review
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function FeaturedCard({
  review,
  highlighted,
  priority,
  isLoggedIn,
  folders,
  comparePinned,
  hoverPreview,
  onAuthRequired,
  onToggleCompare,
}: {
  review: ReviewListItem;
  highlighted: boolean;
  priority: boolean;
  isLoggedIn: boolean;
  folders: FolderListItem[];
  comparePinned: boolean;
  hoverPreview: ReturnType<typeof useHoverPreview>;
  onAuthRequired?: () => void;
  onToggleCompare?: (review: ReviewListItem) => void;
}) {
  const community = Number(review.novelAverageRating ?? review.rating).toFixed(1);

  return (
    <article
      id={`discover-review-${review.id}`}
      data-discover-review-id={review.id}
      {...hoverPreview}
      className={cn(
        "group relative grid touch-manipulation gap-4 rounded-[1.25rem] bg-gradient-to-br from-white via-white to-[#f5efff]/30 p-4 ring-1 ring-[#1A1224]/8",
        "shadow-[0_20px_48px_-32px_rgba(26,18,36,0.4)] transition-all duration-200 fine-hover:-translate-y-0.5 fine-hover:shadow-[0_28px_56px_-28px_rgba(26,18,36,0.45)]",
        "motion-reduce:transition-none motion-reduce:fine-hover:translate-y-0",
        "sm:grid-cols-[120px_minmax(0,1fr)_auto]",
        highlighted && "ring-2 ring-[#6E46C7]"
      )}
    >
      <Link
        href={`/novels/${review.novelId}`}
        className="relative mx-auto h-[168px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-[#1A1224]/5 ring-1 ring-[#1A1224]/8 sm:mx-0"
      >
        <CoverImage
          src={review.coverUrl}
          alt=""
          title={review.novelTitle}
          sizes="112px"
          priority={priority}
          className="object-cover"
        />
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <ReviewVerdictBadge rating={review.rating} size="md" />
          {review.feedReason ? (
            <span className="text-[11px] font-medium text-[#6E46C7]">
              {review.feedReason}
            </span>
          ) : null}
        </div>
        <Link
          href={`/reviews/${review.id}`}
          className="mt-2 block font-serif text-xl leading-snug text-[#1A1224] fine-hover:text-[#6E46C7]"
        >
          {review.novelTitle}
        </Link>
        <p className="mt-1 text-sm text-[#1A1224]/55">{review.novelAuthor}</p>
        <Excerpt review={review} className="mt-3" />
        <ReviewerCredibilityStrip review={review} className="mt-3" />
        <p className="mt-3 text-xs text-[#1A1224]/50">
          <Link
            href={`/users/${review.reviewerUsername}`}
            className="font-medium text-[#1A1224]/70 fine-hover:text-[#6E46C7]"
          >
            {review.reviewerName}
          </Link>
          {" · "}
          {review.genres[0] ?? "Review"}
        </p>
      </div>

      <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
        <p className="inline-flex items-center gap-1 text-sm tabular-nums">
          <Star className="size-4 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
          {community}
        </p>
        <div className="flex items-center gap-2">
          {onToggleCompare ? (
            <button
              type="button"
              aria-pressed={comparePinned}
              onClick={() => onToggleCompare(review)}
              className={cn(
                "rounded-full p-2",
                comparePinned
                  ? "bg-[#6E46C7]/12 text-[#6E46C7]"
                  : "text-[#1A1224]/40 fine-hover:bg-[#1A1224]/5"
              )}
            >
              <Columns2 className="size-4" aria-hidden />
            </button>
          ) : null}
          {isLoggedIn ? (
            <AddToFolderMenu
              reviewId={review.id}
              folders={folders}
              savedFolderIds={[]}
              isLoggedIn
              appearance="toolbar"
            />
          ) : (
            <button
              type="button"
              onClick={onAuthRequired}
              className="text-xs font-semibold text-[#6E46C7]"
            >
              Save
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Excerpt({
  review,
  className,
}: {
  review: ReviewListItem;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const unsafe = review.containsSpoilers && !revealed;

  return (
    <div className={className}>
      {unsafe ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="block text-left text-[13px] leading-relaxed text-[#1A1224]/50 underline-offset-2 fine-hover:underline"
        >
          Excerpt may contain spoilers: show
        </button>
      ) : (
        <p className="line-clamp-3 text-[13px] leading-relaxed text-[#1A1224]/75">
          {review.excerpt || review.title}
        </p>
      )}
    </div>
  );
}

function CoverTile({
  review,
  highlighted,
  priority,
  hoverPreview,
}: {
  review: ReviewListItem;
  highlighted: boolean;
  priority: boolean;
  hoverPreview: ReturnType<typeof useHoverPreview>;
}) {
  return (
    <article
      id={`discover-review-${review.id}`}
      data-discover-review-id={review.id}
      {...hoverPreview}
      className={cn(
        "group relative touch-manipulation overflow-hidden rounded-xl bg-[#1A1224]/5 ring-1 ring-[#1A1224]/8",
        "transition-[box-shadow,transform] duration-200 fine-hover:-translate-y-0.5 fine-hover:shadow-[0_16px_40px_-24px_rgba(26,18,36,0.4)]",
        "motion-reduce:transition-none motion-reduce:fine-hover:translate-y-0",
        highlighted && "ring-2 ring-[#6E46C7]"
      )}
    >
      <Link
        href={`/reviews/${review.id}`}
        className="relative block aspect-[2/3]"
        aria-label={`${review.novelTitle} by ${review.novelAuthor}`}
      >
        <CoverImage
          src={review.coverUrl}
          alt=""
          title={review.novelTitle}
          sizes="(max-width: 640px) 50vw, 180px"
          priority={priority}
          className="object-cover"
        />
        <div className="absolute left-2 top-2">
          <ReviewVerdictBadge rating={review.rating} showRating={false} />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1A1224]/90 via-[#1A1224]/55 to-transparent p-2.5 pt-12">
          <p className="line-clamp-2 font-serif text-sm leading-snug text-white">
            {review.novelTitle}
          </p>
          {review.feedReason ? (
            <p className="mt-0.5 truncate text-[11px] text-white/80">
              {review.feedReason}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
