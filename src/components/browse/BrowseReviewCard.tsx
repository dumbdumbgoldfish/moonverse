import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  BookOpen,
  CalendarDays,
  Heart,
  MessageCircle,
  ShieldAlert,
  Star,
  Tag,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatRelativeTime } from "@/lib/date-utils";
import { formatCompactCount } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import {
  PROFILE_CAROUSEL_CONTENT_CLASS,
  PROFILE_CAROUSEL_COVER_CLASS,
  PROFILE_CAROUSEL_CTA_CLASS,
  PROFILE_CAROUSEL_FOOTER_CLASS,
  PROFILE_CAROUSEL_INNER_CLASS,
  PROFILE_CAROUSEL_SHELL_CLASS,
} from "@/components/users/profile-carousel-layout";
import type { ReviewListItem } from "@/types/review";

interface BrowseReviewCardProps {
  review: ReviewListItem;
  priority?: boolean;
  density?: "default" | "carousel";
  className?: string;
}

function hasSpoilerTag(tags: string[]): boolean {
  return tags.some((t) => /spoiler/i.test(t));
}

export function BrowseReviewCard({
  review,
  priority = false,
  density = "default",
  className,
}: BrowseReviewCardProps) {
  const isCarousel = density === "carousel";
  const score = Number.isInteger(review.rating)
    ? review.rating.toFixed(0)
    : review.rating.toFixed(1);
  const preview = review.excerpt || review.body;
  const showSpoiler = hasSpoilerTag(review.tags);

  const chips: { key: string; label: string; kind: "genre" | "tag" }[] = [];
  const seen = new Set<string>();
  for (const [kind, names] of [
    ["genre", review.genres.slice(0, 2)],
    ["tag", review.tags.filter((t) => !/spoiler/i.test(t)).slice(0, 3)],
  ] as const) {
    for (const name of names) {
      const normalized = name.trim().toLowerCase();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      chips.push({ key: `${kind}:${name}`, label: name, kind });
      if (chips.length >= (isCarousel ? 4 : 5)) break;
    }
    if (chips.length >= (isCarousel ? 4 : 5)) break;
  }

  return (
    <article
      className={cn(
        isCarousel
          ? cn(PROFILE_CAROUSEL_SHELL_CLASS, className)
          : cn(
              "group overflow-hidden rounded-[22px] border border-violet-100/90 bg-white",
              "shadow-[0_8px_28px_-14px_rgba(98,70,234,0.22)]",
              "transition-[transform,box-shadow,border-color] duration-200",
              "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_40px_-16px_rgba(98,70,234,0.32)]",
              "focus-within:ring-2 focus-within:ring-primary/35",
              "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
              className
            )
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1",
          isCarousel
            ? PROFILE_CAROUSEL_INNER_CLASS
            : "flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5"
        )}
      >
        <Link
          href={`/reviews/${review.id}`}
          className={cn(
            isCarousel
              ? PROFILE_CAROUSEL_COVER_CLASS
              : cn(
                  "relative mx-auto aspect-[2/3] w-[108px] shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-muted",
                  "shadow-[0_8px_20px_-8px_rgba(26,16,51,0.35)]",
                  "transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100",
                  "sm:mx-0 sm:w-[124px]"
                )
          )}
          aria-label={`Open review of ${review.novelTitle}`}
        >
          <CoverImage
            src={review.coverUrl}
            alt={`Cover of ${review.novelTitle}`}
            title={review.novelTitle}
            sizes={isCarousel ? "96px" : "(max-width: 640px) 108px, 124px"}
            priority={priority}
            className="h-full w-full object-cover"
          />
        </Link>

        <div className={cn(isCarousel ? PROFILE_CAROUSEL_CONTENT_CLASS : "flex min-h-0 min-w-0 flex-1 flex-col gap-3")}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/novels/${review.novelId}`}
                className={cn(
                  "line-clamp-2 font-extrabold leading-snug text-[#1a1033] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isCarousel ? "text-[15px]" : "text-base sm:text-lg"
                )}
              >
                {review.novelTitle}
              </Link>
              <p
                className={cn(
                  "mt-0.5 flex items-center gap-1.5 truncate text-muted-foreground",
                  isCarousel ? "text-[13px]" : "mt-1 text-sm"
                )}
              >
                <BookOpen
                  className={cn(
                    "shrink-0 text-primary/70",
                    isCarousel ? "size-3.5" : "size-3.5"
                  )}
                  aria-hidden
                />
                by {review.novelAuthor}
              </p>
            </div>
            <div
              className={cn(
                "flex shrink-0 flex-col items-end gap-0.5 rounded-xl bg-amber-50 ring-1 ring-amber-200/90",
                isCarousel ? "px-2.5 py-1" : "px-3 py-2"
              )}
              aria-label={`Rated ${score} out of 5`}
            >
              <div className="flex items-center gap-1">
                <Star
                  className={cn(
                    "fill-[var(--mv-gold)] text-[var(--mv-gold)]",
                    isCarousel ? "size-3.5" : "size-4"
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "font-extrabold tabular-nums text-amber-900",
                    isCarousel ? "text-base" : "text-base"
                  )}
                >
                  {score}
                </span>
              </div>
              <span
                className={cn(
                  "font-semibold uppercase tracking-wide text-amber-800/75",
                  isCarousel ? "text-[9px]" : "text-[10px]"
                )}
              >
                out of 5
              </span>
            </div>
          </div>

          <Link
            href={`/reviews/${review.id}`}
            className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h3
              className={cn(
                "line-clamp-1 font-bold text-[#1a1033] transition-colors group-hover:text-primary",
                isCarousel ? "text-sm" : "text-sm sm:text-[15px]"
              )}
            >
              {review.title}
            </h3>
          </Link>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md bg-violet-50 font-semibold text-primary ring-1 ring-violet-100",
                    isCarousel
                      ? "px-2 py-0.5 text-[11px]"
                      : "px-2 py-0.5 text-[11px]"
                  )}
                >
                  {chip.kind === "genre" ? (
                    <BookOpen className="size-2.5" aria-hidden />
                  ) : (
                    <Tag className="size-2.5" aria-hidden />
                  )}
                  {chip.label}
                </span>
              ))}
            </div>
          )}

          {preview ? (
            <p
              className={cn(
                "line-clamp-2 overflow-hidden leading-relaxed text-[#1a1033]/78",
                isCarousel ? "text-[13px]" : "text-sm sm:line-clamp-3"
              )}
            >
              {preview}
            </p>
          ) : null}

          <div
            className={cn(
              "flex flex-wrap items-center text-muted-foreground",
              isCarousel ? "gap-x-2.5 gap-y-1 text-xs" : "gap-x-4 gap-y-2 text-xs"
            )}
          >
            <Link
              href={`/users/${review.reviewerUsername}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isCarousel ? "min-h-0" : "min-h-9 gap-2"
              )}
            >
              <Avatar size="sm" className={isCarousel ? "size-7" : undefined}>
                {review.reviewerAvatarUrl ? (
                  <AvatarImage src={review.reviewerAvatarUrl} alt="" />
                ) : null}
                <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                  {review.reviewerAvatar}
                </AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-col leading-tight">
                <span
                  className={cn(
                    "truncate font-semibold text-[#1a1033]",
                    isCarousel ? "max-w-[6.5rem] text-xs" : undefined
                  )}
                >
                  {review.reviewerName}
                </span>
                {!isCarousel ? (
                  <span className="text-[11px] text-muted-foreground">
                    @{review.reviewerUsername}
                  </span>
                ) : null}
              </span>
            </Link>

            <span className="inline-flex items-center gap-1 font-medium">
              <CalendarDays
                className={cn("text-primary/70", isCarousel ? "size-3" : "size-3.5")}
                aria-hidden
              />
              {formatRelativeTime(review.createdAt)}
            </span>

            {showSpoiler && !isCarousel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-800 ring-1 ring-amber-200/90">
                <ShieldAlert className="size-3.5" aria-hidden />
                Spoilers
              </span>
            ) : null}
          </div>

          <div className={cn(isCarousel ? PROFILE_CAROUSEL_FOOTER_CLASS : "mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-violet-50 pt-3")}>
            <div
              className={cn(
                "flex flex-wrap items-center font-medium text-muted-foreground",
                isCarousel ? "gap-2.5 text-xs" : "gap-3 text-xs"
              )}
            >
              <span className="inline-flex items-center gap-1">
                <Heart
                  className={cn("text-rose-500/80", isCarousel ? "size-3.5" : "size-3.5")}
                  aria-hidden
                />
                {formatCompactCount(review.likeCount)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle
                  className={cn("text-primary/70", isCarousel ? "size-3.5" : "size-3.5")}
                  aria-hidden
                />
                {formatCompactCount(review.commentCount)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Bookmark
                  className={cn("text-primary/70", isCarousel ? "size-3.5" : "size-3.5")}
                  aria-hidden
                />
                {formatCompactCount(review.saveCount)}
              </span>
            </div>

            <Link
              href={`/reviews/${review.id}`}
              className={cn(
                isCarousel
                  ? PROFILE_CAROUSEL_CTA_CLASS
                  : cn(
                      "inline-flex h-11 min-h-11 items-center gap-1.5 rounded-full bg-primary/10 px-4 text-sm font-bold text-primary",
                      "transition-colors mv-hover-signup",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    )
              )}
            >
              Read review
              <ArrowUpRight
                className={cn(isCarousel ? "size-3.5" : "size-4")}
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
