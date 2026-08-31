import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMoonieExcludeNovelIds,
  buildMoonieRecommendRequestBody,
  resolveMoonieUseTaste,
} from "@/lib/moonie/recommend-request";
import {
  isRecommendationReplayRequest,
  isUnseenRecommendationRequest,
} from "@/lib/moonie/intent";

describe("Moonie taste request preference", () => {
  it("includes a stable client turn id for authenticated retry deduplication", () => {
    const body = buildMoonieRecommendRequestBody({
      message: "Show me fantasy novels",
      spoilerMode: "none",
      clientTurnId: "turn-123",
    });

    assert.equal(body.clientTurnId, "turn-123");
  });

  it("preserves an explicit false in the request body", () => {
    const body = buildMoonieRecommendRequestBody({
      message: "Show me completed slice-of-life novels",
      spoilerMode: "none",
      useTaste: false,
    });

    assert.equal(body.useTaste, false);
  });

  it("lets explicit false override the saved default and only defaults when absent", () => {
    assert.equal(resolveMoonieUseTaste(false, true), false);
    assert.equal(resolveMoonieUseTaste(true, false), true);
    assert.equal(resolveMoonieUseTaste(undefined, false), false);
    assert.equal(resolveMoonieUseTaste(undefined, undefined), true);
  });

  it("prefers unseen cards for an identical repeated request", () => {
    const message = "Show me completed slice-of-life novels";
    const priorRecommendedNovelIds = ["culpa-tuya", "the-vampyre"];
    const explicitExcludedNovelIds = ["hidden-by-user"];

    assert.equal(isUnseenRecommendationRequest(message), true);
    const excludeNovelIds = buildMoonieExcludeNovelIds({
      explicitExcludedNovelIds,
      priorRecommendedNovelIds,
      seekingUnseen: isUnseenRecommendationRequest(message),
    });
    const body = buildMoonieRecommendRequestBody({
      message,
      spoilerMode: "none",
      excludeNovelIds,
    });

    assert.deepEqual(body.excludeNovelIds, ["hidden-by-user"]);
  });

  it("does exclude prior cards when the user explicitly asks for new titles", () => {
    const message = "Show me more new completed slice-of-life novels";
    assert.equal(isUnseenRecommendationRequest(message), true);
    assert.deepEqual(
      buildMoonieExcludeNovelIds({
        explicitExcludedNovelIds: ["hidden-by-user"],
        priorRecommendedNovelIds: ["culpa-tuya", "the-vampyre"],
        seekingUnseen: true,
      }),
      ["hidden-by-user"]
    );
  });

  it("keeps explicit replay separate from hidden or rejected titles", () => {
    const message = "Show those recommendations again";
    assert.equal(isRecommendationReplayRequest(message), true);
    assert.equal(isUnseenRecommendationRequest(message), false);
    assert.deepEqual(
      buildMoonieExcludeNovelIds({
        explicitExcludedNovelIds: ["hidden-by-user"],
        priorRecommendedNovelIds: ["already-shown"],
        seekingUnseen: false,
      }),
      ["hidden-by-user"]
    );
  });

  it("recognizes all previous recommendations again without show prefix", () => {
    assert.equal(
      isRecommendationReplayRequest("All previous Recommendations again"),
      true
    );
    assert.equal(
      isRecommendationReplayRequest("all previous recommendations again"),
      true
    );
  });
});
