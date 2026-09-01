import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runAdminConfirmFlow } from "@/lib/admin/admin-confirm-flow";
import { runAdminTableAction } from "@/lib/admin/admin-table-action-runner";
import {
  applyReadingLinkHealthCheckOutcome,
  applyReadingLinkRowOutcome,
  beginReadingLinkHealthCheck,
  beginReadingLinkRowAction,
  canBeginReadingLinkRowAction,
  clearReadingLinkRowPendingIfMatch,
  isReadingLinkRowBusy,
  type ReadingLinkHealthCheckUiState,
} from "@/lib/admin/reading-link-presentation";
import {
  beginUserRowAction,
  canBeginUserRowAction,
  clearUserRowPendingIfMatch,
  INITIAL_USER_ROW_PENDING_STATE,
  isUserRowActionPending,
  isUserRowBusy,
  type UserRowPendingState,
} from "@/lib/admin/user-row-pending";

function emptyReadingState(): ReadingLinkHealthCheckUiState {
  return {
    pendingLinkId: null,
    pendingOperation: null,
    errorsByLinkId: {},
    patchedById: {},
  };
}

async function runReadingLinkRowFlow(
  initial: ReadingLinkHealthCheckUiState,
  linkId: string,
  operation: "health_check" | "approve" | "reject",
  action: () => Promise<{ success: boolean; error?: string }>,
  patch?: { moderationStatus: string }
): Promise<ReadingLinkHealthCheckUiState> {
  let state = initial;

  if (!canBeginReadingLinkRowAction(state, linkId)) {
    return state;
  }

  state =
    operation === "health_check"
      ? beginReadingLinkHealthCheck(state, linkId)
      : beginReadingLinkRowAction(state, linkId, operation);

  await runAdminTableAction({
    run: action,
    applyOutcome: (result) => {
      state =
        operation === "health_check"
          ? applyReadingLinkHealthCheckOutcome(
              state,
              linkId,
              result as {
                success: true;
                linkId: string;
                healthStatus: string;
                lastCheckedAt: string | null;
              } | { success: false; error: string }
            )
          : applyReadingLinkRowOutcome(state, linkId, result, patch);
    },
      clearPending: () => {
        state = clearReadingLinkRowPendingIfMatch(state, linkId, operation);
      },
  });

  return state;
}

async function runUserRowFlow(
  initial: UserRowPendingState,
  userId: string,
  actionId: string,
  action: () => Promise<{ success: boolean; error?: string }>
): Promise<UserRowPendingState> {
  let state = initial;

  if (!canBeginUserRowAction(state, userId)) {
    return state;
  }

  state = beginUserRowAction(state, userId, actionId);

  await runAdminTableAction({
    run: action,
    applyOutcome: () => {},
    clearPending: () => {
      state = clearUserRowPendingIfMatch(state, userId, actionId);
    },
  });

  return state;
}

