const MOONIE_DESK_PATH = "/moonie";
const MOONIE_DESK_SCROLL_PREFIX = "moonie:desk-scroll:";
const MOONIE_NEW_CHAT_PREFIX = "moonie:new-chat:";
const MOONIE_NEW_CHAT_PARAM = "new";

export interface MoonieDeskHrefOptions {
  conversationId?: string;
  prompt?: string;
  /** Explicit blank desk — survives refresh via `?new=1`. */
  newChat?: boolean;
}

export function buildMoonieDeskHref({
  conversationId,
  prompt,
  newChat,
}: MoonieDeskHrefOptions = {}): string {
  const params = new URLSearchParams();
  const trimmedConversationId = conversationId?.trim();
  const trimmedPrompt = prompt?.trim();

  if (newChat) {
    params.set(MOONIE_NEW_CHAT_PARAM, "1");
  } else if (trimmedConversationId) {
    params.set("conversation", trimmedConversationId);
  }
  if (trimmedPrompt) {
    params.set("prompt", trimmedPrompt);
  }

  const query = params.toString();
  return query ? `${MOONIE_DESK_PATH}?${query}` : MOONIE_DESK_PATH;
}

export function readMoonieDeskNewChatIntent(
  searchParams: Pick<URLSearchParams, "get">
): boolean {
  return searchParams.get(MOONIE_NEW_CHAT_PARAM) === "1";
}

export function readMoonieDeskConversationId(
  searchParams: Pick<URLSearchParams, "get">
): string | undefined {
  const conversationId = searchParams.get("conversation")?.trim();
  return conversationId || undefined;
}

export interface MoonieDeskRouteState {
  newChat: boolean;
  conversationId: string | undefined;
  prompt: string | undefined;
}

const EMPTY_DESK_ROUTE: MoonieDeskRouteState = {
  newChat: false,
  conversationId: undefined,
  prompt: undefined,
};

/**
 * Address-bar conversation always wins over `?new=1` or a durable new-chat
 * intent. Missing both params is a blank desk for the logged-in layout.
 */
export function readMoonieDeskRouteFromSearch(
  search: string
): MoonieDeskRouteState {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  const conversationId = readMoonieDeskConversationId(params);
  const prompt = params.get("prompt")?.trim() || undefined;
  if (conversationId) {
    return { newChat: false, conversationId, prompt };
  }
  return {
    newChat: true,
    conversationId: undefined,
    prompt,
  };
}

/**
 * Novel/review pages have an empty search string. That is not `?new=1`.
 * Keep the last on-desk route so View novel cannot flip the mounted desk
 * into a new chat and replace the conversation history entry.
 */
export function readMoonieDeskRouteFromWindow(
  fallback?: MoonieDeskRouteState
): MoonieDeskRouteState {
  if (typeof window === "undefined") {
    return fallback ?? EMPTY_DESK_ROUTE;
  }
  return readMoonieDeskRouteFromLocation(
    window.location.pathname,
    window.location.search,
    fallback
  );
}

export function readMoonieDeskConversationIdFromWindow(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const search = window.location.search;
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  return readMoonieDeskConversationId(params);
}

export function readMoonieDeskRouteFromLocation(
  pathname: string,
  search: string,
  lastDeskRoute?: MoonieDeskRouteState
): MoonieDeskRouteState {
  if (pathname !== MOONIE_DESK_PATH) {
    return lastDeskRoute ?? EMPTY_DESK_ROUTE;
  }
  return readMoonieDeskRouteFromSearch(search);
}

export function deskHrefIsExplicitNewChat(href: string): boolean {
  const queryIndex = href.indexOf("?");
  const search = queryIndex >= 0 ? href.slice(queryIndex) : "";
  const route = readMoonieDeskRouteFromSearch(search);
  return route.newChat && !route.conversationId;
}

export function moonieDeskScrollStorageKey(conversationId: string): string {
  return `${MOONIE_DESK_SCROLL_PREFIX}${conversationId}`;
}

export function readMoonieDeskScrollTop(conversationId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(moonieDeskScrollStorageKey(conversationId));
    if (raw == null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function writeMoonieDeskScrollTop(
  conversationId: string,
  scrollTop: number
): void {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(scrollTop) || scrollTop < 0) return;
  try {
    sessionStorage.setItem(
      moonieDeskScrollStorageKey(conversationId),
      String(Math.round(scrollTop))
    );
  } catch {
    // Ignore quota / private-mode storage failures.
  }
}

export function clearMoonieDeskScrollTop(conversationId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(moonieDeskScrollStorageKey(conversationId));
  } catch {
    // Ignore storage failures.
  }
}

