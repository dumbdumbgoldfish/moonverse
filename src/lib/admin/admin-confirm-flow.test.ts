import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runAdminConfirmFlow } from "@/lib/admin/admin-confirm-flow";

describe("runAdminConfirmFlow", () => {
  it("closes dialog and clears confirming on success", async () => {
    let confirming = false;
    let closed = false;
    let error: string | null = null;

    const result = await runAdminConfirmFlow(
      async () => ({ success: true }),
      {
        setConfirming: (value) => {
          confirming = value;
        },
        setError: (message) => {
          error = message;
        },
        close: () => {
          closed = true;
        },
      }
    );

    assert.equal(result.success, true);
    assert.equal(confirming, false);
    assert.equal(closed, true);
    assert.equal(error, null);
  });

  it("keeps dialog open with error on failure", async () => {
    let confirming = false;
    let closed = false;
    let error: string | null = null;

    const result = await runAdminConfirmFlow(
      async () => ({ success: false, error: "Rejected." }),
      {
        setConfirming: (value) => {
          confirming = value;
        },
        setError: (message) => {
          error = message;
        },
        close: () => {
          closed = true;
        },
      }
    );

    assert.equal(result.success, false);
    assert.equal(confirming, false);
    assert.equal(closed, false);
    assert.equal(error, "Rejected.");
  });

  it("clears confirming when onConfirm throws", async () => {
    let confirming = false;

    const result = await runAdminConfirmFlow(
      async () => {
        throw new Error("Network error.");
      },
      {
        setConfirming: (value) => {
          confirming = value;
        },
        setError: () => {},
        close: () => {},
      }
    );

    assert.equal(result.success, false);
    assert.equal(confirming, false);
  });
});
