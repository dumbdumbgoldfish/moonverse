"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { MOONIE_QUICK_PROMPTS } from "@/lib/moonie/constants";
import { openMoonie } from "@/lib/moonie/open-moonie";
import { HOME_SURFACE } from "@/lib/home-atelier";
import type { PreferredGenreOption } from "@/services/preference.service";
import type { ReadingTasteSnapshot } from "@/services/feed.service";

interface HomeCommandDeckProps {
  greetingName: string;
  taste: ReadingTasteSnapshot;
  preferredGenres: PreferredGenreOption[];
}

function timeGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeCommandDeck({
  greetingName,
  taste,
  preferredGenres,
}: HomeCommandDeckProps) {
  const [prompt, setPrompt] = useState("");
  const [greeting] = useState(() => timeGreeting(new Date().getHours()));

  const tasteChips = useMemo(() => {
    const chips: { label: string; href?: string }[] = [];
    for (const genre of preferredGenres.slice(0, 3)) {
      chips.push({ label: genre.name, href: `/browse/${genre.slug}` });
    }
    if (taste.topTag) {
      chips.push({ label: taste.topTag.name });
    }
    return chips.slice(0, 4);
  }, [preferredGenres, taste.topTag]);

  const smartPrompts = useMemo(() => {
    const topGenre = preferredGenres[0]?.name ?? taste.topGenres[0]?.name;
    const prompts = [
      MOONIE_QUICK_PROMPTS[0]!,
      topGenre
        ? `A ${topGenre.toLowerCase()} pick I can finish this week.`
        : MOONIE_QUICK_PROMPTS[1]!,
      "Something outside my usual taste. Surprise me.",
    ];
    return prompts;
  }, [preferredGenres, taste.topGenres]);

  function submit(value: string) {
    const next = value.trim();
    if (!next) return;
    openMoonie(next);
    setPrompt("");
  }

  return (
    <section aria-labelledby="home-command-heading" className={HOME_SURFACE}>
      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6E46C7]">
          {greeting}, {greetingName}
        </p>
        <h1
          id="home-command-heading"
          className="mt-2 font-serif text-[1.65rem] font-medium leading-[1.12] tracking-tight text-[#1A1224] sm:text-[2rem]"
        >
          What should you read tonight?
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#1A1224]/60">
          One question. Moonie searches the catalogue and explains each match.
        </p>

        {tasteChips.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {tasteChips.map((chip) => (
              <li key={chip.label}>
                {chip.href ? (
                  <Link
                    href={chip.href}
                    className="inline-flex min-h-8 items-center rounded-full border border-[#1A1224]/10 bg-[#FBF7F1] px-3 text-[12px] font-semibold text-[#1A1224] transition hover:border-[#6E46C7]/30 hover:text-[#6E46C7]"
                  >
                    {chip.label}
                  </Link>
                ) : (
                  <span className="inline-flex min-h-8 items-center rounded-full border border-[#6E46C7]/15 bg-[#6E46C7]/8 px-3 text-[12px] font-semibold text-[#6E46C7]">
                    {chip.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        <form
          className="mt-5 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            submit(prompt);
          }}
        >
          <label htmlFor="home-moonie-command" className="sr-only">
            Ask Moonie what to read
          </label>
          <input
            id="home-moonie-command"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe mood, trope, or hard no…"
            className="min-h-12 flex-1 rounded-full border border-[#1A1224]/10 bg-white px-4 text-sm text-[#1A1224] shadow-sm placeholder:text-[#1A1224]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
          />
          <AskMoonieButton
            type="button"
            onClick={() => submit(prompt)}
            size="lg"
            className="min-h-12 border-0 px-5"
          />
        </form>

        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Suggested prompts">
          {smartPrompts.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => submit(item)}
                className="inline-flex min-h-9 max-w-full items-center rounded-full border border-[#1A1224]/8 bg-[#FBF7F1]/80 px-3 text-left text-[12px] font-medium text-[#1A1224]/80 transition hover:border-[#6E46C7]/25 hover:text-[#6E46C7]"
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
