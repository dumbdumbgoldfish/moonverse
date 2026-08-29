"use client";

import Link from "next/link";
import { DISCOVERY_MOOD_CHIPS, DISCOVERY_TROPE_COMBOS } from "@/lib/moonie/constants";
import { openMoonie } from "@/lib/moonie/open-moonie";

export function ExploreByMoodShelf() {
  return (
    <section aria-labelledby="explore-mood-heading" className="space-y-3">
      <div>
        <h2
          id="explore-mood-heading"
          className="font-heading text-xl font-semibold tracking-tight text-foreground"
        >
          Explore by mood
        </h2>
        <p className="text-sm text-muted-foreground">
          Shortcut chips send a structured request to Moonie, not a decorative filter.
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {DISCOVERY_MOOD_CHIPS.map((mood) => (
          <li key={mood.label}>
            <button
              type="button"
              onClick={() => openMoonie(mood.prompt)}
              className="inline-flex min-h-11 items-center rounded-full border border-primary/20 bg-card px-4 text-sm font-semibold hover:bg-moon-purple-soft/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {mood.label}
            </button>
          </li>
        ))}
      </ul>

      <h3 className="pt-4 font-heading text-lg font-semibold">Popular trope combinations</h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {DISCOVERY_TROPE_COMBOS.map((combo) => (
          <li key={combo.label}>
            <button
              type="button"
              onClick={() => openMoonie(combo.prompt)}
              className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-primary/15 bg-card px-4 py-3 text-left text-sm font-semibold hover:bg-moon-purple-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {combo.label}
              <span className="text-xs font-medium text-primary">Ask Moonie</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Prefer filters?{" "}
        <Link href="/browse" className="font-semibold text-primary underline-offset-4 hover:underline">
          Open Browse
        </Link>
        .
      </p>
    </section>
  );
}
