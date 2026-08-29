"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  clearRecentSearches,
  forgetSearch,
  getSearchRecentScope,
  readRecentSearchEntries,
  rememberSearch,
  SEARCH_RECENT_CHANGE_EVENT,
  searchRecentStorageKey,
  type RecentSearch,
} from "@/lib/search";

export function useRecentSearches() {
  const { data: session } = useSession();
  const scope = useMemo(
    () => getSearchRecentScope(session?.user?.id),
    [session?.user?.id]
  );
  const storageKey = useMemo(() => searchRecentStorageKey(scope), [scope]);
  const [recents, setRecents] = useState<RecentSearch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(() => {
    setRecents(readRecentSearchEntries(scope));
  }, [scope]);

  useEffect(() => {
    sync();
    const onChange = () => sync();
    window.addEventListener(SEARCH_RECENT_CHANGE_EVENT, onChange);
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) onChange();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SEARCH_RECENT_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [sync, storageKey]);

  const forget = useCallback(
    (query: string) => {
      const previous = readRecentSearchEntries(scope);
      const cleaned = query.trim().toLowerCase();
      const optimistic = previous.filter(
        (item) => item.query.toLowerCase() !== cleaned
      );
      setRecents(optimistic);
      setError(null);
      if (forgetSearch(query, scope)) return true;
      setRecents(previous);
      setError("Could not remove that search. Try again.");
      return false;
    },
    [scope]
  );

  const clear = useCallback(() => {
    const previous = readRecentSearchEntries(scope);
    setRecents([]);
    setError(null);
    if (clearRecentSearches(scope)) return true;
    setRecents(previous);
    setError("Could not clear recent searches. Try again.");
    return false;
  }, [scope]);

  const remember = useCallback(
    (query: string, preview?: { coverUrl?: string; novelId?: string }) => {
      const cleaned = query.trim();
      if (cleaned.length < 2) return false;
      setError(null);
      if (!rememberSearch(cleaned, preview, scope)) {
        setError("Could not save that search. Try again.");
        return false;
      }
      setRecents(readRecentSearchEntries(scope));
      return true;
    },
    [scope]
  );

  const dismissError = useCallback(() => setError(null), []);

  return {
    recents,
    recentQueries: recents.map((entry) => entry.query),
    scope,
    forget,
    clear,
    remember,
    error,
    dismissError,
  };
}
