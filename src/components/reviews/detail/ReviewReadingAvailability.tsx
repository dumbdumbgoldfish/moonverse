"use client";

import {
  BookOpen,
  ExternalLink,
  Link2Off,
  MapPin,
} from "lucide-react";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import {
  DETAIL_MODULE_LABEL,
  DETAIL_STAGE,
} from "@/lib/reviews/detail-surface";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";
import type { ReadingLinkItem } from "@/types/reading-link";

interface ReviewReadingAvailabilityProps {
  novelTitle: string;
  readingLinks: ReadingLinkItem[];
  className?: string;
}

export function ReviewReadingAvailability({
  novelTitle,
  readingLinks,
  className,
}: ReviewReadingAvailabilityProps) {
  const links = readingLinks.slice(0, 3);

  return (
    <section
      aria-labelledby="review-reading-availability-heading"
      className={cn(DETAIL_STAGE, "flex h-full flex-col p-4 sm:p-5", className)}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F4ECF8] text-[#6E46C7] ring-1 ring-[#6E46C7]/12">
          <MapPin className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="review-reading-availability-heading" className={DETAIL_MODULE_LABEL}>
            Reading sources
          </h2>
          <p className="mt-1 font-heading text-base font-semibold leading-snug text-[#1a1033]">
            Where to read it
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#5a4d72]">
            Verified links for {novelTitle}.
          </p>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="mt-4 flex flex-1 flex-col justify-between gap-3 rounded-xl border border-dashed border-[#6E46C7]/20 bg-[#F8F1FA] px-3.5 py-3">
          <div className="flex items-start gap-2">
            <Link2Off className="mt-0.5 size-4 shrink-0 text-[#6E46C7]" aria-hidden />
            <div>
              <p className="text-sm font-semibold leading-snug text-[#1a1033]">
                No verified link yet
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#5a4d72]">
                Sources show up here after MoonVerse checks them.
              </p>
            </div>
          </div>
          <AskMoonieLink
            href={moonieEntryHref(
              `Recommend novels like ${novelTitle} with verified reading links`,
            )}
            size="sm"
            className="w-full text-xs font-bold"
          />
        </div>
      ) : (
        <ul className="mt-4 flex-1 space-y-2">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-10 items-center gap-2.5 rounded-xl border border-[#1a1033]/8 bg-[#FFFBFF] px-3 py-2 transition hover:border-[#6E46C7]/25 hover:bg-[#F4ECF8]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
              >
                <BookOpen className="size-3.5 shrink-0 text-[#6E46C7]" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-[#1a1033] group-hover:text-[#6E46C7]">
                    {link.label || link.platform}
                  </span>
                  {link.language ? (
                    <span className="block text-[10px] text-[#7a7284]">
                      {link.language.toUpperCase()}
                    </span>
                  ) : null}
                </span>
                <ExternalLink
                  className="size-3.5 shrink-0 text-[#7a7284] group-hover:text-[#6E46C7]"
                  aria-hidden
                />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
