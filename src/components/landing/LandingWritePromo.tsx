import Link from "next/link";
import { BookOpen, MessageSquare, Sparkles } from "lucide-react";
import {
  LandingWritePromoVisual,
  WRITE_STEPS,
} from "@/components/landing/LandingWritePromoVisual";
import { PaperAtmosphere } from "@/components/landing/LandingDecor";
import { Button } from "@/components/ui/button";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { pickLandingCommunityReviews } from "@/lib/landing-reviews";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

const BENEFITS = [
  {
    icon: BookOpen,
    title: "Help readers choose better",
    copy: "Share pacing, tropes and payoff for a title already on the shelf.",
  },
  {
    icon: MessageSquare,
    title: "Join the conversation",
    copy: "Comments, likes and follows stay attached to a real review.",
  },
  {
    icon: Sparkles,
    title: "Sharpen Moonie for you",
    copy: "Your activity teaches Moonie your taste. Moonie never writes the review.",
  },
] as const;

interface LandingWritePromoProps {
  reviews?: ReviewListItem[];
}

export function LandingWritePromo({ reviews = [] }: LandingWritePromoProps) {
  const deskReviews = pickLandingCommunityReviews(reviews, 3, {
    catalogueOnly: true,
  });

  return (
    <section
      id="write"
      aria-labelledby="write-on-moonverse-heading"
      className="mv-land"
    >
      <PaperAtmosphere tone="cream" />
      <div
        className="pointer-events-none absolute left-1/2 top-8 h-28 w-[60%] -translate-x-1/2 rounded-[100%] bg-[#C89B4A]/10 blur-3xl"
        aria-hidden
      />

      <div className="mv-land-shell">
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr] lg:gap-8">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8f711e]">
              Write on MoonVerse
            </p>
            <h2
              id="write-on-moonverse-heading"
              className="mv-land-title text-[#1a1033]"
            >
              Turn your reading into someone else&apos;s next favourite story.
            </h2>
            <p className="mv-land-copy text-slate-600">
              Write about a title already in the catalogue. MoonVerse does not
              host novel text, and Moonie does not write reviews.
            </p>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                size="lg"
                className={cn(
                  "mv-nav-signup h-11 min-h-[44px] rounded-full border-0 px-6 text-base font-bold text-white",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                )}
                render={<Link href="/register" />}
              >
                Create a free account
              </Button>
              <CatalogLink href="/write">Start writing</CatalogLink>
            </div>

            <ul className="mt-5 grid max-w-md gap-2.5">
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <li
                    key={benefit.title}
                    className="flex items-start gap-3 rounded-xl border border-violet-100/70 bg-white/80 px-3 py-2.5"
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-[#4c2a67] text-white">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-serif text-base font-bold text-[#1a1033]">
                        {benefit.title}
                      </span>
                      <span className="mt-0.5 block text-sm leading-snug text-slate-600">
                        {benefit.copy}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <LandingWritePromoVisual reviews={deskReviews} />
        </div>

        <ol className="mt-7 grid gap-3 sm:grid-cols-3">
          {WRITE_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.n}>
                <Link
                  href={step.href}
                  className={cn(
                    "group flex h-full gap-3.5 rounded-2xl border border-violet-100/90 bg-white/90 p-4",
                    "transition duration-200 hover:border-[#C89B4A]/45",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B4A]",
                    "motion-reduce:transition-none"
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#C89B4A]/45 bg-[#FFFBFF] font-serif text-sm font-black text-[#C89B4A]">
                    {step.n}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <Icon className="size-4 text-violet-600" aria-hidden />
                      <span className="font-serif text-lg font-bold text-[#1a1033]">
                        {step.title}
                      </span>
                    </span>
                    <span className="mt-1.5 block text-sm leading-snug text-slate-600">
                      {step.copy}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
