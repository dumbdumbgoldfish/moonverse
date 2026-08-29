import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { StarRating } from "@/components/reviews/StarRating";
import {
  DeskActionRow,
  DeskDangerButton,
  DeskOutlineButton,
  DeskPrimaryButton,
  deskEqualWidth,
} from "@/components/reviews/write/WritingDeskButtons";
import { formatReviewDay } from "@/components/reviews/my-reviews/review-archive-utils";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

interface MyReviewArchiveCardProps {
  review: ReviewListItem;
  deletingReviewId: string | null;
  onDelete: (reviewId: string) => void;
  className?: string;
}

export function MyReviewArchiveCard({
  review,
  deletingReviewId,
  onDelete,
  className,
}: MyReviewArchiveCardProps) {
  return (
    <article
      className={cn(
        "flex gap-3.5 rounded-2xl border border-violet-100/90 bg-white p-3.5 shadow-[0_12px_32px_-24px_rgba(76,29,149,0.4)] sm:gap-4 sm:p-4",
        className
      )}
    >
      <Link
        href={`/novels/${review.novelId}`}
        className="relative h-28 w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-violet-100 ring-1 ring-black/5 sm:h-32 sm:w-20"
      >
        <CoverImage
          src={review.coverUrl}
          alt=""
          title={review.novelTitle}
          author={review.novelAuthor}
          themeSeed={review.novelId}
          sizes="80px"
          fill
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
              {formatReviewDay(review.createdAt)}
            </p>
            <Link
              href={`/reviews/${review.id}`}
              className="mt-1 line-clamp-2 font-serif text-base font-bold leading-snug text-night-blue hover:text-primary sm:text-lg"
            >
              {review.title}
            </Link>
            <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">
              {review.novelTitle}
              {review.novelAuthor ? ` · ${review.novelAuthor}` : ""}
            </p>
          </div>
          <StarRating rating={review.rating} size="md" className="shrink-0" />
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
          {review.excerpt || review.body}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#faf8ff] px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-violet-100">
            <Heart className="size-3.5 text-primary" aria-hidden />
            {review.likeCount}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#faf8ff] px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-violet-100">
            <MessageCircle className="size-3.5 text-primary" aria-hidden />
            {review.commentCount}
          </span>
          {review.containsSpoilers ? (
            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-100">
              Spoilers
            </span>
          ) : null}
        </div>

        <DeskActionRow className="mt-3">
          <DeskOutlineButton
            deskSize="sm"
            className={deskEqualWidth}
            render={<Link href={`/reviews/${review.id}/edit`} />}
          >
            Edit
          </DeskOutlineButton>
          <DeskPrimaryButton
            deskSize="sm"
            className={deskEqualWidth}
            render={<Link href={`/reviews/${review.id}`} />}
          >
            Open
          </DeskPrimaryButton>
          <DeskDangerButton
            type="button"
            deskSize="sm"
            className={deskEqualWidth}
            disabled={deletingReviewId === review.id}
            showDeleteIcon={deletingReviewId !== review.id}
            onClick={() => onDelete(review.id)}
          >
            {deletingReviewId === review.id ? "…" : "Delete"}
          </DeskDangerButton>
        </DeskActionRow>
      </div>
    </article>
  );
}