describe("reading links table flows", () => {
  it("check health success → recovers", async () => {
    const state = await runReadingLinkRowFlow(
      emptyReadingState(),
      "link-a",
      "health_check",
      async () => ({
        success: true,
        linkId: "link-a",
        healthStatus: "HEALTHY",
        lastCheckedAt: "2026-09-01T00:00:00.000Z",
      })
    );

    assert.equal(isReadingLinkRowBusy(state, "link-a"), false);
    assert.equal(state.patchedById["link-a"]?.healthStatus, "HEALTHY");
  });

  it("check health failure → recovers", async () => {
    const state = await runReadingLinkRowFlow(
      emptyReadingState(),
      "link-a",
      "health_check",
      async () => ({ success: false, error: "Timeout." })
    );

    assert.equal(isReadingLinkRowBusy(state, "link-a"), false);
    assert.equal(state.errorsByLinkId["link-a"], "Timeout.");
  });

  it("reject confirm success → recovers", async () => {
    let state = emptyReadingState();
    let dialogClosed = false;
    let confirming = false;

    const onConfirm = async () => {
      if (!canBeginReadingLinkRowAction(state, "link-a")) {
        return { success: false, error: "Busy." };
      }
      state = beginReadingLinkRowAction(state, "link-a", "reject");

      return runAdminTableAction({
        run: async () => ({ success: true }),
        applyOutcome: (result) => {
          state = applyReadingLinkRowOutcome(state, "link-a", result, {
            moderationStatus: "REJECTED",
          });
        },
        clearPending: () => {
          state = clearReadingLinkRowPendingIfMatch(state, "link-a", "reject");
        },
      });
    };

    await runAdminConfirmFlow(onConfirm, {
      setConfirming: (v) => {
        confirming = v;
      },
      setError: () => {},
      close: () => {
        dialogClosed = true;
      },
    });

    assert.equal(isReadingLinkRowBusy(state, "link-a"), false);
    assert.equal(confirming, false);
    assert.equal(dialogClosed, true);
    assert.equal(state.patchedById["link-a"]?.moderationStatus, "REJECTED");
  });

  it("reject confirm failure → recovers", async () => {
    let state = emptyReadingState();
    let dialogClosed = false;

    const onConfirm = async () => {
      if (!canBeginReadingLinkRowAction(state, "link-a")) {
        return { success: false, error: "Busy." };
      }
      state = beginReadingLinkRowAction(state, "link-a", "reject");

      return runAdminTableAction({
        run: async () => ({ success: false, error: "Denied." }),
        applyOutcome: (result) => {
          state = applyReadingLinkRowOutcome(state, "link-a", result);
        },
        clearPending: () => {
          state = clearReadingLinkRowPendingIfMatch(state, "link-a", "reject");
        },
      });
    };

    await runAdminConfirmFlow(onConfirm, {
      setConfirming: () => {},
      setError: () => {},
      close: () => {
        dialogClosed = true;
      },
    });

    assert.equal(isReadingLinkRowBusy(state, "link-a"), false);
    assert.equal(dialogClosed, false);
    assert.equal(state.errorsByLinkId["link-a"], "Denied.");
  });

  it("blocks duplicate health check while first is in flight", async () => {
    let resolveFirst: (value: {
      success: true;
      linkId: string;
      healthStatus: string;
      lastCheckedAt: string | null;
    }) => void = () => {};
    const firstOutcome = new Promise<{
      success: true;
      linkId: string;
      healthStatus: string;
      lastCheckedAt: string | null;
    }>((resolve) => {
      resolveFirst = resolve;
    });

    let state = emptyReadingState();
    let actionCalls = 0;

    const start = async () => {
      if (!canBeginReadingLinkRowAction(state, "link-a")) return;
      state = beginReadingLinkHealthCheck(state, "link-a");
      actionCalls += 1;
      return runAdminTableAction({
        run: () => firstOutcome,
        applyOutcome: (result) => {
          state = applyReadingLinkHealthCheckOutcome(state, "link-a", result);
        },
        clearPending: () => {
          state = clearReadingLinkRowPendingIfMatch(
            state,
            "link-a",
            "health_check"
          );
        },
      });
    };

    const inFlight = start();
    assert.equal(canBeginReadingLinkRowAction(state, "link-a"), false);
    assert.equal(actionCalls, 1);

    resolveFirst({
      success: true,
      linkId: "link-a",
      healthStatus: "BROKEN",
      lastCheckedAt: "2026-09-01T00:00:00.000Z",
    });
    await inFlight;

    assert.equal(isReadingLinkRowBusy(state, "link-a"), false);
  });
});

describe("users table flows", () => {
  it("promote success → recovers", async () => {
    const state = await runUserRowFlow(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-a",
      "promote",
      async () => ({ success: true })
    );

    assert.equal(isUserRowBusy(state, "user-a"), false);
  });

  it("promote failure → recovers", async () => {
    const state = await runUserRowFlow(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-a",
      "promote",
      async () => ({ success: false, error: "Forbidden." })
    );

    assert.equal(isUserRowBusy(state, "user-a"), false);
  });

  it("suspend success → recovers", async () => {
    const state = await runUserRowFlow(
      INITIAL_USER_ROW_PENDING_STATE,
      "user-b",
      "suspend",
      async () => ({ success: true })
    );

    assert.equal(isUserRowBusy(state, "user-b"), false);
    assert.equal(isUserRowActionPending(state, "user-b", "suspend"), false);
  });

  it("blocks duplicate promote while first is in flight", async () => {
    let resolveFirst: (value: { success: boolean }) => void = () => {};
    const firstOutcome = new Promise<{ success: boolean }>((resolve) => {
      resolveFirst = resolve;
    });

    let state = INITIAL_USER_ROW_PENDING_STATE;
    let actionCalls = 0;

    const start = async () => {
      if (!canBeginUserRowAction(state, "user-a")) return;
      state = beginUserRowAction(state, "user-a", "promote");
      actionCalls += 1;
      return runAdminTableAction({
        run: () => firstOutcome,
        applyOutcome: () => {},
        clearPending: () => {
          state = clearUserRowPendingIfMatch(state, "user-a", "promote");
        },
      });
    };

    const inFlight = start();
    assert.equal(canBeginUserRowAction(state, "user-a"), false);
    assert.equal(actionCalls, 1);

    resolveFirst({ success: true });
    await inFlight;

    assert.equal(isUserRowBusy(state, "user-a"), false);
  });
});
