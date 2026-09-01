import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterInboxItemsByKind,
  inboxKindFilterCountKey,
  inboxKindFilterEmptyMessage,
  inboxKindFilterHref,
  INBOX_KIND_FILTER_OPTIONS,
} from "@/lib/admin/inbox-kind-filter";
import type { InboxItemKind } from "@/services/admin/inbox.service";

describe("INBOX_KIND_FILTER_OPTIONS", () => {
  it("includes an unhealthy approved reading links filter", () => {
    const unhealthy = INBOX_KIND_FILTER_OPTIONS.find(
      (option) => option.id === "reading_link_unhealthy"
    );
    assert.ok(unhealthy);
    assert.equal(unhealthy.label, "Unhealthy links");
  });
});

describe("inboxKindFilterHref", () => {
  it("uses kind=reading_link_unhealthy for the unhealthy links filter", () => {
    assert.equal(
      inboxKindFilterHref("reading_link_unhealthy"),
      "/admin/inbox?kind=reading_link_unhealthy"
    );
  });

  it("uses the bare inbox path for the all filter", () => {
    assert.equal(inboxKindFilterHref("all"), "/admin/inbox");
  });
});

describe("inboxKindFilterCountKey", () => {
  it("maps unhealthy links to counts.reading_link_unhealthy", () => {
    assert.equal(inboxKindFilterCountKey("reading_link_unhealthy"), "reading_link_unhealthy");
  });
});

describe("filterInboxItemsByKind", () => {
  const items: Array<{ id: string; kind: InboxItemKind }> = [
    { id: "pending-link", kind: "reading_link" },
    { id: "unhealthy-link", kind: "reading_link_unhealthy" },
    { id: "report", kind: "report" },
  ];

  it("returns only unhealthy approved links when that filter is selected", () => {
    const filtered = filterInboxItemsByKind(items, "reading_link_unhealthy");
    assert.deepEqual(filtered.map((item) => item.id), ["unhealthy-link"]);
  });
});

describe("inboxKindFilterEmptyMessage", () => {
  it("describes an empty unhealthy links queue", () => {
    assert.equal(
      inboxKindFilterEmptyMessage("reading_link_unhealthy"),
      "No unhealthy approved reading links in the moderation queue."
    );
  });
});