function moonieNewChatStorageKey(userId: string): string {
  return `${MOONIE_NEW_CHAT_PREFIX}${userId}`;
}

export function markMoonieNewChatIntent(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    sessionStorage.setItem(moonieNewChatStorageKey(userId), "1");
  } catch {
    // Ignore quota / private-mode storage failures.
  }
}

export function hasMoonieNewChatIntent(userId: string): boolean {
  if (typeof window === "undefined" || !userId) return false;
  try {
    return sessionStorage.getItem(moonieNewChatStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

/** True when any signed-in user has a durable blank-desk intent before session hydration. */
export function hasAnyMoonieNewChatIntent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (
        key?.startsWith(MOONIE_NEW_CHAT_PREFIX) &&
        sessionStorage.getItem(key) === "1"
      ) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

export function hasDurableMoonieNewChatIntent(userId: string): boolean {
  return hasMoonieNewChatIntent(userId) || hasAnyMoonieNewChatIntent();
}

export function clearMoonieNewChatIntent(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    sessionStorage.removeItem(moonieNewChatStorageKey(userId));
  } catch {
    // Ignore storage failures.
  }
}

/**
 * Generic `/moonie` entry is a fresh desk. Latest-chat restore is never implicit.
 * Continue/open-this-conversation handoffs must pass an explicit conversation id.
 */
export function shouldRestoreLatestMoonieConversation(options: {
  hasDurableNewChatIntent: boolean;
  initialConversationId?: string;
  conversationId?: string;
  messageCount: number;
}): boolean {
  void options;
  return false;
}

export type MoonieDeskHistoryWrite = "replace" | "push";

/**
 * Soft URL write that keeps the desk mounted in the `/moonie` layout.
 *
 * Next.js 16.3.3 (`node_modules/next/dist/client/components/app-router.js`)
 * patches `history.replaceState` / `pushState`:
 * - `data.__NA` or `data._N` skips `ACTION_RESTORE` (internal router writes)
 * - otherwise `copyNextJsInternalHistoryState` copies `__NA` and
 *   `__PRIVATE_NEXTJS_INTERNALS_TREE` from the current entry, then
 *   `ACTION_RESTORE` so `usePathname` / `useSearchParams` stay aligned
 * - `popstate` without `__NA` reloads the document
 *
 * Pass `null` and let the patch copy internals. Do not manufacture `__NA`.
 */
export function writeMoonieDeskUrl(
  href: string,
  mode: MoonieDeskHistoryWrite = "replace"
): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== MOONIE_DESK_PATH) return;
  if (!href.startsWith(MOONIE_DESK_PATH)) return;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === href) return;
  const currentConversationId = readMoonieDeskConversationId(
    new URLSearchParams(
      window.location.search.startsWith("?")
        ? window.location.search.slice(1)
        : window.location.search
    )
  );
  if (
    mode === "replace" &&
    currentConversationId &&
    deskHrefIsExplicitNewChat(href)
  ) {
    return;
  }
  if (mode === "push") {
    window.history.pushState(null, "", href);
  } else {
    window.history.replaceState(null, "", href);
  }
  notifyMoonieDeskLocation();
}

type MoonieNavigationWatcher = {
  addEventListener: (type: "currententrychange", listener: () => void) => void;
  removeEventListener: (type: "currententrychange", listener: () => void) => void;
};

export function subscribeMoonieDeskLocation(onStoreChange: () => void): () => void {
  let cancelled = false;
  const notify = () => {
    queueMicrotask(() => {
      if (!cancelled) onStoreChange();
    });
  };
  window.addEventListener("popstate", notify);
  window.addEventListener("moonverse:desk-url", notify);
  const navigation = (window as Window & { navigation?: MoonieNavigationWatcher })
    .navigation;
  navigation?.addEventListener("currententrychange", notify);
  return () => {
    cancelled = true;
    window.removeEventListener("popstate", notify);
    window.removeEventListener("moonverse:desk-url", notify);
    navigation?.removeEventListener("currententrychange", notify);
  };
}

export function notifyMoonieDeskLocation(): void {
  if (typeof window === "undefined") return;
  if (typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new Event("moonverse:desk-url"));
}

/** Synchronously clear the desk view before route props catch up. */
export function notifyMoonieDeskFresh(): void {
  if (typeof window === "undefined") return;
  if (typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new Event("moonverse:desk-fresh"));
}

export function replaceMoonieDeskUrl(href: string): void {
  writeMoonieDeskUrl(href, "replace");
}

export function hasActiveMoonieNewChatIntent(options: {
  userId: string;
  urlNewChat?: boolean;
}): boolean {
  return (
    Boolean(options.urlNewChat) ||
    hasDurableMoonieNewChatIntent(options.userId)
  );
}
