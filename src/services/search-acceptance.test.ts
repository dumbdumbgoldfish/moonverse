import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runSearch } from "./search.service";

describe("Search acceptance paths", () => {
  it("finds novels by title keyword", async () => {
    const result = await runSearch({ query: "culpa", type: "works", limit: 5 });
    assert.ok(result.totals.works > 0);
    assert.ok(result.works.length > 0);
    assert.ok(result.works[0]?.id);
    assert.match(result.works[0]?.title ?? "", /culpa/i);
  });

  it("S01: Cultivation Chat Group is an exact hit when present, never an unrelated exact", async () => {
    const result = await runSearch({
      query: "Cultivation Chat Group",
      type: "works",
      limit: 8,
    });
    const exact = result.works.filter((work) =>
      /^cultivation chat group$/i.test(work.title.trim())
    );
    assert.equal(exact.length, 1, "exact title must be findable without a stolen cultivation facet");
    assert.match(exact[0]!.id, /^[a-z0-9]+$/i);
  });

  it("filters works by genre slug", async () => {
    const result = await runSearch({
      query: "",
      type: "works",
      genreSlug: "fantasy",
      limit: 8,
    });
    assert.ok(result.totals.works > 0);
    for (const work of result.works) {
      assert.ok(
        work.genres.some((genre) => /fantasy/i.test(genre)),
        work.title
      );
    }
  });

  it("supports combined genre and text query", async () => {
    const result = await runSearch({
      query: "romance",
      type: "works",
      genreSlug: "fantasy",
      limit: 8,
    });
    assert.ok(result.facets.genre === "fantasy");
    assert.ok(result.totals.works >= 0);
  });

  it("returns reviewer people results for username-style queries", async () => {
    const result = await runSearch({
      query: "ezraink76",
      type: "people",
      limit: 5,
    });
    if (result.totals.people > 0) {
      assert.ok(result.people.some((person) => /ezraink76/i.test(person.username)));
    }
  });

  it("filters found-family and slice-of-life independently", async () => {
    const foundFamily = await runSearch({
      query: "",
      type: "works",
      tagSlugs: ["found-family"],
      limit: 8,
    });
    const sliceOfLife = await runSearch({
      query: "",
      type: "works",
      tagSlugs: ["slice-of-life"],
      limit: 8,
    });
    assert.ok(foundFamily.totals.works > 0);
    assert.ok(sliceOfLife.totals.works > 0);
    for (const work of foundFamily.works) {
      assert.ok(
        work.tags.some((tag) => /found.?family/i.test(tag)),
        work.title
      );
    }
    for (const work of sliceOfLife.works) {
      assert.ok(
        work.tags.some((tag) => /slice.?of.?life/i.test(tag)),
        work.title
      );
    }
    const bothRequired = foundFamily.works.filter((work) =>
      work.tags.some((tag) => /slice.?of.?life/i.test(tag))
    );
    assert.ok(
      bothRequired.length < foundFamily.works.length ||
        foundFamily.totals.works !== sliceOfLife.totals.works,
      "Search tag filters must not require both tropes"
    );
  });

  it("has no completion-status facet; completed text is not a verified status filter", async () => {
    const result = await runSearch({
      query: "completed",
      type: "works",
      limit: 8,
    });
    assert.equal(result.facets.tags.includes("completed"), false);
    assert.equal("status" in result.facets, false);
  });

  it("filters works by tag slug", async () => {
    const result = await runSearch({
      query: "",
      type: "works",
      tagSlugs: ["slow-burn"],
      limit: 8,
    });
    assert.ok(result.totals.works > 0);
    assert.ok(result.facets.tags.includes("slow-burn"));
    for (const work of result.works) {
      assert.ok(
        work.tags.some((tag) => /slow.?burn/i.test(tag)),
        work.title
      );
    }
  });

  it("sorts works by highest-rated when requested", async () => {
    const result = await runSearch({
      query: "fantasy",
      type: "works",
      sort: "highest-rated",
      limit: 6,
    });
    assert.ok(result.works.length >= 2);
    for (let index = 1; index < result.works.length; index += 1) {
      const prev = result.works[index - 1]!.averageRating ?? 0;
      const next = result.works[index]!.averageRating ?? 0;
      assert.ok(prev >= next, "works should be sorted by rating descending");
    }
  });

  it("reports totals separately from returned page size", async () => {
    const result = await runSearch({
      query: "fantasy",
      type: "works",
      limit: 4,
      offset: 0,
    });
    assert.ok(result.totals.works >= result.works.length);
    if (result.totals.works > 4) {
      assert.equal(result.works.length, 4);
    }
  });

  it("supports combined genre, tag, and text filters", async () => {
    const result = await runSearch({
      query: "magic",
      type: "works",
      genreSlug: "fantasy",
      tagSlugs: ["slow-burn"],
      limit: 8,
    });
    assert.equal(result.facets.genre, "fantasy");
    assert.ok(result.facets.tags.includes("slow-burn"));
    assert.ok(result.totals.works >= 0);
  });

  it("returns review hits without requiring Moonie", async () => {
    const result = await runSearch({
      query: "fantasy",
      type: "reviews",
      limit: 5,
    });
    assert.ok(result.totals.reviews >= 0);
    if (result.reviews.length > 0) {
      assert.ok(result.reviews[0]?.id);
      assert.ok(result.reviews[0]?.novelId);
    }
  });

  it("returns catalogue novel ids for work hits suitable for navigation", async () => {
    const result = await runSearch({
      query: "fantasy",
      type: "works",
      limit: 5,
    });
    assert.ok(result.works.length > 0);
    for (const work of result.works) {
      assert.match(work.id, /^[a-z0-9]+$/i, work.title);
      assert.ok(work.title.trim().length > 0);
    }
  });

  it("paginates with offset without duplicating first page ids", async () => {
    const first = await runSearch({
      query: "fantasy",
      type: "works",
      limit: 4,
      offset: 0,
    });
    const second = await runSearch({
      query: "fantasy",
      type: "works",
      limit: 4,
      offset: 4,
    });
    if (first.works.length === 4 && second.works.length > 0) {
      const firstIds = new Set(first.works.map((work) => work.id));
      assert.ok(second.works.every((work) => !firstIds.has(work.id)));
    }
  });

  it("reports honest empty state for nonsense queries", async () => {
    const result = await runSearch({
      query: "zzzznotarealqueryacceptancefixture",
      type: "all",
      limit: 8,
    });
    assert.equal(result.totals.works, 0);
    assert.equal(result.totals.reviews, 0);
    assert.equal(result.totals.people, 0);
    assert.equal(result.works.length, 0);
  });
});
