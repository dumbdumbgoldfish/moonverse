"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { DISCOVERY_MOOD_CHIPS } from "@/lib/moonie/constants";
import { openMoonie } from "@/lib/moonie/open-moonie";
import { HOME_SURFACE } from "@/lib/home-atelier";

export function ExploreModule() {
  const moods = DISCOVERY_MOOD_CHIPS.slice(0, 4);

  return (
    <details className={`group ${HOME_SURFACE} px-4 py-3 sm:px-5`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="font-serif text-lg font-medium text-[#1A1224]">
            Explore more
          </p>
          <p className="text-sm text-[#1A1224]/55">
            Mood shortcuts and the full catalogue
          </p>
        </div>
        <ChevronDown
          className="size-5 shrink-0 text-[#1A1224]/40 transition group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="mt-4 space-y-4 border-t border-[#1A1224]/8 pt-4">
        <ul className="flex flex-wrap gap-2">
          {moods.map((mood) => (
            <li key={mood.label}>
              <button
                type="button"
                onClick={() => openMoonie(mood.prompt)}
                className="inline-flex min-h-10 items-center rounded-full border border-[#1A1224]/10 bg-[#FBF7F1] px-4 text-sm font-semibold text-[#1A1224] transition hover:border-[#6E46C7]/30 hover:text-[#6E46C7]"
              >
                {mood.label}
              </button>
            </li>
          ))}
        </ul>
        <Link
          href="/browse"
          className="inline-flex min-h-10 items-center rounded-full bg-[#1A1224] px-5 text-sm font-semibold text-white transition hover:bg-[#2a2038]"
        >
          Open full catalogue
        </Link>
      </div>
    </details>
  );
}
