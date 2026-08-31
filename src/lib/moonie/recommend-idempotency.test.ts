import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findStoredMoonieTurnResponse } from "@/lib/moonie/recommend-idempotency";

describe("findStoredMoonieTurnResponse", () => {
  it("returns the persisted response for a retried client turn", () => {
    const response = { reply: "Three picks", recommendations: [{ novelId: "a" }] };
    assert.deepEqual(
      findStoredMoonieTurnResponse(
        [
          { role: "user", meta: { clientTurnId: "turn-1" } },
          {
            role: "assistant",
            meta: { clientTurnId: "turn-1", response },
          },
        ],
        "turn-1"
      ),
      response
    );
  });

  it("does not reuse another turn or legacy messages without stored responses", () => {
    assert.equal(
      findStoredMoonieTurnResponse(
        [
          {
            role: "assistant",
            meta: { clientTurnId: "turn-2", recommendations: [] },
          },
        ],
        "turn-1"
      ),
      null
    );
  });
});
