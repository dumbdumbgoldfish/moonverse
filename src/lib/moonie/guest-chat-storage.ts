import type { MoonieChatMessage } from "@/types/moonie";

const LEGACY_STORAGE_KEY = "mv-moonie-guest-chat-v1";
const STORAGE_KEY = "mv-moonie-guest-chats-v2";

export interface GuestMoonieConversation {
  id: string;
  title: string;
  messages: MoonieChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface GuestMoonieConversationSummary {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messageCount: number;
}

interface GuestMoonieChatStore {
  version: 2;
  activeConversationId?: string;
  guestTurnsRemaining?: number;
  conversations: Record<string, GuestMoonieConversation>;
}

function isMoonieChatMessage(value: unknown): value is MoonieChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as MoonieChatMessage;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  );
}

function serializeMessages(messages: MoonieChatMessage[]): MoonieChatMessage[] {
  return messages.map((message) => ({
    ...message,
    userAttachment: message.userAttachment
      ? {
          ...message.userAttachment,
          imagePreviewUrl: undefined,
        }
      : undefined,
  }));
}

function truncateText(value: string, max = 52): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function createGuestConversationId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function deriveGuestConversationTitle(
  messages: MoonieChatMessage[],
  fallback = "New chat"
): string {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser?.content.trim()) return fallback;
  return truncateText(firstUser.content, 48);
}

function deriveGuestConversationPreview(messages: MoonieChatMessage[]): string {
  const last = [...messages].reverse().find((message) => message.content.trim());
  if (!last?.content.trim()) return "No messages yet";
  return truncateText(last.content, 64);
}

function emptyStore(): GuestMoonieChatStore {
  return {
    version: 2,
    conversations: {},
  };
}

function readRawStore(): GuestMoonieChatStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as GuestMoonieChatStore;
    if (record.version !== 2 || !record.conversations) return null;

    const conversations: Record<string, GuestMoonieConversation> = {};
    for (const [id, conversation] of Object.entries(record.conversations)) {
      if (!conversation || typeof conversation !== "object") continue;
      const messages = Array.isArray(conversation.messages)
        ? conversation.messages.filter(isMoonieChatMessage)
        : [];
      conversations[id] = {
        id: conversation.id || id,
        title:
          typeof conversation.title === "string" && conversation.title.trim()
            ? conversation.title.trim()
            : deriveGuestConversationTitle(messages),
        messages,
        createdAt:
          typeof conversation.createdAt === "string"
            ? conversation.createdAt
            : new Date().toISOString(),
        updatedAt:
          typeof conversation.updatedAt === "string"
            ? conversation.updatedAt
            : new Date().toISOString(),
      };
    }

    return {
      version: 2,
      activeConversationId:
        typeof record.activeConversationId === "string"
          ? record.activeConversationId
          : undefined,
      guestTurnsRemaining:
        typeof record.guestTurnsRemaining === "number"
          ? record.guestTurnsRemaining
          : undefined,
      conversations,
    };
  } catch {
    return null;
  }
}

function migrateLegacyStore(): GuestMoonieChatStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const legacy = parsed as {
      conversationId?: string;
      messages?: MoonieChatMessage[];
      guestTurnsRemaining?: number;
      updatedAt?: string;
    };
    const messages = Array.isArray(legacy.messages)
      ? legacy.messages.filter(isMoonieChatMessage)
      : [];
    if (messages.length === 0 && !legacy.conversationId) {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return null;
    }

    const now = new Date().toISOString();
    const id = legacy.conversationId || createGuestConversationId();
    const store: GuestMoonieChatStore = {
      version: 2,
      activeConversationId: id,
      guestTurnsRemaining: legacy.guestTurnsRemaining,
      conversations: {
        [id]: {
          id,
          title: deriveGuestConversationTitle(messages),
          messages,
          createdAt: legacy.updatedAt ?? now,
          updatedAt: legacy.updatedAt ?? now,
        },
      },
    };
    writeStore(store);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return store;
  } catch {
    return null;
  }
}

function writeStore(store: GuestMoonieChatStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota errors — in-memory state still works for the session.
  }
}

