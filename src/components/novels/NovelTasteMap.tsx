import Link from "next/link";
import { Heart, ShieldAlert } from "lucide-react";
import {
  EDITION_CHIP,
  EDITION_PANEL,
  EDITION_PANEL_BODY,
  EDITION_PANEL_EYEBROW,
  EDITION_PANEL_TITLE,
} from "@/components/novels/edition-panel";
import { searchHref } from "@/lib/search";
import { cn } from "@/lib/utils";
import type { NovelDetail } from "@/types/review";

interface NovelTasteMapProps {
  novel: NovelDetail;
}

export function NovelTasteMap({ novel }: NovelTasteMapProps) {
  const highRatings = novel.ratingDistribution
    .filter((row) => row.rating >= 4)
    .reduce((sum, row) => sum + row.count, 0);
  const tropes = (
    novel.likedTropes.length ? novel.likedTropes : novel.tropes
  ).slice(0, 6);

  return (
    <section aria-labelledby="taste-map-heading" className={EDITION_PANEL}>
      <p className={EDITION_PANEL_EYEBROW}>Why they stayed</p>
      <h2
        id="taste-map-heading"
        className={cn(EDITION_PANEL_TITLE, "mt-0.5 flex items-center gap-1.5")}
      >
        <Heart className="size-3.5 fill-[#6E46C7] text-[#6E46C7]" aria-hidden />
        What readers stayed for
      </h2>
      <p className={cn(EDITION_PANEL_BODY, "mt-1")}>
        {highRatings > 0
          ? `From ${highRatings} four- and five-star reviews.`
          : "Tropes and moods this edition is known for."}
      </p>

      {tropes.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-1">
          {tropes.map((trope) => (
            <li key={trope}>
              <Link
                href={searchHref(trope)}
                className={cn(EDITION_CHIP, "mv-hover-signup")}
              >
                {trope}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn(EDITION_PANEL_BODY, "mt-2.5")}>
          No tropes tagged for this edition yet.
        </p>
      )}

      {novel.moods.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1">
          {novel.moods.slice(0, 3).map((mood) => (
            <li key={mood}>
              <span className={EDITION_CHIP}>{mood}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {novel.contentWarnings.length > 0 ? (
        <details className="group mt-auto rounded-lg border border-[#6E46C7]/12 bg-[#F8F4FC]/80 px-3 py-2">
          <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1.5 text-[12px] font-semibold text-[#3a2466] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]">
            <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
            <span className="group-open:hidden">
              {novel.contentWarnings.length} content warning
              {novel.contentWarnings.length === 1 ? "" : "s"}
            </span>
            <span className="hidden group-open:inline">Hide warnings</span>
          </summary>
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {novel.contentWarnings.map((warning) => (
              <li
                key={warning.slug}
                className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#3a2466] ring-1 ring-[#6E46C7]/12"
              >
                {warning.name}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
