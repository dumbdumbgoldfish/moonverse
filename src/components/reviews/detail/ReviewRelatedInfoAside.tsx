import Link from "next/link";
import { BookOpen } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { ReviewCommunityInsight } from "@/components/reviews/detail/ReviewCommunityInsight";
import { ReviewReadingAvailability } from "@/components/reviews/detail/ReviewReadingAvailability";
import { DETAIL_CHIP, DETAIL_NOVEL_BTN } from "@/lib/reviews/detail-surface";
import { formatPublicationStatus } from "@/lib/moonie/presentation";
import { cn } from "@/lib/utils";
import type { NovelReviewStats } from "@/services/review.service";
import type { ReadingLinkItem } from "@/types/reading-link";
import type { ReviewDetail } from "@/types/review";

interface ReviewRelatedInfoAsideProps {
  review: ReviewDetail;
  stats: NovelReviewStats;
  readingLinks: ReadingLinkItem[];
  className?: string;
}

export function ReviewRelatedInfoAside({
  review,
  stats,
  readingLinks,
  className,
}: ReviewRelatedInfoAsideProps) {
  const statusLabel = formatPublicationStatus(review.publicationStatus);
  const chips = [...review.genres, ...review.tags]
    .filter(
      (value, index, values) =>
        values.findIndex(
          (candidate) => candidate.toLowerCase() === value.toLowerCase(),
        ) === index,
    )
    .slice(0, 4);

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}
      aria-label="Related novel information"
    >
      <Link
        href={`/novels/${review.novelId}`}
        className="group flex items-center gap-3 rounded-xl border border-[#1a1033]/8 bg-white px-3 py-2.5 shadow-[0_10px_32px_-22px_rgba(20,17,31,0.4)] transition hover:border-[#6E46C7]/20"
      >
        <span className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-md bg-[#F4ECF8] ring-1 ring-[#1a1033]/8">
          <CoverImage
            src={review.coverUrl}
            alt=""
            title={review.novelTitle}
            sizes="40px"
            className="object-cover"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6E46C7]">
            <BookOpen className="size-3" aria-hidden />
            Reviewing
          </span>
          <span className="mt-0.5 block line-clamp-1 font-heading text-sm font-semibold text-[#1a1033] group-hover:text-[#6E46C7]">
            {review.novelTitle}
          </span>
          {statusLabel ? (
            <span className="mt-0.5 block text-[11px] text-[#7a7284]">{statusLabel}</span>
          ) : null}
        </span>
      </Link>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {chips.map((chip) => (
            <span key={chip} className={cn(DETAIL_CHIP, "px-2 py-0.5 text-[10px]")}>
              {chip.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <ReviewCommunityInsight
          novelId={review.novelId}
          novelTitle={review.novelTitle}
          reviewRating={review.rating}
          stats={stats}
        />
        <ReviewReadingAvailability
          novelTitle={review.novelTitle}
          readingLinks={readingLinks}
        />
      </div>

      <Link
        href={`/novels/${review.novelId}`}
        className={cn(DETAIL_NOVEL_BTN, "h-9 w-full px-3 text-xs")}
      >
        Open novel page
      </Link>
    </div>
  );
}
