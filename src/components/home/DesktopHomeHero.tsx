"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Star } from "lucide-react";
import Link from "next/link";
import { FloatingMoonie } from "@/components/brand/FloatingMoonie";
import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { MOONIE_MOOD_OPTIONS } from "@/lib/moonie/constants";
import { Input } from "@/components/ui/input";
import type { ReviewListItem } from "@/types/review";
import { CoverImage } from "@/components/ui/CoverImage";
import { openMoonie } from "@/lib/moonie/open-moonie";

interface DesktopHomeHeroProps {
  displayName?: string;
  picks: ReviewListItem[];
}

export function DesktopHomeHero({ displayName, picks }: DesktopHomeHeroProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <section className="relative hidden overflow-visible px-2 py-6 md:block lg:py-8">
      <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
        <div>
          <p className="text-sm font-semibold text-primary">Moonie says hello</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-night-blue dark:text-foreground">
            {displayName ? `Hi, ${displayName.split(" ")[0]}` : "Welcome back"}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            What would you like to read today?
          </p>

          <form onSubmit={handleSearch} className="relative mt-5">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search novels, genres or reviewers…"
              className="h-12 rounded-full border border-border/60 bg-white pl-11 shadow-sm dark:bg-card"
            />
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {MOONIE_MOOD_OPTIONS.map(({ label, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => openMoonie(prompt)}
                className="rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm ring-1 ring-border/60 transition-colors mv-hover-signup dark:bg-card"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-20 flex justify-center overflow-visible">
          <FloatingMoonie context="hero" size={300} priority />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Moonie recommends
          </p>
          <div className="mt-3 space-y-3">
            {picks.slice(0, 3).map((review) => (
              <Link
                key={review.id}
                href={`/reviews/${review.id}`}
                className="flex gap-3 rounded-2xl bg-white/90 p-3 shadow-md ring-1 ring-border/30 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-card/90"
              >
                <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <CoverImage src={review.coverUrl} alt="" title={review.novelTitle} sizes="44px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold">{review.novelTitle}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{review.excerpt}</p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" />
                    {review.rating}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <AskMoonieButton
            prompt="Surprise me with something new to read"
            size="sm"
            className="mt-4"
          >
            Ask Moonie for more
          </AskMoonieButton>
        </div>
      </div>
    </section>
  );
}
