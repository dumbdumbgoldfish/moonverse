import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { db } from "@/lib/db";
import { MOONIE_WIDGET_CHIPS } from "@/lib/moonie/desk";
import {
  classifyMoonieIntents,
  primaryRetrievalIntent,
} from "@/lib/moonie/intent";
import { constraintEligiblePublicationStatus } from "@/lib/moonie/metadata-eligibility";
import {
  buildPersistedAssistantMeta,
  hydrateStoredAssistantMeta,
} from "@/lib/moonie/persist-assistant-turn";
import { shouldCiteMoreLikeThisHistory } from "@/services/moonie-pipeline.service";
import { handleMoonieRequest } from "./moonie-response.service";

const COMPARE_STARTER = MOONIE_WIDGET_CHIPS[2].prompt;
const DESK_COMPARE_STARTER = "Compare two novels from the catalogue.";
const TITLE_ONLY_ANSWER = "The Road to forever and cultivation chat gp";
const EXPLICIT_COMPARE =
  "Compare The road to forever and Cultivation Chat Group";

const LOTM_ID = "cmtdgrhdb006x3d4576i42373";
const RI_ID = "cmtdgrhbu00653d45py9jr8ts";

function assistantMeta(response: Awaited<ReturnType<typeof handleMoonieRequest>>) {
  return {
    compare: response.compare,
    recommendations: response.recommendations,
    responseKind: response.responseKind,
    state: response.state,
    pendingClarification: response.pendingClarification,
  };
}

async function askForCompareTitles(starter: string) {
  const ask = await handleMoonieRequest({
    message: starter,
    messages: [],
    isLoggedIn: false,
  });
  assert.equal(ask.responseKind, "compare");
  assert.equal(ask.pendingClarification?.kind, "compare_titles");
  assert.equal(ask.compare?.rows.length ?? 0, 0);
  return ask;
}

