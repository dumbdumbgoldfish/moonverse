import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { paginateAdminInboxItems } from "@/services/admin/inbox.service";

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
