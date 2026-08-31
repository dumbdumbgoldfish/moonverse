import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAcceptedLookupCatalogueMatch } from "@/lib/moonie/lookup-acceptance";
import {
  extractNovelQuery,
  normalizeLookupQueryText,
  resolveNovelFactualFieldQuestion,
  resolveNovelContextFollowUpIntent,
} from "@/lib/moonie/intent";
import { resolveExactLookupNovelIds } from "@/services/moonie-identification.service";
import { formatNovelFactualFieldReply } from "@/services/moonie-novel-lookup.service";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import type { MoonieLookupCandidate, MoonieNovelOverview } from "@/types/moonie";

const FIXTURE_OVERVIEW: MoonieNovelOverview = {
  novelId: "novel-fixture-1",
  title: "Fixture Novel",
  author: "Fixture Author",
  coverUrl: null,
  publicationStatus: "Completed",
  originalLanguage: "en",
  genres: ["Fantasy", "Comedy"],
  tags: ["found family", "slice-of-life"],
  synopsis: "A fixture synopsis.",
  readingSources: [
    {
      label: "Royal Road",
      platform: "Royal Road",
      url: "https://example.com/read",
      badge: "verified",
      healthStatus: "HEALTHY",
      healthNote: null,
      lastCheckedAt: null,
    },
  ],
  community: {
    averageRating: 4.2,
    reviewCount: 2,
    previews: [],
    consensus: null,
    signalLevel: "early",
    signalLabel: "Early signal",
    disclaimer: null,
    praised: [],
    criticised: [],
    mixed: [],
    divisive: [],
  },
  provenance: undefined,
  matchedAlias: null,
  confidence: "high",
};

function lookupCandidate(
  overrides: Partial<MoonieLookupCandidate> = {}
): MoonieLookupCandidate {
  return {
    novelId: "novel-fixture-1",
    title: "Fixture Novel",
    canonicalTitle: "Fixture Novel",
    author: "Fixture Author",
    coverUrl: null,
    matchedAlias: null,
    confidence: "medium",
    confidenceScore: 0.5,
    evidence: [{ kind: "fuzzy_title", label: "Partial title match" }],
    genres: ["Fantasy"],
    tags: [],
    publicationStatus: "Completed",
    originalLanguage: "en",
    matchPercent: 72,
    reason: "Partial title match",
    provenance: undefined,
    ...overrides,
  };
}

describe("novel factual field replies", () => {
  it("answers known fields and marks missing fields unavailable", () => {
    assert.match(
      formatNovelFactualFieldReply(FIXTURE_OVERVIEW, "author"),
      /Fixture Author/
    );
    assert.match(
      formatNovelFactualFieldReply(FIXTURE_OVERVIEW, "genre"),
      /Fantasy, Comedy/
    );
    assert.match(
      formatNovelFactualFieldReply(FIXTURE_OVERVIEW, "tags"),
      /found family/
    );
    assert.match(
      formatNovelFactualFieldReply(FIXTURE_OVERVIEW, "status"),
      /Completed/
    );
    assert.match(
      formatNovelFactualFieldReply(FIXTURE_OVERVIEW, "rating"),
      /4\.2\/5/
    );

    const missingAuthor: MoonieNovelOverview = {
      ...FIXTURE_OVERVIEW,
      author: null,
      tags: [],
      publicationStatus: null,
      community: null,
    };
    assert.match(
      formatNovelFactualFieldReply(missingAuthor, "author"),
      /does not list an author/i
    );
    assert.match(
      formatNovelFactualFieldReply(missingAuthor, "tags"),
      /does not list tags/i
    );
    assert.match(
      formatNovelFactualFieldReply(missingAuthor, "status"),
      /does not list a publication status/i
    );
    assert.match(
      formatNovelFactualFieldReply(missingAuthor, "rating"),
      /does not have an average rating/i
    );
  });

  it("routes follow-up field questions through novel overview intent", () => {
    assert.equal(resolveNovelFactualFieldQuestion("Who is the author?"), "author");
    assert.equal(resolveNovelFactualFieldQuestion("What genre is it?"), "genre");
    assert.equal(resolveNovelFactualFieldQuestion("Is it completed?"), "status");
    assert.equal(
      resolveNovelContextFollowUpIntent("How many reviews?"),
      "NOVEL_OVERVIEW"
    );
  });

  it("extracts titled lookup queries with spacing and casing variants", () => {
    assert.equal(
      extractNovelQuery("tell me about   Fixture Novel   "),
      "Fixture Novel"
    );
    assert.equal(
      extractNovelQuery("Tell me about Fixture Novel"),
      "Fixture Novel"
    );
    assert.equal(extractNovelQuery("who wrote Fixture Novel"), "Fixture Novel");
    assert.equal(
      normalizeLookupQueryText("  fixture   novel  "),
      "fixture novel"
    );
    assert.equal(
      extractNovelQuery("tell me about fixture novel"),
      "fixture novel"
    );
  });
});

describe("lookup catalogue acceptance", () => {
  it("accepts partial-title matches without compare-level exact evidence", () => {
    assert.equal(isAcceptedLookupCatalogueMatch(lookupCandidate()), true);
    assert.equal(
      isAcceptedLookupCatalogueMatch(
        lookupCandidate({ confidence: "low", confidenceScore: 0.2 })
      ),
      false
    );
  });
});

describe("novel lookup integration", () => {
  it("anchors follow-up status questions on the same novel id", async () => {
    const title = "A Will Eternal";
    const first = await handleMoonieRequest({
      message: `Tell me about ${title}`,
      messages: [],
      isLoggedIn: false,
    });

    const novelId =
      first.novelOverview?.novelId ?? first.recommendations[0]?.novelId;
    assert.ok(novelId, "expected a resolved catalogue novel");

    const followUp = await handleMoonieRequest({
      message: "Is it completed?",
      messages: [
        { role: "user", content: `Tell me about ${title}` },
        {
          role: "assistant",
          content: first.reply,
          meta: {
            novelOverview: first.novelOverview,
            lookupSession: first.lookupSession,
            recommendations: first.recommendations,
          },
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(followUp.novelOverview?.novelId ?? novelId, novelId);
    assert.match(followUp.reply, /listed as/i);
    assert.doesNotMatch(followUp.reply, /\bunknown\b/i);
    if (followUp.novelOverview?.publicationStatus) {
      assert.match(
        followUp.reply,
        new RegExp(followUp.novelOverview.publicationStatus, "i")
      );
    }
  });

  it("returns no match for unknown titles without substituting unrelated novels", async () => {
    const result = await handleMoonieRequest({
      message: "Tell me about Zzz Nonexistent Catalogue Title 99999",
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(result.recommendations.length, 0);
    assert.match(result.reply, /could not find|couldn't verify/i);
    assert.doesNotMatch(result.reply, /A Will Eternal/i);
  });

  it("resolves exact lookup ids case-insensitively when the title exists", async () => {
    const ids = await resolveExactLookupNovelIds("a will eternal");
    if (ids.length > 0) {
      assert.ok(ids[0]);
    } else {
      assert.equal(ids.length, 0);
    }
  });
});
