import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginReadingLinkHealthCheck,
  beginReadingLinkRowAction,
  canBeginReadingLinkRowAction,
  completeReadingLinkHealthCheck,
  completeReadingLinkRowAction,
  isReadingLinkRowBusy,
  mergeReadingLinkRowPatches,
  patchReadingLinkRowById,
  readingLinkHealthBadgeVariant,
  readingLinkHealthBadgeClassName,
  type ReadingLinkHealthCheckUiState,
} from "@/lib/admin/reading-link-presentation";

describe("readingLinkHealthBadgeVariant", () => {
  it("recognizes the persisted REDIRECTED health status", () => {
    assert.equal(readingLinkHealthBadgeVariant("REDIRECTED"), "secondary");
  });

  it("uses a neutral outline for unknown future statuses", () => {
    assert.equal(readingLinkHealthBadgeVariant("UNRECOGNIZED"), "outline");
  });

  it("styles STALE health with amber warning classes", () => {
    assert.equal(
      readingLinkHealthBadgeClassName("STALE"),
      "border-amber-400/25 bg-amber-500/15 text-amber-200"
    );
  });
});

describe("patchReadingLinkRowById", () => {
  type Row = {
    id: string;
    healthStatus: string;
    lastCheckedAt: string | null;
    moderationStatus: string;
  };

  const baseRows: Row[] = [
    {
      id: "link-first",
      healthStatus: "UNKNOWN",
      lastCheckedAt: null,
      moderationStatus: "PENDING",
    },
    {
      id: "link-second",
      healthStatus: "UNKNOWN",
      lastCheckedAt: null,
      moderationStatus: "PENDING",
    },
  ];

  it("updates only the row matching linkId for health check results", () => {
    const patched = patchReadingLinkRowById(baseRows, "link-first", {
      healthStatus: "BROKEN",
      lastCheckedAt: "2026-09-01T00:00:00.000Z",
    });

    assert.equal(patched[0].healthStatus, "BROKEN");
    assert.equal(patched[0].lastCheckedAt, "2026-09-01T00:00:00.000Z");
    assert.equal(patched[1].healthStatus, "UNKNOWN");
    assert.equal(patched[1].lastCheckedAt, null);
  });

  it("keeps the patched row correct when list order changes after refresh", () => {
    const patched = patchReadingLinkRowById(baseRows, "link-first", {
      healthStatus: "BROKEN",
      lastCheckedAt: "2026-09-01T00:00:00.000Z",
    });
    const reordered = [patched[1], patched[0]];

    const first = reordered.find((row) => row.id === "link-first");
    const second = reordered.find((row) => row.id === "link-second");

    assert.equal(first?.healthStatus, "BROKEN");
    assert.equal(second?.healthStatus, "UNKNOWN");
  });

  it("updates only the targeted row for approve/reject moderation status", () => {
    const approved = patchReadingLinkRowById(baseRows, "link-second", {
      moderationStatus: "APPROVED",
    });
    assert.equal(approved[0].moderationStatus, "PENDING");
    assert.equal(approved[1].moderationStatus, "APPROVED");

    const rejected = patchReadingLinkRowById(approved, "link-first", {
      moderationStatus: "REJECTED",
    });
    assert.equal(rejected[0].moderationStatus, "REJECTED");
    assert.equal(rejected[1].moderationStatus, "APPROVED");
  });
});

