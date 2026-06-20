"use client";

import { Sparkles } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOONIE_QUICK_PROMPTS } from "@/lib/moonie/constants";

interface MoonieHomePromptProps {
  variant?: "hero" | "sidebar" | "section";
}

export function MoonieHomePrompt({ variant = "section" }: MoonieHomePromptProps) {
  const openMoonie = (prompt?: string) => {
    window.dispatchEvent(
      new CustomEvent("moonie:open", { detail: prompt ? { prompt } : undefined })
    );
  };

  if (variant === "hero") {
    return null;
  }

  const isSidebar = variant === "sidebar";

  return (
    <div
      className={
        isSidebar
          ? "rounded-2xl border border-primary/15 bg-gradient-to-br from-moon-purple-soft to-white p-4 shadow-sm"
          : "rounded-3xl border border-primary/20 bg-gradient-to-br from-moon-purple-soft via-white to-sky-50 p-6 shadow-md sm:p-8"
      }
    >
      <div className="flex items-start gap-3">
        <MoonieMascot size={isSidebar ? 40 : 56} animated />
        <div className="min-w-0 flex-1">
          <h3
            className={
              isSidebar
                ? "text-sm font-semibold text-foreground"
                : "text-xl font-bold text-foreground sm:text-2xl"
            }
          >
            Ask Moonie
          </h3>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Get personalised web novel picks from MoonVerse data.
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
            className="rounded-full border border-primary/20 bg-white px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          placeholder="e.g. slow-burn romance with magic school"
          className="bg-white text-sm"
        />
        <Button type="submit" size={isSidebar ? "sm" : "default"}>
          <Sparkles data-icon="inline-start" aria-hidden="true" />
          Ask
        </Button>
      </form>
    </div>
  );
}
