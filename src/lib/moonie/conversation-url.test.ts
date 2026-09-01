import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import {
  buildMoonieDeskHref,
  clearMoonieNewChatIntent,
  clearMoonieDeskScrollTop,
  hasAnyMoonieNewChatIntent,
  hasMoonieNewChatIntent,
  markMoonieNewChatIntent,
  moonieDeskScrollStorageKey,
  deskHrefIsExplicitNewChat,
  readMoonieDeskConversationId,
  readMoonieDeskConversationIdFromWindow,
  readMoonieDeskRouteFromLocation,
  readMoonieDeskRouteFromSearch,
  readMoonieDeskRouteFromWindow,
  readMoonieDeskScrollTop,
  replaceMoonieDeskUrl,
  writeMoonieDeskUrl,
  shouldRestoreLatestMoonieConversation,
  writeMoonieDeskScrollTop,
} from "./conversation-url";

describe("buildMoonieDeskHref", () => {
  it("returns the bare desk path by default", () => {
    assert.equal(buildMoonieDeskHref(), "/moonie");
  });

  it("encodes conversation and prompt params", () => {
    assert.equal(
      buildMoonieDeskHref({
        conversationId: "abc123",
        prompt: "slow burn romance",
      }),
      "/moonie?conversation=abc123&prompt=slow+burn+romance"
    );
  });

  it("encodes explicit new-chat intent", () => {
    assert.equal(buildMoonieDeskHref({ newChat: true }), "/moonie?new=1");
  });

  it("prefers new-chat over conversation id", () => {
    assert.equal(
      buildMoonieDeskHref({ conversationId: "abc123", newChat: true }),
      "/moonie?new=1"
    );
  });
});

describe("readMoonieDeskRouteFromSearch", () => {
  it("lets an address-bar conversation win over new-chat", () => {
    assert.deepEqual(
      readMoonieDeskRouteFromSearch("?conversation=conv-a&new=1"),
      {
        newChat: false,
        conversationId: "conv-a",
        prompt: undefined,
      }
    );
  });

  it("treats a blank desk query as new chat", () => {
    assert.equal(readMoonieDeskRouteFromSearch("?new=1").newChat, true);
    assert.equal(readMoonieDeskRouteFromSearch("").conversationId, undefined);
  });
});

describe("readMoonieDeskRouteFromLocation", () => {
  it("does not treat a novel-page empty search as new chat", () => {
    const desk = readMoonieDeskRouteFromSearch(
      "?conversation=cmtgp8b4b005t3d5bdo7qhpj6"
    );
    const offDesk = readMoonieDeskRouteFromLocation("/novels/heaven", "", desk);
    assert.equal(offDesk.newChat, false);
    assert.equal(offDesk.conversationId, "cmtgp8b4b005t3d5bdo7qhpj6");
  });

  it("keeps unknown-not-new-chat when leaving the desk with no prior route", () => {
    const offDesk = readMoonieDeskRouteFromLocation("/reviews/abc", "");
    assert.equal(offDesk.newChat, false);
    assert.equal(offDesk.conversationId, undefined);
  });

  it("still reads an explicit new-chat desk URL on /moonie", () => {
    assert.equal(
      readMoonieDeskRouteFromLocation("/moonie", "?new=1").newChat,
      true
    );
  });
});

describe("readMoonieDeskRouteFromWindow", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("reads the address bar on /moonie even when fallback says new chat", () => {
    Object.defineProperty(globalThis, "window", {
      value: {
        location: {
          pathname: "/moonie",
          search: "?conversation=conv-restore",
        },
      },
      configurable: true,
    });
    const staleFallback = { newChat: true, conversationId: undefined, prompt: undefined };
    assert.deepEqual(readMoonieDeskRouteFromWindow(staleFallback), {
      newChat: false,
      conversationId: "conv-restore",
      prompt: undefined,
    });
    assert.equal(
      readMoonieDeskConversationIdFromWindow(),
      "conv-restore"
    );
  });

  it("returns fallback when window is unavailable", () => {
    const fallback = {
      newChat: false,
      conversationId: "conv-ssr",
      prompt: undefined,
    };
    assert.deepEqual(readMoonieDeskRouteFromWindow(fallback), fallback);
  });
});

describe("readMoonieDeskConversationId", () => {
  it("reads the conversation id from search params", () => {
    const params = new URLSearchParams("conversation=abc123&prompt=hello");
    assert.equal(readMoonieDeskConversationId(params), "abc123");
  });

  it("returns undefined when the conversation param is missing", () => {
    assert.equal(
      readMoonieDeskConversationId(new URLSearchParams("prompt=hello")),
      undefined
    );
  });
});

describe("moonie desk scroll storage", () => {
  const conversationId = "conv-test-1";
  const storageKey = moonieDeskScrollStorageKey(conversationId);
  const store = new Map<string, string>();

  afterEach(() => {
    store.clear();
    clearMoonieDeskScrollTop(conversationId);
    Reflect.deleteProperty(globalThis, "window");
  });

  it("round-trips scroll position in session storage", () => {
    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
      configurable: true,
    });

    writeMoonieDeskScrollTop(conversationId, 248.7);
    assert.equal(readMoonieDeskScrollTop(conversationId), 249);
    assert.equal(sessionStorage.getItem(storageKey), "249");
  });

  it("returns null when no scroll position is stored", () => {
    assert.equal(readMoonieDeskScrollTop(conversationId), null);
  });

  it("clears stored scroll position", () => {
    writeMoonieDeskScrollTop(conversationId, 120);
    clearMoonieDeskScrollTop(conversationId);
    assert.equal(readMoonieDeskScrollTop(conversationId), null);
  });
});

