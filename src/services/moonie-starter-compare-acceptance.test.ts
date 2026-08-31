import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { db } from "@/lib/db";
import {
  MOONIE_WIDGET_CHIPS,
  isMoonieGenericDiscoveryPrompt,
} from "@/lib/moonie/desk";
import {
  classifyMoonieIntents,
  extractCompareTitles,
  extractNovelQuery,
  isBareReadingLinkRequest,
  primaryRetrievalIntent,
} from "@/lib/moonie/intent";
import { constraintEligiblePublicationStatus } from "@/lib/moonie/metadata-eligibility";
import { buildCompareWidgetSummary } from "@/lib/moonie/compare-widget-summary";
import { handleMoonieRequest } from "./moonie-response.service";

const FIND_NOVEL_PAYLOADS = [
  MOONIE_WIDGET_CHIPS[0].prompt,
  "Help me find a novel.",
  "Find a novel",
] as const;

const WHERE_TO_READ_PAYLOADS = [
  MOONIE_WIDGET_CHIPS[1].prompt,
  "Where can I read it?",
] as const;

const COMPARE_STARTER = MOONIE_WIDGET_CHIPS[2].prompt;
const SUGGESTED_COMPARE =
  "Compare Lord of the Mysteries and Reverend Insanity.";

describe("widget and desk starter routing", () => {
  for (const message of FIND_NOVEL_PAYLOADS) {
    it(`routes "${message}" to discovery, not title lookup`, async () => {
      assert.equal(isMoonieGenericDiscoveryPrompt(message), true);
      assert.equal(extractNovelQuery(message), null);
      const intents = classifyMoonieIntents(message, {});
      assert.equal(primaryRetrievalIntent(intents), "RECOMMEND");
      assert.equal(intents.includes("FIND_NOVEL"), false);

      const response = await handleMoonieRequest({
        message,
        messages: [],
        isLoggedIn: false,
      });

      assert.notEqual(response.responseKind, "novel_bundle");
      assert.equal(response.lookupSession, undefined);
      assert.doesNotMatch(response.reply, /couldn't verify/i);
      assert.doesNotMatch(
        response.reply,
        /couldn't verify ["“].*catalogue["”]/i
      );
      assert.notEqual(response.state, "no_results");
    });
  }

  for (const message of WHERE_TO_READ_PAYLOADS) {
    it(`asks which novel for "${message}" without catalogue search`, async () => {
      assert.equal(extractNovelQuery(message), null);
      assert.equal(isBareReadingLinkRequest(message), true);
      const intents = classifyMoonieIntents(message, {});
      assert.equal(primaryRetrievalIntent(intents), "FIND_READING_SOURCE");

      const response = await handleMoonieRequest({
        message,
        messages: [],
        isLoggedIn: false,
      });

      assert.equal(response.responseKind, "chat");
      assert.equal(response.recommendations.length, 0);
      assert.equal(response.lookupSession, undefined);
      assert.match(response.reply, /which novel/i);
      assert.doesNotMatch(response.reply, /crimson ember|luminous covenant/i);
      assert.doesNotMatch(response.reply, /couldn't verify/i);
    });
  }

  it("uses a single confirmed conversation novel for Where can I read it?", async () => {
    const lookup = await handleMoonieRequest({
      message: "Where can I read Lord of the Mysteries?",
      messages: [],
      isLoggedIn: false,
    });

    if (lookup.recommendations.length !== 1) {
      assert.match(lookup.reply, /which one|could not find|couldn't verify/i);
      return;
    }

    const targetId = lookup.recommendations[0]!.novelId;
    const followUp = await handleMoonieRequest({
      message: "Where can I read it?",
      messages: [
        { role: "user", content: "Where can I read Lord of the Mysteries?" },
        {
          role: "assistant",
          content: lookup.reply,
          meta: {
            recommendations: lookup.recommendations,
            lookupSession: lookup.lookupSession,
            novelOverview: lookup.novelOverview,
            responseKind: lookup.responseKind,
          },
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(followUp.recommendations[0]?.novelId, targetId);
    assert.doesNotMatch(followUp.reply, /which novel do you want a reading link/i);
  });

  it("does not treat a two-title compare as an unambiguous reading-link target", async () => {
    const ask = await handleMoonieRequest({
      message: COMPARE_STARTER,
      messages: [],
      isLoggedIn: false,
    });
    const compared = await handleMoonieRequest({
      message: SUGGESTED_COMPARE,
      messages: [
        { role: "user", content: COMPARE_STARTER },
        {
          role: "assistant",
          content: ask.reply,
          meta: {
            compare: ask.compare,
            responseKind: "compare",
          },
        },
      ],
      isLoggedIn: false,
    });

    if ((compared.compare?.rows.length ?? 0) < 2) {
      return;
    }

    const followUp = await handleMoonieRequest({
      message: "Where can I read it?",
      messages: [
        { role: "user", content: COMPARE_STARTER },
        {
          role: "assistant",
          content: ask.reply,
          meta: { compare: ask.compare, responseKind: "compare" },
        },
        { role: "user", content: SUGGESTED_COMPARE },
        {
          role: "assistant",
          content: compared.reply,
          meta: {
            compare: compared.compare,
            recommendations: compared.recommendations,
            responseKind: "compare",
          },
        },
      ],
      isLoggedIn: false,
    });

    assert.match(followUp.reply, /which novel/i);
    assert.equal(followUp.recommendations.length, 0);
  });
});

describe("compare starter and suggested titles", () => {
  it("asks for titles without a no-results panel", async () => {
    const intents = classifyMoonieIntents(COMPARE_STARTER, {});
    assert.equal(primaryRetrievalIntent(intents), "COMPARE");
    assert.deepEqual(extractCompareTitles(COMPARE_STARTER), []);

    const response = await handleMoonieRequest({
      message: COMPARE_STARTER,
      messages: [],
      isLoggedIn: false,
    });

    assert.equal(response.responseKind, "compare");
    assert.equal(response.compare?.rows.length ?? 0, 0);
    assert.equal(response.recommendations.length, 0);
    assert.notEqual(response.state, "no_results");
    assert.equal(response.emptyReason, undefined);
    assert.match(response.reply, /name two or three novels/i);
    assert.doesNotMatch(response.reply, /nothing in the catalogue matches/i);
    assert.match(response.reply, /Lord of the Mysteries and Reverend Insanity/i);
  });

  it("resolves the suggested compare without substituting Locke Lamora", async () => {
    const ask = await handleMoonieRequest({
      message: COMPARE_STARTER,
      messages: [],
      isLoggedIn: false,
    });

    const suggested = await handleMoonieRequest({
      message: SUGGESTED_COMPARE,
      messages: [
        { role: "user", content: COMPARE_STARTER },
        {
          role: "assistant",
          content: ask.reply,
          meta: {
            compare: ask.compare,
            responseKind: "compare",
            state: ask.state,
            emptyReason: ask.emptyReason,
          },
        },
      ],
      isLoggedIn: false,
    });

    const titles = [
      ...(suggested.compare?.rows ?? []).map((row) => row.title),
      ...suggested.recommendations.map((row) => row.title),
    ];
    for (const title of titles) {
      assert.doesNotMatch(title, /locke lamora/i);
    }
    assert.doesNotMatch(suggested.reply, /locke lamora/i);
    assert.notEqual(suggested.state, "no_results");

    const rowIds = (suggested.compare?.rows ?? []).map((row) => row.novelId);
    const recIds = suggested.recommendations.map((row) => row.novelId);
    assert.deepEqual(rowIds, recIds);

    const widget = buildCompareWidgetSummary(suggested.compare?.rows ?? []);
    if (suggested.compare && suggested.compare.rows.length >= 2) {
      assert.ok(widget);
      assert.equal(
        widget.titleLine,
        suggested.compare.rows.map((row) => row.title).join(" vs ")
      );
      assert.ok(
        suggested.compare.rows.some((row) =>
          /lord of the mysteries/i.test(row.title)
        )
      );
      assert.ok(
        suggested.compare.rows.some((row) =>
          /reverend insanity/i.test(row.title)
        )
      );
    } else {
      assert.match(suggested.reply, /could(?:n't| not) verify/i);
      assert.ok((suggested.compare?.unresolvedTitles?.length ?? 0) > 0);
      assert.ok(
        !(suggested.compare?.unresolvedTitles ?? []).some((title) =>
          /locke lamora/i.test(title)
        )
      );
    }

    if (rowIds.length > 0) {
      const novels = await db.novel.findMany({
        where: { id: { in: rowIds } },
        select: {
          id: true,
          metadataSource: true,
          publicationStatus: true,
          genres: { select: { name: true } },
          tags: { select: { name: true } },
        },
      });
      const byId = new Map(novels.map((novel) => [novel.id, novel]));
      for (const row of suggested.compare?.rows ?? []) {
        const novel = byId.get(row.novelId);
        assert.ok(novel, row.novelId);
        const eligible = constraintEligiblePublicationStatus(
          novel.metadataSource,
          novel.publicationStatus,
          novel.genres.map((genre) => genre.name),
          novel.tags.map((tag) => tag.name)
        );
        assert.equal(row.publicationStatus, eligible);
        const card = suggested.recommendations.find(
          (item) => item.novelId === row.novelId
        );
        assert.equal(card?.publicationStatus, eligible);
      }
    }

    assert.doesNotMatch(suggested.reply, /\*\*/);
    assert.doesNotMatch(suggested.compare?.conclusion ?? "", /\*\*/);
  });
});
