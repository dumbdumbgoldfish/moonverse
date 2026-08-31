import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bayesianQuality,
  combineRankingScore,
  cosineSimilarity,
  lexicalHashEmbedding,
  matchPercent,
  matchStrengthLabel,
  confidenceFromMatchPercent,
  overlapScore,
  RANKING_WEIGHTS,
} from "./ranking";

describe("ranking", () => {
  it("weights sum to 1", () => {
    const sum =
      RANKING_WEIGHTS.semantic +
      RANKING_WEIGHTS.structured +
      RANKING_WEIGHTS.quality +
      RANKING_WEIGHTS.history +
      RANKING_WEIGHTS.diversity;
    assert.equal(Number(sum.toFixed(2)), 1);
  });

  it("penalises a single five-star review against an established title", () => {
    const oneReview = bayesianQuality(5, 1);
    const established = bayesianQuality(4.4, 40);
    assert.ok(established > oneReview);
  });

  it("computes cosine similarity for aligned vectors", () => {
    assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
    assert.ok(cosineSimilarity([1, 0], [0, 1]) < 0.01);
  });

  it("scores structured overlap", () => {
    assert.equal(overlapScore(["Romance", "Fantasy"], ["romance"]), 1);
    assert.equal(overlapScore(["Romance"], ["horror"]), 0);
  });

  it("combines transparent weights", () => {
    const { score, breakdown } = combineRankingScore({
      semantic: 1,
      structured: 1,
      quality: 1,
      history: 1,
      diversity: 1,
    });
    assert.equal(Number(score.toFixed(2)), 1);
    assert.equal(Number(breakdown.semantic.toFixed(2)), 0.4);
  });

  it("does not add a diversity floor when diversity signal is zero", () => {
    const weak = combineRankingScore({
      semantic: 0,
      structured: 0,
      quality: 0.12,
      history: 0.05,
      diversity: 0,
    });
    assert.ok(weak.score < 0.2);
    assert.equal(weak.breakdown.diversity, 0);
  });

  it("converts scores to match percent", () => {
    assert.equal(matchPercent(0.73), 73);
    assert.equal(matchPercent(1.4), 100);
  });

  it("labels match strength bands consistently with confidence", () => {
    assert.equal(matchStrengthLabel(27), "weak");
    assert.equal(matchStrengthLabel(40), "moderate");
    assert.equal(matchStrengthLabel(60), "strong");
    assert.equal(confidenceFromMatchPercent(27), "low");
    assert.equal(confidenceFromMatchPercent(40), "medium");
    assert.equal(confidenceFromMatchPercent(60, 3), "high");
    assert.equal(confidenceFromMatchPercent(60, 1), "medium");
  });

  it("builds a unit lexical hash embedding", () => {
    const vector = lexicalHashEmbedding("slow burn romance fantasy");
    const mag = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    assert.ok(Math.abs(mag - 1) < 0.001);
    assert.ok(
      cosineSimilarity(
        lexicalHashEmbedding("romance slow burn"),
        lexicalHashEmbedding("slow-burn romance")
      ) > 0.3
    );
  });
});
