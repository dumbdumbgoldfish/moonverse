import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAdminSearchSubmitUrl } from "@/lib/admin/admin-search-params";

describe("buildAdminSearchSubmitUrl", () => {
  const pathname = "/admin/users";

  it("removes stale page when submitting a new search from page 3", () => {
    const href = buildAdminSearchSubmitUrl(
      pathname,
      "page=3&q=old",
      "q",
      "new-query"
    );
    assert.equal(href, "/admin/users?q=new-query");
    assert.equal(new URL(href, "http://localhost").searchParams.get("page"), null);
  });

  it("preserves unrelated filter params when resetting page", () => {
    const href = buildAdminSearchSubmitUrl(
      "/admin/reviews",
      "page=3&status=AUTO_FLAGGED&rating=4",
      "q",
      "angst"
    );
    const params = new URL(href, "http://localhost").searchParams;
    assert.equal(params.get("q"), "angst");
    assert.equal(params.get("status"), "AUTO_FLAGGED");
    assert.equal(params.get("rating"), "4");
    assert.equal(params.get("page"), null);
  });

  it("resets page when clearing search", () => {
    const href = buildAdminSearchSubmitUrl(pathname, "page=3&q=stale", "q", "");
    assert.equal(href, "/admin/users");
  });

  it("does not add page=1; omits page when returning to the first page", () => {
    const href = buildAdminSearchSubmitUrl(pathname, "page=5", "q", "reader");
    assert.equal(href, "/admin/users?q=reader");
    assert.equal(new URL(href, "http://localhost").searchParams.has("page"), false);
  });

  it("supports custom search param names", () => {
    const href = buildAdminSearchSubmitUrl(
      "/admin/custom",
      "page=2&tag=romance",
      "query",
      "fantasy"
    );
    const params = new URL(href, "http://localhost").searchParams;
    assert.equal(params.get("query"), "fantasy");
    assert.equal(params.get("tag"), "romance");
    assert.equal(params.get("page"), null);
  });
});
