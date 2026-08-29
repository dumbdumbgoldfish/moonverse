"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Plus, Search, Tags, X } from "lucide-react";
import {
  suggestTagAction,
  getMyPendingTagSuggestionsAction,
} from "@/actions/tag-suggestion.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  findSimilarTags,
  getAdvisoryMatches,
  getBlockingCanonicalMatch,
  normalizeTagName,
  tagCompactKey,
  type SimilarTagMatch,
} from "@/lib/tag-similarity";
import { cn } from "@/lib/utils";

interface TagOption {
  id: string;
  name: string;
  slug?: string;
}

interface PendingSuggestion {
  id: string;
  name: string;
  normalizedName: string;
  compactKey: string;
  createdAt: string;
}

interface TagMultiSelectProps {
  tags: TagOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  max?: number;
  genreNames?: string[];
  novelId?: string | null;
}

const GROUPS: { label: string; match: RegExp }[] = [
  {
    label: "Relationship",
    match: /slow.?burn|enemies|lovers|romance|otp|ship|arranged|marriage/i,
  },
  {
    label: "Character",
    match: /strong.?fl|anti.?hero|found.?family|op.?mc|female.?lead|male.?lead/i,
  },
  {
    label: "Plot",
    match: /cultivation|reincarnation|revenge|system|isekai|transmigration|regression/i,
  },
  {
    label: "Tone",
    match: /dark|comedy|fluff|angst|tragic|wholesome|gritty/i,
  },
  {
    label: "Setting",
    match: /academy|school|modern|historical|urban|apocalypse|royal/i,
  },
  {
    label: "Origin and translation",
    match: /chinese|korean|japanese|translated|original|cn|kr|jp/i,
  },
];

