import Link from "next/link";
import { Heart, MessageCircle, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CoverImage } from "@/components/ui/CoverImage";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

interface CompactReviewRowProps {
  review: ReviewListItem;
  variant?: "same-novel" | "reviewer";
  className?: string;
  badge?: string;
}

export function CompactReviewRow({
  review,
  variant = "same-novel",
  className,
  badge,
}: CompactReviewRowProps) {
  const sameNovel = variant === "same-novel";

  return (
    <Link
      href={`/reviews/${review.id}`}
      className={cn(
        "group flex h-full min-h-[8.5rem] gap-3 rounded-[1.1rem] border border-[#1a1033]/8 bg-[#FFFBFF] p-3 transition",
        "hover:border-[#6E46C7]/25 hover:bg-white hover:shadow-[0_10px_24px_-18px_rgba(110,70,199,0.28)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
        className
      )}
    >
      {sameNovel ? (
        <Avatar className="size-11 shrink-0 ring-1 ring-[#6E46C7]/12">
          {review.reviewerAvatarUrl ? (
            <AvatarImage
              src={review.reviewerAvatarUrl}
              alt={review.reviewerName}
            />
          ) : null}
          <AvatarFallback className="bg-[#F4ECF8] text-xs font-bold text-[#6E46C7]">
            {review.reviewerAvatar}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="relative h-[6.5rem] w-[4.35rem] shrink-0 overflow-hidden rounded-lg bg-[#F4ECF8] ring-1 ring-[#1a1033]/8">
          <CoverImage
            src={review.coverUrl}
            alt={`Cover of ${review.novelTitle}`}
            title={review.novelTitle}
            themeSeed={review.novelId}
            sizes="70px"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {badge ? (
          <span className="w-fit rounded-full bg-[#F4ECF8] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#6E46C7]">
            {badge}
          </span>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8f711e]">
            <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
            {review.rating.toFixed(1)}
          </span>
          <span className="truncate text-xs font-semibold text-[#5a4d72]">
            {sameNovel ? `@${review.reviewerUsername}` : review.novelTitle}
          </span>
        </div>
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[#1a1033] group-hover:text-[#6E46C7]">
          {review.title}
        </h3>
        <p className="line-clamp-2 text-xs leading-5 text-[#5a4d72]">
          {review.excerpt}
        </p>
        <div className="mt-auto flex items-center gap-3 pt-1.5 text-[11px] font-semibold text-[#7a7284]">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5" aria-hidden />
            {review.likeCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" aria-hidden />
            {review.commentCount ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
