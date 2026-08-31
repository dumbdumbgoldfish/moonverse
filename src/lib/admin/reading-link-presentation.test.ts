import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readingLinkHealthBadgeVariant } from "@/lib/admin/reading-link-presentation";

describe("readingLinkHealthBadgeVariant", () => {
  it("recognizes the persisted REDIRECTED health status", () => {
    assert.equal(readingLinkHealthBadgeVariant("REDIRECTED"), "secondary");
  });

  it("uses a neutral outline for unknown future statuses", () => {
    assert.equal(readingLinkHealthBadgeVariant("UNRECOGNIZED"), "outline");
  });
});
