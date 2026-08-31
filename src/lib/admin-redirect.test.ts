import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_PUBLIC_SITE_PATH,
  shouldRenderPublicLanding,
} from "@/lib/admin-redirect";

describe("admin public-site navigation", () => {
  it("uses an explicit public landing URL that retains the admin session", () => {
    assert.equal(ADMIN_PUBLIC_SITE_PATH, "/?public=1");
    assert.equal(shouldRenderPublicLanding({ public: "1" }), true);
  });

  it("keeps the ordinary authenticated root redirect behavior", () => {
    assert.equal(shouldRenderPublicLanding({}), false);
    assert.equal(shouldRenderPublicLanding({ public: "0" }), false);
  });
});
