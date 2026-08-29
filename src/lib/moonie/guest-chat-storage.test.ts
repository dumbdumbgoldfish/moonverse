import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  clearAllGuestMoonieConversations,
  createGuestMoonieConversation,
  deleteGuestMoonieConversation,
  getGuestMoonieConversation,
  listGuestMoonieConversations,
  readGuestMoonieStore,
  renameGuestMoonieConversation,
  resolveInitialGuestMoonieState,
  setActiveGuestMoonieConversation,
  upsertGuestMoonieConversation,
} from "./guest-chat-storage";

describe("guest chat storage", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    const localStorageMock = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    };
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: localStorageMock },
    });
  });

  afterEach(() => {
    clearAllGuestMoonieConversations();
  });

  it("stores multiple guest conversations without deleting previous ones", () => {
    const chatA = upsertGuestMoonieConversation({
      conversationId: "guest-a",
      setActive: true,
      messages: [
        { id: "m1", role: "user", content: "Something cosy" },
        { id: "m2", role: "assistant", content: "Here are a few picks." },
      ],
    });

    const chatB = createGuestMoonieConversation();
    upsertGuestMoonieConversation({
      conversationId: chatB.id,
      setActive: true,
      messages: [{ id: "m3", role: "user", content: "Dark fantasy" }],
    });

    const conversations = listGuestMoonieConversations();
    assert.equal(conversations.length, 2);
    assert.equal(getGuestMoonieConversation(chatA.id)?.messages.length, 2);
    assert.equal(getGuestMoonieConversation(chatB.id)?.messages.length, 1);
    assert.equal(readGuestMoonieStore().activeConversationId, chatB.id);
  });

  it("restores the active conversation on reload", () => {
    upsertGuestMoonieConversation({
      conversationId: "guest-a",
      setActive: true,
      messages: [{ id: "m1", role: "user", content: "Chat A" }],
    });
    createGuestMoonieConversation();
    setActiveGuestMoonieConversation("guest-a");

    const restored = resolveInitialGuestMoonieState();
    assert.equal(restored.conversationId, "guest-a");
    assert.equal(restored.messages.length, 1);
    assert.equal(restored.messages[0]?.content, "Chat A");
  });

  it("supports rename and delete", () => {
    upsertGuestMoonieConversation({
      conversationId: "guest-a",
      setActive: true,
      messages: [{ id: "m1", role: "user", content: "Rename me" }],
    });

    renameGuestMoonieConversation("guest-a", "Cosy picks");
    assert.equal(getGuestMoonieConversation("guest-a")?.title, "Cosy picks");

    deleteGuestMoonieConversation("guest-a");
    assert.equal(listGuestMoonieConversations().length, 0);
  });

  it("clears all guest conversations", () => {
    upsertGuestMoonieConversation({
      conversationId: "guest-a",
      setActive: true,
      messages: [{ id: "m1", role: "user", content: "hi" }],
    });
    clearAllGuestMoonieConversations();
    assert.equal(listGuestMoonieConversations().length, 0);
  });

  it("migrates v1 storage to v2 and removes the legacy key", () => {
    storage.set(
      "mv-moonie-guest-chat-v1",
      JSON.stringify({
        conversationId: "legacy-1",
        messages: [{ id: "m1", role: "user", content: "Old chat" }],
        updatedAt: "2024-01-01T00:00:00.000Z",
      })
    );

    const restored = resolveInitialGuestMoonieState();
    assert.equal(restored.conversationId, "legacy-1");
    assert.equal(restored.messages[0]?.content, "Old chat");
    assert.equal(storage.has("mv-moonie-guest-chat-v1"), false);
    assert.equal(readGuestMoonieStore().conversations["legacy-1"]?.messages.length, 1);
  });

  it("removes empty v1 storage without creating a conversation", () => {
    storage.set("mv-moonie-guest-chat-v1", JSON.stringify({ messages: [] }));

    const restored = resolveInitialGuestMoonieState();
    assert.equal(restored.conversationId, undefined);
    assert.equal(restored.messages.length, 0);
    assert.equal(storage.has("mv-moonie-guest-chat-v1"), false);
    assert.equal(listGuestMoonieConversations().length, 0);
  });

  it("treats malformed v2 storage as an empty safe state", () => {
    storage.set("mv-moonie-guest-chats-v2", "{not-json");

    const restored = resolveInitialGuestMoonieState();
    assert.equal(restored.conversationId, undefined);
    assert.equal(restored.messages.length, 0);
    assert.equal(listGuestMoonieConversations().length, 0);
    assert.deepEqual(readGuestMoonieStore().conversations, {});
  });

  it("falls back to the newest conversation when no active id is stored", () => {
    storage.set(
      "mv-moonie-guest-chats-v2",
      JSON.stringify({
        version: 2,
        conversations: {
          older: {
            id: "older",
            title: "Older",
            messages: [{ id: "m1", role: "user", content: "First" }],
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
          newer: {
            id: "newer",
            title: "Newer",
            messages: [{ id: "m2", role: "user", content: "Second" }],
            createdAt: "2024-06-01T00:00:00.000Z",
            updatedAt: "2024-06-01T00:00:00.000Z",
          },
        },
      })
    );

    const restored = resolveInitialGuestMoonieState();
    assert.equal(restored.conversationId, "newer");
    assert.equal(restored.messages[0]?.content, "Second");
  });
});
