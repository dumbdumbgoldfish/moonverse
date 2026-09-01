import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildReadingLinkModerationWhere,
  normalizeReadingLinkModerationPage,
  parseReadingLinkModerationStatusFilter,
  readingLinkModerationFilterHref,
  readingLinkModerationPageHref,
} from "@/lib/admin/reading-link-moderation-filter";

describe("parseReadingLinkModerationStatusFilter", () => {
  it("defaults to the moderation workload when status is missing", () => {
    assert.equal(parseReadingLinkModerationStatusFilter(), "ALL");
    assert.equal(parseReadingLinkModerationStatusFilter(undefined), "ALL");
    assert.equal(parseReadingLinkModerationStatusFilter(null), "ALL");
  });

  it("defaults invalid status params to the moderation workload", () => {
    assert.equal(parseReadingLinkModerationStatusFilter("bogus"), "ALL");
  });

  it("preserves explicit status filters", () => {
    assert.equal(parseReadingLinkModerationStatusFilter("PENDING"), "PENDING");
    assert.equal(
      parseReadingLinkModerationStatusFilter("NEEDS_REVIEW"),
      "NEEDS_REVIEW"
    );
    assert.equal(parseReadingLinkModerationStatusFilter("APPROVED"), "APPROVED");
    assert.equal(parseReadingLinkModerationStatusFilter("REJECTED"), "REJECTED");
    assert.equal(parseReadingLinkModerationStatusFilter("ALL"), "ALL");
  });
});

describe("buildReadingLinkModerationWhere", () => {
  it("default moderation filter includes PENDING and NEEDS_REVIEW", () => {
    assert.deepEqual(buildReadingLinkModerationWhere("ALL"), {
      moderationStatus: { in: ["PENDING", "NEEDS_REVIEW"] },
    });
  });

  it("explicit pending filter returns only pending links", () => {
    assert.deepEqual(buildReadingLinkModerationWhere("PENDING"), {
      moderationStatus: "PENDING",
    });
  });

  it("explicit needs-review filter returns only needs-review links", () => {
    assert.deepEqual(buildReadingLinkModerationWhere("NEEDS_REVIEW"), {
      moderationStatus: "NEEDS_REVIEW",
    });
  });

  it("approved and rejected filters are unchanged", () => {
    assert.deepEqual(buildReadingLinkModerationWhere("APPROVED"), {
      moderationStatus: "APPROVED",
    });
    assert.deepEqual(buildReadingLinkModerationWhere("REJECTED"), {
      moderationStatus: "REJECTED",
    });
  });
});

describe("readingLinkModerationFilterHref", () => {
  it("uses the bare path for the default moderation workload", () => {
    assert.equal(readingLinkModerationFilterHref("ALL"), "/admin/reading-links");
  });

  it("uses explicit status query params for narrowed filters", () => {
    assert.equal(
      readingLinkModerationFilterHref("PENDING"),
      "/admin/reading-links?status=PENDING"
    );
    assert.equal(
      readingLinkModerationFilterHref("NEEDS_REVIEW"),
      "/admin/reading-links?status=NEEDS_REVIEW"
    );
    assert.equal(
      readingLinkModerationFilterHref("APPROVED"),
      "/admin/reading-links?status=APPROVED"
    );
    assert.equal(
      readingLinkModerationFilterHref("REJECTED"),
      "/admin/reading-links?status=REJECTED"
    );
  });
});

describe("normalizeReadingLinkModerationPage", () => {
  it("clamps out-of-range pages to the last valid page", () => {
    assert.equal(normalizeReadingLinkModerationPage(2, 1), 1);
    assert.equal(normalizeReadingLinkModerationPage(99, 3), 3);
  });

  it("preserves valid in-range pages", () => {
    assert.equal(normalizeReadingLinkModerationPage(2, 5), 2);
    assert.equal(normalizeReadingLinkModerationPage(1, 1), 1);
  });

  it("normalizes invalid requested pages before clamping", () => {
    assert.equal(normalizeReadingLinkModerationPage(0, 3), 1);
    assert.equal(normalizeReadingLinkModerationPage(-1, 3), 1);
  });
});

describe("readingLinkModerationPageHref", () => {
  it("omits page=1 from the URL", () => {
    assert.equal(readingLinkModerationPageHref("ALL", 1), "/admin/reading-links");
    assert.equal(
      readingLinkModerationPageHref("PENDING", 1),
      "/admin/reading-links?status=PENDING"
    );
  });

  it("preserves filter params when redirecting to the last page", () => {
    assert.equal(
      readingLinkModerationPageHref("PENDING", 2),
      "/admin/reading-links?status=PENDING&page=2"
    );
    assert.equal(
      readingLinkModerationPageHref("ALL", 2),
      "/admin/reading-links?page=2"
    );
  });
});
