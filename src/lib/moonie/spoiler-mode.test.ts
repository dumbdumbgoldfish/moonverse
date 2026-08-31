import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_SPOILER_MODE,
  isSpoilerModeNegationMessage,
  isSpoilerModeOnlyMessage,
  isSpoilerModeQuestion,
  parseSpoilerModeFromMessage,
  sanitizeCommunityInsightForMode,
  sanitizeReviewExcerpt,
  sanitizeReviewTitleForMode,
  sanitizeStoredRankedReviewsForMode,
  shouldSyncClientSpoilerModeFromResponse,
} from "./spoiler-mode";
import { hydrateStoredAssistantMeta } from "./persist-assistant-turn";

describe("spoiler mode parsing", () => {
  it("recognizes mode-only commands", () => {
    assert.equal(parseSpoilerModeFromMessage("no spoilers"), "none");
    assert.equal(
      parseSpoilerModeFromMessage("please keep it spoiler-free"),
      "none"
    );
    assert.equal(parseSpoilerModeFromMessage("light spoilers only"), "light");
    assert.equal(parseSpoilerModeFromMessage("full discussion"), "full");
    assert.equal(isSpoilerModeOnlyMessage("no spoilers"), true);
    assert.equal(
      isSpoilerModeOnlyMessage("Recommend fantasy without spoilers"),
      false
    );
  });

  it("does not treat a UI spoiler toggle label as a mode-only command", () => {
    assert.equal(parseSpoilerModeFromMessage("Spoiler mode: none"), null);
    assert.equal(isSpoilerModeOnlyMessage("Spoiler mode: none"), false);
    assert.equal(isSpoilerModeOnlyMessage("Spoiler mode: Light spoilers"), false);
  });

  it("parses mixed spoiler preference without mode-only routing", () => {
    assert.equal(
      parseSpoilerModeFromMessage("Recommend fantasy without spoilers"),
      "none"
    );
    assert.equal(
      isSpoilerModeOnlyMessage("Recommend fantasy without spoilers"),
      false
    );
  });

  it("rejects negation and questions", () => {
    assert.equal(
      parseSpoilerModeFromMessage("don't switch to full discussion"),
      null
    );
    assert.equal(isSpoilerModeNegationMessage("don't switch to full discussion"), true);
    assert.equal(parseSpoilerModeFromMessage("what is full discussion?"), null);
    assert.equal(isSpoilerModeQuestion("what is full discussion?"), true);
    assert.equal(isSpoilerModeOnlyMessage("don't switch to full discussion"), false);
  });
});

describe("spoiler client sync", () => {
  it("syncs explicit shield acknowledgements", () => {
    assert.equal(
      shouldSyncClientSpoilerModeFromResponse({
        reply: "Spoiler shield set to **No spoilers** for your next Moonie replies.",
        serverMode: "none",
        modeAtSend: "light",
        modeNow: "light",
      }),
      true
    );
  });

  it("does not overwrite a newer user toggle from a stale response", () => {
    assert.equal(
      shouldSyncClientSpoilerModeFromResponse({
        reply: "Here are your picks.",
        serverMode: "none",
        modeAtSend: "none",
        modeNow: "full",
      }),
      false
    );
  });

  it("applies mixed-request mode when the user did not toggle mid-flight", () => {
    assert.equal(
      shouldSyncClientSpoilerModeFromResponse({
        reply: "Here are spoiler-safe picks.",
        serverMode: "none",
        modeAtSend: "light",
        modeNow: "light",
      }),
      true
    );
  });
});

describe("spoiler content sanitization", () => {
  const spoilerBody = "The hero dies at the end and the villain wins.";
  const spoilerTitle = "The hero dies and everyone loses";

  it("blocks spoiler bodies and titles in none/light modes", () => {
    assert.equal(
      sanitizeReviewExcerpt({
        title: "Safe",
        body: spoilerBody,
        containsSpoilers: true,
        mode: "none",
      }),
      null
    );
    assert.equal(
      sanitizeReviewTitleForMode({
        title: spoilerTitle,
        containsSpoilers: true,
        mode: "light",
      }),
      "Spoiler-marked review"
    );
    const lightExcerpt = sanitizeReviewExcerpt({
      title: spoilerTitle,
      body: spoilerBody,
      containsSpoilers: true,
      mode: "light",
    });
    assert.match(lightExcerpt ?? "", /Spoiler-marked review/i);
    assert.doesNotMatch(lightExcerpt ?? "", /hero dies/i);
  });

  it("allows full discussion content", () => {
    assert.match(
      sanitizeReviewExcerpt({
        title: spoilerTitle,
        body: spoilerBody,
        containsSpoilers: true,
        mode: "full",
      }) ?? "",
      /hero dies/i
    );
  });

  it("strips leaked community previews on replay under stricter modes", () => {
    const leaky = sanitizeCommunityInsightForMode(
      {
        averageRating: 4.5,
        reviewCount: 3,
        previews: [
          {
            id: "r1",
            title: spoilerTitle,
            excerpt: `${spoilerTitle} ${spoilerBody}`,
            rating: 5,
            reviewerName: "Reader",
          },
        ],
        consensus: spoilerBody,
      },
      "none"
    );
    assert.equal(leaky?.previews.length, 0);
    assert.equal(leaky?.consensus, null);
  });

  it("uses neutral placeholders in light mode for unsafe stored previews", () => {
    const softened = sanitizeCommunityInsightForMode(
      {
        averageRating: 4.5,
        reviewCount: 1,
        previews: [
          {
            id: "r1",
            title: spoilerTitle,
            excerpt: `${spoilerTitle} ${spoilerBody}`,
            rating: 5,
            reviewerName: "Reader",
          },
        ],
        consensus: null,
      },
      "light"
    );
    assert.equal(softened?.previews[0]?.title, "Spoiler-marked review");
    assert.match(
      softened?.previews[0]?.excerpt ?? "",
      /open the novel page for details/i
    );
    assert.doesNotMatch(softened?.previews[0]?.excerpt ?? "", /hero dies/i);
  });
});

describe("guest default spoiler mode", () => {
  it("defaults to spoiler-safe none without desk controls", () => {
    assert.equal(DEFAULT_SPOILER_MODE, "none");
  });
});

describe("stored ranked review restoration", () => {
  const spoilerBody = "The hero dies at the end and the villain wins.";

  it("re-sanitizes spoiler-marked ranked reviews on history hydration", () => {
    const raw = [
      {
        id: "review-spoiler-fixture",
        title: "The hero dies and everyone loses",
        excerpt: spoilerBody,
        rating: 5,
        reviewerName: "Reader",
        novelId: "novel-fixture",
        novelTitle: "Fixture Novel",
        containsSpoilers: true,
      },
    ];

    const hydrated = hydrateStoredAssistantMeta({
      spoilerMode: "none",
      rankedReviews: raw,
      responseKind: "reviews",
    });

    assert.equal(hydrated.rankedReviews?.length, 1);
    assert.doesNotMatch(hydrated.rankedReviews![0]!.excerpt, /hero dies/i);
    assert.match(
      hydrated.rankedReviews![0]!.title,
      /Spoiler-marked review/i
    );

    const direct = sanitizeStoredRankedReviewsForMode(raw, "none");
    assert.doesNotMatch(direct![0]!.excerpt, /hero dies/i);
  });
});
