import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import {
  moonieSubmitBlocked,
  processMoonieRecommendResponse,
} from "./recommend-response-handler";
import type { MooniePendingRequest } from "./pending-request";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const untitledPending: MooniePendingRequest = {
  requestId: "req-user-1",
  conversationId: undefined,
};

describe("Moonie recommend response handler (handleSubmit transport path)", () => {
  it("applies a delayed first reply with a new conversation id on fresh chat", () => {
    const outcome = processMoonieRecommendResponse({
      responseOk: true,
      data: {
        reply: "Here are a few picks.",
        conversationId: "chat-new",
        responseKind: "recommendations",
        recommendations: [],
      },
      requestId: "req-user-1",
      requestEpoch: 1,
      requestEpochRef: 1,
      pending: untitledPending,
      activeConversationId: undefined,
      activeGuestConversationId: undefined,
      isGuestDemo: false,
      deskRouteEnabled: true,
    });

    assert.equal(outcome.kind, "success");
    assert.equal(outcome.canApply, true);
    assert.equal(outcome.conversationId, "chat-new");
    assert.equal(outcome.clearNewChatIntent, true);
    assert.equal(outcome.assistantMessage?.role, "assistant");
    assert.match(outcome.assistantMessage?.content ?? "", /picks/);
  });

  it("ignores a late response after switching away from the originating chat", () => {
    const pending: MooniePendingRequest = {
      requestId: "req-a",
      conversationId: "chat-a",
    };
    const outcome = processMoonieRecommendResponse({
      responseOk: true,
      data: {
        reply: "Late answer",
        conversationId: "chat-a",
        responseKind: "chat",
        recommendations: [],
      },
      requestId: "req-a",
      requestEpoch: 1,
      requestEpochRef: 1,
      pending,
      activeConversationId: "chat-b",
      activeGuestConversationId: undefined,
      isGuestDemo: false,
      deskRouteEnabled: true,
    });

    assert.equal(outcome.kind, "ignored");
    assert.equal(outcome.canApply, false);
    assert.equal(outcome.assistantMessage, undefined);
  });

  it("ignores a late untitled response after explicit fresh chat abandons the request", () => {
    const outcome = processMoonieRecommendResponse({
      responseOk: true,
      data: {
        reply: "Should not land",
        conversationId: "chat-new",
        responseKind: "chat",
        recommendations: [],
      },
      requestId: "req-user-1",
      requestEpoch: 1,
      requestEpochRef: 2,
      pending: untitledPending,
      activeConversationId: undefined,
      activeGuestConversationId: undefined,
      isGuestDemo: false,
      deskRouteEnabled: true,
    });

    assert.equal(outcome.kind, "ignored");
    assert.equal(outcome.canApply, false);
  });

  it("surfaces a failed request and allows a follow-up submit while idle", () => {
    const failed = processMoonieRecommendResponse({
      responseOk: false,
      data: { error: "Moonie hiccup" },
      requestId: "req-user-1",
      requestEpoch: 1,
      requestEpochRef: 1,
      pending: untitledPending,
      activeConversationId: undefined,
      activeGuestConversationId: undefined,
      isGuestDemo: false,
      deskRouteEnabled: true,
    });

    assert.equal(failed.kind, "error");
    assert.equal(failed.errorMessage?.isError, true);
    assert.match(failed.errorMessage?.content ?? "", /hiccup/);

    assert.equal(
      moonieSubmitBlocked(null, undefined),
      false,
      "retry should not be blocked after completion"
    );

    const retryPending: MooniePendingRequest = {
      requestId: "req-user-2",
      conversationId: undefined,
    };
    const retry = processMoonieRecommendResponse({
      responseOk: true,
      data: {
        reply: "Second try worked.",
        conversationId: "chat-retry",
        responseKind: "chat",
        recommendations: [],
      },
      requestId: "req-user-2",
      requestEpoch: 2,
      requestEpochRef: 2,
      pending: retryPending,
      activeConversationId: undefined,
      activeGuestConversationId: undefined,
      isGuestDemo: false,
      deskRouteEnabled: true,
    });

    assert.equal(retry.kind, "success");
    assert.equal(retry.conversationId, "chat-retry");
  });
});

describe("Moonie desk route mount wiring", () => {
  it("does not key the assistant view on conversation id", () => {
    const deskRoute = source("../../components/moonie/MoonieDeskRoute.tsx");
    assert.match(deskRoute, /formatMoonieDeskMountKey\(deskMountEpoch\)/);
    assert.doesNotMatch(
      deskRoute,
      /key=\{route\.conversationId \?\? \(route\.newChat \? "new" : "desk"\)\}/
    );
    assert.match(deskRoute, /moonverse:desk-fresh/);
  });

  it("routes handleSubmit through the shared response handler", () => {
    const hook = source("../../hooks/use-moonie-chat.ts");
    assert.match(hook, /processMoonieRecommendResponse/);
  });
});
