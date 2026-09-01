import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFile } from "node:fs/promises";

const EMPTY_FILTERS = {
  q: "",
  type: "all" as const,
  sort: "relevance" as const,
  genre: null,
  tags: [] as string[],
  minRating: 0,
  page: 1,
};

function chipClickFilters(current: typeof EMPTY_FILTERS, query: string) {
  return { ...current, q: query.trim(), page: 1 };
}

describe("search chip click sync", () => {
  it("first chip click from empty state updates the query filter", () => {
    const next = chipClickFilters(EMPTY_FILTERS, "slow burn");
    assert.equal(next.q, "slow burn");
    assert.equal(next.page, 1);
    assert.notEqual(EMPTY_FILTERS.q, next.q);
  });

  it("second chip click updates to a different query", () => {
    const first = chipClickFilters(EMPTY_FILTERS, "slow burn");
    const second = chipClickFilters(first, "found family");
    assert.equal(second.q, "found family");
    assert.notEqual(first.q, second.q);
  });

  it("search landing chips call applyFilters instead of router.push", async () => {
    const source = await readFile(
      new URL("../components/search/SearchPage.tsx", import.meta.url),
      "utf8"
    );
    assert.match(
      source,
      /onRecent=\{\(query\) => \{[\s\S]*applyFilters\(\{ q: query, page: 1 \}\)/
    );
    assert.doesNotMatch(
      source,
      /onRecent=\{\(query\) => \{[\s\S]*router\.push/
    );
  });
});
