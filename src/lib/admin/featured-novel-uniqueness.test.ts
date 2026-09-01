import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOverlappingFeaturedNovelWhere,
  featuredNovelWindowsOverlap,
  FEATURED_NOVEL_OVERLAP_ERROR,
  hasOverlappingFeaturedNovelWindow,
} from "@/lib/admin/featured-novel-uniqueness";
import {
  createFeaturedNovelRowIfNoOverlap,
} from "@/lib/admin/featured-novel-create";

const day = (value: string) => new Date(value);

describe("featuredNovelWindowsOverlap", () => {
  it("detects overlapping active windows for the same novel", () => {
    const existing = {
      startsAt: day("2026-01-01T00:00:00.000Z"),
      endsAt: day("2026-12-31T23:59:59.000Z"),
    };
    const proposed = {
      startsAt: day("2026-06-01T00:00:00.000Z"),
      endsAt: null,
    };
    assert.equal(featuredNovelWindowsOverlap(proposed, existing), true);
  });

  it("allows a new window after the previous one ended", () => {
    const existing = {
      startsAt: day("2026-01-01T00:00:00.000Z"),
      endsAt: day("2026-03-01T00:00:00.000Z"),
    };
    const proposed = {
      startsAt: day("2026-04-01T00:00:00.000Z"),
      endsAt: null,
    };
    assert.equal(featuredNovelWindowsOverlap(proposed, existing), false);
  });

  it("treats adjacent windows as non-overlapping when existing ends as new starts", () => {
    const boundary = day("2026-03-01T00:00:00.000Z");
    const existing = {
      startsAt: day("2026-01-01T00:00:00.000Z"),
      endsAt: boundary,
    };
    const proposed = {
      startsAt: boundary,
      endsAt: day("2026-06-01T00:00:00.000Z"),
    };
    assert.equal(featuredNovelWindowsOverlap(proposed, existing), false);
  });

  it("detects identical start/end windows as overlapping", () => {
    const window = {
      startsAt: day("2026-09-01T00:00:00.000Z"),
      endsAt: day("2026-12-01T00:00:00.000Z"),
    };
    assert.equal(featuredNovelWindowsOverlap(window, window), true);
  });

  it("detects overlap between future scheduled windows", () => {
    const existing = {
      startsAt: day("2027-01-01T00:00:00.000Z"),
      endsAt: day("2027-06-01T00:00:00.000Z"),
    };
    const proposed = {
      startsAt: day("2027-03-01T00:00:00.000Z"),
      endsAt: day("2027-09-01T00:00:00.000Z"),
    };
    assert.equal(featuredNovelWindowsOverlap(proposed, existing), true);
  });

  it("detects overlap when either window is open-ended", () => {
    const openEnded = {
      startsAt: day("2026-01-01T00:00:00.000Z"),
      endsAt: null,
    };
    const proposed = {
      startsAt: day("2026-12-01T00:00:00.000Z"),
      endsAt: day("2027-01-01T00:00:00.000Z"),
    };
    assert.equal(featuredNovelWindowsOverlap(proposed, openEnded), true);
    assert.equal(featuredNovelWindowsOverlap(openEnded, proposed), true);
  });
});

describe("hasOverlappingFeaturedNovelWindow", () => {
  const existingRows = [
    {
      novelId: "novel-a",
      startsAt: day("2026-01-01T00:00:00.000Z"),
      endsAt: day("2026-12-31T23:59:59.000Z"),
    },
    {
      novelId: "novel-b",
      startsAt: day("2026-01-01T00:00:00.000Z"),
      endsAt: null,
    },
  ];

  it("rejects a duplicate feature for the same novel", () => {
    assert.equal(
      hasOverlappingFeaturedNovelWindow(
        "novel-a",
        { startsAt: day("2026-06-01T00:00:00.000Z"), endsAt: null },
        existingRows
      ),
      true
    );
  });

  it("allows featuring a different novel", () => {
    assert.equal(
      hasOverlappingFeaturedNovelWindow(
        "novel-c",
        { startsAt: day("2026-06-01T00:00:00.000Z"), endsAt: null },
        existingRows
      ),
      false
    );
  });
});

describe("buildOverlappingFeaturedNovelWhere", () => {
  it("builds a query for overlapping windows on one novel", () => {
    const startsAt = day("2026-06-01T00:00:00.000Z");
    const endsAt = day("2026-12-01T00:00:00.000Z");
    assert.deepEqual(buildOverlappingFeaturedNovelWhere("novel-a", startsAt, endsAt), {
      novelId: "novel-a",
      startsAt: { lt: endsAt },
      OR: [{ endsAt: null }, { endsAt: { gt: startsAt } }],
    });
  });
});

describe("featured novel duplicate guard scenarios", () => {
  it("treats a retry with the same window as overlapping", () => {
    const rows: Array<{
      novelId: string;
      startsAt: Date;
      endsAt: Date | null;
    }> = [];
    const proposed = {
      startsAt: day("2026-09-01T00:00:00.000Z"),
      endsAt: null,
    };

    assert.equal(
      hasOverlappingFeaturedNovelWindow("novel-a", proposed, rows),
      false
    );
    rows.push({ novelId: "novel-a", ...proposed });
    assert.equal(
      hasOverlappingFeaturedNovelWindow("novel-a", proposed, rows),
      true
    );
  });
});

describe("concurrent featured novel create guard", () => {
  const window = {
    startsAt: day("2026-09-01T00:00:00.000Z"),
    endsAt: null as Date | null,
  };

  it("allows only one overlapping create per novel under concurrent attempts", async () => {
    const rows: Array<{
      id: string;
      novelId: string;
      startsAt: Date;
      endsAt: Date | null;
    }> = [];
    const locks = new Map<string, Promise<unknown>>();

    const attempts = await Promise.allSettled(
      Array.from({ length: 2 }, (_, index) =>
        createFeaturedNovelRowIfNoOverlap(rows, locks, {
          novelId: "novel-a",
          ...window,
          id: `row-${index}`,
        })
      )
    );

    const successes = attempts.filter((result) => result.status === "fulfilled");
    const overlapFailures = attempts.filter(
      (result) =>
        result.status === "rejected" &&
        result.reason instanceof Error &&
        result.reason.message === FEATURED_NOVEL_OVERLAP_ERROR
    );

    assert.equal(successes.length, 1);
    assert.equal(overlapFailures.length, 1);
    assert.equal(rows.length, 1);
  });

  it("does not block concurrent creates for different novels", async () => {
    const rows: Array<{
      id: string;
      novelId: string;
      startsAt: Date;
      endsAt: Date | null;
    }> = [];
    const locks = new Map<string, Promise<unknown>>();

    const attempts = await Promise.allSettled([
      createFeaturedNovelRowIfNoOverlap(rows, locks, {
        novelId: "novel-a",
        ...window,
        id: "row-a",
      }),
      createFeaturedNovelRowIfNoOverlap(rows, locks, {
        novelId: "novel-b",
        ...window,
        id: "row-b",
      }),
    ]);

    assert.equal(attempts.every((result) => result.status === "fulfilled"), true);
    assert.equal(rows.length, 2);
  });
});
