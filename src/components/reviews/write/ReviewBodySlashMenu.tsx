"use client";

import { useEffect, useMemo, useState } from "react";
import { filterSlashMenuItems } from "@/components/reviews/write/writing-studio-commands";
import { cn } from "@/lib/utils";

interface SlashState {
  lineStart: number;
  query: string;
  replaceEnd: number;
}

export function getReviewBodySlashState(
  body: string,
  cursor: number
): SlashState | null {
  const before = body.slice(0, cursor);
  const lineStart = before.lastIndexOf("\n") + 1;
  const line = before.slice(lineStart);
  if (!line.startsWith("/")) return null;
  return {
    lineStart,
    query: line.slice(1),
    replaceEnd: cursor,
  };
}

interface ReviewBodySlashMenuProps {
  body: string;
  cursor: number;
  onInsert: (nextBody: string, nextCursor: number) => void;
  className?: string;
}

export function ReviewBodySlashMenu({
  body,
  cursor,
  onInsert,
  className,
}: ReviewBodySlashMenuProps) {
  const slash = getReviewBodySlashState(body, cursor);
  const items = useMemo(
    () => (slash ? filterSlashMenuItems(slash.query) : []),
    [slash]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [slash?.query]);

  if (!slash || items.length === 0) return null;

  function apply(item: (typeof items)[number]) {
    const prefix = body.slice(0, slash!.lineStart);
    const suffix = body.slice(slash!.replaceEnd);
    const nextBody = `${prefix}${item.insert}${suffix}`;
    const nextCursor = prefix.length + item.insert.length;
    onInsert(nextBody, nextCursor);
  }

  return (
    <div
      className={cn(
        "absolute left-2 right-2 top-full z-20 mt-1 overflow-hidden rounded-xl border border-[var(--mv-border)] bg-white shadow-[var(--mv-card-shadow)]",
        className
      )}
      role="listbox"
      aria-label="Insert section"
    >
      <p className="border-b border-[var(--mv-border)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mv-text-muted)]">
        Insert section
      </p>
      <ul className="max-h-48 overflow-y-auto py-1">
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                apply(item);
              }}
              className={cn(
                "flex w-full px-3 py-2 text-left text-sm transition",
                index === activeIndex
                  ? "bg-[var(--mv-plum)]/[0.08] text-[var(--mv-ink)]"
                  : "text-[var(--mv-ink)] hover:bg-[var(--mv-paper)]"
              )}
            >
              <span className="font-semibold">{item.label}</span>
              <span className="ml-2 text-xs text-[var(--mv-text-muted)]">
                /{item.id.replace(/-/g, "")}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function handleReviewBodySlashKeyDown(
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  body: string,
  onInsert: (nextBody: string, nextCursor: number) => void
): boolean {
  const textarea = event.currentTarget;
  const slash = getReviewBodySlashState(body, textarea.selectionStart);
  if (!slash) return false;

  const items = filterSlashMenuItems(slash.query);
  if (items.length === 0) return false;

  if (event.key === "Enter" || event.key === "Tab") {
    event.preventDefault();
    const item = items[0];
    const prefix = body.slice(0, slash.lineStart);
    const suffix = body.slice(slash.replaceEnd);
    const nextBody = `${prefix}${item.insert}${suffix}`;
    const nextCursor = prefix.length + item.insert.length;
    onInsert(nextBody, nextCursor);
    return true;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    const prefix = body.slice(0, slash.lineStart);
    const suffix = body.slice(slash.replaceEnd);
    onInsert(prefix + suffix, slash.lineStart);
    return true;
  }

  return false;
}
