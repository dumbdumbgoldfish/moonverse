import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Link2,
  Star,
  Tag,
} from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatCompactCount } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import {
  PROFILE_CAROUSEL_CONTENT_CLASS,
  PROFILE_CAROUSEL_COVER_CLASS,
  PROFILE_CAROUSEL_CTA_CLASS,
  PROFILE_CAROUSEL_FOOTER_CLASS,
  PROFILE_CAROUSEL_INNER_CLASS,
  PROFILE_CAROUSEL_SHELL_CLASS,
} from "@/components/users/profile-carousel-layout";
import type { ReadingListShelfNovel } from "@/types/discovery";

interface ProfileReadingListShelfNovelCardProps {
  novel: ReadingListShelfNovel;
  className?: string;
}

export function ProfileReadingListShelfNovelCard({
  novel,
  className,
}: ProfileReadingListShelfNovelCardProps) {
  const score =
    novel.averageRating !== null
      ? Number.isInteger(novel.averageRating)
        ? novel.averageRating.toFixed(0)
        : novel.averageRating.toFixed(1)
      : null;

  const chips = [
    ...(novel.primaryGenre ? [{ key: `genre:${novel.primaryGenre}`, label: novel.primaryGenre, kind: "genre" as const }] : []),
    ...novel.tags.map((tag) => ({
      key: `tag:${tag}`,
      label: tag,
      kind: "tag" as const,
    })),
  ].slice(0, 4);

  return (
    <article
      className={cn(PROFILE_CAROUSEL_SHELL_CLASS, className)}
    >
      <div className={PROFILE_CAROUSEL_INNER_CLASS}>
        <Link
          href={`/novels/${novel.novelId}`}
          className={PROFILE_CAROUSEL_COVER_CLASS}
          aria-label={`Open ${novel.title}`}
        >
          <CoverImage
            src={novel.coverUrl}
            alt=""
            title={novel.title}
            author={novel.author}
            themeSeed={novel.novelId}
            sizes="96px"
            className="h-full w-full object-cover"
          />
        </Link>

        <div className={PROFILE_CAROUSEL_CONTENT_CLASS}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/novels/${novel.novelId}`}
                className="line-clamp-2 text-[15px] font-extrabold leading-snug text-[#1a1033] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {novel.title}
              </Link>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted-foreground">
                <BookOpen className="size-3.5 shrink-0 text-primary/70" aria-hidden />
                by {novel.author}
              </p>
            </div>
            {score !== null ? (
              <div
                className="flex shrink-0 flex-col items-end gap-0.5 rounded-xl bg-amber-50 px-2.5 py-1 ring-1 ring-amber-200/90"
                aria-label={`Community score ${score} out of 5`}
              >
                <div className="flex items-center gap-1">
                  <Star
                    className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]"
                    aria-hidden
                  />
                  <span className="text-base font-extrabold tabular-nums text-amber-900">
                    {score}
                  </span>
                </div>
                <span className="text-[9px] font-semibold uppercase tracking-wide text-amber-800/75">
                  out of 5
                </span>
              </div>
            ) : (
              <div className="w-[3.25rem] shrink-0" aria-hidden />
            )}
          </div>

          {novel.publicationStatus ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#1a1033]/45">
              {novel.publicationStatus}
            </p>
          ) : null}

          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-violet-100"
                >
                  {chip.kind === "genre" ? (
                    <BookOpen className="size-2.5" aria-hidden />
                  ) : (
                    <Tag className="size-2.5" aria-hidden />
                  )}
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}

          {novel.synopsisExcerpt ? (
            <p className="line-clamp-2 overflow-hidden text-[13px] leading-relaxed text-[#1a1033]/78">
              {novel.synopsisExcerpt}
            </p>
          ) : null}

          <div className={PROFILE_CAROUSEL_FOOTER_CLASS}>
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-muted-foreground">
              {novel.reviewCount > 0 ? (
                <span>
                  {formatCompactCount(novel.reviewCount)}{" "}
                  {novel.reviewCount === 1 ? "review" : "reviews"}
                </span>
              ) : (
                <span>No reviews yet</span>
              )}
              {novel.hasOfficialLink ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <Link2 className="size-3.5" aria-hidden />
                  Official source
                </span>
              ) : null}
            </div>

            <Link
              href={`/novels/${novel.novelId}`}
              className={PROFILE_CAROUSEL_CTA_CLASS}
            >
              View novel
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
