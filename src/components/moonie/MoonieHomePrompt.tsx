"use client";

import { FloatingMoonie } from "@/components/brand/FloatingMoonie";
import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { Input } from "@/components/ui/input";
import { MOONIE_QUICK_PROMPTS } from "@/lib/moonie/constants";
import { moonieVariantFor } from "@/lib/moonie/variants";
import { openMoonie } from "@/lib/moonie/open-moonie";

interface MoonieHomePromptProps {
  variant?: "hero" | "sidebar" | "section";
  /** Use on dark section backgrounds (e.g. Meet Moonie shelf). */
  tone?: "light" | "dark";
}

export function MoonieHomePrompt({
  variant = "section",
  tone = "light",
}: MoonieHomePromptProps) {
  if (variant === "hero") {
    return (
      <section className="relative mx-4 overflow-visible py-4">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <FloatingMoonie variant={moonieVariantFor("homepageGreeting")} size={140} priority />
          <div>
            <h2 className="text-2xl font-bold">Discover with Moonie</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Moonie helps you discover your next favorite novel.
            </p>
            <AskMoonieButton className="mt-4" />
          </div>
        </div>
      </section>
    );
  }

  const isSidebar = variant === "sidebar";
  const onDark = tone === "dark";
  const titleClass = isSidebar
    ? "text-sm font-semibold"
    : "text-xl font-bold sm:text-2xl";
  const titleTone = onDark ? "text-[#F7F5FF]" : "text-foreground";
  const subtitleTone = onDark ? "text-[#B7BDD1]" : "text-muted-foreground";

  return (
    <div className={isSidebar ? "p-1" : "py-2"}>
      <div className="flex items-start gap-2">
        <FloatingMoonie
          variant="thinking"
          size={isSidebar ? 56 : 88}
          display="badge"
          compact={isSidebar}
        />
        <div className="min-w-0 flex-1">
          <h3 className={`${titleClass} ${titleTone}`}>Ask Moonie</h3>
          <p className={`mt-1 text-xs sm:text-sm ${subtitleTone}`}>
            Get personalised web novel picks from MoonVerse.
          </p>
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap gap-1.5"
        role="group"
        aria-label="Quick prompts"
      >
        {MOONIE_QUICK_PROMPTS.slice(0, isSidebar ? 3 : 4).map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => openMoonie(prompt)}
            className="rounded-full border border-primary/20 bg-white px-2.5 py-1 text-xs text-primary transition-colors mv-hover-signup focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-card"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const input = form.elements.namedItem("moonie-prompt") as HTMLInputElement;
          if (input.value.trim()) {
            openMoonie(input.value.trim());
            input.value = "";
          }
        }}
      >
        <label htmlFor={isSidebar ? "moonie-sidebar-prompt" : "moonie-home-prompt"} className="sr-only">
          Ask Moonie for recommendations
        </label>
        <Input
          id={isSidebar ? "moonie-sidebar-prompt" : "moonie-home-prompt"}
          name="moonie-prompt"
          placeholder="What should I read next?"
          className="bg-white text-sm dark:bg-card"
        />
        <AskMoonieButton
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.currentTarget.closest("form")?.requestSubmit();
          }}
          size={isSidebar ? "sm" : "md"}
        >
          Ask
        </AskMoonieButton>
      </form>
    </div>
  );
}
