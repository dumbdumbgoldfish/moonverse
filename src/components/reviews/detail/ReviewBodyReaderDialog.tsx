"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReviewSpoilerGate } from "@/components/reviews/detail/ReviewSpoilerGate";
import { ReviewStickyToc } from "@/components/reviews/detail/ReviewStickyToc";
import { ReviewStructuredBody } from "@/components/reviews/detail/ReviewStructuredBody";
import type { ReviewBodyTocItem } from "@/lib/review-body";

interface ReviewBodyReaderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  containsSpoilers?: boolean;
  isLoggedIn?: boolean;
  tocItems?: ReviewBodyTocItem[];
}

export function ReviewBodyReaderDialog({
  open,
  onOpenChange,
  title,
  body,
  containsSpoilers = false,
  isLoggedIn = true,
  tocItems = [],
}: ReviewBodyReaderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(88dvh,760px)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-[#1a1033]/10 bg-[#FFFBFF] p-0 sm:w-full"
      >
        <DialogHeader className="shrink-0 border-b border-[#1a1033]/8 px-5 py-4 text-left">
          <DialogTitle className="font-heading text-lg font-semibold leading-snug text-[#1a1033] sm:text-xl">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
          {tocItems.length >= 2 ? (
            <ReviewStickyToc items={tocItems} className="mb-4" />
          ) : null}
          <ReviewSpoilerGate containsSpoilers={containsSpoilers}>
            <ReviewStructuredBody
              body={body}
              isLoggedIn={isLoggedIn}
              forceExpanded
              className="[&_p]:text-[1rem] [&_p]:leading-[1.7] sm:[&_p]:text-[1.0625rem]"
            />
          </ReviewSpoilerGate>
        </div>
      </DialogContent>
    </Dialog>
  );
}
