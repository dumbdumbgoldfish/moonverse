import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scorePassword } from "./password-strength";

describe("scorePassword", () => {
  it("treats empty input as unusable", () => {
    assert.equal(scorePassword("").score, 0);
  });

  it("requires a letter and a number for an okay password", () => {
    assert.equal(scorePassword("abcdefgh").score, 1);
    assert.equal(scorePassword("abcde123").score, 2);
  });

  it("rewards length or a symbol", () => {
    assert.equal(scorePassword("abcdefghij12").score, 3);
    assert.equal(scorePassword("abcde123!").score, 3);
    assert.equal(scorePassword("abcdefghij12!").score, 4);
  });
});
