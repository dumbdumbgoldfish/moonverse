import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isBrowseNavActive,
  isCommunityNavActive,
  isDiscoverNavActive,
  isHomeNavActive,
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

  it("discover is active on /discover and inactive on home", () => {
    assert.equal(isDiscoverNavActive("/discover"), true);
    assert.equal(isDiscoverNavActive("/"), false);
    assert.equal(isHomeNavActive("/"), true);
  });

  it("browse is inactive on home after browse round-trip", () => {
    assert.equal(isBrowseNavActive("/"), false);
    assert.equal(isBrowseNavActive("/browse"), true);
    assert.equal(isDiscoverNavActive("/"), false);
  });

  it("stale pending does not override settled home route", () => {
    assert.equal(isNavPending("/", null, "/discover"), false);
    assert.equal(isNavPending("/", null, "/browse"), false);
    assert.equal(isDiscoverNavActive("/"), false);
    assert.equal(isBrowseNavActive("/"), false);
  });

  it("in-flight pending from home to discover before pathname changes", () => {
    assert.equal(isNavPending("/", "/discover", "/discover"), true);
    assert.equal(isDiscoverNavActive("/"), false);
  });
});
