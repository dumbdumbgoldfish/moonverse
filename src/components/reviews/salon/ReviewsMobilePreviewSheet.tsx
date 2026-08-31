"use client";

import Link from "next/link";
import { AddToFolderMenu } from "@/components/folders/AddToFolderMenu";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { CoverImage } from "@/components/ui/CoverImage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { moonieGuestEntryHref, moonieLoggedInEntryHref } from "@/lib/moonie/open-moonie";
import type { FolderListItem } from "@/types/folder";
import type { ReviewListItem } from "@/types/review";
import { ReviewVerdictBadge } from "./ReviewVerdictBadge";
import { ReviewerCredibilityStrip } from "./ReviewerCredibilityStrip";

interface ReviewsMobilePreviewSheetProps {
  review: ReviewListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoggedIn: boolean;
  folders: FolderListItem[];
  onAuthRequired: () => void;
}

export function ReviewsMobilePreviewSheet({
  review,
  open,
  onOpenChange,
  isLoggedIn,
  folders,
  onAuthRequired,
}: ReviewsMobilePreviewSheetProps) {
  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="fixed inset-x-0 bottom-0 top-auto max-h-[88vh] w-full max-w-none translate-x-0 translate-y-0 rounded-t-[1.5rem] rounded-b-none border-x-0 border-b-0 bg-[#FBF7F1] p-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:max-w-none"
      >
        <div className="mx-auto mb-2 mt-2 h-1 w-10 rounded-full bg-[#1A1224]/15" />
        <DialogHeader className="px-5 pb-0 pt-1 text-left">
          <DialogTitle className="font-serif text-lg text-[#1A1224]">
            Review preview
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(88vh-4rem)] overflow-y-auto px-5 pb-8 pt-4">
          <div className="flex gap-4">
            <div className="relative h-[132px] w-[88px] shrink-0 overflow-hidden rounded-xl ring-1 ring-[#1A1224]/10">
              <CoverImage
                src={review.coverUrl}
                alt=""
                title={review.novelTitle}
                sizes="88px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <ReviewVerdictBadge rating={review.rating} size="md" />
              <Link
                href={`/novels/${review.novelId}`}
                className="mt-2 block font-serif text-lg leading-snug text-[#1A1224]"
                onClick={() => onOpenChange(false)}
              >
                {review.novelTitle}
              </Link>
              <p className="mt-1 text-sm text-[#1A1224]/55">
                {review.novelAuthor}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <ReviewerCredibilityStrip review={review} className="w-full" />
          </div>

          {review.feedReason ? (
            <p className="mt-3 text-xs font-medium text-[#6E46C7]">
              {review.feedReason}
            </p>
          ) : null}

          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-[#1A1224]/75">
            {review.excerpt || review.title}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/reviews/${review.id}`}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-[#1A1224] px-4 text-sm font-bold text-white"
              onClick={() => onOpenChange(false)}
            >
              Read review
            </Link>
            {isLoggedIn ? (
              <AddToFolderMenu
                reviewId={review.id}
                folders={folders}
                savedFolderIds={[]}
                isLoggedIn
                appearance="toolbar"
              />
            ) : (
              <button
                type="button"
                onClick={onAuthRequired}
                className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#6E46C7] ring-1 ring-[#1A1224]/10"
              >
                Save
              </button>
            )}
          </div>

          <AskMoonieLink
            href={
              isLoggedIn ? moonieLoggedInEntryHref() : moonieGuestEntryHref()
            }
            size="xs"
            className="mt-4 text-xs font-semibold shadow-none"
          >
            Ask Moonie for similar reads
          </AskMoonieLink>
        </div>
      </DialogContent>
    </Dialog>
  );
}
