import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginUserRowAction,
  canBeginUserRowAction,
  clearUserRowPendingIfMatch,
  completeUserRowAction,
  INITIAL_USER_ROW_PENDING_STATE,
  isUserRowActionPending,
  isUserRowBusy,
  runUserRowActionLifecycle,
  userSuspendActionId,
} from "@/lib/admin/user-row-pending";

describe("user row pending state", () => {
  it("does not mark user B busy when user A is pending", () => {
    const pending = beginUserRowAction(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-a",
      "promote"
    );

    assert.equal(isUserRowBusy(pending, "user-a"), true);
    assert.equal(isUserRowBusy(pending, "user-b"), false);
    assert.equal(canBeginUserRowAction(pending, "user-b"), true);
  });

  it("blocks a second action on the same user", () => {
    const pending = beginUserRowAction(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-a",
      "suspend"
    );

    assert.equal(canBeginUserRowAction(pending, "user-a"), false);
    assert.equal(isUserRowActionPending(pending, "user-a", "demote"), false);
    const blocked = beginUserRowAction(pending, "user-a", "demote");
    assert.deepEqual(blocked, pending);
  });

  it("clears pending state after success or failure", () => {
    const pending = beginUserRowAction(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-c",
      "delete"
    );
    const cleared = completeUserRowAction(pending);
    assert.deepEqual(cleared, INITIAL_USER_ROW_PENDING_STATE);
  });

  it("includes userId in pending identity", () => {
    const pending = beginUserRowAction(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-d",
      "promote"
    );

    assert.equal(pending.pendingAction?.userId, "user-d");
    assert.equal(pending.pendingAction?.action, "promote");
    assert.equal(
      isUserRowActionPending(pending, "user-d", "promote"),
      true
    );
  });

  it("uses distinct suspend and unsuspend action ids", () => {
    assert.equal(userSuspendActionId(false), "suspend");
    assert.equal(userSuspendActionId(true), "unsuspend");
  });
});

describe("user row action lifecycles", () => {
  it("ignores a rapid second promote while the first is in flight", async () => {
    let resolveFirst: (value: { success: boolean }) => void = () => {};
    const firstOutcome = new Promise<{ success: boolean }>((resolve) => {
      resolveFirst = resolve;
    });
    let actionCalls = 0;

    const inFlight = runUserRowActionLifecycle(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-a",
      "promote",
      async () => {
        actionCalls += 1;
        return await firstOutcome;
      }
    );
    const blocked = await runUserRowActionLifecycle(
      beginUserRowAction(INITIAL_USER_ROW_PENDING_STATE, "user-a", "promote"),
      "user-a",
      "promote",
      async () => {
        actionCalls += 1;
        return { success: true };
      }
    );

    assert.equal(actionCalls, 1);
    assert.equal(isUserRowBusy(blocked, "user-a"), true);
    assert.equal(canBeginUserRowAction(blocked, "user-a"), false);

    resolveFirst({ success: true });
    const completed = await inFlight;

    assert.equal(completed.pendingAction, null);
  });

  it("clears pending after promote success", async () => {
    const completed = await runUserRowActionLifecycle(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-a",
      "promote",
      async () => ({ success: true })
    );
    assert.equal(completed.pendingAction, null);
  });

  it("clears pending after suspend failure", async () => {
    const completed = await runUserRowActionLifecycle(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-b",
      "suspend",
      async () => ({ success: false, error: "Cannot suspend." })
    );
    assert.equal(completed.pendingAction, null);
  });

  it("clears pending when the action throws", async () => {
    const completed = await runUserRowActionLifecycle(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-c",
      "demote",
      async () => {
        throw new Error("Server exploded.");
      }
    );
    assert.equal(completed.pendingAction, null);
  });

  it("keeps other user rows interactive while one row is busy", () => {
    const busy = beginUserRowAction(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-a",
      "promote"
    );
    assert.equal(isUserRowBusy(busy, "user-a"), true);
    assert.equal(isUserRowBusy(busy, "user-b"), false);
    assert.equal(canBeginUserRowAction(busy, "user-b"), true);
  });

  it("does not clear another user pending when a stale completion resolves", () => {
    const busyOnB = beginUserRowAction(
      beginUserRowAction(INITIAL_USER_ROW_PENDING_STATE, "user-a", "promote"),
      "user-b",
      "suspend"
    );
    const afterStaleA = completeUserRowAction(busyOnB, "user-a");

    assert.equal(afterStaleA.pendingAction?.userId, "user-b");
    assert.equal(afterStaleA.pendingAction?.action, "suspend");
    assert.equal(isUserRowBusy(afterStaleA, "user-b"), true);
  });

  it("force-clears stuck pending state for a matching user", () => {
    const busy = beginUserRowAction(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-d",
      "delete"
    );
    const cleared = clearUserRowPendingIfMatch(busy, "user-d", "delete");
    assert.equal(cleared.pendingAction, null);
  });
});
