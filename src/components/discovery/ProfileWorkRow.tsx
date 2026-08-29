import Link from "next/link";
import { Heart, MessageCircle, Star } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatCompactCount } from "@/lib/format-utils";
import type { ReviewListItem } from "@/types/review";

interface ProfileWorkRowProps {
  review: ReviewListItem;
}

export function ProfileWorkRow({ review }: ProfileWorkRowProps) {
  return (
    <Link
      href={`/reviews/${review.id}`}
      className="flex gap-3 border-b border-border/40 px-4 py-4 transition-colors active:bg-muted/40"
    >
      <div className="relative h-[100px] w-[68px] shrink-0 overflow-hidden rounded-md bg-muted shadow-sm">
        <CoverImage
          src={review.coverUrl}
          alt=""
          title={review.novelTitle}
          sizes="68px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-bold leading-snug">{review.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3" aria-hidden="true" />
            {formatCompactCount(review.likeCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="size-3 fill-[var(--mv-star-gold)] text-[var(--mv-star-gold)]" aria-hidden="true" />
            {review.rating}
          </span>
          {review.commentCount !== undefined && (
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3" aria-hidden="true" />
              {review.commentCount}
            </span>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {review.excerpt}
        </p>
        {review.genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {review.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {genre.toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
