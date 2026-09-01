import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMoonieShelfPrompt } from "@/lib/discover";
import {
  buildCurrentTurnHardConstraints,
  hasHardInclusionConstraints,
} from "@/lib/moonie/hard-constraints";
import {
  classifyMoonieIntents,
  extractNovelQuery,
  primaryRetrievalIntent,
} from "@/lib/moonie/intent";
import {
  parseSimilarityRequest,
  similarityPreferenceSource,
} from "@/lib/moonie/similarity-request";
import { resolveExactLookupNovelIds } from "@/services/moonie-identification.service";
import { handleMoonieRequest } from "./moonie-response.service";
import { db } from "@/lib/db";

const QUEEN_OF_SHADOWS_ID = "cmtdgrhll00bt3d45vtrzu7j8";
const TAGGART_WOMAN_ID = "cmtdgrhu300h73d45r3nkz0ha";

const S1_MESSAGE =
  "Find novels like Queen of Shadows with beginner friendly vibes, but easier on the angst.";
const S2_MESSAGE =
  "Recommend novels like Taggart's Woman with verified reading links";

describe("similarity screenshot acceptance (fixture / DB)", () => {
  it("S1: resolves seed ID, excludes seed, and ranks beginner-friendly signal", async () => {
    const parsed = parseSimilarityRequest(S1_MESSAGE);
    assert.ok(parsed);
    assert.equal(parsed!.seedTitle, "Queen of Shadows");

    const seedIds = await resolveExactLookupNovelIds(parsed!.seedTitle);
    assert.deepEqual(seedIds, [QUEEN_OF_SHADOWS_ID]);

    const intents = classifyMoonieIntents(S1_MESSAGE);
    assert.equal(primaryRetrievalIntent(intents), "MORE_LIKE_THIS");
    assert.equal(extractNovelQuery(S1_MESSAGE), null);

    const prefSource = similarityPreferenceSource(parsed!);
    assert.match(prefSource, /beginner friendly/i);
    assert.match(prefSource, /angst/i);

    const response = await handleMoonieRequest({
      message: S1_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });

    assert.equal(response.responseKind, "recommendations");
    assert.ok(response.recommendations.length > 0);
    assert.equal(
      response.recommendations.some((rec) => rec.novelId === QUEEN_OF_SHADOWS_ID),
      false,
      "seed novel must not appear in similarity slate"
    );
    assert.doesNotMatch(response.reply, /couldn't verify.*s like Queen/i);

    const beginnerSignal = response.recommendations.some(
      (rec) =>
        rec.tags?.some((tag) => /beginner/i.test(tag)) ||
        /beginner|cozy|gentle|low angst|less angst/i.test(rec.reason)
    );
    assert.equal(beginnerSignal, true, "preference tail should influence ranking");
  });

  it("S2: seed without links still yields verified-link alternatives", async () => {
    const parsed = parseSimilarityRequest(S2_MESSAGE);
    assert.ok(parsed);
    assert.equal(parsed!.requiresVerifiedReadingLinks, true);

    const seedIds = await resolveExactLookupNovelIds(parsed!.seedTitle);
    assert.deepEqual(seedIds, [TAGGART_WOMAN_ID]);

    const approvedSeedLinks = await db.readingLink.count({
      where: {
        novelId: TAGGART_WOMAN_ID,
        active: true,
        moderationStatus: "APPROVED",
      },
    });
    assert.equal(approvedSeedLinks, 0, "fixture: seed has no approved reading link");

    const hard = buildCurrentTurnHardConstraints(S2_MESSAGE);
    assert.equal(hard.requireOfficialReadingLink, true);

    const response = await handleMoonieRequest({
      message: S2_MESSAGE,
      messages: [],
      isLoggedIn: false,
    });

    assert.doesNotMatch(
      response.reply,
      /which novel do you want a reading link for/i
    );
    assert.equal(response.responseKind, "recommendations");
    assert.ok(response.recommendations.length > 0);
    assert.equal(
      response.recommendations.some((rec) => rec.novelId === TAGGART_WOMAN_ID),
      false
    );

    for (const rec of response.recommendations) {
      assert.equal(rec.sourceStatus, "verified");
      assert.ok(rec.primaryReadUrl?.startsWith("http"), rec.title);
    }
  });

  it("S3: short why is output-format only; short novels constraint still applies", async () => {
    const shelfMessage = buildMoonieShelfPrompt({
      tagNames: [],
      novelTitles: [
        "Sovereign of the Three Realms",
        "Outlander",
        "The Housemaid Is Watching",
        "Comparative Strangers",
      ],
    });

    const shelfHard = buildCurrentTurnHardConstraints(shelfMessage);
    assert.equal(shelfHard.length, null);

    const shelfResponse = await handleMoonieRequest({
      message: shelfMessage,
      messages: [],
      isLoggedIn: false,
    });
    assert.doesNotMatch(shelfResponse.reply, /short length/i);
    assert.ok(shelfResponse.recommendations.length > 0);
    const shelfIds = [
      "Sovereign of the Three Realms",
      "Outlander",
      "The Housemaid Is Watching",
      "Comparative Strangers",
    ];
    for (const title of shelfIds) {
      const id = (await resolveExactLookupNovelIds(title))[0];
      if (id) {
        assert.equal(
          shelfResponse.recommendations.some((rec) => rec.novelId === id),
          false,
          `should not recommend on-shelf title ${title}`
        );
      }
    }

    const shortNovelHard = buildCurrentTurnHardConstraints(
      "Recommend short novels in the MoonVerse catalog"
    );
    assert.equal(shortNovelHard.length, null);
    assert.equal(
      hasHardInclusionConstraints(shortNovelHard),
      false
    );

    const shortNovelResponse = await handleMoonieRequest({
      message: "Recommend short novels in the MoonVerse catalog",
      messages: [],
      isLoggedIn: false,
    });
    assert.match(shortNovelResponse.reply, /novel-length metadata/i);
    assert.doesNotMatch(shortNovelResponse.reply, /short length/i);
  });
});
