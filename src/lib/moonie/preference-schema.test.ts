import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  constrainExplanationsToCandidateOrder,
  explanationIdsOutsideAllowlist,
  explanationResponseSchema,
  interpretedPreferencesSchema,
  mergeStructuredPreferences,
} from "./preference-schema";

describe("preference schema", () => {
  it("accepts structured preferences and rejects invented length values", () => {
    const parsed = interpretedPreferencesSchema.parse({
      genres: ["romance"],
      tags: ["slow-burn"],
      length: "short",
    });
    assert.deepEqual(parsed.genres, ["romance"]);
    assert.equal(
      interpretedPreferencesSchema.safeParse({ length: "epic" }).success,
      false
    );
  });

  it("merges heuristic and LLM fields without dropping exclusions", () => {
    const merged = mergeStructuredPreferences(
      {
        genres: ["fantasy"],
        tags: [],
        excludedTags: ["harem"],
        status: null,
        mood: [],
        language: null,
        length: null,
      },
      {
        genres: ["romance"],
        tags: ["slow-burn"],
        excludedTags: [],
        status: "completed",
        mood: ["cozy"],
        language: "en",
        length: "long",
      }
    );
    assert.ok(merged.genres.includes("fantasy"));
    assert.ok(merged.excludedTags.includes("harem"));
    assert.equal(merged.status, "completed");
  });

  it("drops explanation IDs outside the candidate allowlist and keeps order", () => {
    const candidates = [{ novelId: "a" }, { novelId: "b" }];
    const explanations = [
      { novelId: "invented" },
      { novelId: "b" },
      { novelId: "a" },
    ];
    assert.deepEqual(
      explanationIdsOutsideAllowlist(explanations, new Set(["a", "b"])),
      ["invented"]
    );
    assert.deepEqual(
      constrainExplanationsToCandidateOrder(candidates, explanations).map(
        (row) => row.novelId
      ),
      ["a", "b"]
    );
  });

  it("rejects malformed explanation payloads", () => {
    const parsed = explanationResponseSchema.safeParse({
      recommendations: [{ novelId: "" }],
    });
    assert.equal(parsed.success, false);
  });
});
