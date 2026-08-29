import Link from "next/link";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatCompactCount } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

interface ReviewResultCardProps {
  review: ReviewListItem;
  priority?: boolean;
}

function hasSpoilerTag(tags: string[]): boolean {
  return tags.some((t) => /spoiler/i.test(t));
}

function buildTagChips(review: ReviewListItem): { key: string; label: string }[] {
  const chips: { key: string; label: string }[] = [];
  const seen = new Set<string>();

  for (const [kind, names] of [
    ["genre", review.genres],
    ["tag", review.tags.filter((t) => !/spoiler/i.test(t))],
  ] as const) {
    for (const name of names) {
      const normalized = name.trim().toLowerCase();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      chips.push({ key: `${kind}:${name}`, label: name });
      if (chips.length >= 4) break;
    }
    if (chips.length >= 4) break;
  }

  return chips;
}

export function ReviewResultCard({
  review,
  priority = false,
}: ReviewResultCardProps) {
  const chips = buildTagChips(review);
  const showSpoiler = hasSpoilerTag(review.tags);
  const preview = review.excerpt || review.body;
  const score = Number.isInteger(review.rating)
    ? review.rating.toFixed(0)
    : review.rating.toFixed(1);

  return (
    <article
      className={cn(
        "group relative flex gap-4 overflow-hidden rounded-2xl border border-primary/10",
        "bg-white p-4 shadow-[0_8px_24px_-12px_rgba(98,70,234,0.22)]",
        "transition-[transform,box-shadow,border-color] duration-200",
        "hover:-translate-y-0.5 hover:border-primary/25",
        "hover:shadow-[0_16px_40px_-16px_rgba(98,70,234,0.35)]",
        "focus-within:ring-2 focus-within:ring-primary/40",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      )}
    >
      <Link
        href={`/reviews/${review.id}`}
        className={cn(
          "relative h-[168px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-muted shadow-md sm:h-[200px] sm:w-[140px]",
          "ring-1 ring-black/5 transition-transform duration-300",
          "group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
        )}
        aria-label={`Open review of ${review.novelTitle}`}
      >
        <CoverImage
          src={review.coverUrl}
          alt={`Cover of ${review.novelTitle}`}
          title={review.novelTitle}
          author={review.novelAuthor}
          genres={review.genres}
          rating={review.rating}
          themeSeed={review.novelId}
          sizes="(max-width: 640px) 120px, 140px"
          priority={priority}
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/novels/${review.novelId}`}
              className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
            >
              {review.novelTitle}
            </Link>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              by {review.novelAuthor}
            </p>
          </div>
          <div
            className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-800 ring-1 ring-amber-200/80"
            aria-label={`Rated ${score} out of 5`}
          >
            <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
            <span className="text-xs font-bold tabular-nums">{score}</span>
          </div>
        </div>

        {(chips.length > 0 || showSpoiler) && (
          <div className="flex flex-wrap gap-1">
            {showSpoiler && (
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200/80">
                Spoilers
              </span>
            )}
            {chips.map((chip) => (
              <span
                key={chip.key}
                className="rounded-md bg-moon-purple-soft px-1.5 py-0.5 text-[10px] font-medium text-primary"
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5 text-rose-500/75" aria-hidden />
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
          {review.shareCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Share2 className="size-3.5" aria-hidden />
              {formatCompactCount(review.shareCount)}
            </span>
          )}
        </div>

        {preview && (
          <p className="line-clamp-3 text-sm leading-relaxed text-foreground/75">
            {preview}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <Link
            href={`/users/${review.reviewerUsername}`}
            className="flex min-w-0 items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar size="sm">
              {review.reviewerAvatarUrl ? (
                <AvatarImage src={review.reviewerAvatarUrl} alt="" />
              ) : null}
              <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                {review.reviewerAvatar}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-foreground">
                {review.reviewerName}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                @{review.reviewerUsername}
              </span>
            </span>
          </Link>

          <Link
            href={`/reviews/${review.id}`}
            className="shrink-0 text-xs font-semibold text-primary underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Read review
          </Link>
        </div>
      </div>
    </article>
  );
}