describe("reading link health check row state", () => {
  const baseState: ReadingLinkHealthCheckUiState = {
    pendingLinkId: null,
    pendingOperation: null,
    errorsByLinkId: {},
    patchedById: {},
  };

  const rows: Array<{
    id: string;
    healthStatus: string;
    lastCheckedAt: string | null;
  }> = [
    {
      id: "link-a",
      healthStatus: "UNKNOWN",
      lastCheckedAt: null,
    },
    {
      id: "link-b",
      healthStatus: "UNKNOWN",
      lastCheckedAt: null,
    },
  ];

  it("patches only the clicked row on success", () => {
    const started = beginReadingLinkHealthCheck(baseState, "link-a");
    const completed = completeReadingLinkHealthCheck(started, "link-a", {
      success: true,
      linkId: "link-a",
      healthStatus: "BROKEN",
      lastCheckedAt: "2026-09-01T00:00:00.000Z",
    });
    const merged = mergeReadingLinkRowPatches(rows, completed.patchedById);

    assert.equal(completed.pendingLinkId, null);
    assert.equal(merged[0].healthStatus, "BROKEN");
    assert.equal(merged[0].lastCheckedAt, "2026-09-01T00:00:00.000Z");
    assert.equal(merged[1].healthStatus, "UNKNOWN");
    assert.equal(merged[1].lastCheckedAt, null);
  });

  it("stores a row-scoped error when the health check fails", () => {
    const started = beginReadingLinkHealthCheck(baseState, "link-a");
    const completed = completeReadingLinkHealthCheck(started, "link-a", {
      success: false,
      error: "Network timeout.",
    });

    assert.equal(completed.pendingLinkId, null);
    assert.equal(completed.errorsByLinkId["link-a"], "Network timeout.");
    assert.equal(completed.errorsByLinkId["link-b"], undefined);
    assert.deepEqual(completed.patchedById, {});
  });

  it("clears loading after failure", () => {
    const started = beginReadingLinkHealthCheck(baseState, "link-b");
    assert.equal(started.pendingLinkId, "link-b");

    const completed = completeReadingLinkHealthCheck(started, "link-b", {
      success: false,
      error: "Service unavailable.",
    });
    assert.equal(completed.pendingLinkId, null);
  });

  it("allows retry after failure and clears the prior error on success", () => {
    const failed = completeReadingLinkHealthCheck(
      beginReadingLinkHealthCheck(baseState, "link-a"),
      "link-a",
      { success: false, error: "Network timeout." }
    );
    const retrying = beginReadingLinkHealthCheck(failed, "link-a");
    assert.equal(retrying.errorsByLinkId["link-a"], undefined);
    assert.equal(retrying.pendingLinkId, "link-a");

    const succeeded = completeReadingLinkHealthCheck(retrying, "link-a", {
      success: true,
      linkId: "link-a",
      healthStatus: "HEALTHY",
      lastCheckedAt: "2026-09-01T01:00:00.000Z",
    });

    assert.equal(succeeded.errorsByLinkId["link-a"], undefined);
    assert.equal(
      succeeded.patchedById["link-a"]?.healthStatus,
      "HEALTHY"
    );
  });
});

describe("reading link row pending state", () => {
  const baseState: ReadingLinkHealthCheckUiState = {
    pendingLinkId: null,
    pendingOperation: null,
    errorsByLinkId: {},
    patchedById: {},
  };

  it("marks a row busy while health check is pending", () => {
    const busy = beginReadingLinkHealthCheck(baseState, "link-a");
    assert.equal(isReadingLinkRowBusy(busy, "link-a"), true);
    assert.equal(busy.pendingOperation, "health_check");
    assert.equal(isReadingLinkRowBusy(busy, "link-b"), false);
  });

  it("blocks another action on the same busy row", () => {
    const busy = beginReadingLinkRowAction(baseState, "link-a", "health_check");
    assert.equal(canBeginReadingLinkRowAction(busy, "link-a"), false);

    const blocked = beginReadingLinkRowAction(busy, "link-a", "approve");
    assert.deepEqual(blocked, busy);
  });

  it("keeps other rows available while one row is busy", () => {
    const busy = beginReadingLinkRowAction(baseState, "link-a", "reject");
    assert.equal(canBeginReadingLinkRowAction(busy, "link-b"), true);
    assert.equal(isReadingLinkRowBusy(busy, "link-b"), false);
  });

  it("clears busy state after moderation failure", () => {
    const busy = beginReadingLinkRowAction(baseState, "link-a", "approve");
    const cleared = completeReadingLinkRowAction(busy, "link-a", {
      success: false,
      error: "Action failed.",
    });

    assert.equal(cleared.pendingLinkId, null);
    assert.equal(cleared.pendingOperation, null);
    assert.equal(cleared.errorsByLinkId["link-a"], "Action failed.");
  });

  it("clears busy state after moderation success", () => {
    const busy = beginReadingLinkRowAction(baseState, "link-a", "reject");
    const cleared = completeReadingLinkRowAction(busy, "link-a", {
      success: true,
    }, { moderationStatus: "REJECTED" });

    assert.equal(cleared.pendingLinkId, null);
    assert.equal(cleared.pendingOperation, null);
    assert.equal(cleared.patchedById["link-a"]?.moderationStatus, "REJECTED");
  });
});
