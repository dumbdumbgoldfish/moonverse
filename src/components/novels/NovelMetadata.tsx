import {
  BookOpen,
  CircleDot,
  Languages,
  MessageSquareText,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NovelDetail } from "@/types/review";

interface NovelMetadataProps {
  novel: NovelDetail;
  className?: string;
}

export function NovelMetadata({ novel, className }: NovelMetadataProps) {
  const rows = [
    novel.publicationStatus
      ? { label: "Status", value: novel.publicationStatus, Icon: CircleDot }
      : null,
    novel.originalLanguage
      ? { label: "Language", value: novel.originalLanguage, Icon: Languages }
      : null,
    novel.publisher
      ? { label: "Publisher", value: novel.publisher, Icon: BookOpen }
      : null,
    novel.lengthBand
      ? { label: "Length", value: novel.lengthBand, Icon: BookOpen }
      : null,
    novel.readingLinks[0]?.platform
      ? {
          label: "Platform",
          value: novel.readingLinks[0].platform,
          Icon: BookOpen,
        }
      : null,
    {
      label: "Community",
      value:
        novel.averageRating === null
          ? "Not rated yet"
          : `${novel.averageRating.toFixed(1)} out of 5`,
      Icon: Star,
    },
    {
      label: "Reviews",
      value: `${novel.reviewCount} ${
        novel.reviewCount === 1 ? "review" : "reviews"
      }`,
      Icon: MessageSquareText,
    },
  ].filter(
    (
      row
    ): row is {
      label: string;
      value: string;
      Icon: typeof CircleDot;
    } => row !== null
  );

  return (
    <section
      aria-labelledby="novel-overview-heading"
      className={cn(
        "rounded-[22px] border border-[#1A1224]/10 bg-white p-4 shadow-[0_12px_35px_-28px_rgba(26,16,51,0.12)] sm:p-5",
        className
      )}
    >
      <h2
        id="novel-overview-heading"
        className="font-heading text-xl font-bold text-[#1a1033]"
      >
        Novel overview
      </h2>
      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="grid grid-cols-[28px_88px_1fr] items-center gap-2 border-b border-[#1A1224]/8 pb-3 last:border-b-0 sm:last:border-b"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#F4ECF8] text-[#6E46C7]">
              <Icon className="size-3.5" aria-hidden />
            </span>
            <dt className="text-xs font-bold uppercase tracking-wide text-[#4a4458]">
              {label}
            </dt>
            <dd className="text-sm font-semibold capitalize text-[#1a1033]">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
