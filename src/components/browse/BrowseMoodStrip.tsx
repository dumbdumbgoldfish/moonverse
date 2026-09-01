import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrowseMoodStripProps {
  className?: string;
}

/** Quiet escape hatch when mood beats structure. */
export function BrowseMoodStrip({ className }: BrowseMoodStripProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[#1a1033]/8 bg-[#1a1033] px-4 py-3 text-[#fffbff] sm:px-5 sm:py-3.5",
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
        <Sparkles className="size-5 shrink-0 text-[#c9b8ff]" aria-hidden />
      </div>
    </section>
  );
}
