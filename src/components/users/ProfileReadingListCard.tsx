import Link from "next/link";
import { BookOpen, Lock } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { StarRating } from "@/components/reviews/StarRating";
import {
  PROFILE_CARD_COVER_CLASS,
  PROFILE_CARD_LINK_CLASS,
} from "@/components/users/profile-card-styles";
import { formatCompactCount } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import type { ReadingListPreview } from "@/types/discovery";

interface ProfileReadingListCardProps {
  list: ReadingListPreview;
  className?: string;
}

export function ProfileReadingListCard({
  list,
  className,
}: ProfileReadingListCardProps) {
  const primaryCover = list.coverUrls[0];
  const tagLabels = (list.novelTitles ?? []).filter(Boolean).slice(0, 3);
  const preview =
    list.description?.trim() ||
    list.highlightQuote?.trim() ||
    `A curated list of ${formatCompactCount(list.reviewCount)} ${
      list.reviewCount === 1 ? "novel" : "novels"
    } on MoonVerse.`;

  return (
    <Link
      href={list.href ?? `/folders/${list.id}`}
      className={cn(PROFILE_CARD_LINK_CLASS, className)}
    >
      <div className={PROFILE_CARD_COVER_CLASS}>
        {primaryCover ? (
          <CoverImage
            src={primaryCover}
            alt=""
            title={list.name}
            sizes="88px"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
            Empty list
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-[#1A1224]/45">
              {list.isPublic ? "Public list" : "Private list"}
            </p>
            <h3 className="mt-0.5 line-clamp-2 font-serif text-base font-bold leading-snug text-[#1A1224] transition-colors group-hover:text-[#6E46C7]">
              {list.name}
            </h3>
          </div>
          {list.averageRating ? (
            <StarRating
              rating={Math.round(list.averageRating)}
              size="sm"
              showValue={false}
              className="shrink-0"
            />
          ) : null}
        </div>

        <p className="mt-0.5 line-clamp-1 text-xs text-[#1A1224]/55">
          @{list.ownerUsername}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[11px] text-[#1A1224]/55">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="size-3 text-[#6E46C7]" aria-hidden="true" />
            {formatCompactCount(list.reviewCount)}{" "}
            {list.reviewCount === 1 ? "novel" : "novels"}
          </span>
          {!list.isPublic ? (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" aria-hidden="true" />
              Private
            </span>
          ) : null}
        </div>

        <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-[#1A1224]/60">
          {preview}
        </p>

        {tagLabels.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {tagLabels.map((label) => (
              <span
                key={label}
                className="rounded-full bg-[#1A1224]/5 px-2 py-0.5 text-[10px] font-medium text-[#1A1224]/60"
              >
                {label.toLowerCase()}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