export function readGuestMoonieStore(): GuestMoonieChatStore {
  return readRawStore() ?? migrateLegacyStore() ?? emptyStore();
}

export function listGuestMoonieConversations(): GuestMoonieConversationSummary[] {
  const store = readGuestMoonieStore();
  return Object.values(store.conversations)
    .filter((conversation) => conversation.messages.length > 0)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      preview: deriveGuestConversationPreview(conversation.messages),
      updatedAt: conversation.updatedAt,
      messageCount: conversation.messages.length,
    }));
}

export function getGuestMoonieConversation(
  conversationId: string
): GuestMoonieConversation | null {
  const store = readGuestMoonieStore();
  return store.conversations[conversationId] ?? null;
}

export function getActiveGuestMoonieConversation(): GuestMoonieConversation | null {
  const store = readGuestMoonieStore();
  const activeId = store.activeConversationId;
  if (!activeId) return null;
  return store.conversations[activeId] ?? null;
}

export function resolveInitialGuestMoonieState() {
  const store = readGuestMoonieStore();
  const active =
    (store.activeConversationId
      ? store.conversations[store.activeConversationId]
      : null) ??
    Object.values(store.conversations).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0] ??
    null;

  return {
    conversationId: active?.id,
    messages: active?.messages ?? [],
  };
}

export function upsertGuestMoonieConversation(input: {
  conversationId: string;
  messages: MoonieChatMessage[];
  title?: string;
  setActive?: boolean;
}) {
  const store = readGuestMoonieStore();
  const now = new Date().toISOString();
  const existing = store.conversations[input.conversationId];
  const messages = serializeMessages(input.messages);
  const conversation: GuestMoonieConversation = {
    id: input.conversationId,
    title:
      input.title?.trim() ||
      existing?.title ||
      deriveGuestConversationTitle(messages),
    messages,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const nextStore: GuestMoonieChatStore = {
    ...store,
    activeConversationId: input.setActive
      ? input.conversationId
      : store.activeConversationId ?? input.conversationId,
    conversations: {
      ...store.conversations,
      [input.conversationId]: conversation,
    },
  };

  writeStore(nextStore);
  return conversation;
}

export function createGuestMoonieConversation(): GuestMoonieConversation {
  const id = createGuestConversationId();
  const now = new Date().toISOString();
  const conversation: GuestMoonieConversation = {
    id,
    title: "New chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  const store = readGuestMoonieStore();
  writeStore({
    ...store,
    activeConversationId: id,
    conversations: {
      ...store.conversations,
      [id]: conversation,
    },
  });
  return conversation;
}

export function setActiveGuestMoonieConversation(conversationId: string) {
  const store = readGuestMoonieStore();
  if (!store.conversations[conversationId]) return null;
  writeStore({
    ...store,
    activeConversationId: conversationId,
  });
  return store.conversations[conversationId] ?? null;
}

export function renameGuestMoonieConversation(
  conversationId: string,
  title: string
) {
  const store = readGuestMoonieStore();
  const existing = store.conversations[conversationId];
  if (!existing) return null;
  const nextTitle = title.trim() || deriveGuestConversationTitle(existing.messages);
  const updated: GuestMoonieConversation = {
    ...existing,
    title: nextTitle,
    updatedAt: new Date().toISOString(),
  };
  writeStore({
    ...store,
    conversations: {
      ...store.conversations,
      [conversationId]: updated,
    },
  });
  return updated;
}

export function deleteGuestMoonieConversation(conversationId: string) {
  const store = readGuestMoonieStore();
  if (!store.conversations[conversationId]) return null;
  const { [conversationId]: removed, ...rest } = store.conversations;
  const remaining = Object.values(rest).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const nextActive =
    store.activeConversationId === conversationId
      ? remaining[0]?.id
      : store.activeConversationId;

  writeStore({
    ...store,
    activeConversationId: nextActive,
    conversations: rest,
  });
  return removed;
}

export function clearAllGuestMoonieConversations() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // no-op
  }
}

/** @deprecated Use clearAllGuestMoonieConversations */
export function clearGuestMoonieChat() {
  clearAllGuestMoonieConversations();
}
