import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { novelMatchesHardConstraints } from "@/lib/moonie/hard-constraints";
import {
  constraintEligibleAfterFieldRemoval,
  constraintEligibleGenreLabels,
  constraintEligiblePublicationStatus,
  constraintEligibleTagLabels,
  hasCuratedWebNovelOriginEvidence,
  novelForHardConstraintCheck,
} from "@/lib/moonie/metadata-eligibility";
import {
  buildMetadataRepairPlan,
  validateRepairPlanAgainstCurrent,
} from "@/lib/moonie/metadata-repair";

const SEED = "seed-catalog";

describe("metadata eligibility", () => {
  it("does not treat missing metadataSource as contaminated", () => {
    assert.deepEqual(
      constraintEligibleGenreLabels(null, ["Fantasy", "Cultivation"], []),
      ["Fantasy", "Cultivation"]
    );
    assert.equal(
      constraintEligiblePublicationStatus(null, "Completed", ["Fantasy"], []),
      "Completed"
    );
  });

  it("strips unsupported cultivation from literary Open Library rows", () => {
    assert.deepEqual(
      constraintEligibleGenreLabels(SEED, ["Military", "Cultivation"], []),
      ["Military"]
    );
    assert.deepEqual(
      constraintEligibleTagLabels(SEED, ["Military", "Cultivation"], ["cultivation"]),
      []
    );
  });

  it("keeps curated translated-cn progression lanes (A Will Eternal pattern)", () => {
    const tags = ["translated-cn", "chinese-original", "cultivation"];
    assert.equal(hasCuratedWebNovelOriginEvidence(tags), true);
    assert.deepEqual(
      constraintEligibleGenreLabels(SEED, ["Xianxia", "Comedy"], tags),
      ["Xianxia", "Comedy"]
    );
    assert.deepEqual(
      constraintEligibleTagLabels(SEED, ["Xianxia", "Comedy"], tags),
      tags
    );
  });

  it("keeps Cultivation Chat Group comedy + xianxia with translated-cn evidence", () => {
    const tags = ["translated-cn", "chinese-original", "cultivation"];
    assert.deepEqual(
      constraintEligibleGenreLabels(SEED, ["Comedy", "Xianxia"], tags),
      ["Comedy", "Xianxia"]
    );
    assert.deepEqual(
      constraintEligibleTagLabels(SEED, ["Comedy", "Xianxia"], tags),
      tags
    );
  });

  it("does not let royal-road alone establish progression on low-trust rows", () => {
    assert.equal(hasCuratedWebNovelOriginEvidence(["royal-road"]), false);
    assert.deepEqual(
      constraintEligibleGenreLabels(SEED, ["Military", "Cultivation"], ["royal-road"]),
      ["Military"]
    );
    assert.equal(
      constraintEligiblePublicationStatus(
        SEED,
        "Completed",
        ["Romance"],
        ["royal-road"]
      ),
      "Completed"
    );
  });

  it("uses explicit publication status on low-trust rows when defined", () => {
    assert.equal(
      constraintEligiblePublicationStatus(
        SEED,
        "Completed",
        ["Xianxia"],
        ["translated-cn", "chinese-original"]
      ),
      "Completed"
    );
    assert.equal(
      constraintEligiblePublicationStatus("verified-catalog", "Completed"),
      "Completed"
    );
    assert.equal(constraintEligiblePublicationStatus(SEED, null), null);
    assert.equal(constraintEligiblePublicationStatus(SEED, "Unknown"), null);
  });

  it("preserves length and language fields through novelForHardConstraintCheck", () => {
    const adjusted = novelForHardConstraintCheck({
      metadataSource: SEED,
      genres: ["Romance"],
      tags: ["slice-of-life"],
      publicationStatus: "Completed",
      originalLanguage: "en",
      lengthBand: "short",
      chapterCount: 40,
    });
    assert.equal(adjusted.originalLanguage, "en");
    assert.equal(adjusted.lengthBand, "short");
    assert.equal(adjusted.chapterCount, 40);
    assert.equal(adjusted.publicationStatus, "Completed");
  });

  it("rejects low-trust rows with unknown status for completed hard constraints", () => {
    assert.equal(
      novelMatchesHardConstraints(
        {
          genres: ["Romance"],
          tags: ["slice-of-life"],
          publicationStatus: null,
          metadataSource: SEED,
          originalLanguage: "en",
          lengthBand: "short",
          chapterCount: 40,
        },
        {
          genres: [],
          tags: ["slice-of-life"],
          inclusionMatch: "all",
          genreMatch: "all",
          status: "completed",
          language: "en",
          length: "short",
        }
      ),
      false
    );
  });

  it("accepts low-trust rows with explicit Completed for completed hard constraints", () => {
    assert.equal(
      novelMatchesHardConstraints(
        {
          genres: ["Romance"],
          tags: ["slice-of-life"],
          publicationStatus: "Completed",
          metadataSource: SEED,
          originalLanguage: "en",
          lengthBand: "short",
          chapterCount: 40,
        },
        {
          genres: [],
          tags: ["slice-of-life"],
          inclusionMatch: "all",
          genreMatch: "all",
          status: "completed",
          language: "en",
          length: "short",
        }
      ),
      true
    );
  });

  it("accepts null metadataSource rows with explicit Completed for completed hard constraints", () => {
    assert.equal(
      novelMatchesHardConstraints(
        {
          genres: ["Romance"],
          tags: ["slice-of-life"],
          publicationStatus: "Completed",
          metadataSource: null,
          originalLanguage: "en",
          lengthBand: "short",
          chapterCount: 40,
        },
        {
          genres: [],
          tags: ["slice-of-life"],
          inclusionMatch: "all",
          genreMatch: "all",
          status: "completed",
          language: "en",
          length: "short",
        }
      ),
      true
    );
  });
});

