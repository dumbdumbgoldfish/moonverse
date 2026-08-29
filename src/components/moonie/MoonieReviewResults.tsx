"use client";

import Link from "next/link";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { MOONIE_CHAT_ATTACHMENT_CARD } from "@/components/moonie/moonie-chat-bubble-styles";
import type { MoonieCardDensity } from "@/lib/moonie/presentation";
import { cn } from "@/lib/utils";
import type { MoonieNovelOverview } from "@/types/moonie";

interface MoonieReviewResultsProps {
  overview: MoonieNovelOverview;
  density?: MoonieCardDensity;
  className?: string;
}

const WIDGET_PREVIEW_LIMIT = 2;
const DESK_PREVIEW_LIMIT = 3;

export function MoonieReviewResults({
  overview,
  density = "desk",
  className,
}: MoonieReviewResultsProps) {
  const isWidget = density === "widget";
  const community = overview.community;
  const reviewCount = community?.reviewCount ?? 0;
  const previews = (community?.previews ?? []).slice(
    0,
    isWidget ? WIDGET_PREVIEW_LIMIT : DESK_PREVIEW_LIMIT
  );
  const averageRating = community?.averageRating ?? null;
  const novelHref = `/novels/${overview.novelId}`;

  if (reviewCount === 0 || previews.length === 0) {
    return (
      <article
        className={cn(
          MOONIE_CHAT_ATTACHMENT_CARD,
          "rounded-2xl border border-violet-100 bg-[#FFFBFF] ring-1 ring-violet-50",
          isWidget ? "px-2.5 py-2" : "px-4 py-4",
          className
        )}
      >
        <p className={cn("text-slate-600", isWidget ? "text-xs" : "text-sm")}>
          There aren&apos;t any MoonVerse reviews for{" "}
          <span className="font-semibold text-[#1A1224]">{overview.title}</span>{" "}
          yet.
        </p>
        <CatalogLink href={novelHref} size="compact" className="mt-1.5 inline-flex">
          View novel
        </CatalogLink>
      </article>
    );
  }

  const ratingLine =
    averageRating != null
      ? `${reviewCount} review${reviewCount === 1 ? "" : "s"} · ${averageRating.toFixed(1)} average`
      : `${reviewCount} review${reviewCount === 1 ? "" : "s"}`;

  return (
    <article
      className={cn(
        MOONIE_CHAT_ATTACHMENT_CARD,
        "rounded-2xl border border-violet-100 bg-[#FFFBFF] ring-1 ring-violet-50",
        isWidget ? "px-2.5 py-2" : "px-4 py-4",
        className
      )}
    >
      <div className="space-y-0.5">
        <h3
          className={cn(
            "font-[family-name:var(--font-source-serif)] font-semibold text-[#1A1224]",
            isWidget ? "text-sm leading-snug" : "text-lg"
          )}
        >
          {overview.title}
        </h3>
        <p className="text-[11px] text-slate-500">{ratingLine}</p>
      </div>

      <div className={cn(isWidget ? "mt-2 space-y-1.5" : "mt-4 space-y-3")}>
        {previews.map((preview) => (
          <div
            key={preview.id}
            className={cn(
              "rounded-xl border border-violet-100 bg-white",
              isWidget ? "px-2 py-1.5" : "px-3 py-2.5"
            )}
          >
            <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-600">
              <span className="font-semibold text-[#1A1224]">
                {preview.reviewerName}
              </span>
              <span aria-hidden>·</span>
              <span className="font-semibold text-[#4C2A67]">
                ★{preview.rating}
              </span>
            </div>
            <p
              className={cn(
                "mt-0.5 font-semibold text-[#1A1224]",
                isWidget ? "line-clamp-1 text-xs" : "text-sm"
              )}
            >
              {preview.title}
            </p>
            <p
              className={cn(
                "text-slate-600",
                isWidget
                  ? "mt-0.5 line-clamp-2 text-[11px] leading-snug"
                  : "mt-1 line-clamp-3 text-sm leading-relaxed"
              )}
            >
              {preview.excerpt}
            </p>
            <Link
              href={`/reviews/${preview.id}`}
              className={cn(
                "inline-flex font-semibold text-[#6E46C7] hover:underline",
                isWidget ? "mt-1 text-[11px]" : "mt-2 text-xs"
              )}
            >
              {isWidget ? "Read review" : "Read full review"}
            </Link>
          </div>
        ))}
      </div>

      <CatalogLink
        href={novelHref}
        size="compact"
        className={cn("inline-flex", isWidget ? "mt-2" : "mt-4")}
      >
        View all {reviewCount} review{reviewCount === 1 ? "" : "s"}
      </CatalogLink>
    </article>
  );
}
