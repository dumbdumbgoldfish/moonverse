import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isBareReadingLinkRequest,
  isReadingSourceRequest,
} from "./intent";

describe("bare reading link requests", () => {
  it("detects title-less link asks", () => {
    assert.equal(isBareReadingLinkRequest("give me link"), true);
    assert.equal(isBareReadingLinkRequest("give me novel link"), true);
    assert.equal(isBareReadingLinkRequest("give me reading link"), true);
    assert.equal(isBareReadingLinkRequest("can you give me the link"), true);
    assert.equal(isBareReadingLinkRequest("where can I read it"), true);
  });

  it("does not treat titled link asks as bare", () => {
    assert.equal(
      isBareReadingLinkRequest("give me the link for Lord of the Mysteries"),
      false
    );
    assert.equal(isReadingSourceRequest("give me link"), true);
  });
});
