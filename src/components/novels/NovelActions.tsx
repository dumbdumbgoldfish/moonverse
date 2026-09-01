"use client";

import Link from "next/link";
import { useState } from "react";
import { PenLine, Share2 } from "lucide-react";
import { ReadingStatusValue } from "@prisma/client";
import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { moonieLoggedInEntryHref } from "@/lib/moonie/open-moonie";
import { ReadingStatusControl } from "@/components/novels/ReadingStatusControl";
import {
  MV_PRIMARY_BTN,
  SALON_OUTLINE_BTN,
} from "@/lib/novels/salon-surface";
import { buildWriteReviewHref } from "@/lib/write-entry";
import { cn } from "@/lib/utils";

interface NovelActionsProps {
  novelId: string;
  title: string;
  isLoggedIn: boolean;
  initialReadingStatus: ReadingStatusValue | null;
  tone?: "light" | "dark";
}

export function NovelActions({
  novelId,
  title,
  isLoggedIn,
  initialReadingStatus,
  tone = "light",
}: NovelActionsProps) {
  const [shareFeedback, setShareFeedback] = useState(false);
  const dark = tone === "dark";
  const writeHref = buildWriteReviewHref({ novelId, isLoggedIn });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareFeedback(true);
        window.setTimeout(() => setShareFeedback(false), 2000);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
    }
  };

  if (dark) {
    return (
      <div className="flex flex-wrap items-center gap-2.5">
        <AskMoonieButton
          href={moonieLoggedInEntryHref()}
          size="md"
          className="min-h-10 px-5 text-[13px] font-bold"
        />
        <Link
          href={writeHref}
          className={cn(MV_PRIMARY_BTN, "min-h-10 px-4 text-[13px] font-bold")}
        >
          <PenLine className="size-3.5" aria-hidden />
          Write a review
        </Link>
        <ReadingStatusControl
          novelId={novelId}
          isLoggedIn={isLoggedIn}
          initialStatus={initialReadingStatus}
          tone="night"
        />
        <button
          type="button"
          onClick={handleShare}
          className={cn(
            SALON_OUTLINE_BTN,
            "size-10 shrink-0 justify-center gap-0 px-0"
          )}
          aria-label={shareFeedback ? "Novel link copied" : "Share this novel"}
        >
          <Share2 className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={writeHref}
        className={cn(MV_PRIMARY_BTN, "min-h-10 px-4 text-sm font-bold")}
      >
        <PenLine className="size-4" aria-hidden />
        Write a review
      </Link>
      <ReadingStatusControl
        novelId={novelId}
        isLoggedIn={isLoggedIn}
        initialStatus={initialReadingStatus}
        tone="day"
      />
      <AskMoonieButton href={moonieLoggedInEntryHref()} size="md" />
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex size-10 items-center justify-center rounded-full text-[#4a4458] hover:bg-[#F4ECF8]"
        aria-label={shareFeedback ? "Novel link copied" : "Share this novel"}
      >
        <Share2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}
