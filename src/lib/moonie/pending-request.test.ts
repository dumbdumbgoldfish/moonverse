import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mooniePendingLoadingVisible,
  shouldApplyMooniePendingResponse,
} from "@/lib/moonie/pending-request";

const requestA = {
  requestId: "req-a",
  conversationId: "chat-a",
} as const;

describe("Moonie pending request isolation", () => {
  it("shows loading only on the originating conversation", () => {
    assert.equal(mooniePendingLoadingVisible(requestA, "chat-a"), true);
    assert.equal(mooniePendingLoadingVisible(requestA, "chat-b"), false);
    assert.equal(mooniePendingLoadingVisible(requestA, undefined), false);
    assert.equal(mooniePendingLoadingVisible(null, "chat-a"), false);
  });

  it("keeps untitled new-chat loading off other named chats", () => {
    const untitled = { requestId: "req-new", conversationId: undefined };
    assert.equal(mooniePendingLoadingVisible(untitled, undefined), true);
    assert.equal(mooniePendingLoadingVisible(untitled, "chat-b"), false);
  });

  it("applies a late response only while still on conversation A", () => {
    assert.equal(
      shouldApplyMooniePendingResponse({
        pending: requestA,
        requestId: "req-a",
        activeConversationId: "chat-a",
        responseConversationId: "chat-a",
        requestAbandoned: false,
      }),
      true
    );
    assert.equal(
      shouldApplyMooniePendingResponse({
        pending: requestA,
        requestId: "req-a",
        activeConversationId: "chat-b",
        responseConversationId: "chat-a",
        requestAbandoned: false,
      }),
      false
    );
    assert.equal(
      shouldApplyMooniePendingResponse({
        pending: requestA,
        requestId: "req-a",
        activeConversationId: undefined,
        responseConversationId: "chat-a",
        requestAbandoned: false,
      }),
      false
    );
  });

  it("does not apply after New chat abandons the in-flight request", () => {
    assert.equal(
      shouldApplyMooniePendingResponse({
        pending: requestA,
        requestId: "req-a",
        activeConversationId: undefined,
        responseConversationId: "chat-a",
        requestAbandoned: true,
      }),
      false
    );
  });

  it("applies an untitled A response if the desk is still that new thread", () => {
    const untitled = { requestId: "req-new", conversationId: undefined };
    assert.equal(
      shouldApplyMooniePendingResponse({
        pending: untitled,
        requestId: "req-new",
        activeConversationId: undefined,
        responseConversationId: "chat-a",
        requestAbandoned: false,
      }),
      true
    );
    assert.equal(
      shouldApplyMooniePendingResponse({
        pending: untitled,
        requestId: "req-new",
        activeConversationId: "chat-b",
        responseConversationId: "chat-a",
        requestAbandoned: false,
      }),
      false
    );
  });

  it("ignores out-of-order completion from a different request id", () => {
    assert.equal(
      shouldApplyMooniePendingResponse({
        pending: requestA,
        requestId: "req-stale",
        activeConversationId: "chat-a",
        responseConversationId: "chat-a",
        requestAbandoned: false,
      }),
      false
    );
  });
});
