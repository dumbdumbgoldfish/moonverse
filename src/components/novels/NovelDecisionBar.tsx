"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";
import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { MV_PRIMARY_BTN } from "@/lib/novels/salon-surface";
import { cn } from "@/lib/utils";

interface NovelDecisionBarProps {
  novelId: string;
  title: string;
  isLoggedIn: boolean;
}

export function NovelDecisionBar({
  novelId,
  title,
  isLoggedIn,
}: NovelDecisionBarProps) {
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
          href={
            isLoggedIn
              ? `/reviews/new?novelId=${novelId}`
              : `/login?callbackUrl=/reviews/new?novelId=${novelId}`
          }
          className={cn(MV_PRIMARY_BTN, "min-h-11 flex-1 px-3 text-sm font-bold")}
        >
          <PenLine className="size-4" aria-hidden />
          Write
        </Link>
        <AskMoonieButton
          prompt={`Recommend novels similar to ${title}`}
          size="md"
          className="min-h-11 flex-1 px-3 text-sm font-bold"
        >
          Ask Moonie
        </AskMoonieButton>
      </div>
    </div>
  );
}
