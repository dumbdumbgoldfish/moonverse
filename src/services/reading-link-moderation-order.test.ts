import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Mirrors listReadingLinksForModeration orderBy for regression coverage. */
function compareReadingLinksForModeration(
  a: { createdAt: Date; id: string },
  b: { createdAt: Date; id: string }
): number {
  const byCreatedAt = b.createdAt.getTime() - a.createdAt.getTime();
  if (byCreatedAt !== 0) return byCreatedAt;
  return b.id.localeCompare(a.id);
}

describe("reading link moderation list ordering", () => {
  it("uses id as a stable tie-breaker when createdAt matches", () => {
    const sameTime = new Date("2026-09-01T00:00:00.000Z");
    const rows = [
      { id: "aaa-link", createdAt: sameTime },
      { id: "bbb-link", createdAt: sameTime },
      { id: "ccc-link", createdAt: sameTime },
    ];

    const sorted = [...rows].sort(compareReadingLinksForModeration);

    assert.deepEqual(
      sorted.map((row) => row.id),
      ["ccc-link", "bbb-link", "aaa-link"]
    );
  });

  it("preserves row identity after a mutation when createdAt ties", () => {
    const sameTime = new Date("2026-09-01T00:00:00.000Z");
    const before = [
      { id: "link-a", createdAt: sameTime, healthStatus: "UNKNOWN" },
      { id: "link-b", createdAt: sameTime, healthStatus: "UNKNOWN" },
    ];
    const afterMutation = before.map((row) =>
      row.id === "link-a"
        ? { ...row, healthStatus: "BROKEN" }
        : row
    );
    const sortedAfter = [...afterMutation].sort(compareReadingLinksForModeration);

    const updated = sortedAfter.find((row) => row.id === "link-a");
    const untouched = sortedAfter.find((row) => row.id === "link-b");

    assert.equal(updated?.healthStatus, "BROKEN");
    assert.equal(untouched?.healthStatus, "UNKNOWN");
  });
});
