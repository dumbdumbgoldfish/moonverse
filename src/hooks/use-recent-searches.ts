"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import {
  clearRecentSearches,
  forgetSearch,
  getSearchRecentScope,
  parseRecentSearchStorageValue,
  readRecentSearchEntries,
  rememberSearch,
  SEARCH_RECENT_CHANGE_EVENT,
  searchRecentStorageKey,
} from "@/lib/search";

function getServerRecentSearchSnapshot(): string | null {
  return null;
}

function getClientRecentSearchSnapshot(storageKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function subscribeRecentSearches(
  scope: string,
  storageKey: string,
  onStoreChange: () => void
): () => void {
  void readRecentSearchEntries(scope);
  onStoreChange();

  const onCustom = () => onStoreChange();
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) onStoreChange();
  };
  window.addEventListener(SEARCH_RECENT_CHANGE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SEARCH_RECENT_CHANGE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function useRecentSearches() {
  const { data: session } = useSession();
  const scope = useMemo(
    () => getSearchRecentScope(session?.user?.id),
    [session?.user?.id]
  );
  const storageKey = useMemo(() => searchRecentStorageKey(scope), [scope]);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      subscribeRecentSearches(scope, storageKey, onStoreChange),
    [scope, storageKey]
  );
  const getSnapshot = useCallback(
    () => getClientRecentSearchSnapshot(storageKey),
    [storageKey]
  );

  const raw = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerRecentSearchSnapshot
  );
  const recents = useMemo(() => parseRecentSearchStorageValue(raw), [raw]);

  const forget = useCallback(
    (query: string) => {
      setError(null);
      if (forgetSearch(query, scope)) return true;
      setError("Could not remove that search. Try again.");
      return false;
    },
    [scope]
  );

  const clear = useCallback(() => {
    setError(null);
    if (clearRecentSearches(scope)) return true;
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
