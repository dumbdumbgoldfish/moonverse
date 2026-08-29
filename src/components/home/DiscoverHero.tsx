"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Search } from "lucide-react";
import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { MoonieCharacter } from "@/components/moonie/MoonieCharacter";
import { getGenreIcon } from "@/components/browse/genre-icon";
import { Button } from "@/components/ui/button";
import {
  DISCOVERY_MOOD_CHIPS,
  MOONIE_QUICK_PROMPTS,
} from "@/lib/moonie/constants";
import { openMoonie } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";
import type { PreferredGenreOption } from "@/services/preference.service";

interface DiscoverHeroProps {
  greetingName: string;
  genres: PreferredGenreOption[];
}

function timeGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DiscoverHero({ greetingName, genres }: DiscoverHeroProps) {
  const router = useRouter();
  const [greeting] = useState(() => timeGreeting(new Date().getHours()));
  const [prompt, setPrompt] = useState("");
  const [titleQuery, setTitleQuery] = useState("");

  function submitMoonie(value: string) {
    const next = value.trim();
    if (!next) return;
    openMoonie(next);
    setPrompt("");
  }

  function submitTitleSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = titleQuery.trim();
    if (q.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(q)}&type=works`);
  }

  return (
    <header className="relative overflow-hidden rounded-[28px] border border-[#2a2150]/80 bg-[#080B16] text-[#F7F5FF] shadow-[0_24px_60px_-28px_rgba(8,11,22,0.7)]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-[#A99BFF]/25 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-[#FFD978]/12 blur-3xl" />
      </div>

      <div className="relative grid items-stretch lg:grid-cols-[minmax(0,1.25fr)_minmax(240px,0.75fr)]">
        <div className="flex flex-col gap-5 px-5 py-6 sm:px-7 sm:py-8 lg:pr-4">
          <p className="text-sm font-medium text-[#B7BDD1]">
            {greeting}, <span className="text-[#F7F5FF]">{greetingName}</span>
          </p>
          <div>
            <h1 className="font-heading text-[1.85rem] font-semibold leading-[1.15] tracking-tight sm:text-[2.25rem]">
              What kind of story are you looking for tonight?
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#B7BDD1] sm:text-[15px]">
              Describe a mood, trope, or hard no. Moonie will rank in-catalogue
              matches and show why they fit.
            </p>
          </div>

          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              submitMoonie(prompt);
            }}
          >
            <label htmlFor="discover-story-prompt" className="sr-only">
              Describe the story you want
            </label>
            <input
              id="discover-story-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="A completed slow-burn romance with a clever heroine"
              className="min-h-11 flex-1 rounded-2xl border border-white/15 bg-white/8 px-4 text-sm text-[#F7F5FF] placeholder:text-[#B7BDD1]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A99BFF]"
            />
            <AskMoonieButton
              type="button"
              onClick={() => submitMoonie(prompt)}
              size="md"
              className="min-h-11 border-0 px-5"
            />
          </form>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B7BDD1]/80">
              Try a prompt
            </p>
            <ul className="flex flex-wrap gap-2">
              {MOONIE_QUICK_PROMPTS.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => submitMoonie(item)}
                    className="min-h-11 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-left text-xs font-semibold text-[#F7F5FF] transition hover:border-[#FFD978]/50 hover:bg-white/12"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B7BDD1]/80">
              <Compass className="size-3.5" aria-hidden />
              Moods
            </p>
            <ul className="flex flex-wrap gap-2">
              {DISCOVERY_MOOD_CHIPS.map((mood) => (
                <li key={mood.label}>
                  <button
                    type="button"
                    onClick={() => submitMoonie(mood.prompt)}
                    className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/8 px-3 text-xs font-semibold text-[#F7F5FF] transition hover:border-[#A99BFF]/60"
                  >
                    {mood.label}
                  </button>
                </li>
              ))}
              {genres.map((genre) => {
                const Icon = getGenreIcon(genre.slug);
                return (
                  <li key={genre.id}>
                    <button
                      type="button"
                      onClick={() =>
                        submitMoonie(`Recommend ${genre.name} novels that match my taste.`)
                      }
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 text-xs font-semibold text-[#F7F5FF] transition hover:border-[#FFD978]/50"
                    >
                      <Icon className="size-3.5 text-[#FFD978]" aria-hidden />
                      {genre.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <form
            onSubmit={submitTitleSearch}
            className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center"
          >
            <p className="text-xs font-semibold text-[#B7BDD1]">
              Already know the title?
            </p>
            <label htmlFor="discover-title-search" className="sr-only">
              Search by title
            </label>
            <input
              id="discover-title-search"
              value={titleQuery}
              onChange={(event) => setTitleQuery(event.target.value)}
              placeholder="Search the catalogue"
              className="min-h-11 flex-1 rounded-2xl border border-white/15 bg-white/8 px-4 text-sm text-[#F7F5FF] placeholder:text-[#B7BDD1]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A99BFF]"
            />
            <Button
              type="submit"
              variant="outline"
              className="min-h-11 rounded-full border-white/20 bg-transparent text-[#F7F5FF] hover:bg-white/10 hover:text-white"
            >
              <Search className="size-4" aria-hidden />
              Search
            </Button>
            <Link
              href="/browse"
              className="inline-flex min-h-11 items-center justify-center rounded-full px-3 text-xs font-semibold text-[#A99BFF] underline-offset-4 hover:underline"
            >
              Open advanced browse
            </Link>
          </form>
        </div>

        <div className="relative hidden min-h-[280px] border-t border-white/10 lg:block lg:border-l lg:border-t-0">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <MoonieCharacter
              size={148}
              emotion="happy"
              compact
              priority
              lightweight
              className="drop-shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
            />
            <p className="mt-3 max-w-[16rem] text-center text-xs leading-relaxed text-[#B7BDD1]">
              Moonie only recommends novels already in the MoonVerse catalogue.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
