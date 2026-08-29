import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "@/components/users/FollowButton";
import {
  estimateReadMinutes,
  formatReviewDate,
} from "@/lib/review-reading";
import type { ReviewerPublicStats } from "@/services/review.service";
import { cn } from "@/lib/utils";

interface ReviewBylineStripProps {
  reviewerName: string;
  reviewerUsername: string;
  reviewerAvatar: string;
  reviewerAvatarUrl?: string;
  reviewerId?: string;
  createdAt: string;
  body: string;
  reviewerStats?: ReviewerPublicStats | null;
  isOwner?: boolean;
  isLoggedIn?: boolean;
  initialFollowing?: boolean;
  className?: string;
}

export function ReviewBylineStrip({
  reviewerName,
  reviewerUsername,
  reviewerAvatar,
  reviewerAvatarUrl,
  reviewerId,
  createdAt,
  body,
  reviewerStats,
  isOwner = false,
  isLoggedIn = false,
  initialFollowing = false,
  className,
}: ReviewBylineStripProps) {
  const readMinutes = estimateReadMinutes(body);

  return (
    <div className={cn("flex min-w-0 items-start gap-3", className)}>
      <Avatar className="size-12 ring-1 ring-[#6E46C7]/12">
        {reviewerAvatarUrl ? (
          <AvatarImage src={reviewerAvatarUrl} alt={reviewerName} />
        ) : null}
        <AvatarFallback className="bg-[#F4ECF8] text-sm font-bold text-[#6E46C7]">
          {reviewerAvatar}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/users/${reviewerUsername}`}
            className="font-heading text-lg font-semibold text-[#1a1033] hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] rounded-sm"
          >
            {reviewerName}
          </Link>
          {reviewerId && !isOwner ? (
            <FollowButton
              userId={reviewerId}
              username={reviewerUsername}
              initialFollowing={initialFollowing}
              isLoggedIn={isLoggedIn}
              appearance="subtle"
            />
          ) : null}
        </div>
        <p className="mt-1 text-sm text-[#5a4d72]">
          @{reviewerUsername}
          <span className="text-[#c5bed4]"> · </span>
          <time dateTime={createdAt}>{formatReviewDate(createdAt)}</time>
          <span className="text-[#c5bed4]"> · </span>
          {readMinutes} min read
        </p>
        {reviewerStats?.reviewCount ? (
          <p className="mt-1 text-sm font-medium text-[#7a7284]">
            {reviewerStats.reviewCount}{" "}
            {reviewerStats.reviewCount === 1 ? "review" : "reviews"}
            {reviewerStats.averageRating != null
              ? ` · avg ${reviewerStats.averageRating.toFixed(1)}★`
              : ""}
            {reviewerStats.topGenre ? ` · mostly ${reviewerStats.topGenre}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}
