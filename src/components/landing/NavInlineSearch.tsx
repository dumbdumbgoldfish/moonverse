"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
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

import {
  notifySearchLocation,
  readLocationSearchQuery,
  subscribeSearchLocation,
} from "@/lib/search-location";

function suggestRowSetKey(rows: SearchSuggestRow[]): string {
  return rows
    .map((row) =>
      row.kind === "search-all"
        ? `${row.kind}:${row.id}:${row.query}`
        : `${row.kind}:${row.id}`
    )
    .join("|");
}

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
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const urlQuery = useSyncExternalStore(
    subscribeSearchLocation,
    readLocationSearchQuery,
    () => ""
  );

  useEffect(() => {
    notifySearchLocation();
  }, [pathname]);

  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(urlQuery);
  const { recents, forget, remember, error: recentError, dismissError } = useRecentSearches();
  const [fetched, setFetched] = useState<SearchResponse>(EMPTY_SEARCH_RESPONSE);
  const [trending, setTrending] = useState<SearchResponse>(EMPTY_SEARCH_RESPONSE);
  const [suggestLoad, setSuggestLoad] = useState({ queryKey: "", loading: false });
  const [highlight, setHighlight] = useState({ key: "", index: 0 });
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const searchPending = pendingQuery != null && pendingQuery !== urlQuery;

  const searchValue = focused ? draft : urlQuery;
  const suggestOpen = focused;
  const queryKey = draft.trim();
  const loadingSuggest =
    suggestLoad.queryKey === queryKey && queryKey.length >= 2 && suggestLoad.loading;
  const result =
    !suggestOpen || queryKey.length < 2 ? EMPTY_SEARCH_RESPONSE : fetched;

  useEffect(() => {
    if (!suggestOpen) return;
    const q = draft.trim();
    if (q.length < 2) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSuggestLoad({ queryKey: q, loading: true });
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
        if (!controller.signal.aborted) {
          setSuggestLoad({ queryKey: q, loading: false });
        }
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

  const rowSetKey = suggestRowSetKey(rows);
  const rawActive = highlight.key === rowSetKey ? highlight.index : 0;
  const active =
    rows.length === 0 ? 0 : Math.min(Math.max(0, rawActive), rows.length - 1);

  const setActiveForRows = (index: number) => {
    setHighlight({ key: rowSetKey, index });
  };

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
    setPendingQuery(cleaned);
    const onSearchPage = pathname === "/search";

    if (onSearchPage) {
      let href: string;
      if (cleaned) {
        const params = new URLSearchParams(window.location.search);
        params.set("q", cleaned);
        params.delete("page");
        const qs = params.toString();
        href = qs ? `/search?${qs}` : "/search";
      } else {
        href = "/search";
      }
      if (mode === "push") {
        window.history.pushState(window.history.state, "", href);
      } else {
        window.history.replaceState(window.history.state, "", href);
      }
      notifySearchLocation();
      return;
    }

    const navigate =
      mode === "push" ? router.push.bind(router) : router.replace.bind(router);
    navigate(searchHref(cleaned));
    notifySearchLocation();
  };

  const closeSuggest = () => {
    setDraft(urlQuery);
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
    closeSuggest();
    if (pathname === "/search" || urlQuery) {
      navigateSearch("", "replace");
    }
  };

  const openSuggest = () => {
    setDraft(urlQuery);
    dismissError();
    setFocused(true);
    setActiveForRows(0);
  };

  const showShortcut = !compact && !searchValue && !focused;

  return (
    <form
      ref={rootRef}
      className={cn("relative w-full", className)}
      role="search"
      aria-busy={searchPending || undefined}
      data-nav-pending={searchPending ? "true" : undefined}
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
            setActiveForRows(0);
          }}
          onFocus={openSuggest}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitSearch();
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              closeSuggest();
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              if (rows.length === 0) return;
              setHighlight((current) => {
                const currentIndex = current.key === rowSetKey ? current.index : 0;
                return {
                  key: rowSetKey,
                  index: Math.min(rows.length - 1, currentIndex + 1),
                };
              });
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              if (rows.length === 0) return;
              setHighlight((current) => {
                const currentIndex = current.key === rowSetKey ? current.index : 0;
                return {
                  key: rowSetKey,
                  index: Math.max(0, currentIndex - 1),
                };
              });
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
        onActive={setActiveForRows}
        onPick={pickRow}
        onForget={forget}
        error={recentError}
        onStarter={(term) => {
          setDraft(term);
          setFocused(true);
          setActiveForRows(0);
        }}
      />
    </form>
  );
}
