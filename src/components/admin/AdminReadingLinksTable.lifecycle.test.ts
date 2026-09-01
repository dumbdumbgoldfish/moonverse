import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runAdminConfirmFlow } from "@/lib/admin/admin-confirm-flow";
import { runAdminTableAction } from "@/lib/admin/admin-table-action-runner";
import {
  applyReadingLinkHealthCheckOutcome,
  applyReadingLinkRowOutcome,
  beginReadingLinkHealthCheck,
  beginReadingLinkRowAction,
  clearReadingLinkRowPendingIfMatch,
  isReadingLinkRowBusy,
  type ReadingLinkHealthCheckUiState,
} from "@/lib/admin/reading-link-presentation";

function emptyState(): ReadingLinkHealthCheckUiState {
  return {
    pendingLinkId: null,
    pendingOperation: null,
    errorsByLinkId: {},
    patchedById: {},
  };
}

/**
 * Mirrors AdminReadingLinksTable row state without React flushSync on begin
 * (the production bug when the server action resolves before pending commits).
 */
function simulateDeferredBeginLifecycle(
  linkId: string,
  action: () => Promise<{
    success: true;
    linkId: string;
    healthStatus: string;
    lastCheckedAt: string | null;
  }>
): Promise<ReadingLinkHealthCheckUiState> {
  let state = emptyState();
  let deferredBegin: ReadingLinkHealthCheckUiState | null = null;

  deferredBegin = beginReadingLinkHealthCheck(state, linkId);

  return runAdminTableAction({
    run: action,
    applyOutcome: (outcome) => {
      state = applyReadingLinkHealthCheckOutcome(state, linkId, outcome);
    },
    clearPending: () => {
      state = clearReadingLinkRowPendingIfMatch(state, linkId, "health_check");
    },
  }).then(() => {
    if (deferredBegin) {
      state = deferredBegin;
    }
    return state;
  });
}

/**
 * Mirrors AdminReadingLinksTable with flushSync-equivalent synchronous begin.
 */
async function simulateSyncedBeginLifecycle(
  linkId: string,
  action: () => Promise<{
    success: true;
    linkId: string;
    healthStatus: string;
    lastCheckedAt: string | null;
  }>
): Promise<ReadingLinkHealthCheckUiState> {
  let state = emptyState();
  state = beginReadingLinkHealthCheck(state, linkId);

  await runAdminTableAction({
    run: action,
    applyOutcome: (outcome) => {
      state = applyReadingLinkHealthCheckOutcome(state, linkId, outcome);
    },
    clearPending: () => {
      state = clearReadingLinkRowPendingIfMatch(state, linkId, "health_check");
    },
  });

  return state;
}

describe("AdminReadingLinksTable lifecycle", () => {
  it("deferred begin + fast health check leaves row busy (regression guard)", async () => {
    const state = await simulateDeferredBeginLifecycle("link-a", async () => ({
      success: true,
      linkId: "link-a",
      healthStatus: "HEALTHY",
      lastCheckedAt: "2026-09-01T00:00:00.000Z",
    }));

    assert.equal(isReadingLinkRowBusy(state, "link-a"), true);
    assert.equal(state.pendingOperation, "health_check");
  });

  it("synced begin + fast health check recovers row controls", async () => {
    const state = await simulateSyncedBeginLifecycle("link-a", async () => ({
      success: true,
      linkId: "link-a",
      healthStatus: "HEALTHY",
      lastCheckedAt: "2026-09-01T00:00:00.000Z",
    }));

    assert.equal(isReadingLinkRowBusy(state, "link-a"), false);
    assert.equal(state.patchedById["link-a"]?.healthStatus, "HEALTHY");
  });

  it("reject confirm finishes before deferred refresh (no dialog lock)", async () => {
    let state = emptyState();
    let confirming = false;
    let refreshStarted = false;
    let refreshFinished = false;

    const onConfirm = async () => {
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
      }).then((result) => {
        if (result.success) {
          void new Promise<void>((resolve) => {
            refreshStarted = true;
            setTimeout(() => {
              refreshFinished = true;
              resolve();
            }, 100);
          });
        }
        return result;
      });
    };

    const confirmDone = runAdminConfirmFlow(onConfirm, {
      setConfirming: (value) => {
        confirming = value;
      },
      setError: () => {},
      close: () => {},
    });

    await confirmDone;

    assert.equal(confirming, false);
    assert.equal(isReadingLinkRowBusy(state, "link-a"), false);
    assert.equal(state.patchedById["link-a"]?.moderationStatus, "REJECTED");
    assert.equal(refreshStarted, true);
    assert.equal(refreshFinished, false);
  });
});
