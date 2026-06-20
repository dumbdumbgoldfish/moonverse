"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/reviews/StarRating";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

interface SocialReviewCardProps {
  review: ReviewListItem;
  variant?: "feed" | "compact" | "profile";
}

function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}

export function SocialReviewCard({
  review,
  variant = "feed",
}: SocialReviewCardProps) {
  const isCompact = variant === "compact";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm transition-shadow hover:shadow-md",
        isCompact && "rounded-xl"
      )}
    >
      {/* Post header — reviewer */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <Link
          href={`/users/${review.reviewerUsername}`}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar size={isCompact ? "sm" : "default"}>
            <AvatarFallback className="bg-primary/15 text-xs text-primary">
              {review.reviewerAvatar}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/users/${review.reviewerUsername}`}
            className="font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {review.reviewerName}
          </Link>
          <p className="text-xs text-muted-foreground">
            @{review.reviewerUsername} · {formatRelativeDate(review.createdAt)}
          </p>
        </div>
      </div>

      {/* Review content */}
      <div className="px-4 pt-3">
        <Link
          href={`/reviews/${review.id}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        >
          <h3 className="text-base font-semibold leading-snug text-foreground hover:text-primary">
            {review.title}
          </h3>
        </Link>

        <div className="mt-3 flex gap-3 rounded-xl bg-bg-warm p-3">
          <div className="relative h-[88px] w-[60px] shrink-0 overflow-hidden rounded-lg shadow-sm">
            <Image
              src={review.coverUrl}
              alt={`Cover of ${review.novelTitle}`}
              fill
              className="object-cover"
              sizes="60px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {review.novelTitle}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              by {review.novelAuthor}
            </p>
            <div className="mt-1.5">
              <StarRating rating={review.rating} size="sm" />
            </div>
          </div>
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {review.excerpt}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.genres.map((genre) => (
            <Badge
              key={genre}
              variant="secondary"
              className="rounded-full bg-moon-purple-soft text-[10px] text-primary"
            >
              {genre}
            </Badge>
          ))}
        </div>
      </div>

      {/* Action row */}
      <div className="mt-3 flex items-center justify-between border-t border-border/50 px-2 py-1">
        <Link
          href={`/reviews/${review.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Heart className="size-4" aria-hidden="true" />
          {review.likeCount}
        </Link>
        <Link
          href={`/reviews/${review.id}#comments`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Comment
        </Link>
        <Link
          href={`/reviews/${review.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Share2 className="size-4" aria-hidden="true" />
          Share
        </Link>
        <Link
          href={`/reviews/${review.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bookmark className="size-4" aria-hidden="true" />
          Save
        </Link>
      </div>
    </article>
  );
}
