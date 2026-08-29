"use client";

import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import { AddToFolderMenu } from "@/components/folders/AddToFolderMenu";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { CoverImage } from "@/components/ui/CoverImage";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import { buildMoonieSimilarPrompt } from "@/lib/discover";
import { formatCompactCount } from "@/lib/format-utils";
import type { FolderListItem } from "@/types/folder";
import type { ReviewListItem } from "@/types/review";

interface DiscoverPreviewRailProps {
  review: ReviewListItem | null;
  isLoggedIn: boolean;
  folders: FolderListItem[];
  currentUserId?: string;
  onAuthRequired: () => void;
}

export function DiscoverPreviewRail({
  review,
  isLoggedIn,
  folders,
  currentUserId,
  onAuthRequired,
}: DiscoverPreviewRailProps) {
  if (!review) {
    return (
      <div>
        <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-[#1A1224]/8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A1224]/45">
            Preview
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#1A1224]/60">
            Hover a review to preview the work here.
          </p>
        </div>
      </div>
    );
  }

  const score = Number(review.novelAverageRating ?? review.rating).toFixed(1);
  const similarHref = moonieEntryHref(
    buildMoonieSimilarPrompt(review.novelTitle, review.novelAuthor)
  );
  const isOwn = Boolean(currentUserId && review.reviewerId === currentUserId);

  return (
    <div>
      <div className="space-y-4">
        <article className="overflow-hidden rounded-2xl bg-white/80 ring-1 ring-[#1A1224]/8">
          <div className="relative aspect-[2/3] w-full bg-[#1A1224]/5">
            <CoverImage
              src={review.coverUrl}
              alt=""
              title={review.novelTitle}
              sizes="280px"
              className="object-cover"
            />
          </div>
          <div className="space-y-3 p-4">
            <div>
              <Link
                href={`/novels/${review.novelId}`}
                className="font-serif text-lg leading-snug text-[#1A1224] transition-colors duration-150 hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
              >
                {review.novelTitle}
              </Link>
              <p className="mt-0.5 text-sm text-[#1A1224]/55">
                {review.novelAuthor}
              </p>
            </div>

            <p className="inline-flex items-center gap-1 text-sm text-[#1A1224]">
              <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
              <span className="tabular-nums">{score}</span>
              {review.novelReviewCount ? (
                <span className="text-[#1A1224]/50">
                  · {formatCompactCount(review.novelReviewCount)}{" "}
                  {review.novelReviewCount === 1 ? "review" : "reviews"}
                </span>
              ) : null}
            </p>

            <p className="line-clamp-4 text-[13px] leading-relaxed text-[#1A1224]/75">
              {review.containsSpoilers
                ? "This review is marked as containing spoilers."
                : review.excerpt || review.title}
            </p>

            {review.officialLinkUrl ? (
              <a
                href={review.officialLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6E46C7] underline-offset-2 hover:underline"
              >
                {review.officialLinkLabel || "Official reading link"}
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {isLoggedIn ? (
                <AddToFolderMenu
                  reviewId={review.id}
                  folders={folders}
                  savedFolderIds={[]}
                  isLoggedIn={isLoggedIn}
                  appearance="toolbar"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onAuthRequired()}
                  className="inline-flex h-8 items-center rounded-full bg-[#1A1224]/5 px-3 text-[13px] font-medium text-[#1A1224] transition-colors duration-150 hover:bg-[#1A1224]/10"
                >
                  Save
                </button>
              )}
              {!isOwn && review.reviewerUsername ? (
                isLoggedIn ? (
                  <Link
                    href={`/users/${review.reviewerUsername}`}
                    className="inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium text-[#6E46C7]"
                  >
                    Follow {review.reviewerName.split(" ")[0]}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAuthRequired()}
                    className="inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium text-[#6E46C7]"
                  >
                    Follow
                  </button>
                )
              ) : null}
            </div>

            <AskMoonieLink
              href={similarHref}
              size="xs"
              className="text-[13px] font-medium shadow-none"
            >
              Ask Moonie for similar
            </AskMoonieLink>
          </div>
        </article>
      </div>
    </div>
  );
}
