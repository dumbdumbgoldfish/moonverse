const MOONIE_DESK_PATH = "/moonie";
const MOONIE_DESK_SCROLL_PREFIX = "moonie:desk-scroll:";

export interface MoonieDeskHrefOptions {
  conversationId?: string;
  prompt?: string;
}

export function buildMoonieDeskHref({
  conversationId,
  prompt,
}: MoonieDeskHrefOptions = {}): string {
  const params = new URLSearchParams();
  const trimmedConversationId = conversationId?.trim();
  const trimmedPrompt = prompt?.trim();

  if (trimmedConversationId) {
    params.set("conversation", trimmedConversationId);
  }
  if (trimmedPrompt) {
    params.set("prompt", trimmedPrompt);
  }

  const query = params.toString();
  return query ? `${MOONIE_DESK_PATH}?${query}` : MOONIE_DESK_PATH;
}

export function readMoonieDeskConversationId(
  searchParams: Pick<URLSearchParams, "get">
): string | undefined {
  const conversationId = searchParams.get("conversation")?.trim();
  return conversationId || undefined;
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
