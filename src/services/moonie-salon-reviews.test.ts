import assert from "node:assert/strict";
import { createElement } from "react";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MoonieRankedReviews } from "@/components/moonie/MoonieRankedReviews";
import { buildAssistantMessage } from "@/hooks/use-moonie-chat";
import { extractPreferencesFromMessage } from "@/lib/moonie/preferences";
import {
  catalogueTagSlugs,
  hasUsableSalonReviewPreference,
  moodCatalogueSlugs,
  salonNovelPreferenceWhere,
} from "./moonie-salon-reviews.service";

describe("salon review preference evidence", () => {
  it("requires a genre or tag before skipping the mood question", () => {
    assert.equal(
      hasUsableSalonReviewPreference({ genres: [], tags: [] }),
      false
    );
    assert.equal(
      hasUsableSalonReviewPreference({ genres: ["romance"], tags: [] }),
      true
    );
    assert.equal(
      hasUsableSalonReviewPreference({ genres: [], tags: ["slow-burn"] }),
      true
    );
  });

  it("keeps spaced and hyphenated tag slugs without inventing new tags", () => {
    assert.deepEqual(catalogueTagSlugs(["found family", "slow-burn"]), [
      "found family",
      "found-family",
      "slow-burn",
    ]);
  });

  it("maps cosy mood to catalogue genres and tags without inventing slugs", () => {
    const cosy = moodCatalogueSlugs(["cosy"]);
    assert.deepEqual(cosy.genres, ["slice-of-life", "comedy"]);
    assert.deepEqual(cosy.tags, ["found-family", "slow-burn", "fluff"]);
  });

  it("parses Something darker into dark mood for salon narrowing", () => {
    const prefs = extractPreferencesFromMessage("Something darker");
    assert.deepEqual(prefs.mood, ["dark"]);
    const dark = moodCatalogueSlugs(prefs.mood);
    assert.deepEqual(dark.genres, ["horror"]);
    assert.deepEqual(dark.tags, ["tragedy", "angst"]);
  });

  it("requires fantasy AND cosy catalogue signals for Cozy fantasy", () => {
    const prefs = extractPreferencesFromMessage("Cozy fantasy");
    assert.deepEqual(prefs.genres, ["fantasy"]);
    assert.deepEqual(prefs.mood, ["cosy"]);

    const where = salonNovelPreferenceWhere(prefs);
    assert.ok(where);
    assert.equal("AND" in where!, true);
    const andClauses = (where as { AND: unknown[] }).AND;
    assert.equal(andClauses.length, 2);
    assert.deepEqual(andClauses[0], {
      genres: { some: { slug: { in: ["fantasy"] } } },
    });
    assert.equal("OR" in (andClauses[1] as object), true);
  });

  it("does not treat cosy fantasy as fantasy-only OR filter", () => {
    const prefs = extractPreferencesFromMessage("Cozy fantasy");
    const where = salonNovelPreferenceWhere(prefs);
    assert.notDeepEqual(where, {
      genres: { some: { slug: { in: ["fantasy"] } } },
    });
  });

  it("sanitizes spoiler-marked ranked reviews in buildAssistantMessage", () => {
    const spoilerBody = "The hero dies at the end and the villain wins.";
    const message = buildAssistantMessage({
      reply: "Here are spoiler-aware public salon reviews that match fantasy, cosy.",
      recommendations: [],
      responseKind: "reviews",
      spoilerMode: "none",
      rankedReviews: [
        {
          id: "review-spoiler-fixture",
          title: "The hero dies and everyone loses",
          excerpt: spoilerBody,
          rating: 5,
          reviewerName: "Reader",
          reviewerUsername: "reader",
          novelId: "novel-fixture",
          novelTitle: "Fixture Novel",
          containsSpoilers: true,
        },
      ],
      consumesQuota: true,
    });

    const html = renderToStaticMarkup(
      createElement(MoonieRankedReviews, {
        reviews: message.rankedReviews ?? [],
        density: "widget",
      })
    );

    assert.doesNotMatch(html, /hero dies/i);
    assert.doesNotMatch(html, /villain wins/i);
    assert.match(html, /Spoiler-marked review|open the novel page for details/i);
  });
});
