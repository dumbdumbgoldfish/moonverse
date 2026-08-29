import Link from "next/link";
import { Sparkles, Tag } from "lucide-react";
import { CommunityPostMenu } from "@/components/community/CommunityPostMenu";
import { PremiumNovelAttachment } from "@/components/home/community/PremiumNovelAttachment";
import { ReviewExcerpt } from "@/components/feed/ReviewExcerpt";
import { FollowButton } from "@/components/users/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCompactRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export interface CommunityReviewPostFields {
  id: string;
  title: string;
  body: string;
  containsSpoilers: boolean;
  novelId: string;
  novelTitle: string;
  novelAuthor: string;
  coverUrl: string;
  rating: number;
  genres: string[];
  tags: string[];
  reviewerName: string;
  reviewerUsername: string;
  reviewerAvatar: string;
  reviewerAvatarUrl?: string;
  userId?: string;
  createdAt: string;
}

interface CommunityReviewPostLayoutProps {
  review: CommunityReviewPostFields;
  initialFollowing: boolean;
  isOwner: boolean;
  isLoggedIn?: boolean;
  defaultExpanded?: boolean;
  titleAs?: "h1" | "h2";
  titleClassName?: string;
  onTitleClick?: () => void;
  onContinueRead?: () => void;
  feedReason?: string | null;
  className?: string;
}

export function CommunityReviewPostLayout({
  review,
  initialFollowing,
  isOwner,
  isLoggedIn = true,
  defaultExpanded = false,
  titleAs: TitleTag = "h2",
  titleClassName,
  onTitleClick,
  onContinueRead,
  feedReason,
  className,
}: CommunityReviewPostLayoutProps) {
  const visibleTags = review.tags
    .filter((tag) => {
      if (review.genres.length === 1 && tag === review.genres[0]) return false;
      return !/spoiler/i.test(tag);
    })
    .slice(0, defaultExpanded ? 8 : 3);
  const extraTagCount = Math.max(
    0,
    review.tags.filter((tag) => !/spoiler/i.test(tag)).length - visibleTags.length
  );

  const titleClass = cn(
    "text-[15px] font-semibold leading-snug text-[var(--mv-ink)]",
    !defaultExpanded && "line-clamp-3 hover:text-[var(--mv-plum)]",
    titleClassName
  );

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <Link
          href={`/users/${review.reviewerUsername}`}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]"
        >
          <Avatar className="size-10">
            {review.reviewerAvatarUrl ? (
              <AvatarImage src={review.reviewerAvatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-[var(--mv-plum)]/10 text-xs font-semibold text-[var(--mv-plum)]">
              {review.reviewerAvatar}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <Link
              href={`/users/${review.reviewerUsername}`}
              className="truncate text-[15px] font-semibold text-[var(--mv-ink)] hover:underline"
            >
              {review.reviewerName}
            </Link>
            {!isOwner && review.userId ? (
              <FollowButton
                userId={review.userId}
                username={review.reviewerUsername}
                initialFollowing={initialFollowing}
                isLoggedIn={isLoggedIn}
                appearance="subtle"
              />
            ) : null}
          </div>
          <time
            dateTime={review.createdAt}
            className="block text-[13px] text-[var(--mv-text-muted)]"
          >
            {formatCompactRelativeTime(review.createdAt)}
          </time>
          {feedReason ? (
            <p className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full border border-[var(--mv-plum)]/20 bg-[var(--mv-plum)]/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-[var(--mv-plum)]">
              <Sparkles className="size-3 shrink-0" aria-hidden />
              {feedReason}
            </p>
          ) : null}
        </div>
        {isOwner ? (
          <CommunityPostMenu
            reviewId={review.id}
            onSave={() => {
              document.getElementById(`save-review-${review.id}`)?.click();
            }}
          />
        ) : null}
      </div>

      <div className="mt-3">
        {onTitleClick ? (
          <button
            type="button"
            onClick={onTitleClick}
            className="block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]"
          >
            <TitleTag className={titleClass}>{review.title}</TitleTag>
          </button>
        ) : (
          <TitleTag className={titleClass}>{review.title}</TitleTag>
        )}

        <PremiumNovelAttachment
          novelId={review.novelId}
          title={review.novelTitle}
          author={review.novelAuthor}
          coverUrl={review.coverUrl}
          rating={review.rating}
          genres={review.genres}
        />

        <ReviewExcerpt
          body={review.body}
          containsSpoilers={review.containsSpoilers}
          variant="literary"
          defaultExpanded={defaultExpanded}
          onContinueRead={onContinueRead}
        />

        {visibleTags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <Link
                key={tag}
                href={`/search?tags=${encodeURIComponent(tag)}`}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--mv-border)] bg-[var(--mv-paper)]/70 px-2 py-0.5 text-[11px] font-medium text-[var(--mv-ink)] transition hover:border-[var(--mv-plum)]/30"
              >
                <Tag className="size-2.5 text-[var(--mv-plum)]" aria-hidden />
                {tag}
              </Link>
            ))}
            {extraTagCount > 0 ? (
              <span className="rounded-md border border-[var(--mv-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--mv-text-muted)]">
                +{extraTagCount}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
