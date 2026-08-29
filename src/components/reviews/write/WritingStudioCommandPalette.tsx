"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { WritingStudioCommand } from "@/components/reviews/write/writing-studio-commands";
import { cn } from "@/lib/utils";

interface WritingStudioCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: WritingStudioCommand[];
}

const GROUP_ORDER = ["Insert", "Writing", "Studio", "Publish"] as const;

function WritingStudioCommandPaletteSession({
  commands,
  onOpenChange,
}: {
  commands: WritingStudioCommand[];
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((command) => {
      const haystack = [
        command.label,
        command.hint,
        command.group,
        ...(command.keywords ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [commands, query]);

  const grouped = useMemo(() => {
    const buckets = new Map<string, WritingStudioCommand[]>();
    for (const group of GROUP_ORDER) {
      buckets.set(group, []);
    }
    for (const command of filtered) {
      const list = buckets.get(command.group) ?? [];
      list.push(command);
      buckets.set(command.group, list);
    }
    return GROUP_ORDER.map((group) => ({
      group,
      items: buckets.get(group) ?? [],
    })).filter((entry) => entry.items.length > 0);
  }, [filtered]);

  const flatItems = useMemo(
    () => grouped.flatMap((entry) => entry.items),
    [grouped]
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function run(command: WritingStudioCommand) {
    if (command.disabled) return;
    onOpenChange(false);
    command.onSelect();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flatItems.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter" && flatItems[activeIndex]) {
      event.preventDefault();
      run(flatItems[activeIndex]);
    }
  }

  return (
    <DialogContent
      showCloseButton
      className="gap-0 overflow-hidden border-[var(--mv-border)] bg-white p-0 sm:max-w-lg"
    >
      <DialogHeader className="border-b border-[var(--mv-border)] px-4 py-3 text-left">
        <DialogTitle className="font-serif text-lg text-[var(--mv-ink)]">
          Writing studio
        </DialogTitle>
        <DialogDescription className="text-[var(--mv-text-muted)]">
          Insert sections, change modes, or preview your review.
        </DialogDescription>
      </DialogHeader>

      <div className="border-b border-[var(--mv-border)] px-3 py-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--mv-text-muted)]"
            aria-hidden
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search commands…"
            className="h-10 border-[var(--mv-border)] bg-[var(--mv-paper)]/50 pl-9"
          />
        </div>
      </div>

      <div className="max-h-[min(50vh,360px)] overflow-y-auto px-2 py-2">
        {flatItems.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-[var(--mv-text-muted)]">
            No commands match that search.
          </p>
        ) : (
          grouped.map((entry) => (
            <div key={entry.group} className="mb-2 last:mb-0">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mv-text-muted)]">
                {entry.group}
              </p>
              <ul>
                {entry.items.map((command) => {
                  const index = flatItems.indexOf(command);
                  const active = index === activeIndex;
                  return (
                    <li key={command.id}>
                      <button
                        type="button"
                        disabled={command.disabled}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => run(command)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition",
                          active
                            ? "bg-[var(--mv-plum)]/[0.08] text-[var(--mv-ink)]"
                            : "text-[var(--mv-ink)] hover:bg-[var(--mv-paper)]",
                          command.disabled && "cursor-not-allowed opacity-50"
                        )}
                      >
                        <span>
                          <span className="block text-sm font-semibold">
                            {command.label}
                          </span>
                          {command.hint ? (
                            <span className="mt-0.5 block text-xs text-[var(--mv-text-muted)]">
                              {command.hint}
                            </span>
                          ) : null}
                        </span>
                        {command.hint?.includes("⌘") ? (
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--mv-text-muted)]">
                            {command.hint.match(/⌘[^\s]+/)?.[0]}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-[var(--mv-border)] bg-[var(--mv-paper)]/60 px-4 py-2 text-[11px] text-[var(--mv-text-muted)]">
        <span className="font-semibold text-[var(--mv-ink)]">↑↓</span> navigate ·{" "}
        <span className="font-semibold text-[var(--mv-ink)]">Enter</span> run ·{" "}
        <span className="font-semibold text-[var(--mv-ink)]">Esc</span> close
      </div>
    </DialogContent>
  );
}

export function WritingStudioCommandPalette({
  open,
  onOpenChange,
  commands,
}: WritingStudioCommandPaletteProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <WritingStudioCommandPaletteSession
          commands={commands}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}
