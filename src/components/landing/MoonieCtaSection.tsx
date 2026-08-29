import Link from "next/link";
import { Sparkles } from "lucide-react";
import { NightAtmosphere } from "@/components/landing/LandingDecor";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { MoonieGoldSeal } from "@/components/moonie/MoonieGoldSeal";
import { Button } from "@/components/ui/button";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { MOONIE_CONSTRAINT, MOONIE_DESK_CHIPS } from "@/lib/moonie/desk";
import { MOONIE_QUICK_PROMPTS } from "@/lib/moonie/constants";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";

const LANDING_ASKS = [
  { label: "Slow-burn romance", prompt: MOONIE_QUICK_PROMPTS[0] },
  { label: "Dark but hopeful", prompt: MOONIE_QUICK_PROMPTS[1] },
  { label: "Found-family binge", prompt: MOONIE_QUICK_PROMPTS[3] },
] as const;

export function MoonieCtaSection() {
  const guestTurns = 3;

  return (
    <section id="close-night" className="mv-land text-white">
      <NightAtmosphere intensity="rich" />
      <div
        className="pointer-events-none absolute left-1/2 top-8 h-28 w-[60%] -translate-x-1/2 rounded-[100%] bg-[#C89B4A]/12 blur-3xl"
        aria-hidden
      />

      <div className="mv-land-shell">
        <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:gap-7">
          <div className="flex flex-col justify-center">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-4">
              <MoonieGoldSeal
                size="lg"
                variant="thinking"
                className="sm:-scale-x-100"
              />
              <div className="text-center sm:text-left">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F6C85F]">
                  <Sparkles className="size-3" aria-hidden />
                  Close the night with Moonie
                </p>
                <h2 className="mv-land-title text-white">
                  Not sure what to read next?
                </h2>
              </div>
            </div>

            <p className="mv-land-copy text-white/70">
              Name a mood, trope or genre. Moonie ranks titles already on the
              MoonVerse shelf, using community reviews. Then join so your
              shelves and taste travel with you.
            </p>
            <p className="mt-2 max-w-xl text-xs text-white/55">
              {MOONIE_CONSTRAINT} Guests get {guestTurns} free turns.
            </p>

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {[
                "In-catalogue titles only",
                "Never writes reviews",
                "Taste stays private",
                `${guestTurns} guest turns`,
              ].map((chip) => (
                <li
                  key={chip}
                  className="rounded-full border border-[#C89B4A]/45 bg-[#C89B4A]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#E6D2A3]"
                >
                  {chip}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex flex-col rounded-2xl border border-white/12 bg-white/[0.07] p-4 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.75)]">
            <span
              className="absolute inset-x-8 top-0 h-1 rounded-b-full bg-gradient-to-r from-[#6E46C7] via-[#C89B4A] to-[#6E46C7]"
              aria-hidden
            />
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#F6C85F]/90">
              Try asking
            </p>
            <ul className="mt-3 grid gap-2">
              {LANDING_ASKS.map((ask) => (
                <li key={ask.prompt}>
                  <Link
                    href={moonieEntryHref(ask.prompt)}
                    className={cn(
                      "block rounded-xl border border-white/15 bg-black/35 px-3 py-2.5",
                      "transition hover:border-[#C89B4A]/50 hover:bg-black/50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B4A]"
                    )}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#E6D2A3]">
                      {ask.label}
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-white/90">
                      {ask.prompt}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              {MOONIE_DESK_CHIPS.slice(0, 4).map((chip) => (
                <CatalogLink
                  key={chip.label}
                  href={moonieEntryHref(chip.prompt)}
                  size="compact"
                  tone="night"
                >
                  {chip.label}
                </CatalogLink>
              ))}
            </div>

            <AskMoonieLink
              href={moonieEntryHref()}
              size="md"
              className="mt-3 h-10 w-full text-sm font-bold"
            />
            <div className="mt-3 flex justify-center">
              <CatalogLink href="/browse" tone="night" size="compact">
                Or browse the catalogue
              </CatalogLink>
            </div>

            <div className="mt-4 border-t border-white/12 pt-3">
              <p className="text-sm font-medium text-white/70">
                Ready to keep your reading circle?
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="lg"
                  className="mv-nav-signup h-9 rounded-full border-0 px-4 text-sm font-bold text-white"
                  render={<Link href="/register" />}
                >
                  Create free account
                </Button>
                <CatalogLink href="/login" tone="night">
                  Log in
                </CatalogLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
