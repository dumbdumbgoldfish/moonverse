import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAcceptedCompareCatalogueMatch } from "./compare-acceptance";
import type { MoonieLookupCandidate } from "@/types/moonie";

function candidate(
  overrides: Partial<MoonieLookupCandidate> &
    Pick<MoonieLookupCandidate, "confidence" | "confidenceScore" | "evidence">
): MoonieLookupCandidate {
  return {
    novelId: "novel-1",
    title: "Example Novel",
    canonicalTitle: "Example Novel",
    genres: [],
    tags: [],
    ...overrides,
  };
}

describe("compare catalogue acceptance gate", () => {
  it("accepts exact canonical title matches", () => {
    assert.equal(
      isAcceptedCompareCatalogueMatch(
        candidate({
          confidence: "high",
          confidenceScore: 0.9,
          evidence: [{ kind: "canonical_title", label: "Exact canonical title" }],
        })
      ),
      true
    );
  });

  it("accepts exact catalogue alias matches", () => {
    assert.equal(
      isAcceptedCompareCatalogueMatch(
        candidate({
          confidence: "medium",
          confidenceScore: 0.6,
          evidence: [{ kind: "alias", label: 'Catalogue alias "ORV"' }],
        })
      ),
      true
    );
  });

  it("accepts strong fuzzy matches with high confidence", () => {
    assert.equal(
      isAcceptedCompareCatalogueMatch(
        candidate({
          confidence: "high",
          confidenceScore: 0.75,
          evidence: [{ kind: "fuzzy_title", label: "Strong title similarity" }],
        })
      ),
      true
    );
  });

  it("rejects weak partial fuzzy matches", () => {
    assert.equal(
      isAcceptedCompareCatalogueMatch(
        candidate({
          confidence: "medium",
          confidenceScore: 0.5,
          evidence: [{ kind: "fuzzy_title", label: "Partial title match" }],
        })
      ),
      false
    );
  });

  it("rejects low-confidence unrelated candidates", () => {
    assert.equal(
      isAcceptedCompareCatalogueMatch(
        candidate({
          confidence: "low",
          confidenceScore: 0.3,
          evidence: [{ kind: "fuzzy_title", label: "Fuzzy title similarity" }],
        })
      ),
      false
    );
  });

  it("rejects fake titles with only weak fuzzy similarity", () => {
    assert.equal(
      isAcceptedCompareCatalogueMatch(
        candidate({
          confidence: "medium",
          confidenceScore: 0.45,
          evidence: [
            { kind: "fuzzy_title", label: "Fuzzy title similarity" },
            { kind: "catalogue_verified", label: "Catalogue retrieval signal" },
          ],
        })
      ),
      false
    );
  });
});
