"use client";

import Link from "next/link";
import { ArrowRight, Link2, Star, Tag } from "lucide-react";
import { DiscoverReviewCard } from "@/components/discovery/DiscoverReviewCard";
import type { DiscoverLayout } from "@/lib/discover";
import { cn } from "@/lib/utils";
import type { DiscoverTagPreview } from "@/types/discovery";
import type { ReviewListItem } from "@/types/review";

interface BrowseSecondaryRailsProps {
  popularTags: DiscoverTagPreview[];
  highestRated: ReviewListItem[];
  layout: DiscoverLayout;
  isLoggedIn: boolean;
  hasOfficialLinkFilter: boolean;
  onToggleOfficialLink: () => void;
  onToggleTag: (slug: string) => void;
  onAuthRequired: () => void;
}

export function BrowseSecondaryRails({
  popularTags,
  highestRated,
  layout,
  isLoggedIn,
  hasOfficialLinkFilter,
  onToggleOfficialLink,
  onToggleTag,
  onAuthRequired,
}: BrowseSecondaryRailsProps) {
  const tags = popularTags.slice(0, 10);

  return (
    <div className="mt-10 space-y-8 border-t border-[#1A1224]/8 pt-10">
      {tags.length > 0 ? (
        <section aria-label="Trending tags">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A1224]">
              <Tag className="size-3.5 text-[#6E46C7]" aria-hidden />
              Trending tags
            </h2>
          </div>
          <div className="discover-hscroll -mx-4 flex gap-2 px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            {tags.map((tag) => (
              <button
                key={tag.slug}
                type="button"
                onClick={() => onToggleTag(tag.slug)}
                className="inline-flex shrink-0 items-center rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1A1224]/80 ring-1 ring-[#1A1224]/10 transition-colors hover:ring-[#6E46C7]/30"
              >
                {tag.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="Official reading links">
        <button
          type="button"
          onClick={onToggleOfficialLink}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors",
            hasOfficialLinkFilter
              ? "bg-[#6E46C7]/10 ring-1 ring-[#6E46C7]/25"
              : "bg-white/70 ring-1 ring-[#1A1224]/8 hover:bg-white"
          )}
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1224]">
            <Link2 className="size-4 text-[#6E46C7]" aria-hidden />
            Works with official reading links
          </span>
          <ArrowRight className="size-4 text-[#1A1224]/40" aria-hidden />
        </button>
      </section>

      {highestRated.length > 0 ? (
        <section aria-label="Highest rated this month">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A1224]">
              <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
              Highest rated
            </h2>
            <Link
              href="/reviews?sort=highest-rated"
              className="text-[12px] font-semibold text-[#6E46C7] hover:underline"
            >
              View all
            </Link>
          </div>
          <div
            className={cn(
              layout === "covers"
                ? "grid grid-cols-2 gap-3 sm:grid-cols-4"
                : "grid gap-3 sm:grid-cols-2"
            )}
          >
            {highestRated.map((review) => (
              <DiscoverReviewCard
                key={review.id}
                review={review}
                layout={layout === "covers" ? "covers" : "compact"}
                isLoggedIn={isLoggedIn}
                folders={[]}
                onAuthRequired={onAuthRequired}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
