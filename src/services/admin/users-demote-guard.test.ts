import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertCanDemoteAdminTarget } from "@/services/admin/users.service";

describe("assertCanDemoteAdminTarget", () => {
  it("rejects self-demote attempts", () => {
    assert.throws(
      () => assertCanDemoteAdminTarget("admin-a", "admin-a"),
      /cannot demote your own account/i
    );
  });

  it("allows demoting another admin", () => {
    assert.equal(
      assertCanDemoteAdminTarget("admin-a", "admin-b"),
      undefined
    );
  });
});
