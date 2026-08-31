import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signOutAndReload } from "@/lib/logout";

describe("signOutAndReload", () => {
  it("reloads only after the server sign-out succeeds", async () => {
    const calls: string[] = [];

    await signOutAndReload(
      async () => {
        calls.push("sign-out");
      },
      "/",
      (destination) => calls.push(`navigate:${destination}`)
    );

    assert.deepEqual(calls, ["sign-out", "navigate:/"]);
  });

  it("does not hide authenticated chrome when sign-out fails", async () => {
    let navigated = false;

    await assert.rejects(
      signOutAndReload(
        async () => {
          throw new Error("Sign-out failed");
        },
        "/",
        () => {
          navigated = true;
        }
      ),
      /Sign-out failed/
    );
    assert.equal(navigated, false);
  });
});
