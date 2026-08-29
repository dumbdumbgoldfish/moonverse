"use client";

import { MoonieHomePrompt } from "@/components/moonie/MoonieHomePrompt";

export function MeetMoonieShelf() {
  return (
    <section
      aria-labelledby="meet-moonie-heading"
      className="rounded-[22px] border border-primary/15 bg-[#11182A] px-5 py-6 text-[#F7F5FF] sm:px-6"
    >
      <h2
        id="meet-moonie-heading"
        className="font-heading text-xl font-semibold tracking-tight"
      >
        Meet Moonie
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[#B7BDD1]">
        Ask for a story in plain language. Moonie extracts your constraints,
        searches the catalogue, then explains each match.
      </p>
      <div className="mt-4 rounded-2xl bg-white/5 p-4">
        <MoonieHomePrompt tone="dark" />
      </div>
    </section>
  );
}
