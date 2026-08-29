"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { saveGenrePreferencesAction } from "@/actions/preference.actions";
import { getGenreIcon } from "@/components/browse/genre-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PreferredGenreOption } from "@/services/preference.service";

const MIN_PICKS = 3;
const MAX_PICKS = 10;

interface GenrePreferenceFormProps {
  genres: PreferredGenreOption[];
  initialSelectedIds?: string[];
  displayName?: string;
  redirectTo?: string;
  submitLabel?: string;
}

export function GenrePreferenceForm({
  genres,
  initialSelectedIds = [],
  displayName,
  redirectTo = "/home",
  submitLabel = "Build my home feed",
}: GenrePreferenceFormProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const count = selected.size;
  const canSubmit = count >= MIN_PICKS && count <= MAX_PICKS;
  const firstName = displayName?.trim().split(/\s+/)[0];

  function toggle(id: string) {
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= MAX_PICKS) {
        setError(`You can pick up to ${MAX_PICKS} genres.`);
        return prev;
      }
      next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (!canSubmit) {
      setError(`Choose at least ${MIN_PICKS} genres.`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveGenrePreferencesAction([...selected]);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="text-center">
        <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.18em] text-primary">
          <Sparkles className="size-3.5" aria-hidden />
          {firstName ? `Hi, ${firstName}` : "Personalise MoonVerse"}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-night-blue sm:text-3xl">
          Choose the worlds you love
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
          Pick the genres you enjoy. Moonie will use them to shape your
          recommendations.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm font-semibold text-night-blue">
          {count < MIN_PICKS
            ? `Choose at least ${MIN_PICKS} genres`
            : `${count} selected`}
          <span className="font-normal text-slate-500">
            {" "}
            · max {MAX_PICKS}
          </span>
        </p>
        <Button
          type="button"
          className="rounded-full"
          disabled={!canSubmit || isPending}
          onClick={handleSubmit}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {genres.map((genre) => {
          const Icon = getGenreIcon(genre.slug);
          const active = selected.has(genre.id);
          return (
            <li key={genre.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => toggle(genre.id)}
                className={cn(
                  "relative flex h-full w-full flex-col items-start gap-2 rounded-2xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active
                    ? "border-primary mv-nav-signup border-0 text-white shadow-sm"
                    : "border-violet-100 bg-white text-night-blue hover:border-violet-200 hover:bg-violet-50"
                )}
              >
                {active ? (
                  <span className="absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full bg-white/20">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                ) : null}
                <span
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-xl",
                    active ? "bg-white/15" : "bg-violet-50 text-primary"
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="pr-4 text-sm font-bold leading-snug">
                  {genre.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-4 mt-8 flex justify-center sm:hidden">
        <Button
          type="button"
          className="min-w-[14rem] rounded-full shadow-lg"
          disabled={!canSubmit || isPending}
          onClick={handleSubmit}
        >
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