describe("moonie new-chat intent", () => {
  const store = new Map<string, string>();

  afterEach(() => {
    store.clear();
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "sessionStorage");
  });

  it("survives reload semantics and remains scoped to the signed-in user", () => {
    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
      configurable: true,
    });

    markMoonieNewChatIntent("reader-a");
    assert.equal(hasMoonieNewChatIntent("reader-a"), true);
    assert.equal(hasMoonieNewChatIntent("reader-b"), false);

    clearMoonieNewChatIntent("reader-a");
    assert.equal(hasMoonieNewChatIntent("reader-a"), false);
  });

  it("detects durable intent before session user id hydrates", () => {
    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        key: (index: number) => [...store.keys()][index] ?? null,
        get length() {
          return store.size;
        },
      },
      configurable: true,
    });

    markMoonieNewChatIntent("reader-a");
    assert.equal(hasAnyMoonieNewChatIntent(), true);
    assert.equal(hasMoonieNewChatIntent(""), false);
  });

  it("never restores the latest chat without an explicit conversation id", () => {
    assert.equal(
      shouldRestoreLatestMoonieConversation({
        hasDurableNewChatIntent: true,
        initialConversationId: undefined,
        conversationId: undefined,
        messageCount: 0,
      }),
      false
    );
    assert.equal(
      shouldRestoreLatestMoonieConversation({
        hasDurableNewChatIntent: false,
        initialConversationId: undefined,
        conversationId: undefined,
        messageCount: 0,
      }),
      false
    );
    assert.equal(
      shouldRestoreLatestMoonieConversation({
        hasDurableNewChatIntent: false,
        initialConversationId: "linked-conversation",
        conversationId: undefined,
        messageCount: 0,
      }),
      false
    );
  });
});

describe("replaceMoonieDeskUrl", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("notifies desk listeners after a supported History write", () => {
    const replaced: string[] = [];
    const states: unknown[] = [];
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { pathname: "/moonie", search: "?new=1" },
        history: {
          state: { idx: 1, __NA: true },
          replaceState(state: unknown, _title: string, href: string) {
            states.push(state);
            replaced.push(href);
          },
        },
      },
    });

    replaceMoonieDeskUrl("/moonie?conversation=conv-1");
    assert.deepEqual(replaced, ["/moonie?conversation=conv-1"]);
    assert.equal(states[0], null);
  });

  it("pushes a new history entry for user-initiated conversation switches", () => {
    const pushed: string[] = [];
    const states: unknown[] = [];
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { pathname: "/moonie", search: "?conversation=a" },
        history: {
          state: { idx: 1 },
          pushState(state: unknown, _title: string, href: string) {
            states.push(state);
            pushed.push(href);
          },
          replaceState() {
            throw new Error("Recents should push, not replace");
          },
        },
      },
    });

    writeMoonieDeskUrl("/moonie?conversation=b", "push");
    assert.deepEqual(pushed, ["/moonie?conversation=b"]);
    assert.equal(states[0], null);
  });

  it("does not replace an address-bar conversation with ?new=1", () => {
    const replaced: string[] = [];
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          pathname: "/moonie",
          search: "?conversation=cmtgp8b4b005t3d5bdo7qhpj6",
        },
        history: {
          replaceState(_state: unknown, _title: string, href: string) {
            replaced.push(href);
          },
          pushState() {
            throw new Error("must not push when replacing is refused");
          },
        },
      },
    });
    assert.equal(deskHrefIsExplicitNewChat("/moonie?new=1"), true);
    writeMoonieDeskUrl("/moonie?new=1");
    assert.deepEqual(replaced, []);
  });

  it("does not rewrite a non-desk route during Back/Forward", () => {
    const replaced: string[] = [];
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { pathname: "/novels/abc", search: "" },
        history: {
          replaceState(_state: unknown, _title: string, href: string) {
            replaced.push(href);
          },
          pushState() {
            throw new Error("must not push on a novel page");
          },
        },
      },
    });
    writeMoonieDeskUrl("/moonie?conversation=conv-1");
    assert.deepEqual(replaced, []);
  });

  it("defers location subscribers off Next's insertion-effect stack", () => {
    const source = readFileSync(
      new URL("./conversation-url.ts", import.meta.url),
      "utf8"
    );
    assert.match(source, /queueMicrotask/);
    assert.match(source, /subscribeMoonieDeskLocation/);
  });

  it("does not rewrite when the desk URL is already current", () => {
    const replaced: string[] = [];
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { pathname: "/moonie", search: "?conversation=conv-1" },
        history: {
          state: { idx: 1 },
          replaceState(_state: unknown, _title: string, href: string) {
            replaced.push(href);
          },
        },
      },
    });
    replaceMoonieDeskUrl("/moonie?conversation=conv-1");
    assert.deepEqual(replaced, []);
  });
});
