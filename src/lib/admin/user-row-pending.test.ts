import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginUserRowAction,
  canBeginUserRowAction,
  completeUserRowAction,
  INITIAL_USER_ROW_PENDING_STATE,
  isUserRowActionPending,
  isUserRowBusy,
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
