import Link from "next/link";
import { Sparkles } from "lucide-react";
import { DeskCard } from "@/components/home/reader-hub/DeskCard";
import { ForYouDeskFallback } from "@/components/home/reader-hub/ForYouDeskFallback";
import { CoverImage } from "@/components/ui/CoverImage";
import { HOME_SURFACE_INK } from "@/lib/home-atelier";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import type { PreferredGenreOption } from "@/services/preference.service";
import type { ReadingTasteSnapshot } from "@/services/feed.service";
import type { MoonieDailyPick } from "@/services/moonie-daily.service";
import type { ReviewListItem } from "@/types/review";

interface TonightsDeskProps {
  dailyPick: MoonieDailyPick | null;
  continueReading: ReviewListItem[];
  taste: ReadingTasteSnapshot;
  preferredGenres: PreferredGenreOption[];
}

export function TonightsDesk({
  dailyPick,
  continueReading,
  taste,
  preferredGenres,
}: TonightsDeskProps) {
  const continueItems = continueReading.slice(0, 2);
  const showFallback = !dailyPick && continueItems.length === 0;

  return (
    <section aria-labelledby="tonight-desk-heading" className="space-y-5">
      <h2 id="tonight-desk-heading" className="sr-only">
        Tonight&apos;s desk
      </h2>

      {showFallback ? (
        <ForYouDeskFallback taste={taste} preferredGenres={preferredGenres} />
      ) : null}

      {dailyPick ? (
        <article className={`relative overflow-hidden p-5 sm:p-6 ${HOME_SURFACE_INK}`}>
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(200,155,74,0.18),transparent_55%)]"
            aria-hidden
          />
          <div className="relative grid gap-5 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
            <Link
              href={`/reviews/${dailyPick.reviewId}`}
              className="relative mx-auto block aspect-[2/3] w-[120px] overflow-hidden rounded-[14px] ring-1 ring-white/15 sm:mx-0"
            >
              <CoverImage
                src={dailyPick.coverUrl}
                alt=""
                title={dailyPick.novelTitle}
                sizes="120px"
                priority
                className="object-cover"
              />
            </Link>
            <div className="min-w-0 text-center sm:text-left">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C89B4A]">
                <Sparkles className="size-3.5" aria-hidden />
                Moonie&apos;s pick tonight
                {dailyPick.isNew ? (
                  <span className="rounded-full bg-[#C89B4A]/20 px-2 py-0.5 text-[9px] tracking-[0.12em]">
                    New
                  </span>
                ) : null}
              </p>
              <h3 className="mt-2 font-serif text-2xl font-medium leading-tight">
                {dailyPick.novelTitle}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#FBF7F1]/75">
                {dailyPick.reason}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Link
                  href={`/reviews/${dailyPick.reviewId}`}
                  className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#1A1224] transition hover:bg-[#FBF7F1]"
                >
                  Read review
                </Link>
                <Link
                  href={moonieEntryHref(
                    `Why did you pick "${dailyPick.novelTitle}" for me tonight?`
                  )}
                  className="inline-flex min-h-10 items-center rounded-full border border-white/25 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Why this?
                </Link>
              </div>
            </div>
          </div>
        </article>
      ) : null}

      {continueItems.length > 0 ? (
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A1224]/45">
            Continue
          </p>
          <div className="grid grid-cols-2 gap-4 sm:max-w-md">
            {continueItems.map((item, index) => (
              <DeskCard
                key={item.id}
                href={`/reviews/${item.id}`}
                coverUrl={item.coverUrl}
                title={item.novelTitle}
                subtitle={item.reviewerName}
                reason={index === 0 ? "Recently saved" : undefined}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
