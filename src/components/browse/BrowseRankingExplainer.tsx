import { Scale, ShieldCheck, Sparkles } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { cn } from "@/lib/utils";

const RANKING_ROWS = [
  {
    id: "community-strength",
    icon: Scale,
    title: "Community strength",
    body: "Bayesian average of star ratings. A few five-star reviews cannot dominate an established title with more evidence.",
    iconClass: "bg-amber-100 text-amber-800 ring-amber-200/70",
    glowClass: "bg-amber-300/25",
  },
  {
    id: "catalogue-confidence",
    icon: ShieldCheck,
    title: "Catalogue confidence",
    body: "Prefers official reading links, real covers, and denser community evidence when ranking the shelf.",
    iconClass: "bg-teal-100 text-teal-800 ring-teal-200/70",
    glowClass: "bg-teal-300/20",
  },
] as const;

interface BrowseRankingExplainerProps {
  className?: string;
}

export function BrowseRankingExplainer({
  className,
}: BrowseRankingExplainerProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-[#1a1033]/8 bg-[#1a1033] text-[#fffbff]",
        className,
      )}
      aria-labelledby="browse-ranking-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none h-1 bg-gradient-to-r from-[#F6C85F]/70 via-[#c9b8ff]/50 to-[#6b4bb5]/60"
      />

      <div className="relative px-4 py-4 sm:px-5">
        <Sparkles
          className="pointer-events-none absolute right-4 top-4 size-5 text-[#c9b8ff] sm:right-5"
          aria-hidden
        />

        <div className="flex items-start gap-3">
          <MoonieMascot
            size={56}
            variant="thinking"
            display="clean"
            lightweight
            className="hidden shrink-0 sm:block"
          />

          <div className="min-w-0 flex-1 pr-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c9b8ff]">
              Transparency
            </p>
            <h2
              id="browse-ranking-heading"
              className="mt-0.5 font-heading text-lg font-semibold"
            >
              How ranking works
            </h2>
            <p className="mt-1 text-xs text-[#d7d0e8] sm:text-sm">
              No invented titles. Shelves stay inside the catalogue.
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-3 border-t border-white/10 pt-4">
          {RANKING_ROWS.map(
            ({ id, icon: Icon, title, body, iconClass, glowClass }) => (
              <li
                key={id}
                className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-3"
              >
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -right-4 -top-4 size-16 rounded-full blur-2xl",
                    glowClass,
                  )}
                />
                <div className="relative flex gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
                      iconClass,
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#fffbff]">
                      {title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#d7d0e8]">
                      {body}
                    </p>
                  </div>
                </div>
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
