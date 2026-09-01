import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { serialAdminServerAction } from "@/lib/admin/serial-admin-server-action";

describe("serialAdminServerAction", () => {
  it("runs actions one at a time", async () => {
    const order: string[] = [];

    const first = serialAdminServerAction(async () => {
      order.push("first-start");
      await new Promise((resolve) => setTimeout(resolve, 30));
      order.push("first-end");
      return { success: true };
    });

    const second = serialAdminServerAction(async () => {
      order.push("second-start");
      return { success: true };
    });

    await Promise.all([first, second]);

    assert.deepEqual(order, [
      "first-start",
      "first-end",
      "second-start",
    ]);
  });
});
