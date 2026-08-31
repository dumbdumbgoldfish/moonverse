import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SEARCH_LOCATION_EVENT } from "./search-location";

describe("search-location", () => {
  it("uses a stable event name for navbar and search page sync", () => {
    assert.equal(SEARCH_LOCATION_EVENT, "moonverse:search-location");
  });
});
