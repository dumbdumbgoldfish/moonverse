import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isUnresolvedLookupSession } from "@/lib/moonie/presentation";
import type { MoonieLookupSession } from "@/types/moonie";

describe("lookup candidate presentation", () => {
  it("shows unresolved candidates only during clarification flows", () => {
    const clarification: MoonieLookupSession = {
      mode: "clarification",
      query: "Cultivation Chat Group",
      candidates: [
        {
          novelId: "novel-1",
          title: "Cultivation Chat Group",
          canonicalTitle: "Cultivation Chat Group",
          confidence: "medium",
          confidenceScore: 0.7,
          evidence: [],
          genres: [],
          tags: [],
        },
      ],
      rejectedNovelIds: [],
      pendingIntent: "NOVEL_REVIEWS",
    };

    assert.equal(isUnresolvedLookupSession(clarification), true);

    const confirmed: MoonieLookupSession = {
      ...clarification,
      mode: "confirmed",
      confirmedNovelId: "novel-1",
    };
    assert.equal(isUnresolvedLookupSession(confirmed), false);
  });
});
