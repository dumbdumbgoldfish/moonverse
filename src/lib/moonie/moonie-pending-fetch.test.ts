import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mooniePendingLoadingVisible,
  shouldApplyMooniePendingResponse,
} from "@/lib/moonie/pending-request";

describe("Moonie delayed response isolation (mockable transport)", () => {
  it("does not apply a late response after explicit fresh desk abandons the request", () => {
    const pending = {
      requestId: "req-a",
      conversationId: "chat-a",
    } as const;

    assert.equal(
      shouldApplyMooniePendingResponse({
        pending,
        requestId: "req-a",
        activeConversationId: undefined,
        responseConversationId: "chat-a",
        requestAbandoned: true,
      }),
      false
    );
    assert.equal(mooniePendingLoadingVisible(pending, undefined), false);
    assert.equal(mooniePendingLoadingVisible(pending, "chat-b"), false);
  });

  it("documents fetch stubbing for hook-level delayed response tests", async () => {
    const originalFetch = globalThis.fetch;
    let resolveFetch: (value: Response) => void = () => {};
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    globalThis.fetch = async () => fetchPromise;

    const inFlight = fetch("/api/moonie/recommend", {
      method: "POST",
      body: JSON.stringify({ message: "fixture" }),
    });

    resolveFetch(
      new Response(
        JSON.stringify({
          reply: "fixture reply",
          recommendations: [],
          responseKind: "chat",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const response = await inFlight;
    assert.equal(response.ok, true);
    globalThis.fetch = originalFetch;
  });
});
