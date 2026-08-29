import { BookOpen, CircleDot, Languages } from "lucide-react";
import { ReadingStatusValue } from "@prisma/client";
import { NovelActions } from "@/components/novels/NovelActions";
import { NovelCover } from "@/components/novels/NovelCover";
import { NovelProvenance } from "@/components/novels/NovelProvenance";
import {
  SALON_CHIP,
  SALON_EYEBROW,
  SALON_GLOW_GOLD,
  SALON_GLOW_PURPLE,
  SALON_SURFACE,
  MV_PRIMARY_BTN,
} from "@/lib/novels/salon-surface";
import { cn } from "@/lib/utils";
import type { NovelDetail } from "@/types/review";

interface NovelHeroProps {
  novel: NovelDetail;
  isLoggedIn?: boolean;
  initialReadingStatus?: ReadingStatusValue | null;
}

export function NovelHero({
  novel,
  isLoggedIn = false,
  initialReadingStatus = null,
}: NovelHeroProps) {
  const synopsis = novel.synopsis?.trim();
  const isLongSynopsis = Boolean(synopsis && synopsis.length > 380);

  return (
    <header
      id="edition-about"
      className={cn(SALON_SURFACE, "scroll-mt-28 px-4 py-5 sm:px-6 sm:py-6")}
    >
      <div aria-hidden className={SALON_GLOW_PURPLE} />
      <div aria-hidden className={SALON_GLOW_GOLD} />

      <div className="relative grid items-start gap-5 lg:grid-cols-[192px_minmax(0,1fr)] lg:gap-8">
        <div className="mx-auto lg:mx-0">
          <NovelCover
            src={novel.coverUrl}
            title={novel.title}
            author={novel.author}
            genres={novel.genres}
            language={novel.originalLanguage}
            themeSeed={novel.id}
            size="md"
            priority
          />
        </div>

        <div className="min-w-0">
          <p className={SALON_EYEBROW}>
            <BookOpen className="size-3.5" aria-hidden />
            Novel
          </p>
          <h1 className="mt-3 font-serif text-[1.7rem] font-medium leading-[1.1] tracking-tight text-white sm:text-[2.15rem]">
            {novel.title}
          </h1>
          {novel.aliases.length > 0 ? (
            <p className="mt-2 text-sm text-[#B7B0CC]">
              Also known as {novel.aliases.slice(0, 3).join(" · ")}
            </p>
          ) : null}
          <p className="mt-1.5 text-sm font-medium text-[#EDE8FF]">
            {novel.author ? `by ${novel.author}` : "Author not listed"}
          </p>

          {novel.publicationStatus || novel.originalLanguage || novel.lengthBand ? (
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#B7B0CC]">
              {novel.publicationStatus ? (
                <span className="inline-flex items-center gap-1.5">
                  <CircleDot className="size-3.5 text-[#E8C36A]" aria-hidden />
                  {novel.publicationStatus}
                </span>
              ) : null}
              {novel.originalLanguage ? (
                <span className="inline-flex items-center gap-1.5">
                  <Languages className="size-3.5 text-[#E8C36A]" aria-hidden />
                  {novel.originalLanguage}
                </span>
              ) : null}
              {novel.lengthBand ? (
                <span className="capitalize">Length: {novel.lengthBand}</span>
              ) : null}
            </p>
          ) : null}

          <div className="mt-3">
            <NovelProvenance
              novel={novel}
              isLoggedIn={isLoggedIn}
              tone="dark"
            />
          </div>

          {(novel.genres.length > 0 ||
            novel.tropes.length > 0 ||
            novel.moods.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {novel.genres.map((genre) => (
                <span
                  key={`genre:${genre}`}
                  className={cn(MV_PRIMARY_BTN, "px-2.5 py-1 text-xs font-bold")}
                >
                  {genre}
                </span>
              ))}
              {[...novel.tropes.slice(0, 5), ...novel.moods.slice(0, 3)].map(
                (tag, index) => (
                  <span key={`chip:${index}:${tag}`} className={SALON_CHIP}>
                    {tag}
                  </span>
                )
              )}
            </div>
          )}

          {synopsis ? (
            <div className="mt-4 max-w-3xl text-sm leading-6 text-[#B7B0CC]">
              {isLongSynopsis ? (
                <details className="group">
                  <p className="line-clamp-4 group-open:hidden">{synopsis}</p>
                  <div className="hidden group-open:block">{synopsis}</div>
                  <summary className="mt-2 min-h-11 cursor-pointer list-none text-sm font-bold text-[#E8C36A] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A]">
                    <span className="group-open:hidden">Show full synopsis</span>
                    <span className="hidden group-open:inline">Show less</span>
                  </summary>
                </details>
              ) : (
                <p>{synopsis}</p>
              )}
            </div>
          ) : null}

          <div className="mt-5">
            <NovelActions
              novelId={novel.id}
              title={novel.title}
              isLoggedIn={isLoggedIn}
              initialReadingStatus={initialReadingStatus}
              tone="dark"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
