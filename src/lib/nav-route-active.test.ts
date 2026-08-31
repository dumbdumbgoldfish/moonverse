import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isCommunityNavActive,
  isDiscoverNavActive,
  isMoonieNavActive,
  isNavPending,
  normalizeNavPathname,
} from "./nav-route-active";

describe("nav route active", () => {
  it("normalizes query strings from hrefs", () => {
    assert.equal(normalizeNavPathname("/moonie?new=1"), "/moonie");
  });

  it("clears stale community pending when moonie desk is shown", () => {
    assert.equal(
      isNavPending("/moonie", "/community", "/community"),
      false
    );
    assert.equal(
      isNavPending("/moonie?new=1", "/community", "/community"),
      false
    );
    assert.equal(isCommunityNavActive("/moonie"), false);
    assert.equal(isMoonieNavActive("/moonie?new=1"), true);
  });

  it("does not clear browse pending while still on discover", () => {
    assert.equal(
      isNavPending("/discover", "/community", "/community"),
      true
    );
  });

  it("keeps pending feedback while navigating to the target", () => {
    assert.equal(
      isNavPending("/discover", "/browse", "/browse"),
      true
    );
    assert.equal(
      isNavPending("/browse", "/browse", "/browse"),
      false
    );
  });

  it("clears pending when another primary destination wins", () => {
    assert.equal(
      isNavPending("/discover", "/community", "/community"),
      true
    );
    assert.equal(isDiscoverNavActive("/discover"), true);
  });

  it("clears community pending when moonie supersedes in-flight nav", () => {
    assert.equal(
      isNavPending("/moonie?new=1", "/community", "/community"),
      false
    );
    assert.equal(
      isNavPending("/moonie", "/discover", "/discover"),
      false
    );
  });

  it("keeps browse pending until browse route settles", () => {
    assert.equal(isNavPending("/discover", "/browse", "/browse"), true);
    assert.equal(isNavPending("/browse", "/browse", "/browse"), false);
    assert.equal(isNavPending("/browse", "/discover", "/discover"), true);
  });
});
