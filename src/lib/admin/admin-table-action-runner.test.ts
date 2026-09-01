import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runAdminTableAction } from "@/lib/admin/admin-table-action-runner";

describe("runAdminTableAction", () => {
  it("clears pending in finally before follow-up on success", async () => {
    const order: string[] = [];

    const result = await runAdminTableAction({
      run: async () => {
        order.push("run");
        return { success: true };
      },
      applyOutcome: () => order.push("apply"),
      clearPending: () => order.push("clear"),
      followUp: async () => {
        order.push("followUp");
      },
    });

    assert.equal(result.success, true);
    assert.deepEqual(order, ["run", "apply", "clear", "followUp"]);
  });

  it("clears pending without follow-up on failure", async () => {
    const order: string[] = [];

    const result = await runAdminTableAction({
      run: async () => {
        order.push("run");
        return { success: false, error: "Denied." };
      },
      applyOutcome: () => order.push("apply"),
      clearPending: () => order.push("clear"),
      followUp: () => {
        order.push("followUp");
      },
    });

    assert.equal(result.success, false);
    assert.deepEqual(order, ["run", "apply", "clear"]);
  });

  it("clears pending when the action throws", async () => {
    let cleared = false;

    const result = await runAdminTableAction({
      run: async (): Promise<{ success: boolean; error?: string }> => {
        throw new Error("Server exploded.");
      },
      applyOutcome: () => {},
      clearPending: () => {
        cleared = true;
      },
    });

    assert.equal(result.success, false);
    assert.equal(result.error, "Server exploded.");
    assert.equal(cleared, true);
  });
});
