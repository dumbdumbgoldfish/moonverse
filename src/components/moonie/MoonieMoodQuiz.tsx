"use client";

import { useState } from "react";
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

const LENGTH_OPTIONS = [
  { label: "Quick read", value: "a shorter, quick read" },
  { label: "Long epic", value: "a long, immersive epic" },
  { label: "Doesn't matter", value: "any length" },
];

export function MoonieMoodQuiz({ onComplete }: MoonieMoodQuizProps) {
  const [tone, setTone] = useState<string | null>(null);

  function handleToneSelect(value: string) {
    setTone(value);
  }

  function handleLengthSelect(value: string) {
    if (tone) {
      onComplete(
        `I'm in the mood for a web novel that is ${tone}. Ideally ${value}.`
      );
      setTone(null);
    }
  }

  return (
    <div className="rounded-2xl border border-primary/15 bg-moon-purple-soft/40 p-4">
      <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
        <Sparkles className="size-3.5" aria-hidden />
        Quick mood quiz
      </p>
      {!tone ? (
        <>
          <p className="mt-2 text-sm font-medium text-foreground">
            What tone are you in the mood for?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TONE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleToneSelect(option.value)}
                className={cn(
                  "rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors mv-hover-signup"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm font-medium text-foreground">
            And how long of a story?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {LENGTH_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleLengthSelect(option.value)}
                className="rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors mv-hover-signup"
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setTone(null)}
            className="mt-2 text-xs text-muted-foreground hover:text-primary"
          >
            ← Back
          </button>
        </>
      )}
    </div>
  );
}
