"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { SearchSuggestMenu, type SearchSuggestRow } from "@/components/search/SearchSuggestMenu";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import {
  searchHref,
} from "@/lib/search";
import { cn } from "@/lib/utils";
import {
  EMPTY_SEARCH_RESPONSE,
  type SearchResponse,
} from "@/types/search";

interface NavInlineSearchProps {
  className?: string;
  compact?: boolean;
  inputId?: string;
}

export function NavInlineSearch({
  className,
  compact = false,
  inputId = "mv-global-search",
}: NavInlineSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const urlQuery = (searchParams.get("q") ?? "").trim();
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(urlQuery);
  const { recents, forget, remember, error: recentError, dismissError } = useRecentSearches();
  const [fetched, setFetched] = useState<SearchResponse>(EMPTY_SEARCH_RESPONSE);
  const [trending, setTrending] = useState<SearchResponse>(EMPTY_SEARCH_RESPONSE);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!focused) setDraft(urlQuery);
  }, [urlQuery, focused]);

  const searchValue = focused ? draft : urlQuery;
  const suggestOpen = focused;
  const result =
    !suggestOpen || draft.trim().length < 2 ? EMPTY_SEARCH_RESPONSE : fetched;

  useEffect(() => {
    if (!suggestOpen) return;
    const q = draft.trim();
    if (q.length < 2) {
      setLoadingSuggest(false);
      return;
    }
    const controller = new AbortController();
    setLoadingSuggest(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&type=all&limit=6`,
          { signal: controller.signal }
        );
        if (!response.ok) return;
        setFetched((await response.json()) as SearchResponse);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      } finally {
        if (!controller.signal.aborted) setLoadingSuggest(false);
      }
    }, 160);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [draft, suggestOpen]);

  useEffect(() => {
    if (!suggestOpen || draft.trim().length >= 2) return;
    if (trending.works.length > 0) return;
    const controller = new AbortController();
    void fetch("/api/search?type=works&limit=5", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: SearchResponse | null) => {
        if (payload) setTrending(payload);
      })
      .catch(() => {
        // aborted or network
      });
    return () => controller.abort();
  }, [suggestOpen, draft, trending.works.length]);

  const rows: SearchSuggestRow[] = useMemo(() => {
    const q = draft.trim();
    if (!q) {
      const recentRows = recents.map((recent) => ({
        id: `recent:${recent.query}`,
        kind: "recent" as const,
        recent,
      }));
      const trendingRows = trending.works.slice(0, 4).map((work) => ({
        id: `trend:${work.id}`,
        kind: "work" as const,
        work,
        trending: true,
      }));
      return [
        ...recentRows,
        ...trendingRows,
      ];
    }
    return [
      { id: "search-all", kind: "search-all" as const, query: q },
      ...result.works.slice(0, 5).map((work) => ({
        id: `work:${work.id}`,
        kind: "work" as const,
        work,
      })),
      ...result.people.slice(0, 2).map((person) => ({
        id: `person:${person.id}`,
        kind: "person" as const,
        person,
      })),
    ];
  }, [draft, recents, result.people, result.works, trending.works]);

  useEffect(() => {
    setActive(0);
  }, [rows]);

  useEffect(() => {
    if (!suggestOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [suggestOpen]);

  const navigateSearch = (cleaned: string, mode: "push" | "replace") => {
    const navigate = mode === "push" ? router.push.bind(router) : router.replace.bind(router);
    const onSearchPage = pathname === "/search" || pathname.startsWith("/search?");

    if (onSearchPage) {
      const params = new URLSearchParams(searchParams.toString());
      if (cleaned) params.set("q", cleaned);
      else params.delete("q");
      const qs = params.toString();
      navigate(qs ? `/search?${qs}` : "/search");
      return;
    }

    navigate(searchHref(cleaned));
  };

  const closeSuggest = () => {
    setFocused(false);
    inputRef.current?.blur();
  };

  const go = (href: string) => {
    closeSuggest();
    router.push(href);
  };

  const submitSearch = () => {
    const row = rows[active];
    if (row) {
      pickRow(row);
      return;
    }
    const cleaned = searchValue.trim();
    setDraft(cleaned);
    if (cleaned) remember(cleaned);
    navigateSearch(cleaned, "push");
    closeSuggest();
  };

  const pickRow = (row: SearchSuggestRow) => {
    if (row.kind === "recent") {
      remember(row.recent.query, {
        coverUrl: row.recent.coverUrl,
        novelId: row.recent.novelId,
      });
      navigateSearch(row.recent.query, "push");
      closeSuggest();
      return;
    }
    if (row.kind === "work") {
      remember(row.work.title, {
        coverUrl: row.work.coverUrl,
        novelId: row.work.id,
      });
      go(`/novels/${row.work.id}`);
      return;
    }
    if (row.kind === "person") {
      remember(`@${row.person.username}`);
      go(`/users/${row.person.username}`);
      return;
    }
    if (row.kind === "search-all") {
      remember(row.query);
      navigateSearch(row.query, "push");
      closeSuggest();
    }
  };

  const clearSearch = () => {
    setDraft("");
    const onSearchPage = pathname === "/search";
    if (onSearchPage || searchParams.has("q")) {
      navigateSearch("", "replace");
    }
  };

  const openSuggest = () => {
    setDraft(urlQuery);
    dismissError();
    setFocused(true);
  };

  const showShortcut = !compact && !searchValue && !focused;

  return (
    <form
      ref={rootRef}
      className={cn("relative w-full", className)}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
    >
      <div
        className={cn(
          "mv-nav-search relative flex h-12 min-h-[48px] items-center rounded-full transition-all duration-250",
          focused && "mv-nav-search--focused",
          !compact && "w-full max-w-[520px] xl:max-w-[620px]"
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute left-4 flex size-8 items-center justify-center transition-colors",
            focused ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Search className="size-5 stroke-[2.25]" aria-hidden />
        </div>

        <input
          id={inputId}
          ref={inputRef}
          data-moonverse-search=""
          type="search"
          value={searchValue}
          onChange={(e) => {
            setDraft(e.target.value);
            setFocused(true);
          }}
          onFocus={openSuggest}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeSuggest();
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              if (rows.length === 0) return;
              setActive((current) => Math.min(rows.length - 1, current + 1));
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              if (rows.length === 0) return;
              setActive((current) => Math.max(0, current - 1));
            }
          }}
          placeholder="Search"
          aria-label="Search MoonVerse"
          aria-autocomplete="list"
          aria-controls="moonverse-search-suggest"
          autoComplete="off"
          className={cn(
            "h-full min-w-0 flex-1 rounded-full bg-transparent pl-12 text-sm font-medium text-night-blue outline-none",
            "placeholder:text-muted-foreground/70",
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            searchValue ? "pr-11" : showShortcut ? "pr-[5.5rem]" : "pr-5"
          )}
        />

        {searchValue ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/90 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Clear search"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          showShortcut && (
            <kbd
              className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-primary/12 bg-white/80 px-1.5 py-1 text-[10px] font-semibold tracking-wide text-muted-foreground shadow-sm sm:inline-flex"
              aria-hidden
            >
              <span className="inline-flex items-center gap-0.5 rounded-md bg-[#F6F3FF] px-1.5 py-0.5">
                <span className="text-[11px] leading-none">⌘</span>K
              </span>
              <span className="text-[#1A1224]/25">/</span>
            </kbd>
          )
        )}
      </div>

      <SearchSuggestMenu
        open={suggestOpen}
        query={draft}
        rows={rows}
        active={active}
        loading={loadingSuggest && result.works.length === 0}
        onActive={setActive}
        onPick={pickRow}
        onForget={forget}
        error={recentError}
        onStarter={(term) => {
          setDraft(term);
          setFocused(true);
          setActive(0);
        }}
      />
    </form>
  );
}
