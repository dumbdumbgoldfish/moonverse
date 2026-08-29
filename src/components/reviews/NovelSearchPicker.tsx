"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BookOpen, Search, X } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { NovelSelectOption } from "@/services/novel.service";

interface NovelSearchPickerProps {
  novels: NovelSelectOption[];
  value: string;
  onChange: (novelId: string) => void;
  disabled?: boolean;
}

export function NovelSearchPicker({
  novels,
  value,
  onChange,
  disabled = false,
}: NovelSearchPickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => novels.find((novel) => novel.id === value) ?? null,
    [novels, value]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return novels.slice(0, 12);

    return novels
      .filter((novel) => {
        const title = novel.title.toLowerCase();
        const author = (novel.author ?? "").toLowerCase();
        return title.includes(q) || author.includes(q);
      })
      .slice(0, 20);
  }, [novels, query]);

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

  function clearSelection() {
    onChange("");
    setQuery("");
    setOpen(true);
  }

  return (
    <div ref={rootRef} className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
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
          className="h-12 rounded-xl border-violet-100 bg-[#fffdf9] pl-9 pr-3"
        />
      </div>

      {selected ? (
        <div className="flex gap-3 rounded-2xl border border-violet-100 bg-[#faf8ff] p-3.5">
          <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg bg-violet-100 ring-1 ring-black/5">
            <CoverImage
              src={selected.coverUrl ?? ""}
              alt={`Cover of ${selected.title}`}
              title={selected.title}
              author={selected.author ?? undefined}
              themeSeed={selected.id}
              sizes="56px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              Selected novel
            </p>
            <p className="mt-1 font-serif text-base font-bold leading-snug text-night-blue">
              {selected.title}
            </p>
            <p className="mt-0.5 text-sm text-slate-600">
              {selected.author ? `by ${selected.author}` : "Author not listed"}
            </p>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            disabled={disabled}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-night-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Clear selected novel"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Matching novels"
          className="max-h-72 overflow-y-auto rounded-2xl border border-violet-100 bg-white shadow-lg"
        >
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No novels match “{query.trim()}”. Try another title or switch to
              New novel.
            </p>
          ) : (
            <ul className="divide-y divide-violet-50 py-1">
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
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition",
                        "hover:bg-[#faf8ff] focus-visible:bg-[#faf8ff] focus-visible:outline-none",
                        active && "bg-violet-50"
                      )}
                    >
                      <div className="relative aspect-[2/3] w-9 shrink-0 overflow-hidden rounded-md bg-violet-100">
                        <CoverImage
                          src={novel.coverUrl ?? ""}
                          alt=""
                          title={novel.title}
                          themeSeed={novel.id}
                          sizes="36px"
                        />
                      </div>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-night-blue">
                          {novel.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {novel.author ? `by ${novel.author}` : "Author not listed"}
                        </span>
                      </span>
                      <BookOpen
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-primary" : "text-slate-300"
                        )}
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!query.trim() && novels.length > 12 ? (
            <p className="border-t border-violet-50 px-4 py-2 text-xs text-slate-500">
              Showing the first 12 novels. Type to search the full list (
              {novels.length} titles).
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
