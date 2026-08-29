import Link from "next/link";
import { Sparkles } from "lucide-react";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";

interface MoodChip {
  label: string;
  prompt: string;
}

interface BrowseMoodStripProps {
  moods: readonly MoodChip[];
  className?: string;
}

/** Quiet escape hatch when mood beats structure. */
export function BrowseMoodStrip({ moods, className }: BrowseMoodStripProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[#1a1033]/8 bg-[#1a1033] px-4 py-4 text-[#fffbff] sm:px-5",
        className,
      )}
      aria-labelledby="browse-mood-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9b8ff]">
            When filters are not enough
          </p>
          <h2
            id="browse-mood-heading"
            className="mt-1 font-heading text-lg font-semibold"
          >
            Ask Moonie by mood
          </h2>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-[#d7d0e8]">
            Hands off a grounded catalogue prompt: still no invented titles.
          </p>
        </div>
        <Sparkles className="size-5 text-[#c9b8ff]" aria-hidden />
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {moods.map((mood) => (
          <li key={mood.label}>
            <Link
              href={moonieEntryHref(mood.prompt)}
              className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-[#fffbff] hover:bg-white/10"
            >
              {mood.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