describe("metadata repair plan", () => {
  it("removes unsupported progression tags when genres are disconnected (Catch-22 simulation)", () => {
    const catch22 = {
      novelId: "catch-22",
      title: "Catch-22",
      author: "Joseph Heller",
      metadataSource: SEED,
      publicationStatus: "Completed",
      genres: [
        { id: "g-mil", slug: "military", name: "Military" },
        { id: "g-cul", slug: "cultivation", name: "Cultivation" },
      ],
      tags: [
        { id: "t-cul", slug: "cultivation", name: "Cultivation" },
        { id: "t-rr", slug: "royal-road", name: "Royal Road" },
      ],
    };

    const plan = buildMetadataRepairPlan([catch22]);
    const record = plan.records[0];
    assert.ok(record);
    assert.deepEqual(record.changes.removeGenreNames, ["Cultivation"]);
    assert.deepEqual(record.changes.removeTagNames, ["Cultivation"]);
    assert.equal(record.changes.clearPublicationStatus, false);
    assert.equal(record.after.publicationStatus, "Completed");

    const post = constraintEligibleAfterFieldRemoval(
      SEED,
      record.after.genres.map((g) => g.name),
      record.after.tags.map((t) => t.name),
      record.after.publicationStatus
    );
    assert.deepEqual(post.genres, ["Military"]);
    assert.deepEqual(post.tags, ["Royal Road"]);
    assert.equal(post.publicationStatus, "Completed");
    assert.equal(
      post.tags.some((tag) => /cultivation/i.test(tag)),
      false
    );
  });

  it("does not plan removal or status clear for A Will Eternal", () => {
    const plan = buildMetadataRepairPlan([
      {
        novelId: "awe",
        title: "A Will Eternal",
        author: "Er Gen",
        metadataSource: SEED,
        publicationStatus: "Completed",
        genres: [
          { id: "g1", slug: "xianxia", name: "Xianxia" },
          { id: "g2", slug: "comedy", name: "Comedy" },
        ],
        tags: [
          { id: "t1", slug: "translated-cn", name: "Translated CN" },
          { id: "t2", slug: "chinese-original", name: "Chinese Original" },
          { id: "t3", slug: "cultivation", name: "Cultivation" },
        ],
      },
    ]);
    assert.equal(plan.candidateCount, 0);
    assert.equal(plan.statusClearCount, 0);
  });

  it("aborts apply validation when before-values drift", () => {
    const catch22 = {
      novelId: "catch-22",
      title: "Catch-22",
      author: "Joseph Heller",
      metadataSource: SEED,
      publicationStatus: "Completed",
      genres: [
        { id: "g-mil", slug: "military", name: "Military" },
        { id: "g-cul", slug: "cultivation", name: "Cultivation" },
      ],
      tags: [
        { id: "t-cul", slug: "cultivation", name: "Cultivation" },
        { id: "t-rr", slug: "royal-road", name: "Royal Road" },
      ],
    };
    const plan = buildMetadataRepairPlan([catch22]);
    const drift = validateRepairPlanAgainstCurrent(plan, [
      {
        ...catch22,
        publicationStatus: "Ongoing",
      },
    ]);
    assert.ok(drift.some((line) => line.includes("Status drift")));
  });
});
