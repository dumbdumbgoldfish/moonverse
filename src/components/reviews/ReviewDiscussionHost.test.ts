import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("ReviewDiscussionHost hash bridge", () => {
  it("subscribes to hashchange for #comments deep links", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(
        new URL("./ReviewDiscussionHost.tsx", import.meta.url),
        "utf8"
      )
    );
    assert.match(source, /hashchange/);
    assert.match(source, /#comments/);
  });
});
