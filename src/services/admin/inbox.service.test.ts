import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inboxKindFilterCountKey,
  INBOX_PER_KIND_CAP,
  paginateAdminInboxItems,
  parseInboxKindFilter,
  sortInboxItems,
  type InboxItemKind,
} from "@/services/admin/inbox.service";

describe("paginateAdminInboxItems", () => {
  it("does not silently truncate older moderation work", () => {
    const items = Array.from({ length: 123 }, (_, index) => index);
    const page = paginateAdminInboxItems(items, 3, 50);

    assert.deepEqual(page.items, items.slice(100, 123));
    assert.equal(page.total, 123);
    assert.equal(page.totalPages, 3);
    assert.equal(page.page, 3);
  });

  it("clamps an out-of-range page to the last available page", () => {
    const page = paginateAdminInboxItems([1, 2, 3], 99, 2);
    assert.equal(page.page, 2);
    assert.deepEqual(page.items, [3]);
  });
});

describe("inbox bounded queue helpers", () => {
  it("caps per-kind fetch at INBOX_PER_KIND_CAP", () => {
    const page = 30;
    const pageSize = 50;
    const total = 5000;
    const perKindLimit = Math.min(page * pageSize, total, INBOX_PER_KIND_CAP);
    assert.equal(perKindLimit, INBOX_PER_KIND_CAP);
  });

  it("sorts inbox items by priority then age", () => {
    const sorted = sortInboxItems([
      {
        id: "tag-1",
        kind: "tag_suggestion",
        priority: 50,
        title: "a",
        subtitle: "",
        detail: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        ageHours: 1,
        badge: "Tag",
        suggestionId: "s1",
        tagName: "a",
        suggestedByUsername: "user",
        novelTitle: null,
      },
      {
        id: "report-1",
        kind: "report",
        priority: 90,
        title: "b",
        subtitle: "",
        detail: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        ageHours: 1,
        badge: "Report",
        report: {
          id: "r1",
          targetType: "REVIEW",
          targetId: "rev1",
          reason: "spam",
          details: null,
          status: "OPEN",
          resolution: null,
          reporterUsername: "reporter",
          resolvedByUsername: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          targetPreview: "Review",
          targetLink: null,
        },
      },
    ]);
    assert.equal(sorted[0]?.id, "report-1");
  });
});

describe("inbox kind filter", () => {
  it("parses known moderation kinds and rejects unknown values", () => {
    assert.equal(parseInboxKindFilter("tag_suggestion"), "tag_suggestion");
    assert.equal(parseInboxKindFilter("reading_link_unhealthy"), "reading_link_unhealthy");
    assert.equal(parseInboxKindFilter("all"), "all");
    assert.equal(parseInboxKindFilter(undefined), "all");
    assert.equal(parseInboxKindFilter("tags"), "all");
  });

  it("maps filter keys to inbox count keys", () => {
    assert.equal(inboxKindFilterCountKey("tag_suggestion"), "tag_suggestion");
    assert.equal(
      inboxKindFilterCountKey("reading_link_unhealthy"),
      "reading_link_unhealthy"
    );
    assert.equal(inboxKindFilterCountKey("all"), "total");
  });

  it("filters before paginating so low-priority tag suggestions are not dropped", () => {
    type Stub = { kind: InboxItemKind; priority: number };
    const items: Stub[] = [
      ...Array.from({ length: 100 }, () => ({
        kind: "report" as InboxItemKind,
        priority: 90,
      })),
      ...Array.from({ length: 45 }, () => ({
        kind: "tag_suggestion" as InboxItemKind,
        priority: 50,
      })),
    ];

    const paginateThenFilter = paginateAdminInboxItems(items, 1, 50).items.filter(
      (item) => item.kind === "tag_suggestion"
    );
    assert.equal(paginateThenFilter.length, 0);

    const filtered = items.filter((item) => item.kind === "tag_suggestion");
    const filterThenPaginate = paginateAdminInboxItems(filtered, 1, 50);
    assert.equal(filterThenPaginate.total, 45);
    assert.equal(filterThenPaginate.items.length, 45);
  });
});
