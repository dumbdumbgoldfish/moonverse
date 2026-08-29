import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  buildMoonieDeskHref,
  clearMoonieDeskScrollTop,
  moonieDeskScrollStorageKey,
  readMoonieDeskConversationId,
  readMoonieDeskScrollTop,
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

  it("omits blank params", () => {
    assert.equal(
      buildMoonieDeskHref({ conversationId: "  ", prompt: "  " }),
      "/moonie"
    );
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