describe("compare continuation across turns", () => {
  it("consumes the exact title-only answer after the compare starter", async () => {
    const ask = await askForCompareTitles(COMPARE_STARTER);
    const follow = await handleMoonieRequest({
      message: TITLE_ONLY_ANSWER,
      messages: [
        { role: "user", content: COMPARE_STARTER },
        {
          role: "assistant",
          content: ask.reply,
          meta: assistantMeta(ask),
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(follow.responseKind, "compare");
    assert.notEqual(follow.state, "no_results");
    const ids = (follow.compare?.rows ?? []).map((row) => row.novelId);
    assert.equal(ids.length, 2);
    assert.equal(new Set(ids).size, 2);
    assert.deepEqual(
      ids,
      follow.recommendations.map((row) => row.novelId)
    );
    const titles = (follow.compare?.rows ?? []).map((row) => row.title);
    assert.ok(titles.some((title) => /road to forever/i.test(title)));
    assert.ok(titles.some((title) => /cultivation chat group/i.test(title)));
    assert.doesNotMatch(follow.reply, /couldn't verify it|cannot verify/i);
    assert.equal(follow.pendingClarification, undefined);
  });

  it("preserves the explicit Compare prefix path and the same IDs", async () => {
    const explicit = await handleMoonieRequest({
      message: EXPLICIT_COMPARE,
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(explicit.responseKind, "compare");
    const explicitIds = (explicit.compare?.rows ?? []).map((row) => row.novelId);
    assert.equal(explicitIds.length, 2);

    const ask = await askForCompareTitles(COMPARE_STARTER);
    const continued = await handleMoonieRequest({
      message: TITLE_ONLY_ANSWER,
      messages: [
        { role: "user", content: COMPARE_STARTER },
        {
          role: "assistant",
          content: ask.reply,
          meta: assistantMeta(ask),
        },
      ],
      isLoggedIn: false,
    });
    assert.deepEqual(
      new Set((continued.compare?.rows ?? []).map((row) => row.novelId)),
      new Set(explicitIds)
    );
  });

  it("keeps a partial resolve and clarifies the other title", async () => {
    const ask = await askForCompareTitles(COMPARE_STARTER);
    const follow = await handleMoonieRequest({
      message: "The Road to forever and ZzNotACatalogueTitle999",
      messages: [
        { role: "user", content: COMPARE_STARTER },
        {
          role: "assistant",
          content: ask.reply,
          meta: assistantMeta(ask),
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(follow.responseKind, "compare");
    assert.equal(follow.compare?.rows.length, 1);
    assert.match(follow.compare?.rows[0]?.title ?? "", /road to forever/i);
    assert.ok(
      (follow.compare?.unresolvedTitles ?? []).some((title) =>
        /zznotacataloguetitle999/i.test(title)
      )
    );
    assert.equal(follow.pendingClarification?.kind, "compare_titles");
    if (follow.pendingClarification?.kind !== "compare_titles") {
      throw new Error("expected compare_titles");
    }
    assert.deepEqual(follow.pendingClarification.resolvedNovelIds, [
      follow.compare!.rows[0]!.novelId,
    ]);
    assert.doesNotMatch(follow.reply, /locke lamora/i);
    assert.match(follow.reply, /name the other title|name one more/i);
  });

  it("does not blindly split a genuine title containing and", async () => {
    const andTitle = await db.novel.findFirst({
      where: {
        title: { contains: " and ", mode: "insensitive" },
        NOT: {
          title: { contains: "road to forever", mode: "insensitive" },
        },
      },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
    if (!andTitle) {
      return;
    }

    const ask = await askForCompareTitles(COMPARE_STARTER);
    const follow = await handleMoonieRequest({
      message: andTitle.title,
      messages: [
        { role: "user", content: COMPARE_STARTER },
        {
          role: "assistant",
          content: ask.reply,
          meta: assistantMeta(ask),
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(follow.responseKind, "compare");
    assert.ok((follow.compare?.rows.length ?? 0) <= 1);
    if ((follow.compare?.rows.length ?? 0) === 1) {
      assert.equal(follow.compare?.rows[0]?.novelId, andTitle.id);
    }
    assert.equal(follow.pendingClarification?.kind, "compare_titles");
    assert.match(follow.reply, /name (?:the other|one more|two or three)/i);
  });

  it("isolates pending compare from a new empty chat", async () => {
    const ask = await askForCompareTitles(COMPARE_STARTER);
    assert.equal(ask.pendingClarification?.kind, "compare_titles");

    const isolated = await handleMoonieRequest({
      message: TITLE_ONLY_ANSWER,
      messages: [],
      isLoggedIn: false,
    });
    assert.notEqual(isolated.responseKind, "compare");
    assert.equal(isolated.compare, undefined);
    const isolatedIntents = classifyMoonieIntents(TITLE_ONLY_ANSWER, {});
    assert.equal(primaryRetrievalIntent(isolatedIntents), "FIND_NOVEL");
  });

  it("matches widget and desk starter payloads for the same follow-up IDs", async () => {
    const widgetAsk = await askForCompareTitles(COMPARE_STARTER);
    const deskAsk = await askForCompareTitles(DESK_COMPARE_STARTER);

    const widgetFollow = await handleMoonieRequest({
      message: TITLE_ONLY_ANSWER,
      messages: [
        { role: "user", content: COMPARE_STARTER },
        {
          role: "assistant",
          content: widgetAsk.reply,
          meta: assistantMeta(widgetAsk),
        },
      ],
      isLoggedIn: false,
    });
    const deskFollow = await handleMoonieRequest({
      message: TITLE_ONLY_ANSWER,
      messages: [
        { role: "user", content: DESK_COMPARE_STARTER },
        {
          role: "assistant",
          content: deskAsk.reply,
          meta: assistantMeta(deskAsk),
        },
      ],
      isLoggedIn: false,
    });

    assert.equal(widgetFollow.responseKind, "compare");
    assert.equal(deskFollow.responseKind, "compare");
    assert.deepEqual(
      (widgetFollow.compare?.rows ?? []).map((row) => row.novelId),
      (deskFollow.compare?.rows ?? []).map((row) => row.novelId)
    );
    assert.equal((widgetFollow.compare?.rows ?? []).length, 2);
  });

  it("restores pending compare from persisted meta on reopen", async () => {
    const ask = await askForCompareTitles(COMPARE_STARTER);
    const persisted = buildPersistedAssistantMeta(ask);
    const hydrated = hydrateStoredAssistantMeta(
      persisted as Record<string, unknown>
    );
    assert.equal(hydrated.pendingClarification?.kind, "compare_titles");

    const follow = await handleMoonieRequest({
      message: TITLE_ONLY_ANSWER,
      messages: [
        { role: "user", content: COMPARE_STARTER },
        {
          role: "assistant",
          content: ask.reply,
          meta: persisted,
        },
      ],
      isLoggedIn: false,
    });
    assert.equal(follow.responseKind, "compare");
    assert.equal((follow.compare?.rows ?? []).length, 2);
  });

  it("applies the same eligible status on reading-link and compare payloads", async () => {
    const lookup = await handleMoonieRequest({
      message: "Where can I read The road to forever?",
      messages: [],
      isLoggedIn: false,
    });
    const compared = await handleMoonieRequest({
      message: EXPLICIT_COMPARE,
      messages: [],
      isLoggedIn: false,
    });

    const lookupRec = lookup.recommendations[0];
    const compareRow = (compared.compare?.rows ?? []).find((row) =>
      /road to forever/i.test(row.title)
    );
    if (!lookupRec || !compareRow) {
      return;
    }

    assert.equal(lookupRec.novelId, compareRow.novelId);
    const novel = await db.novel.findUnique({
      where: { id: compareRow.novelId },
      select: {
        metadataSource: true,
        publicationStatus: true,
        genres: { select: { name: true } },
        tags: { select: { name: true } },
      },
    });
    assert.ok(novel);
    const eligible = constraintEligiblePublicationStatus(
      novel.metadataSource,
      novel.publicationStatus,
      novel.genres.map((genre) => genre.name),
      novel.tags.map((tag) => tag.name)
    );
    assert.equal(lookupRec.publicationStatus, eligible);
    assert.equal(compareRow.publicationStatus, eligible);
    assert.equal(
      compared.recommendations.find((row) => row.novelId === compareRow.novelId)
        ?.publicationStatus,
      eligible
    );
  });

  it("does not cite stale more-like history on generic discovery copy", () => {
    assert.equal(shouldCiteMoreLikeThisHistory(undefined), false);
    assert.equal(shouldCiteMoreLikeThisHistory(""), false);
    assert.equal(shouldCiteMoreLikeThisHistory("novel-seed"), true);
  });

  it("preserves the already-working suggested LoTM / RI IDs", async () => {
    const suggested = await handleMoonieRequest({
      message: "Compare Lord of the Mysteries and Reverend Insanity.",
      messages: [],
      isLoggedIn: false,
    });
    if ((suggested.compare?.rows.length ?? 0) < 2) {
      return;
    }
    const ids = new Set(
      (suggested.compare?.rows ?? []).map((row) => row.novelId)
    );
    assert.ok(ids.has(LOTM_ID));
    assert.ok(ids.has(RI_ID));
  });
});
