import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldShowFloatingMoonie } from "./constants";

describe("shouldShowFloatingMoonie", () => {
  it("shows on browse and community surfaces", () => {
    assert.equal(shouldShowFloatingMoonie("/browse"), true);
    assert.equal(shouldShowFloatingMoonie("/community"), true);
    assert.equal(shouldShowFloatingMoonie("/novels/abc"), true);
  });

  it("hides on onboarding, auth, admin, and dedicated Moonie routes", () => {
    assert.equal(shouldShowFloatingMoonie("/onboarding"), false);
    assert.equal(shouldShowFloatingMoonie("/onboarding/genres"), false);
    assert.equal(shouldShowFloatingMoonie("/login"), false);
    assert.equal(shouldShowFloatingMoonie("/admin"), false);
    assert.equal(shouldShowFloatingMoonie("/moonie"), false);
    assert.equal(shouldShowFloatingMoonie("/ask-moonie"), false);
  });
});
