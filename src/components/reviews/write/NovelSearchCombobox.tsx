"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertCircle, BookOpen, Link2, Loader2, Search } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { NovelSelectOption } from "@/services/novel.service";

interface NovelSearchComboboxProps {
  novels: NovelSelectOption[];
  value: string;
  onChange: (novelId: string) => void;
  disabled?: boolean;
}

const RESULT_LIMIT = 10;

export function NovelSearchCombobox({
  novels,
  value,
  onChange,
  disabled = false,
}: NovelSearchComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isSearching = query !== deferredQuery;
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const pool = !q
      ? novels
      : novels.filter((novel) => {
          const title = novel.title.toLowerCase();
          const author = (novel.author ?? "").toLowerCase();
          return title.includes(q) || author.includes(q);
        });
    return pool.slice(0, RESULT_LIMIT);
  }, [novels, deferredQuery]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function selectNovel(novel: NovelSelectOption) {
    onChange(novel.id);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="space-y-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--mv-text-muted)]"
          aria-hidden
        />
        <Input
          id="novel-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by title or author…"
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-12 rounded-xl border-[var(--mv-border)] bg-white pl-9 pr-10"
        />
        {isSearching ? (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-[var(--mv-plum)]"
            aria-hidden
          />
        ) : null}
      </div>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Matching novels"
          className="max-h-80 overflow-y-auto rounded-2xl border border-[var(--mv-border)] bg-white shadow-[var(--mv-card-shadow)]"
        >
          {isSearching ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--mv-text-muted)]">
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--mv-text-muted)]">
              No novels match “{deferredQuery.trim()}”. Try another title or
              switch to New novel.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--mv-border)] py-1">
              {results.map((novel) => {
                const active = novel.id === value;
                return (
                  <li key={novel.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={disabled}
                      onClick={() => selectNovel(novel)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left transition",
                        "hover:bg-[var(--mv-surface-soft)] focus-visible:bg-[var(--mv-surface-soft)] focus-visible:outline-none",
                        active && "bg-[var(--mv-plum)]/[0.08]"
                      )}
                    >
                      <div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-md bg-violet-100">
                        <CoverImage
                          src={novel.coverUrl ?? ""}
                          alt=""
                          title={novel.title}
                          themeSeed={novel.id}
                          sizes="40px"
                        />
                      </div>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[var(--mv-ink)]">
                          {novel.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[var(--mv-text-muted)]">
                          {novel.author
                            ? `by ${novel.author}`
                            : "Author not listed"}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--mv-text-muted)]">
                          {novel.genres.slice(0, 2).map((genre) => (
                            <span
                              key={genre}
                              className="rounded-full border border-[var(--mv-plum)]/15 bg-[var(--mv-paper)] px-1.5 py-0.5 text-[var(--mv-plum)]"
                            >
                              {genre}
                            </span>
                          ))}
                          <span className="inline-flex items-center gap-0.5">
                            <BookOpen className="size-3" aria-hidden />
                            {novel.reviewCount}
                          </span>
                          {novel.verifiedSourceCount > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-700">
                              <Link2 className="size-3" aria-hidden />
                              Sources
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!deferredQuery.trim() && novels.length > RESULT_LIMIT ? (
            <p className="border-t border-[var(--mv-border)] px-4 py-2 text-xs text-[var(--mv-text-muted)]">
              Showing {RESULT_LIMIT} of {novels.length} novels. Type to refine.
            </p>
          ) : null}
        </div>
      ) : null}

      {!open && query.trim() && results.length === 0 ? (
        <p
          className="inline-flex items-center gap-1.5 text-sm text-[var(--mv-text-muted)]"
          role="status"
        >
          <AlertCircle className="size-3.5" aria-hidden />
          No matches yet. Keep typing or switch to New novel.
        </p>
      ) : null}
    </div>
  );
}
