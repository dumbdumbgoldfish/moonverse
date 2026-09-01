import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildReadingLinkModerationWhere,
  parseReadingLinkModerationStatusFilter,
  readingLinkModerationFilterHref,
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
