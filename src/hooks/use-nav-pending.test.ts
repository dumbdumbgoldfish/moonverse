import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFile } from "node:fs/promises";

describe("useNavPendingFromPath", () => {
  it("scopes pending to pathname generation", async () => {
    const source = await readFile(
      new URL("./use-nav-pending.ts", import.meta.url),
      "utf8"
    );
    assert.match(source, /routeEpoch/);
    assert.match(
      source,
      /pendingFromPath\.generation === generation/
    );
    assert.doesNotMatch(source, /useLayoutEffect/);
  });

  it("navbar uses shared pending hook for logo/home round-trip safety", async () => {
    const source = await readFile(
      new URL("../components/layout/Navbar.tsx", import.meta.url),
      "utf8"
    );
    assert.match(source, /useNavPendingFromPath\(pathname\)/);
    assert.doesNotMatch(source, /pendingFromPath\?\.path === normalizedPath/);
  });
});
