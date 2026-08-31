import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveMoonieFollowState,
  resolveMoonieRestoreScrollTop,
  shouldDeferMoonieFollow,
} from "./use-moonie-chat-scroll";

describe("resolveMoonieFollowState", () => {
  it("keeps following across programmatic scroll and content growth", () => {
    assert.equal(
      resolveMoonieFollowState({
        wasFollowing: true,
        isNearBottom: false,
        hasUserScrollIntent: false,
      }),
      true
    );
  });

  it("pauses only when the user deliberately moves away from latest", () => {
    assert.equal(
      resolveMoonieFollowState({
        wasFollowing: true,
        isNearBottom: false,
        hasUserScrollIntent: true,
      }),
      false
    );
  });

  it("resumes when the transcript reaches latest again", () => {
    assert.equal(
      resolveMoonieFollowState({
        wasFollowing: false,
        isNearBottom: true,
        hasUserScrollIntent: false,
      }),
      true
    );
  });
});

describe("resolveMoonieRestoreScrollTop", () => {
  it("defers restoration until an existing conversation has hydrated messages", () => {
    assert.equal(
      resolveMoonieRestoreScrollTop({
        messageCount: 0,
        savedScrollTop: 240,
        scrollHeight: 1200,
        clientHeight: 500,
      }),
      null
    );
  });

  it("restores a saved position and defaults unsaved conversations to latest", () => {
    const geometry = {
      messageCount: 4,
      scrollHeight: 1200,
      clientHeight: 500,
    };
    assert.equal(
      resolveMoonieRestoreScrollTop({
        ...geometry,
        savedScrollTop: 240,
      }),
      240
    );
    assert.equal(
      resolveMoonieRestoreScrollTop({
        ...geometry,
        savedScrollTop: null,
      }),
      700
    );
  });

  it("clamps stale saved positions to the current transcript", () => {
    assert.equal(
      resolveMoonieRestoreScrollTop({
        messageCount: 4,
        savedScrollTop: 900,
        scrollHeight: 800,
        clientHeight: 500,
      }),
      300
    );
  });
});

describe("shouldDeferMoonieFollow", () => {
  it("allows active follow while saved-position restoration is pending", () => {
    assert.equal(
      shouldDeferMoonieFollow({
        restoreScroll: true,
        conversationId: "conversation-a",
        restoredConversationId: null,
        isFollowing: true,
      }),
      false
    );
  });

  it("protects a paused conversation until its saved position is restored", () => {
    assert.equal(
      shouldDeferMoonieFollow({
        restoreScroll: true,
        conversationId: "conversation-a",
        restoredConversationId: null,
        isFollowing: false,
      }),
      true
    );
  });

  it("does not defer after restoration completes", () => {
    assert.equal(
      shouldDeferMoonieFollow({
        restoreScroll: true,
        conversationId: "conversation-a",
        restoredConversationId: "conversation-a",
        isFollowing: false,
      }),
      false
    );
  });
});
