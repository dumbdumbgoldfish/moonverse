import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildInboxTriageHref,
  buildInboxTriageHrefFromSearch,
  findInboxPageForSelectedIndex,
  reconcileInboxSelectionForFilterChange,
  resolveInboxSelection,
} from "@/lib/admin/inbox-selection";

const ITEMS = [
  { id: "report-1" },
  { id: "review-2" },
  { id: "comment-3" },
];

describe("buildInboxTriageHref", () => {
  it("includes selected without dropping kind or page params", () => {
    assert.equal(
      buildInboxTriageHref({
        kind: "report",
        page: 2,
        selected: "report-9",
      }),
      "/admin/inbox?kind=report&page=2&selected=report-9"
    );
  });
});

describe("buildInboxTriageHrefFromSearch", () => {
  it("updates only selected while preserving other params", () => {
    assert.equal(
      buildInboxTriageHrefFromSearch("kind=report&page=2", {
        selected: "report-9",
      }),
      "/admin/inbox?kind=report&page=2&selected=report-9"
    );
  });

  it("clears selected when changing kind", () => {
    assert.equal(
      buildInboxTriageHrefFromSearch("selected=report-1&page=2", {
        kind: "review_flagged",
        selected: null,
        page: null,
      }),
      "/admin/inbox?kind=review_flagged"
    );
  });
});

describe("resolveInboxSelection", () => {
  it("restores a valid selected id on the loaded page", () => {
    const resolution = resolveInboxSelection(ITEMS, "review-2");
    assert.equal(resolution.activeSelectedId, "review-2");
    assert.equal(resolution.selectionMatched, true);
    assert.equal(resolution.selectionWarning, null);
  });

  it("falls back safely when the selected id is invalid", () => {
    const resolution = resolveInboxSelection(ITEMS, "missing-item");
    assert.equal(resolution.activeSelectedId, "report-1");
    assert.equal(resolution.selectionMatched, false);
    assert.ok(resolution.selectionWarning);
  });

  it("defaults to the first item when selected is missing", () => {
    const resolution = resolveInboxSelection(ITEMS);
    assert.equal(resolution.activeSelectedId, "report-1");
    assert.equal(resolution.selectionMatched, true);
  });
});

describe("findInboxPageForSelectedIndex", () => {
  it("finds the page containing a deep-linked inbox item", () => {
    assert.equal(findInboxPageForSelectedIndex(120, 99, 50), 2);
    assert.equal(findInboxPageForSelectedIndex(120, 0, 50), 1);
    assert.equal(findInboxPageForSelectedIndex(120, -1, 50), null);
  });
});

describe("reconcileInboxSelectionForFilterChange", () => {
  it("keeps the current selection when it still exists after a filter change", () => {
    assert.equal(
      reconcileInboxSelectionForFilterChange("review-2", ITEMS),
      "review-2"
    );
  });

  it("reconciles stale selection to the first item in the new view", () => {
    assert.equal(
      reconcileInboxSelectionForFilterChange("report-1", [{ id: "tag-4" }]),
      "tag-4"
    );
  });
});
