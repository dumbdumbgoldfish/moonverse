"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoonieMoodQuizProps {
  onComplete: (prompt: string) => void;
}

const TONE_OPTIONS = [
  { label: "Uplifting & feel-good", value: "uplifting and feel-good" },
  { label: "Dark & gritty", value: "dark, gritty and morally complex" },
  { label: "Romantic", value: "romance-focused with strong chemistry" },
  { label: "Adventurous", value: "action-packed and adventurous" },
];

export function MoonieMoodQuiz({ onComplete }: MoonieMoodQuizProps) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-moon-purple-soft/40 p-4">
      <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
        <Sparkles className="size-3.5" aria-hidden />
        Quick mood quiz
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">
        What tone are you in the mood for?
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {TONE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              onComplete(`I'm in the mood for a web novel that is ${option.value}.`)
            }
            className={cn(
              "rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors mv-hover-signup"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
