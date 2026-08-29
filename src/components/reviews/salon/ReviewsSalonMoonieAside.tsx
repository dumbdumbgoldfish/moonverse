"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  {
    label: "Find my next binge",
    prompt:
      "Recommend completed web novels I can binge this weekend based on popular salon picks.",
  },
  {
    label: "Match my mood",
    prompt:
      "Suggest novels by mood (cozy, tense, or romantic) with spoiler-free reviews.",
  },
] as const;

interface ReviewsSalonMoonieAsideProps {
  prompt: string;
  className?: string;
}

export function ReviewsSalonMoonieAside({
  prompt,
  className,
}: ReviewsSalonMoonieAsideProps) {
  return (
    <section
      aria-label="Ask Moonie"
      className={cn(
        "relative overflow-hidden rounded-[1.25rem]",
        "bg-gradient-to-b from-[#1A1224] via-[#2a1848] to-[#6E46C7]",
        "p-4 text-white shadow-[0_20px_48px_-32px_rgba(26,18,36,0.55)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full bg-[#C89B4A]/25 blur-2xl"
        aria-hidden
      />

      <div className="relative flex justify-center pt-1">
        <MoonieMascot variant="waving" size={88} display="clean" lightweight />
      </div>

      <div className="relative mt-3 space-y-2 text-center">
        <p className="inline-flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#C89B4A]">
          <Sparkles className="size-3" aria-hidden />
          AI reading companion
        </p>
        <h3 className="font-serif text-lg font-medium leading-tight">Ask Moonie</h3>
        <p className="text-[12px] leading-relaxed text-white/72">
          Get tailored novel suggestions, compare vibes, and discover stories readers
          love in the salon.
        </p>
      </div>

      <AskMoonieLink
        href={moonieEntryHref(prompt)}
        tone="dark"
        size="sm"
        className="relative mt-4 w-full"
      >
        Get recommendations
      </AskMoonieLink>

      <ul className="relative mt-4 space-y-2 border-t border-white/10 pt-4">
        {QUICK_PROMPTS.map((item) => (
          <li key={item.label}>
            <Link
              href={moonieEntryHref(item.prompt)}
              className="block text-[11px] font-medium text-white/65 underline-offset-2 transition-colors fine-hover:text-white fine-hover:underline"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
