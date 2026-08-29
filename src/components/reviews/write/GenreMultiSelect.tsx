"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, Tags, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WEB_NOVEL_GENRES } from "@/lib/genres";
import { cn } from "@/lib/utils";

interface GenreOption {
  id: string;
  name: string;
}

interface GenreMultiSelectProps {
  genres: GenreOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  max?: number;
  error?: string | null;
}

const POPULAR_NAMES = WEB_NOVEL_GENRES.slice(0, 10).map((g) => g.name);

export function GenreMultiSelect({
  genres,
  selectedIds,
  onChange,
  disabled = false,
  max = 8,
  error = null,
}: GenreMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const errorId = "genre-select-error";

  const byId = useMemo(
    () => new Map(genres.map((genre) => [genre.id, genre])),
    [genres]
  );

  const selected = selectedIds
    .map((id) => byId.get(id))
    .filter((genre): genre is GenreOption => Boolean(genre));

  const popular = useMemo(() => {
    const popularSet = new Set(POPULAR_NAMES.map((name) => name.toLowerCase()));
    return genres.filter((genre) => popularSet.has(genre.name.toLowerCase()));
  }, [genres]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return genres;
    return genres.filter((genre) => genre.name.toLowerCase().includes(q));
  }, [genres, query]);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    if (selectedIds.length >= max) return;
    onChange([...selectedIds, id]);
  }

  const atMax = selectedIds.length >= max;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <Label className="inline-flex items-center gap-1.5">
          <Tags className="size-3.5 text-primary" aria-hidden />
          Genres
          <span className="font-normal text-slate-500">(required)</span>
        </Label>
        <p className="text-xs font-medium text-slate-500">
          {selectedIds.length} of {max} selected
        </p>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((genre) => (
            <button
              key={genre.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(genre.id)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-sm font-semibold text-primary ring-1 ring-primary/20"
            >
              {genre.name}
              <X className="size-3.5" aria-hidden />
              <span className="sr-only">Remove {genre.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          Popular genres
        </p>
        <div className="flex flex-wrap gap-2">
          {popular.map((genre) => {
            const active = selectedIds.includes(genre.id);
            return (
              <button
                key={genre.id}
                type="button"
                disabled={disabled || (!active && atMax)}
                onClick={() => toggle(genre.id)}
                className={cn(
                  "min-h-10 rounded-xl px-3 text-sm font-semibold transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active
                    ? "mv-nav-signup border-0 text-white"
                    : "bg-[#faf8ff] text-slate-700 ring-1 ring-violet-100 hover:bg-violet-50",
                  !active && atMax && "opacity-40"
                )}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAll((prev) => !prev)}
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-primary"
      >
        <ChevronDown
          className={cn("size-4 transition", showAll && "rotate-180")}
          aria-hidden
        />
        {showAll ? "Hide full genre list" : "View all genres"}
      </button>

      {showAll ? (
        <div className="space-y-3 rounded-2xl border border-violet-100 bg-white p-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search genres…"
              disabled={disabled}
              className="h-11 rounded-xl pl-9"
              aria-describedby={error ? errorId : undefined}
            />
          </div>
          <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto">
            {filtered.map((genre) => {
              const active = selectedIds.includes(genre.id);
              return (
                <button
                  key={genre.id}
                  type="button"
                  disabled={disabled || (!active && atMax)}
                  onClick={() => toggle(genre.id)}
                  className={cn(
                    "min-h-9 rounded-lg px-2.5 text-xs font-semibold transition",
                    active
                      ? "mv-nav-signup border-0 text-white"
                      : "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
                    !active && atMax && "opacity-40"
                  )}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {atMax ? (
        <p className="text-xs text-amber-800">
          Maximum of {max} genres reached. Remove one to add another.
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <p className="text-xs text-slate-500">
        Can&apos;t find the genre?{" "}
        <span className="font-medium text-slate-600">
          Suggest a genre
        </span>{" "}
        via Contact after publishing. New genres are moderated before they
        become public.
      </p>
    </div>
  );
}
