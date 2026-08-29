import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { HOME_SURFACE } from "@/lib/home-atelier";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import type { PreferredGenreOption } from "@/services/preference.service";
import type { ReadingTasteSnapshot } from "@/services/feed.service";

interface ForYouDeskFallbackProps {
  taste: ReadingTasteSnapshot;
  preferredGenres: PreferredGenreOption[];
}

export function ForYouDeskFallback({
  taste,
  preferredGenres,
}: ForYouDeskFallbackProps) {
  const topGenre = preferredGenres[0] ?? taste.topGenres[0];
  const learning = !taste.hasSignals;

  return (
    <article className={`${HOME_SURFACE} px-5 py-8 text-center sm:px-8`}>
      <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E46C7]">
        <Sparkles className="size-3.5" aria-hidden />
        Tonight&apos;s desk
      </p>
      <h2 className="mt-3 font-serif text-2xl font-medium text-[#1A1224]">
        {learning ? "Your reading desk is ready" : "Nothing queued yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#1A1224]/55">
        {learning
          ? "Save a novel, follow a reviewer, or ask Moonie. Your nightly pick will land here."
          : topGenre
            ? `Browse ${topGenre.name} or ask Moonie for a fresh pick tonight.`
            : "Browse the catalogue or ask Moonie for a fresh pick tonight."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <AskMoonieLink
          href={moonieEntryHref("What should I read tonight?")}
          size="sm"
          className="min-h-10 px-4 text-sm font-semibold"
        />
        <Link
          href={topGenre ? `/browse/${topGenre.slug}` : "/browse"}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#1A1224]/10 bg-white px-4 text-sm font-semibold text-[#1A1224] transition hover:border-[#6E46C7]/30"
        >
          <BookOpen className="size-4" aria-hidden />
          {topGenre ? `Browse ${topGenre.name}` : "Browse catalogue"}
        </Link>
      </div>
    </article>
  );
}
