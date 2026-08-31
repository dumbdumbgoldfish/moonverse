import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  constraintEligibleGenreLabels,
  constraintEligibleTagLabels,
  novelMatchesSearchGenreFacet,
} from "@/lib/moonie/metadata-eligibility";
import { labelsMatch } from "@/lib/moonie/label-match";
import { db } from "@/lib/db";
import { runSearch } from "@/services/search.service";

describe("Search and Moonie eligibility alignment", () => {
  it("excludes sprayed cultivation genre hits for literary demo rows", () => {
    const genres = ["Military", "Cultivation"];
    const tags = ["cultivation", "royal-road"];
    const eligibleGenres = constraintEligibleGenreLabels(
      "seed-catalog",
      genres,
      tags
    );
    const eligibleTags = constraintEligibleTagLabels(
      "seed-catalog",
      genres,
      tags
    );
    assert.deepEqual(eligibleGenres, ["Military"]);
    assert.ok(!eligibleTags.some((tag) => labelsMatch(tag, "cultivation")));
  });

  it("keeps curated xianxia lanes when translated-cn evidence exists", () => {
    const genres = ["Xianxia", "Comedy"];
    const tags = ["translated-cn", "chinese-original", "cultivation"];
    assert.deepEqual(
      constraintEligibleGenreLabels("seed-catalog", genres, tags),
      genres
    );
    assert.ok(
      constraintEligibleTagLabels("seed-catalog", genres, tags).some((tag) =>
        labelsMatch(tag, "cultivation")
      )
    );
  });

  it("filters cultivation works consistently in Search genre facet", async () => {
    const result = await runSearch({
      query: "",
      type: "works",
      genreSlug: "cultivation",
      limit: 12,
    });
    for (const work of result.works) {
      const novel = await db.novel.findUnique({
        where: { id: work.id },
        include: { genres: true },
      });
      assert.ok(novel);
      assert.ok(
        novelMatchesSearchGenreFacet(
          novel.metadataSource,
          novel.genres,
          "cultivation"
        ),
        `${work.title} should not appear as cultivation without eligible genre evidence`
      );
    }
  });
});
