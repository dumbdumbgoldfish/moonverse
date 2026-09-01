import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginInboxAction,
  canBeginInboxAction,
  completeInboxAction,
  inboxRemediationActionId,
  INITIAL_INBOX_ACTION_PENDING_STATE,
  isInboxActionPending,
  isInboxItemBusy,
} from "@/lib/admin/inbox-action-pending";

describe("inbox action pending state", () => {
  it("identifies action A pending independently from action B", () => {
    const pending = beginInboxAction(
      INITIAL_INBOX_ACTION_PENDING_STATE,
      "report-1",
      inboxRemediationActionId("hide_review")
    );

    assert.equal(
      isInboxActionPending(
        pending,
        "report-1",
        inboxRemediationActionId("hide_review")
      ),
      true
    );
    assert.equal(
      isInboxActionPending(
        pending,
        "report-1",
        inboxRemediationActionId("resolve_only")
      ),
      false
    );
  });

  it("does not mark action B as pending when action A is running", () => {
    const pending = beginInboxAction(
      INITIAL_INBOX_ACTION_PENDING_STATE,
      "review-2",
      "hide_review"
    );

    assert.equal(isInboxActionPending(pending, "review-2", "restore_review"), false);
    assert.equal(isInboxItemBusy(pending, "review-2"), true);
  });

  it("blocks duplicate starts of the same action on the same item", () => {
    const pending = beginInboxAction(
      INITIAL_INBOX_ACTION_PENDING_STATE,
      "comment-3",
      "hide_comment"
    );

    assert.equal(canBeginInboxAction(pending, "comment-3", "hide_comment"), false);
    const blocked = beginInboxAction(pending, "comment-3", "hide_comment");
    assert.deepEqual(blocked, pending);
  });

  it("clears pending state after success or failure", () => {
    const pending = beginInboxAction(
      INITIAL_INBOX_ACTION_PENDING_STATE,
      "tag-4",
      "approve_tag"
    );
    const cleared = completeInboxAction(pending);
    assert.deepEqual(cleared, INITIAL_INBOX_ACTION_PENDING_STATE);
  });

  it("includes item id in pending identity", () => {
    const pending = beginInboxAction(
      INITIAL_INBOX_ACTION_PENDING_STATE,
      "link-a",
      "approve_link"
    );

    assert.equal(isInboxItemBusy(pending, "link-a"), true);
    assert.equal(isInboxItemBusy(pending, "link-b"), false);
    assert.equal(canBeginInboxAction(pending, "link-b", "approve_link"), true);
  });
});
