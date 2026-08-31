import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bumpMoonieDeskMountEpoch,
  formatMoonieDeskMountKey,
  shouldBumpMoonieDeskMountOnRouteChange,
} from "./desk-mount-key";

describe("Moonie desk mount key", () => {
  it("keeps the same key when the first reply assigns a conversation id", () => {
    const epoch = 2;
    const keyBefore = formatMoonieDeskMountKey(epoch);
    const keyAfter = formatMoonieDeskMountKey(epoch);
    assert.equal(keyBefore, "desk-2");
    assert.equal(keyAfter, "desk-2");
    assert.equal(
      shouldBumpMoonieDeskMountOnRouteChange({
        previousConversationId: undefined,
        routeNewChat: false,
        routeConversationId: "chat-new",
      }),
      false
    );
  });

  it("bumps only on explicit fresh desk navigation", () => {
    assert.equal(bumpMoonieDeskMountEpoch(0), 1);
    assert.equal(
      shouldBumpMoonieDeskMountOnRouteChange({
        previousConversationId: "chat-a",
        routeNewChat: true,
        routeConversationId: undefined,
      }),
      true
    );
    assert.equal(
      shouldBumpMoonieDeskMountOnRouteChange({
        previousConversationId: undefined,
        routeNewChat: true,
        routeConversationId: undefined,
      }),
      false
    );
  });
});
