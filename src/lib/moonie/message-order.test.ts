import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sortMoonieMessagesChronologically } from "@/lib/moonie/message-order";

describe("sortMoonieMessagesChronologically", () => {
  const sharedTime = "2026-09-01T10:00:00.000Z";

  it("places user before assistant when createdAt matches within a turn", () => {
    const ordered = sortMoonieMessagesChronologically([
      {
        id: "assistant-later-id",
        role: "assistant",
        createdAt: sharedTime,
      },
      {
        id: "user-earlier-id",
        role: "user",
        createdAt: sharedTime,
      },
    ]);

    assert.equal(ordered[0]?.role, "user");
    assert.equal(ordered[1]?.role, "assistant");
  });

  it("preserves multi-turn chronology for restored conversations", () => {
    const ordered = sortMoonieMessagesChronologically([
      {
        id: "a2",
        role: "assistant",
        createdAt: "2026-09-01T10:00:01.000Z",
      },
      {
        id: "u2",
        role: "user",
        createdAt: "2026-09-01T10:00:01.000Z",
      },
      {
        id: "a1",
        role: "assistant",
        createdAt: sharedTime,
      },
      {
        id: "u1",
        role: "user",
        createdAt: sharedTime,
      },
    ]);

    assert.deepEqual(
      ordered.map((message) => message.id),
      ["u1", "a1", "u2", "a2"]
    );
  });
});
