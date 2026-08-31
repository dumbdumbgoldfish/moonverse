import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSimilarityRecommendationMessage,
  parseSimilarityRequest,
  similarityPreferenceSource,
} from "./similarity-request";
import {
  classifyMoonieIntents,
  extractNovelQuery,
  primaryRetrievalIntent,
} from "./intent";

describe("parseSimilarityRequest", () => {
  it("splits Queen of Shadows seed from preference tail", () => {
    const message =
      "Find novels like Queen of Shadows with beginner friendly vibes, but easier on the angst.";
    const parsed = parseSimilarityRequest(message);
    assert.ok(parsed);
    assert.equal(parsed!.seedTitle, "Queen of Shadows");
    assert.match(parsed!.preferenceTail ?? "", /beginner friendly/i);
    assert.match(parsed!.preferenceTail ?? "", /angst/i);
    assert.equal(parsed!.requiresVerifiedReadingLinks, false);
  });

  it("does not treat similarity as a title lookup string", () => {
    const message =
      "Find novels like Queen of Shadows with beginner friendly vibes, but easier on the angst.";
    assert.equal(extractNovelQuery(message), null);
    assert.equal(isSimilarityRecommendationMessage(message), true);
  });

  it("marks verified reading links as a result constraint, not seed lookup", () => {
    const message = "Recommend novels like Taggart's Woman with verified reading links";
    const parsed = parseSimilarityRequest(message);
    assert.ok(parsed);
    assert.equal(parsed!.seedTitle, "Taggart's Woman");
    assert.equal(parsed!.requiresVerifiedReadingLinks, true);
    const intents = classifyMoonieIntents(message);
    assert.equal(primaryRetrievalIntent(intents), "MORE_LIKE_THIS");
    assert.equal(intents.includes("FIND_READING_SOURCE"), false);
  });

  it("handles paraphrases and alternate titles", () => {
    const paraphrases = [
      "Suggest books similar to The Housemaid Is Watching with less angst",
      "Give me novels like Outlander, but cozier",
      "Find me books like Sovereign of the Three Realms with verified reading links",
    ];
    for (const message of paraphrases) {
      assert.ok(parseSimilarityRequest(message), message);
      assert.equal(extractNovelQuery(message), null, message);
    }
  });

  it("keeps preference tail separate from link requirement phrase", () => {
    const parsed = parseSimilarityRequest(
      "Recommend novels like Outlander with cozy vibes and verified reading links"
    );
    assert.ok(parsed);
    assert.equal(parsed!.seedTitle, "Outlander");
    assert.match(similarityPreferenceSource(parsed!), /cozy/i);
    assert.equal(parsed!.requiresVerifiedReadingLinks, true);
  });
});
