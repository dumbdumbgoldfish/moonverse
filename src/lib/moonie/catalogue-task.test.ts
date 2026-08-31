import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveCatalogueTask,
  resolveReviewRankingMetric,
} from "./catalogue-task";

describe("catalogue task routing", () => {
  it("parses exact top-review phrases as review entities needing a ranking basis", () => {
    for (const message of ["give me top 5 reviews", "give me top 5 novel reviews"]) {
      const task = resolveCatalogueTask(message);
      assert.ok(task, message);
      assert.equal(task.kind, "top_reviews");
      assert.equal(task.entity, "reviews");
      assert.equal(task.count, 5);
      assert.equal(task.metric, null);
      assert.equal(task.needsRankingClarification, true);
      assert.equal(task.amongThese, false);
    }
  });

  it("parses the exact most-reviewed novel statistic", () => {
    const task = resolveCatalogueTask("what novel has the most reviews");
    assert.ok(task);
    assert.equal(task.kind, "most_reviewed_novel");
    assert.equal(task.entity, "novels");
    assert.equal(task.metric, "novel_review_count");
    assert.equal(task.amongThese, false);
  });

  it("only restricts scope when the user says among these", () => {
    const open = resolveCatalogueTask("what novel has the most reviews");
    const restricted = resolveCatalogueTask(
      "what novel has the most reviews among these"
    );
    assert.equal(open?.amongThese, false);
    assert.equal(restricted?.amongThese, true);
    assert.equal(restricted?.kind, "most_reviewed_novel");
  });

  it("distinguishes highest-rated novels from top reviews", () => {
    const novels = resolveCatalogueTask("give me the highest-rated novels");
    const reviews = resolveCatalogueTask("give me top 5 novel reviews");
    assert.equal(novels?.kind, "highest_rated_novels");
    assert.equal(novels?.entity, "novels");
    assert.equal(reviews?.kind, "top_reviews");
    assert.equal(reviews?.entity, "reviews");
  });

  it("routes the salon spoiler-aware review chip to review recommendations, not ranking", () => {
    const message =
      "Recommend spoiler-aware novel reviews from the MoonVerse salon that match what I might binge next.";
    const task = resolveCatalogueTask(message);
    assert.ok(task);
    assert.equal(task.kind, "salon_reviews");
    assert.equal(task.entity, "reviews");
    assert.equal(task.needsRankingClarification, false);
    assert.equal(task.amongThese, false);
  });

  it("routes For You shelf review prompts to for_you_shelf_reviews", () => {
    const task = resolveCatalogueTask(
      "Recommend novel reviews that match my For You shelves."
    );
    assert.ok(task);
    assert.equal(task.kind, "for_you_shelf_reviews");
    assert.equal(task.entity, "reviews");
  });

  it("maps ranking-basis answers", () => {
    assert.equal(resolveReviewRankingMetric("Highest rated"), "review_rating");
    assert.equal(resolveReviewRankingMetric("Most recent"), "review_recent");
    assert.equal(resolveReviewRankingMetric("Most helpful"), "review_helpful");
  });
});
