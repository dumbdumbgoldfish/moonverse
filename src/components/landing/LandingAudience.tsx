import Link from "next/link";
import { BookOpen, Compass, Hash, PenLine, Search, Sparkles } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { Button } from "@/components/ui/button";

const AUDIENCES = [
  {
    icon: Compass,
    label: "Discovery readers",
    benefit: "Find your next binge before it trends everywhere else, guided by real reviews.",
  },
  {
    icon: PenLine,
    label: "Review writers",
    benefit: "Write about pacing, tropes and payoff for readers who actually care.",
  },
  {
    icon: Hash,
    label: "Trope hunters",
    benefit: "Chase enemies to lovers, regression or slow burns with precise tags.",
  },
  {
    icon: Search,
    label: "Genre and tag searchers",
    benefit: "Filter by up to five tags at once to land on exactly the right vibe.",
  },
  {
    icon: Sparkles,
    label: "AI-assisted readers",
    benefit: "Let Moonie translate a mood into a shortlist worth opening tonight.",
  },
];

export function LandingAudience() {
  return (
    <section className="mv-zone-cream px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Left editorial panel */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl mv-zone-night p-8 text-white lg:sticky lg:top-24 lg:self-start">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 mv-moon-shape opacity-40" aria-hidden />
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-soft-lavender">Built for readers</p>
            <h2 className="mt-3 font-serif text-3xl font-black leading-tight sm:text-4xl">
              Who MoonVerse is for
            </h2>
            <p className="mt-4 max-w-sm text-white/70">
              Whether you devour a series a week or dip in on quiet nights, MoonVerse
              is a home for people who treat web fiction as a hobby worth sharing.
            </p>
          </div>
          <div className="mt-8 flex items-end justify-between gap-4">
            <Button
              className="rounded-full bg-white font-bold text-night-blue hover:bg-white/90"
              render={<Link href="/register" />}
            >
              Join the community
            </Button>
            <MoonieMascot size={130} variant="reading" display="hero" className="mv-float-slow" />
          </div>
        </div>

        {/* Right staggered audience stories */}
        <ul className="space-y-4">
          {AUDIENCES.map((item, i) => {
            const Icon = item.icon;
            return (
              <li
                key={item.label}
                className={i % 2 === 1 ? "lg:ml-12" : "lg:mr-12"}
              >
                <div className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 mv-hover-lift">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-moon-purple-soft text-primary">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-night-blue">{item.label}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.benefit}</p>
                  </div>
                </div>
              </li>
            );
          })}
          <li className="rounded-2xl border border-dashed border-primary/30 bg-moon-purple-soft/40 p-5">
            <p className="text-sm font-semibold text-night-blue">
              What you can do here
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Discover web novels",
                "Write reviews",
                "Like and comment",
                "Follow reviewers",
                "Save reading lists",
                "Explore genres and tags",
                "Ask Moonie",
              ].map((action) => (
                <span
                  key={action}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/15"
                >
                  <BookOpen className="size-3" aria-hidden />
                  {action}
                </span>
              ))}
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
