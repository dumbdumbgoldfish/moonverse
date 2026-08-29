import Image from "next/image";
import { Bookmark, Heart, MessageCircle, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { canUseNextImageCover, isMissingCoverUrl, shouldSkipCoverOptimizer } from "@/lib/review-utils";
import { cn } from "@/lib/utils";

/** Decorative review card used on the write promo / write gate. */
export interface WritePromoReviewCard {
  title: string;
  novelTitle: string;
  coverUrl: string;
  rating: number;
  excerpt: string;
  genres: string[];
  reviewerName: string;
  reviewerUsername?: string;
  reviewerAvatar: string;
  likeCount: number;
  commentCount?: number;
  saveCount?: number;
}

interface WriteReviewMockCardProps {
  review: WritePromoReviewCard;
  className?: string;
  commentCount?: number;
}

function CoverThumb({ review }: { review: WritePromoReviewCard }) {
  if (isMissingCoverUrl(review.coverUrl)) {
    return (
      <div className="relative flex h-[72px] w-[52px] shrink-0 flex-col justify-between overflow-hidden rounded-lg bg-gradient-to-br from-[#1e1636] via-[#3a2b6b] to-[#6246ea] p-1.5 shadow-sm">
        <span className="text-[6px] font-black uppercase tracking-wider text-white/50">
          MV
        </span>
        <p className="line-clamp-3 font-serif text-[8px] font-bold leading-tight text-white">
          {review.novelTitle}
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[72px] w-[52px] shrink-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5">
      {canUseNextImageCover(review.coverUrl) ? (
        <Image
          src={review.coverUrl}
          alt=""
          fill
          className="object-cover"
          sizes="52px"
          unoptimized={shouldSkipCoverOptimizer(review.coverUrl)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- host not in next/image allowlist
        <img
          src={review.coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}

export function WriteReviewMockCard({
  review,
  className,
  commentCount = 0,
}: WriteReviewMockCardProps) {
  return (
    <div
      className={cn(
        "pointer-events-none w-[min(100%,280px)] select-none rounded-2xl border border-violet-200/80 bg-white/95 p-3.5 shadow-[0_16px_40px_-20px_rgba(76,29,149,0.28)] backdrop-blur-sm",
        className
      )}
      aria-hidden
    >
      <div className="flex items-center gap-2.5">
        <Avatar size="sm">
          <AvatarFallback className="bg-violet-100 text-[10px] font-bold text-violet-700">
            {review.reviewerAvatar}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            {review.reviewerName}
          </p>
          {review.reviewerUsername ? (
            <p className="text-xs text-slate-500">@{review.reviewerUsername}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        <CoverThumb review={review} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-950">
            {review.title}
          </p>
          <p className="mt-1 text-xs text-violet-700">{review.novelTitle}</p>
          <div className="mt-1.5 flex items-center gap-0.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={cn(
                  "size-3",
                  index < review.rating
                    ? "fill-[var(--mv-gold)] text-[var(--mv-gold)]"
                    : "fill-slate-200 text-slate-200"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
        {review.excerpt}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {review.genres.slice(0, 2).map((genre) => (
          <Badge
            key={genre}
            variant="secondary"
            className="rounded-md bg-violet-50 px-2 py-0 text-[10px] font-semibold text-violet-700"
          >
            {genre}
          </Badge>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3.5 text-rose-400" aria-hidden />
          {review.likeCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="size-3.5 text-violet-500" aria-hidden />
          {commentCount}
        </span>
        {typeof review.saveCount === "number" ? (
          <span className="inline-flex items-center gap-1">
            <Bookmark className="size-3.5 text-amber-500" aria-hidden />
            {review.saveCount}
          </span>
        ) : null}
      </div>
    </div>
  );
}
