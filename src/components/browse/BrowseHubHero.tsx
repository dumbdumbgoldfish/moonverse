import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";

interface BrowseHubHeroProps {
  className?: string;
}

/** Catalogue hero: dark ink pill with Moonie + two browse actions. */
export function BrowseHubHero({ className }: BrowseHubHeroProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#1a1033]/8 bg-[#1a1033] px-4 py-4 text-[#fffbff] sm:px-5 sm:py-5",
        className,
      )}
      aria-labelledby="browse-hub-title"
    >
      <Sparkles
        className="pointer-events-none absolute right-4 top-4 size-5 text-[#c9b8ff] sm:right-5 sm:top-5"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative shrink-0 self-center sm:self-end">
          <MoonieMascot
            size={112}
            variant="excited"
            display="clean"
            className="mv-float-slow relative sm:hidden"
            priority
          />
          <MoonieMascot
            size={140}
            variant="excited"
            display="clean"
            className="mv-float-slow relative hidden sm:block"
            priority
          />
        </div>

        <div className="min-w-0 flex-1 pr-8 sm:pr-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9b8ff]">
            MoonVerse catalogue
          </p>
          <h1
            id="browse-hub-title"
            className="mt-1 font-heading text-2xl font-semibold sm:text-3xl"
          >
            Open the stacks
          </h1>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-[#d7d0e8] sm:text-sm">
            Pick a shelf, refine by tags, and rank by community strength. Or ask
            Moonie when mood beats filters.
          </p>

          <ul className="mt-4 flex flex-wrap gap-2">
            <li>
              <Link
                href="/browse/fantasy?sort=community-strength"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-[#fffbff] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9b8ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1033]"
              >
                <BookOpen className="size-3.5" aria-hidden />
                Open Fantasy works
              </Link>
            </li>
            <li>
              <AskMoonieLink
                href={moonieEntryHref(
                  "I want a web novel recommendation from the MoonVerse catalogue. Ask me one clarifying question, then suggest grounded titles.",
                )}
                size="xs"
                className="min-h-9 px-3 text-xs font-semibold"
              >
                Ask Moonie instead
              </AskMoonieLink>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