export function TagMultiSelect({
  tags,
  selectedIds,
  onChange,
  disabled = false,
  max = 10,
  genreNames = [],
  novelId = null,
}: TagMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingSuggestions, setPendingSuggestions] = useState<PendingSuggestion[]>(
    []
  );
  const [suggestNotice, setSuggestNotice] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const safeTags = useMemo(
    () => tags.filter((tag) => !/spoiler/i.test(tag.name)),
    [tags]
  );

  const byId = useMemo(
    () => new Map(safeTags.map((tag) => [tag.id, tag])),
    [safeTags]
  );

  const selected = selectedIds
    .map((id) => byId.get(id))
    .filter((tag): tag is TagOption => Boolean(tag));

  const relevant = useMemo(() => {
    const genreHints = genreNames.join(" ").toLowerCase();
    return safeTags
      .filter((tag) => {
        if (!genreHints) return true;
        const name = tag.name.toLowerCase();
        return (
          genreHints.includes(name) ||
          name.includes("slow") ||
          name.includes("cultivation") ||
          name.includes("translated")
        );
      })
      .slice(0, 12);
  }, [safeTags, genreNames]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return safeTags.slice(0, 40);
    return safeTags.filter((tag) => tag.name.toLowerCase().includes(q)).slice(0, 40);
  }, [safeTags, query]);

  const grouped = useMemo(() => {
    return GROUPS.map((group) => ({
      label: group.label,
      tags: safeTags.filter((tag) => group.match.test(tag.name)).slice(0, 8),
    })).filter((group) => group.tags.length > 0);
  }, [safeTags]);

  const searchAnalysis = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;
    return findSimilarTags(trimmed, safeTags);
  }, [query, safeTags]);

  const blockingMatch = searchAnalysis
    ? getBlockingCanonicalMatch(searchAnalysis)
    : null;

  const advisoryMatches: SimilarTagMatch[] = searchAnalysis
    ? getAdvisoryMatches(searchAnalysis)
    : [];

  const showSuggestPanel =
    Boolean(query.trim()) && filtered.length === 0 && !blockingMatch;

  useEffect(() => {
    void getMyPendingTagSuggestionsAction().then((result) => {
      if (result.success) {
        setPendingSuggestions(result.suggestions);
      }
    });
  }, []);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    if (selectedIds.length >= max) return;
    onChange([...selectedIds, id]);
  }

  function handleSuggestTag() {
    const trimmed = query.trim();
    if (!trimmed || disabled || isPending) return;

    setSuggestError(null);
    setSuggestNotice(null);

    startTransition(async () => {
      const result = await suggestTagAction({
        name: trimmed,
        novelId,
      });

      if (!result.success) {
        if (result.existingTag) {
          setSuggestError(result.error);
          return;
        }
        setSuggestError(result.error);
        return;
      }

      setSuggestNotice(
        `“${result.suggestion.name}” is pending moderator review. If approved, it will become available in MoonVerse.`
      );
      setQuery("");
      const refresh = await getMyPendingTagSuggestionsAction();
      if (refresh.success) {
        setPendingSuggestions(refresh.suggestions);
      }
    });
  }

  const atMax = selectedIds.length >= max;
  const normalizedQuery = normalizeTagName(query);
  const queryCompactKey = normalizedQuery ? tagCompactKey(normalizedQuery) : "";
  const alreadyPending =
    Boolean(queryCompactKey) &&
    pendingSuggestions.some((item) => item.compactKey === queryCompactKey);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <Label className="inline-flex items-center gap-1.5">
          <Tags className="size-3.5 text-[var(--mv-plum)]" aria-hidden />
          Tags
          <span className="font-normal text-[var(--mv-text-muted)]">
            (optional)
          </span>
        </Label>
        <p className="text-xs font-medium text-[var(--mv-text-muted)]">
          {selectedIds.length} of {max} selected
        </p>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((tag) => (
            <button
              key={tag.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(tag.id)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[var(--mv-plum)]/[0.08] px-3 text-sm font-semibold text-[var(--mv-ink)] ring-1 ring-[var(--mv-plum)]/20"
            >
              {tag.name}
              <X className="size-3.5" aria-hidden />
            </button>
          ))}
        </div>
      ) : null}

      {pendingSuggestions.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-[var(--mv-border)] bg-[var(--mv-surface-soft)]/50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--mv-plum)]">
            Pending your suggestions
          </p>
          <ul className="space-y-1.5">
            {pendingSuggestions.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 text-sm text-[var(--mv-text-muted)]"
              >
                <Check className="size-3.5 shrink-0 text-[var(--mv-plum)]" aria-hidden />
                <span>
                  <span className="font-medium text-[var(--mv-ink)]">
                    {item.name}
                  </span>{" "}
                  · pending moderator review
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--mv-text-muted)]"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSuggestError(null);
            setSuggestNotice(null);
          }}
          placeholder="Search tags…"
          disabled={disabled}
          className="h-11 rounded-xl border-[var(--mv-border)] pl-9"
        />
      </div>

      {!query.trim() && relevant.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--mv-text-muted)]">
            Suggested for your genres
          </p>
          <div className="flex flex-wrap gap-2">
            {relevant.map((tag) => {
              const active = selectedIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={disabled || (!active && atMax)}
                  onClick={() => toggle(tag.id)}
                  className={cn(
                    "min-h-9 rounded-lg px-2.5 text-xs font-semibold",
                    active
                      ? "bg-[var(--mv-deep-plum)] text-white"
                      : "bg-white text-[var(--mv-ink)] ring-1 ring-[var(--mv-border)]",
                    !active && atMax && "opacity-40"
                  )}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {query.trim() && filtered.length > 0 ? (
        <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
          {filtered.map((tag) => {
            const active = selectedIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                disabled={disabled || (!active && atMax)}
                onClick={() => toggle(tag.id)}
                className={cn(
                  "min-h-9 rounded-lg px-2.5 text-xs font-semibold",
                  active
                    ? "bg-[var(--mv-deep-plum)] text-white"
                    : "bg-[var(--mv-surface-soft)] text-[var(--mv-ink)] ring-1 ring-[var(--mv-border)]",
                  !active && atMax && "opacity-40"
                )}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      ) : null}

      {!query.trim() ? (
        <div className="space-y-3">
          {grouped.slice(0, 3).map((group) => (
            <div key={group.label} className="space-y-1.5">
              <p className="text-xs font-semibold text-[var(--mv-text-muted)]">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.tags.map((tag) => {
                  const active = selectedIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      disabled={disabled || (!active && atMax)}
                      onClick={() => toggle(tag.id)}
                      className={cn(
                        "min-h-8 rounded-md px-2 text-[11px] font-semibold",
                        active
                          ? "bg-[var(--mv-deep-plum)] text-white"
                          : "bg-white text-[var(--mv-ink)] ring-1 ring-[var(--mv-border)]",
                        !active && atMax && "opacity-40"
                      )}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {blockingMatch ? (
        <div className="rounded-xl border border-[var(--mv-plum)]/20 bg-[var(--mv-plum)]/[0.06] px-3 py-3">
          <p className="text-sm text-[var(--mv-ink)]">
            This tag already exists in MoonVerse.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || atMax || selectedIds.includes(blockingMatch.tag.id)}
            onClick={() => toggle(blockingMatch.tag.id)}
            className="mt-2 h-9 rounded-lg border-[var(--mv-border)]"
          >
            Select “{blockingMatch.tag.name}”
          </Button>
        </div>
      ) : null}

      {showSuggestPanel ? (
        <div className="space-y-3 rounded-xl border border-dashed border-[var(--mv-border)] bg-[var(--mv-paper)]/60 px-3 py-3">
          <p className="text-sm font-medium text-[var(--mv-ink)]">
            No matching tag found
          </p>

          {advisoryMatches.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--mv-text-muted)]">
                Did you mean?
              </p>
              <div className="flex flex-wrap gap-2">
                {advisoryMatches.map((match) => {
                  const active = selectedIds.includes(match.tag.id);
                  return (
                    <button
                      key={match.tag.id}
                      type="button"
                      disabled={disabled || (!active && atMax)}
                      onClick={() => toggle(match.tag.id)}
                      className={cn(
                        "min-h-8 rounded-lg px-2.5 text-xs font-semibold",
                        active
                          ? "bg-[var(--mv-deep-plum)] text-white"
                          : "bg-white text-[var(--mv-ink)] ring-1 ring-[var(--mv-border)]"
                      )}
                    >
                      {match.tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {alreadyPending ? (
            <p className="text-sm text-[var(--mv-text-muted)]">
              You already suggested “{normalizedQuery}”. It is pending moderator
              review.
            </p>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={disabled || isPending || !normalizedQuery}
              onClick={handleSuggestTag}
              className="h-9 gap-1.5 rounded-lg bg-[var(--mv-deep-plum)] text-white hover:bg-[var(--mv-plum)]"
            >
              <Plus className="size-3.5" aria-hidden />
              {isPending ? "Submitting…" : `Suggest “${normalizedQuery}”`}
            </Button>
          )}
        </div>
      ) : null}

      {suggestNotice ? (
        <p
          className="rounded-xl border border-[var(--mv-plum)]/20 bg-[var(--mv-plum)]/[0.06] px-3 py-2.5 text-sm text-[var(--mv-ink)]"
          role="status"
        >
          {suggestNotice}
        </p>
      ) : null}

      {suggestError ? (
        <p className="text-sm text-destructive" role="alert">
          {suggestError}
        </p>
      ) : null}

      {atMax ? (
        <p className="text-xs text-amber-800">
          Maximum of {max} tags reached.
        </p>
      ) : null}

      <p className="text-xs text-[var(--mv-text-muted)]">
        Tags are moderated to keep MoonVerse search and recommendations reliable.
        Missing a tag? Suggest it above. It will not be added until approved.
      </p>
    </div>
  );
}
