"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { moonieLoggedInEntryHref } from "@/lib/moonie/open-moonie";
import type { WriteStep } from "@/components/reviews/write/ReviewStepIndicator";
import { cn } from "@/lib/utils";

const STEP_COPY: Record<
  WriteStep,
  { headline: string; body: string; prompt: string; cta: string }
> = {
  1: {
    headline: "Need inspiration?",
    body: "Moonie can suggest titles from your library when you are not sure what to review next.",
    prompt:
      "Suggest novels from my library and taste that I should review next on MoonVerse.",
    cta: "Find a title",
  },
  2: {
    headline: "Stuck on the angle?",
    body: "Ask Moonie what themes readers highlight for books like yours. It won't draft for you.",
    prompt:
      "What themes and discussion angles do readers highlight for novels like the one I'm reviewing?",
    cta: "Explore angles",
  },
  3: {
    headline: "Almost ready",
    body: "After publishing, Moonie can help readers discover your perspective in the salon.",
    prompt:
      "After I publish this review, suggest related novels and readers who might enjoy my perspective.",
    cta: "Plan discovery",
  },
};

interface WritingStudioMoonieAsideProps {
  step: WriteStep;
  novelTitle?: string | null;
  className?: string;
  compact?: boolean;
}

export function WritingStudioMoonieAside({
  step,
  novelTitle,
  className,
  compact = false,
}: WritingStudioMoonieAsideProps) {
  const copy = STEP_COPY[step];
  const prompt = novelTitle?.trim()
    ? `${copy.prompt} The novel is "${novelTitle.trim()}".`
    : copy.prompt;

  if (compact) {
    return (
      <div
        className={cn(
          "rounded-xl border border-[var(--mv-plum)]/15 bg-[var(--mv-plum)]/[0.05] p-3",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <MoonieMascot variant="thinking" size={44} display="clean" lightweight />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--mv-plum)]">
              {copy.headline}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--mv-text-muted)]">
              {copy.body}
            </p>
            <AskMoonieLink
              href={moonieLoggedInEntryHref(prompt)}
              tone="light"
              size="sm"
              variant="soft"
              className="mt-2.5 h-9 w-full justify-center px-2 text-xs"
            >
              {copy.cta}
            </AskMoonieLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Moonie writing companion"
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--mv-plum)]/20 bg-[linear-gradient(160deg,var(--mv-surface-soft)_0%,#ffffff_55%,var(--mv-paper)_100%)] p-4",
        className
      )}
    >
      <div className="flex gap-3">
        <MoonieMascot variant="waving" size={56} display="clean" lightweight />
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--mv-plum)]">
            Ask Moonie
          </p>
          <h3 className="mt-1 font-serif text-base font-semibold leading-tight text-[var(--mv-ink)]">
            {copy.headline}
          </h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--mv-text-muted)]">
            {copy.body}
          </p>
        </div>
      </div>

      <AskMoonieLink
        href={moonieLoggedInEntryHref(prompt)}
        tone="light"
        size="sm"
        className="mt-4 w-full"
      >
        {copy.cta}
      </AskMoonieLink>

      <Link
        href={moonieLoggedInEntryHref()}
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--mv-plum)] underline-offset-2 transition-colors fine-hover:underline"
      >
        Open Moonie hub
        <ArrowRight className="size-3" aria-hidden />
      </Link>
    </section>
  );
}
