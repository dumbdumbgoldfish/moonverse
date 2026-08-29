"use client";

import Link from "next/link";
import { PencilLine, Sparkles } from "lucide-react";
import { getWeeklySalonPrompt } from "@/lib/community-salon";

interface CommunitySalonPromptProps {
  onOpenLane?: (lane: string) => void;
}

export function CommunitySalonPrompt({ onOpenLane }: CommunitySalonPromptProps) {
  const prompt = getWeeklySalonPrompt();

  return (
    <section className="mv-salon-panel rounded-2xl border border-[var(--mv-plum)]/18 px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--mv-plum)]">
        <Sparkles className="size-3.5" aria-hidden />
        {prompt.title}
      </p>
      <p className="mt-1.5 font-serif text-[1.05rem] font-semibold leading-snug text-[var(--mv-ink)]">
        {prompt.question}
      </p>
      <p className="mt-1 text-[13px] text-[var(--mv-text-muted)]">
        {prompt.writeHint}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/reviews/new?resume=1"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--mv-deep-plum)] px-3.5 text-[13px] font-semibold text-white transition hover:bg-[var(--mv-plum)]"
        >
          <PencilLine className="size-3.5" aria-hidden />
          Write a take
        </Link>
        {onOpenLane ? (
          <button
            type="button"
            onClick={() => onOpenLane(prompt.lane)}
            className="inline-flex h-9 items-center rounded-full border border-[var(--mv-border)] bg-white px-3.5 text-[13px] font-semibold text-[var(--mv-ink)] transition hover:border-[var(--mv-plum)]/35"
          >
            See matching reviews
          </button>
        ) : null}
      </div>
    </section>
  );
}
