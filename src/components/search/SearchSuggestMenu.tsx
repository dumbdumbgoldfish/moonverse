"use client";

import { BookOpen, Clock, User, X } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { HighlightedText } from "@/components/search/HighlightedText";
import { starterSearchQueries } from "@/lib/search";
import { cn } from "@/lib/utils";
import type { RecentSearch } from "@/lib/search";
import type { SearchWorkHit } from "@/types/search";
import type { UserSearchResult } from "@/services/user.service";

export type SearchSuggestRow =
  | { id: string; kind: "recent"; recent: RecentSearch }
  | { id: string; kind: "work"; work: SearchWorkHit; trending?: boolean }
  | { id: string; kind: "person"; person: UserSearchResult }
  | { id: string; kind: "search-all"; query: string };

interface SearchSuggestMenuProps {
  open: boolean;
  query: string;
  rows: SearchSuggestRow[];
  active: number;
  loading?: boolean;
  onActive: (index: number) => void;
  onPick: (row: SearchSuggestRow) => void;
  onForget: (query: string) => void;
  onStarter?: (query: string) => void;
  error?: string | null;
}

export function SearchSuggestMenu({
  open,
  query,
  rows,
  active,
  loading = false,
  onActive,
  onPick,
  onForget,
  onStarter,
  error,
}: SearchSuggestMenuProps) {
  if (!open) return null;

  const q = query.trim();
  const heading = loading
    ? "Scanning the stacks"
    : q
      ? "Matching the stacks"
      : "Recently in your stacks";
  const starters = !q ? starterSearchQueries() : [];

  return (
    <div
      id="moonverse-search-suggest"
      role="listbox"
      aria-label="Catalog suggestions"
      className="mv-search-suggest absolute left-0 right-0 top-[calc(100%+0.6rem)] z-[70] overflow-hidden rounded-[24px] bg-[#FFFBFF] shadow-[0_32px_64px_-28px_rgba(26,18,36,0.45)] ring-1 ring-[#1A1224]/10"
      aria-busy={loading}
    >
      <div className="flex items-center justify-between border-b border-[#1A1224]/8 px-4 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E46C7]">
          {heading}
        </p>
        <span className="text-[10px] font-medium text-[#1A1224]/40">
          ↑↓ Enter · Esc
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="border-b border-[#B42318]/15 bg-[#FEF3F2] px-4 py-2 text-[12px] font-medium text-[#B42318]"
        >
          {error}
        </p>
      ) : null}

      {starters.length > 0 && onStarter ? (
        <div className="flex flex-wrap gap-1.5 border-b border-[#1A1224]/8 px-4 py-3">
          {starters.map((term) => (
            <button
              key={term}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onStarter(term)}
              className="rounded-full bg-[#F4ECF8] px-2.5 py-1 text-[11px] font-semibold text-[#4C35C4] transition mv-hover-signup"
            >
              {term}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <SuggestSkeleton />
      ) : rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-[#1A1224]/50">
          {q
            ? "No catalog matches yet. Try a broader keyword or search the full catalog."
            : "Recent title searches collect here. Try a starter above."}
        </p>
      ) : (
        <ul className="max-h-[min(26rem,62vh)] overflow-y-auto p-1.5">
          {rows.map((row, index) => (
            <li key={row.id}>
              {groupLabel(rows, index) ? (
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A1224]/40">
                  {groupLabel(rows, index)}
                </p>
              ) : null}
              <SuggestRow
                row={row}
                query={q}
                active={index === active}
                onActive={() => onActive(index)}
                onPick={() => onPick(row)}
                onForget={onForget}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function groupLabel(rows: SearchSuggestRow[], index: number): string | null {
  const row = rows[index];
  const prev = rows[index - 1];
  if (!row) return null;
  if (row.kind === "recent" && prev?.kind !== "recent") return "Recent";
  if (row.kind === "work" && prev?.kind !== "work") {
    return row.trending ? "Trending works" : "Works";
  }
  if (row.kind === "person" && prev?.kind !== "person") return "Readers";
  if (row.kind === "search-all") return "Catalog";
  return null;
}

function SuggestRow({
  row,
  query,
  active,
  onActive,
  onPick,
  onForget,
}: {
  row: SearchSuggestRow;
  query: string;
  active: boolean;
  onActive: () => void;
  onPick: () => void;
  onForget: (query: string) => void;
}) {
  return (
    <div
      className={cn(
        "group flex w-full items-center gap-3 rounded-[16px] px-2 py-1.5 text-left transition-colors",
        active ? "bg-[#6E46C7]/10 ring-1 ring-[#6E46C7]/20" : "hover:bg-[#F4ECF8]"
      )}
      onMouseEnter={onActive}
    >
      <button
        type="button"
        role="option"
        aria-selected={active}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onPick}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <RowMark row={row} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-[#1A1224]">
            {row.kind === "recent" ? (
              <HighlightedText text={row.recent.query} query={query} />
            ) : row.kind === "work" ? (
              <span className="font-serif text-[15px] leading-snug">
                <HighlightedText text={row.work.title} query={query} />
              </span>
            ) : row.kind === "person" ? (
              <HighlightedText text={row.person.displayName} query={query} />
            ) : row.kind === "search-all" ? (
              <>Search the catalog for “{row.query}”</>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-[#1A1224]/50">
            {row.kind === "recent"
              ? "Recent search"
              : row.kind === "work"
                ? [row.work.author, row.work.matchReason || row.work.genres[0]]
                    .filter(Boolean)
                    .join(" · ")
                : row.kind === "person"
                  ? `@${row.person.username} · ${row.person.reviewCount} reviews`
                  : row.kind === "search-all"
                    ? "Works, reviews, readers, and lists"
                    : null}
          </span>
        </span>
      </button>
      {row.kind === "recent" ? (
        <button
          type="button"
          aria-label={`Remove ${row.recent.query} from recent searches`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onForget(row.recent.query)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#1A1224]/35 opacity-0 transition-opacity hover:bg-white hover:text-[#1A1224] group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function RowMark({ row }: { row: SearchSuggestRow }) {
  if (row.kind === "work" || (row.kind === "recent" && row.recent.coverUrl)) {
    const title = row.kind === "work" ? row.work.title : row.recent.query;
    const cover = row.kind === "work" ? row.work.coverUrl : row.recent.coverUrl;
    return (
      <span className="relative h-[52px] w-[36px] shrink-0 overflow-hidden rounded-md bg-[#EDE8FF] shadow-[0_8px_16px_-12px_rgba(26,18,36,0.55)] ring-1 ring-[#1A1224]/10">
        <CoverImage
          src={cover}
          alt=""
          title={title}
          sizes="36px"
          compactFallback
          className="object-cover"
        />
      </span>
    );
  }

  const Icon = row.kind === "recent" ? Clock : row.kind === "person" ? User : BookOpen;

  return (
    <span className="flex h-[52px] w-[36px] shrink-0 items-center justify-center rounded-md bg-[#EDE8FF] text-[#6E46C7] ring-1 ring-[#6E46C7]/15">
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

function SuggestSkeleton() {
  return (
    <ul className="space-y-1 p-2" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <li
          key={index}
          className="flex items-center gap-3 rounded-[16px] px-2 py-1.5"
        >
          <span className="h-[52px] w-[36px] animate-pulse rounded-md bg-[#EDE8FF]" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-2/3 animate-pulse rounded bg-[#EDE8FF]" />
            <span className="block h-2.5 w-1/3 animate-pulse rounded bg-[#F4ECF8]" />
          </span>
        </li>
      ))}
    </ul>
  );
}
