import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  patchReadingLinkRowById,
  readingLinkHealthBadgeVariant,
} from "@/lib/admin/reading-link-presentation";

describe("readingLinkHealthBadgeVariant", () => {
  it("recognizes the persisted REDIRECTED health status", () => {
    assert.equal(readingLinkHealthBadgeVariant("REDIRECTED"), "secondary");
  });

  it("uses a neutral outline for unknown future statuses", () => {
    assert.equal(readingLinkHealthBadgeVariant("UNRECOGNIZED"), "outline");
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
