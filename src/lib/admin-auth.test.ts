import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { UserRole } from "@prisma/client";
import {
  AdminAccessDeniedError,
  assertActiveAdminUser,
} from "@/lib/admin-auth";

describe("assertActiveAdminUser", () => {
  it("allows an active admin", () => {
    assert.doesNotThrow(() =>
      assertActiveAdminUser({
        role: UserRole.ADMIN,
        isSuspended: false,
      })
    );
  });

  it("rejects a suspended admin even when session role is stale ADMIN", () => {
    assert.throws(
      () =>
        assertActiveAdminUser({
          role: UserRole.ADMIN,
          isSuspended: true,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AdminAccessDeniedError);
        assert.match(error.message, /suspended/i);
        return true;
      }
    );
  });

  it("rejects a demoted admin with stale ADMIN session role", () => {
    assert.throws(
      () =>
        assertActiveAdminUser({
          role: UserRole.USER,
          isSuspended: false,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AdminAccessDeniedError);
        assert.match(error.message, /Admin access required/i);
        return true;
      }
    );
  });

  it("rejects a missing/deleted user record", () => {
    assert.throws(
      () => assertActiveAdminUser(null),
      (error: unknown) => {
        assert.ok(error instanceof AdminAccessDeniedError);
        assert.match(error.message, /no longer available/i);
        return true;
      }
    );
  });

  it("rejects an ordinary active user", () => {
    assert.throws(
      () =>
        assertActiveAdminUser({
          role: UserRole.USER,
          isSuspended: false,
        }),
      AdminAccessDeniedError
    );
  });
});
