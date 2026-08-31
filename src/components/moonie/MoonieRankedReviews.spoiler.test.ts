import assert from "node:assert/strict";
import { createElement } from "react";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MoonieRankedReviews } from "@/components/moonie/MoonieRankedReviews";
import { hydrateStoredAssistantMeta } from "@/lib/moonie/persist-assistant-turn";

describe("MoonieRankedReviews spoiler rendering", () => {
  it("renders hydrated spoiler-safe ranked reviews without raw spoiler text", () => {
    const spoilerBody = "The hero dies at the end and the villain wins.";
    const hydrated = hydrateStoredAssistantMeta({
      spoilerMode: "none",
      rankedReviews: [
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
      ],
      responseKind: "reviews",
    });

    const reviews = hydrated.rankedReviews ?? [];
    const html = renderToStaticMarkup(
      createElement(MoonieRankedReviews, { reviews, density: "desk" })
    );

    assert.doesNotMatch(html, /hero dies/i);
    assert.doesNotMatch(html, /villain wins/i);
    assert.match(html, /Spoiler-marked review|open the novel page for details/i);
  });
});
