import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCommunityLanes,
  resolveCommunityLane,
  reviewMatchesLane,
} from "./community-lanes";

describe("community lanes", () => {
  it("matches genres by name or slug", () => {
    const lane = buildCommunityLanes([
      { name: "Reincarnation", slug: "reincarnation" },
    ])[0]!;

    assert.equal(
      reviewMatchesLane(
        { genres: ["Other", "Romance", "Reincarnation"], tags: [] },
        lane
      ),
      true
    );
    assert.equal(
      reviewMatchesLane({ genres: ["Fantasy"], tags: ["Reincarnation"] }, lane),
      true
    );
  });

  it("resolves salon tokens to ad-hoc lanes", () => {
    const lanes = buildCommunityLanes([{ name: "BL", slug: "bl" }]);
    const villainess = resolveCommunityLane(lanes, "villainess");

    assert.equal(villainess.id, "salon:villainess");
    assert.equal(
      reviewMatchesLane({ genres: [], tags: ["Villainess"] }, villainess),
      true
    );
  });

  it("resolves known mood lanes from salon tokens", () => {
    const lanes = buildCommunityLanes([]);
    const cozy = resolveCommunityLane(lanes, "slice-of-life");

    assert.equal(cozy.id, "cozy");
  });
});
