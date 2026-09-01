"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";
import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { moonieLoggedInEntryHref } from "@/lib/moonie/open-moonie";
import { buildWriteReviewHref } from "@/lib/write-entry";
import { MV_PRIMARY_BTN } from "@/lib/novels/salon-surface";
import { cn } from "@/lib/utils";

interface NovelDecisionBarProps {
  novelId: string;
  isLoggedIn: boolean;
}

export function NovelDecisionBar({
  novelId,
  isLoggedIn,
}: NovelDecisionBarProps) {
  const writeHref = buildWriteReviewHref({ novelId, isLoggedIn });

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-40 border-t border-[#1A1224]/10 bg-white/95 px-3 py-2 backdrop-blur-md xl:hidden",
        isLoggedIn
          ? "bottom-[calc(var(--mv-mobile-nav-h)+env(safe-area-inset-bottom,0px))] md:bottom-0"
          : "bottom-0"
      )}
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-2">
        <Link
          href={writeHref}
          className={cn(MV_PRIMARY_BTN, "min-h-11 flex-1 px-3 text-sm font-bold")}
        >
          <PenLine className="size-4" aria-hidden />
          Write
        </Link>
        <AskMoonieButton
          href={moonieLoggedInEntryHref()}
          size="md"
          className="min-h-11 flex-1 px-3 text-sm font-bold"
        >
          Ask Moonie
        </AskMoonieButton>
      </div>
    </div>
  );
}
