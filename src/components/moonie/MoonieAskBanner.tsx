"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { MoonieCharacter } from "@/components/moonie/MoonieCharacter";
import { Input } from "@/components/ui/input";
import { MOONIE_DISCOVER_PROMPTS } from "@/lib/moonie/constants";
import { openMoonie } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";

const COMPACT_PROMPTS = [
  { label: "Surprise Me", prompt: "Surprise me with a web novel I'd love" },
  { label: "Trending", prompt: "What are the trending web novels right now?" },
  {
    label: "Based on History",
    prompt: "Recommend novels based on what I've liked before",
  },
  { label: "Enemies to lovers", prompt: "I want enemies to lovers" },
  { label: "Completed fantasy", prompt: "Recommend completed fantasy novels" },
] as const;

interface MoonieAskBannerProps {
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Ask Moonie. Discover uses the compact "constellation bar" layout.
 */
export function MoonieAskBanner({
  variant = "default",
  className,
}: MoonieAskBannerProps) {
  const [input, setInput] = useState("");
  const isCompact = variant === "compact";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message) return;
    openMoonie(message);
    setInput("");
  };

  if (isCompact) {
    return (
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-[linear-gradient(135deg,#f7f3ff_0%,#fffdf9_48%,#fff8e8_100%)]",
          "ring-1 ring-violet-200/70 shadow-[0_12px_40px_-20px_rgba(98,70,234,0.45)]",
          className
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 30%, rgba(246,200,95,0.28), transparent 28%), radial-gradient(circle at 88% 20%, rgba(98,70,234,0.16), transparent 32%), radial-gradient(circle at 70% 90%, rgba(165,148,249,0.18), transparent 36%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full bg-violet-300/20 blur-2xl motion-safe:animate-pulse"
        />

        <div className="relative flex items-stretch gap-3 p-3 sm:gap-4 sm:p-3.5">
          <div className="hidden shrink-0 items-end sm:flex">
            <MoonieCharacter
              emotion="excited"
              size={56}
              lightweight
              className="drop-shadow-md transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-baseline gap-2">
              <p className="font-serif text-sm font-semibold tracking-tight text-violet-950 sm:text-[15px]">
                Ask Moonie
              </p>
              <span className="hidden text-[11px] text-violet-700/70 sm:inline">
                mood · trope · vibe
              </span>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <label htmlFor="discover-moonie-prompt-compact" className="sr-only">
                Ask Moonie what to read next
              </label>
              <div className="relative min-w-0 flex-1">
                <Sparkles
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-violet-400"
                  aria-hidden
                />
                <Input
                  id="discover-moonie-prompt-compact"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="What should I fall into tonight?"
                  className="h-10 rounded-full border-violet-200/80 bg-white/90 pl-9 text-sm shadow-none placeholder:text-violet-400/80 focus-visible:ring-violet-400/40"
                />
              </div>
              <AskMoonieButton
                type="button"
                onClick={() => {
                  const message = input.trim();
                  if (!message) return;
                  openMoonie(message);
                  setInput("");
                }}
                size="sm"
                className="h-10 shrink-0 px-4"
              >
                Ask
              </AskMoonieButton>
            </form>

            <div
              className="discover-hscroll mt-2.5 flex gap-1.5"
              role="group"
              aria-label="Quick prompts"
            >
              {COMPACT_PROMPTS.map(({ label, prompt }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => openMoonie(prompt)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200",
                    "bg-white/70 text-violet-800 ring-1 ring-violet-200/80",
                    "hover:bg-amber-50 hover:text-amber-900 hover:ring-amber-300/70",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  )}
                >
                  {label}
                </button>
              ))}
              <span className="w-2 shrink-0" aria-hidden />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "mb-6 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-moon-purple-soft/70 via-white to-white p-4 shadow-sm sm:p-5",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <MoonieCharacter emotion="happy" size={40} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">Ask Moonie</p>
          <p className="text-xs text-muted-foreground">
            Describe a mood, trope or genre and Moonie searches MoonVerse for you.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <label htmlFor="discover-moonie-prompt" className="sr-only">
          Ask Moonie what to read next
        </label>
        <Input
          id="discover-moonie-prompt"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What should I read next?"
          className="h-11 rounded-full border border-border/60 bg-white shadow-sm"
        />
        <AskMoonieButton
          type="button"
          onClick={() => {
            const message = input.trim();
            if (!message) return;
            openMoonie(message);
            setInput("");
          }}
          size="md"
          className="h-11 shrink-0 px-5"
        >
          Ask
        </AskMoonieButton>
      </form>

      <div
        className="mt-3 flex flex-wrap gap-2"
        role="group"
        aria-label="Example prompts"
      >
        {MOONIE_DISCOVER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => openMoonie(prompt)}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-primary ring-1 ring-primary/20 transition-colors mv-hover-signup"
          >
            {prompt}
          </button>
        ))}
      </div>
    </section>
  );
}
