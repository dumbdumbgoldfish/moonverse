import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acceptPolishedReason,
  acceptPolishedSummary,
  mergePolishedConfidence,
  MOONIE_INTERNAL_JARGON_RE,
  reasonClaimsUnavailablePersonalization,
  sanitizePolishedReason,
} from "@/lib/moonie/polish-safety";
import { matchPercent } from "@/lib/moonie/ranking";
import { MOONIE_INTEGRATION_SEED_MESSAGE } from "@/lib/moonie/demo-acceptance-fixtures";
import { formatNovelFactualFieldReply } from "@/services/moonie-novel-lookup.service";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import type { MoonieNovelOverview } from "@/types/moonie";

const FIXTURE_OVERVIEW: MoonieNovelOverview = {
  novelId: "novel-tone-1",
  title: "Tone Fixture Novel",
  author: null,
  coverUrl: null,
  publicationStatus: null,
  originalLanguage: "en",
  genres: ["Fantasy"],
  tags: [],
  synopsis: null,
  readingSources: [],
  community: null,
  provenance: undefined,
  matchedAlias: null,
  confidence: "medium",
};

describe("polish safety guards", () => {
  it("softens strong-match wording for low catalogue fit", () => {
    const sanitized = sanitizePolishedReason(
      "This is a strong match for your fantasy request.",
      27
    );
    assert.doesNotMatch(sanitized, /\bstrong\b/i);
    assert.match(sanitized, /modest/i);
  });

  it("rejects catalogue-absence polish summaries", () => {
    const accepted = acceptPolishedSummary(
      "The catalogue has no fantasy novels tagged as completed.",
      "Here are three fantasy picks from MoonVerse."
    );
    assert.equal(accepted, "Here are three fantasy picks from MoonVerse.");
  });

  it("rejects fabricated personalization claims for guests", () => {
    const accepted = acceptPolishedReason(
      "Based on your saved novels, this fits your taste.",
      "Fits your fantasy interest.",
      55,
      []
    );
    assert.equal(accepted, "Fits your fantasy interest.");
    assert.equal(
      reasonClaimsUnavailablePersonalization(
        "Based on your saved taste profile",
        []
      ),
      true
    );
  });

  it("caps polished confidence to match-percent bands", () => {
    assert.equal(mergePolishedConfidence("high", "medium", 27, 5), "low");
    assert.equal(mergePolishedConfidence("high", "medium", 40, 5), "medium");
    assert.equal(mergePolishedConfidence("high", "medium", 60, 5), "high");
    assert.equal(mergePolishedConfidence("high", "medium", 60, 1), "medium");
  });

  it("keeps floating and desk on the same match percent function", () => {
    const score = 0.42;
    assert.equal(matchPercent(score), matchPercent(score));
    assert.equal(matchPercent(score), 42);
  });
});

describe("user-facing tone", () => {
  it("marks only the missing factual field, not the whole novel", () => {
    assert.match(
      formatNovelFactualFieldReply(FIXTURE_OVERVIEW, "author"),
      /does not list an author/i
    );
    assert.doesNotMatch(
      formatNovelFactualFieldReply(FIXTURE_OVERVIEW, "author"),
      /entire novel|cannot verify this entire/i
    );
  });

  it("avoids internal implementation jargon in guest recommendation replies", async () => {
    const response = await handleMoonieRequest({
      message: MOONIE_INTEGRATION_SEED_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });
    assert.doesNotMatch(response.reply, MOONIE_INTERNAL_JARGON_RE);
    assert.doesNotMatch(response.reply, /\bunverified demo metadata\b/i);
    for (const recommendation of response.recommendations) {
      const text = `${recommendation.reason} ${recommendation.drawback ?? ""}`;
      assert.doesNotMatch(text, MOONIE_INTERNAL_JARGON_RE);
      if ((recommendation.matchPercent ?? 100) < 35) {
        assert.doesNotMatch(text, /\bstrong match\b/i);
      }
    }
  });

  it("uses a friendly greeting without internal jargon", async () => {
    const response = await handleMoonieRequest({
      message: "hi",
      messages: [],
      isLoggedIn: false,
    });
    assert.doesNotMatch(response.reply, MOONIE_INTERNAL_JARGON_RE);
    assert.match(response.reply, /moonie|hi|hey|hello/i);
  });
});
