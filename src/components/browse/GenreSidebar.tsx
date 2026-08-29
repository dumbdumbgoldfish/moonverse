"use client";

import { BookOpen, Hash, Sparkles, Tag } from "lucide-react";
import { MoonieCharacter } from "@/components/moonie/MoonieCharacter";
import { openMoonie } from "@/lib/moonie/open-moonie";
import type { GenrePresentation } from "@/lib/genre-presentation";
import { cn } from "@/lib/utils";

interface GenreSidebarProps {
  presentation: GenrePresentation;
  popularTags: { name: string; slug: string }[];
  className?: string;
}

function genreMooniePrompts(genreLabel: string): { label: string; prompt: string }[] {
  return [
    {
      label: `Best ${genreLabel}`,
      prompt: `What are the best ${genreLabel.toLowerCase()} web novels on MoonVerse?`,
    },
    {
      label: "Surprise me",
      prompt: `Surprise me with a ${genreLabel.toLowerCase()} novel I'd love`,
    },
    {
      label: "Beginner pick",
      prompt: `Recommend a beginner-friendly ${genreLabel.toLowerCase()} web novel`,
    },
  ];
}

export function GenreSidebar({
  presentation,
  popularTags,
  className,
}: GenreSidebarProps) {
  const prompts = genreMooniePrompts(presentation.label);
  const Icon = presentation.icon;

  return (
    <aside
      className={cn(
        "flex flex-col gap-4 self-start lg:sticky lg:top-28",
        className
      )}
      aria-label="Genre insights"
    >
      <section
        className={cn(
          "overflow-hidden rounded-2xl border border-violet-100/90 p-4 shadow-sm",
          presentation.softBackgroundClass
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
              presentation.iconContainerClass
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-[#1a1033]">
              About {presentation.label}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#1a1033]/75">
              {presentation.description}
            </p>
          </div>
        </div>
      </section>

      {popularTags.length > 0 && (
        <section className="rounded-2xl border border-violet-100/90 bg-white p-4 shadow-sm">
          <h2 className="inline-flex items-center gap-2 text-sm font-extrabold text-[#1a1033]">
            <Hash className="size-4 text-primary" aria-hidden />
            Popular tags
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {popularTags.slice(0, 8).map((tag) => (
              <li key={tag.slug}>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-primary",
                    "ring-1 ring-violet-100 transition-colors hover:bg-violet-100/80"
                  )}
                >
                  <Tag className="size-3 opacity-70" aria-hidden />
                  {tag.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-violet-100/90 bg-gradient-to-br from-[#f7f3ff] via-white to-[#fffdf9] p-4 shadow-[0_8px_24px_-14px_rgba(98,70,234,0.2)]">
        <div className="flex items-start gap-3">
          <MoonieCharacter emotion="thinking" size={52} lightweight />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" aria-hidden />
              <h2 className="text-sm font-extrabold text-[#1a1033]">Ask Moonie</h2>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#1a1033]/70">
              Not sure what to read? Moonie can help you find {presentation.label.toLowerCase()}{" "}
              picks tailored to your mood.
            </p>
          </div>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {prompts.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => openMoonie(item.prompt)}
              className={cn(
                "inline-flex h-11 min-h-11 items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3.5 text-xs font-bold text-[#1a1033]",
                "shadow-sm transition-colors hover:border-primary/35 hover:bg-violet-50/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              )}
            >
              <Sparkles className="size-3.5 text-primary/80" aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <BookOpen className="size-3.5" aria-hidden />
          Opens Moonie with a ready-made prompt
        </p>
      </section>
    </aside>
  );
}
