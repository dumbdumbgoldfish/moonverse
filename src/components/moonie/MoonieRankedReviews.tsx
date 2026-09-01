"use client";

import Link from "next/link";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { MOONIE_CHAT_ATTACHMENT_CARD, MOONIE_CHAT_REVIEW_CARD_STACK } from "@/components/moonie/moonie-chat-bubble-styles";
import type { MoonieCardDensity } from "@/lib/moonie/presentation";
import { cn } from "@/lib/utils";
import type { MoonieRankedReview } from "@/types/moonie";

export function MoonieRankedReviews({
  reviews,
  density = "desk",
  className,
}: {
  reviews: MoonieRankedReview[];
  density?: MoonieCardDensity;
  className?: string;
}) {
  const isWidget = density === "widget";

  return (
    <div
      className={cn(
        MOONIE_CHAT_REVIEW_CARD_STACK,
        isWidget && "gap-2",
        className
      )}
    >
      {reviews.map((review) => (
        <article
          key={review.id}
          className={cn(
            MOONIE_CHAT_ATTACHMENT_CARD,
            "rounded-2xl border border-violet-100 bg-[#FFFBFF] ring-1 ring-violet-50",
            isWidget ? "px-2.5 py-2" : "px-4 py-3"
          )}
        >
          <p className={cn("text-slate-500", isWidget ? "text-[11px]" : "text-xs")}>
            {review.novelTitle}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-600">
            <span className="font-semibold text-[#1A1224]">{review.reviewerName}</span>
            <span aria-hidden>·</span>
            <span className="font-semibold text-[#4C2A67]">★{review.rating}</span>
          </div>
          <p
            className={cn(
              "mt-0.5 font-semibold text-[#1A1224]",
              isWidget ? "line-clamp-1 text-xs" : "text-sm"
            )}
          >
            {review.title}
          </p>
          <p
            className={cn(
              "text-slate-600",
              isWidget
                ? "mt-0.5 line-clamp-2 text-[11px] leading-snug"
                : "mt-1 line-clamp-3 text-sm leading-relaxed"
            )}
          >
            {review.excerpt}
          </p>
          <div className={cn("flex flex-wrap gap-2", isWidget ? "mt-1" : "mt-2")}>
            <Link
              href={`/reviews/${review.id}`}
              className={cn(
                "inline-flex font-semibold text-[#6E46C7] hover:underline",
                isWidget ? "text-[11px]" : "text-xs"
              )}
            >
              {isWidget ? "Read review" : "Read full review"}
            </Link>
            <CatalogLink
              href={`/novels/${review.novelId}`}
              size="compact"
              className="inline-flex"
            >
              View novel
            </CatalogLink>
          </div>
        </article>
      ))}
    </div>
  );
}
