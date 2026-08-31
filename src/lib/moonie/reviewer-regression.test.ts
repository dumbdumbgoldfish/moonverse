import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyMoonieIntents,
  primaryRetrievalIntent,
  isBareCatalogueTitleQuery,
} from "@/lib/moonie/intent";
import {
  demoReviewerRankingSession,
} from "@/lib/moonie/demo-acceptance-fixtures";
import {
  isReviewerAuthoredReviewsMessage,
  isReviewerListRequest,
  isReviewerOrdinalQuestion,
  resolveReviewerOrdinalFromMessage,
} from "@/lib/moonie/reviewer-intent";
import {
  buildMoonieReviewerGroupOverviewResponse,
  buildMoonieReviewerOverviewResponse,
} from "@/services/moonie-reviewer.service";
import { handleMoonieRequest } from "@/services/moonie-response.service";

function assistantMeta(response: Awaited<ReturnType<typeof handleMoonieRequest>>) {
  return {
    reviewerResults: response.reviewerResults,
    reviewerSession: response.reviewerSession,
    reviewerOverview: response.reviewerOverview,
    reviewerGroupOverview: response.reviewerGroupOverview,
    reviewerReviewSession: response.reviewerReviewSession,
  };
}

describe("reviewer multi-turn sequences", () => {
  it("ranking → top 1 → top 10 list → their information preserves list membership", async () => {
    const ranking = await handleMoonieRequest({
      message: "recommend top 5 reviewer",
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(ranking.reviewerResults?.length, 5);
    const rankMeta = assistantMeta(ranking);
    const first = ranking.reviewerResults![0]!;

    const top1 = await handleMoonieRequest({
      message: "which reviewer is top 1",
      messages: [
        { role: "user", content: "recommend top 5 reviewer" },
        { role: "assistant", content: ranking.reply, meta: rankMeta },
      ],
      isLoggedIn: false,
    });
    assert.equal(top1.reviewerOverview?.username, first.username);
    assert.equal(top1.reviewerOverview?.reviewCount, first.reviewCount);

    const top10 = await handleMoonieRequest({
      message: "top 10",
      messages: [
        { role: "user", content: "recommend top 5 reviewer" },
        { role: "assistant", content: ranking.reply, meta: rankMeta },
      ],
      isLoggedIn: false,
    });
    assert.equal(top10.reviewerResults?.length, 10);

    const session10 = demoReviewerRankingSession(10);
    const details = await buildMoonieReviewerOverviewResponse({
      message: "give me their information",
      reviewerSession: session10,
    });
    assert.equal(details.reviewerGroupOverview?.reviewers.length, 10);
    assert.equal(
      details.reviewerGroupOverview?.reviewers[0]?.username,
      session10.reviewers[0]?.username
    );
  });

  it("10th reviewer selects one profile from the preceding ranking", async () => {
    const ranking = await handleMoonieRequest({
      message: "recommend top 10 reviewer",
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(ranking.reviewerResults?.length, 10);
    const tenth = ranking.reviewerResults![9]!;
    const rankMeta = assistantMeta(ranking);

    const pick = await handleMoonieRequest({
      message: "who is the 10th reviewer from that list",
      messages: [
        { role: "user", content: "recommend top 10 reviewer" },
        { role: "assistant", content: ranking.reply, meta: rankMeta },
      ],
      isLoggedIn: false,
    });
    assert.equal(pick.reviewerOverview?.username, tenth.username);
    assert.equal(pick.reviewerGroupOverview, undefined);
  });

  it("returns paginated public reviews for @mirascroll70 phrasing", async () => {
    const response = await handleMoonieRequest({
      message: "give me all of @mirascroll70 reviews",
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(response.reviewerOverview?.username, "mirascroll70");
    assert.ok((response.reviewerReviewSession?.reviews.length ?? 0) > 0);
    assert.match(response.reply, /\d+ of \d+ public reviews/i);
    assert.doesNotMatch(response.reply, /novel discovery on MoonVerse/i);
  });
});

describe("reviewer intent regression (screenshot failures)", () => {
  it("routes which reviewer is top 1 to reviewer overview, not catalogue chat", () => {
    for (const message of ["which reviewer is top 1", "which reviwer is top 1"]) {
      const intents = classifyMoonieIntents(message, {
        hasPriorReviewerResults: true,
      });
      assert.equal(primaryRetrievalIntent(intents), "REVIEWER_OVERVIEW", message);
      assert.equal(intents.includes("FIND_NOVEL"), false, message);
      assert.equal(isReviewerOrdinalQuestion(message), true, message);
      assert.equal(resolveReviewerOrdinalFromMessage(message), 0, message);
    }
  });

  it("distinguishes top 10 reviewer list from the 10th reviewer ordinal", () => {
    const listMessage = "give me top 10 reviewer and their information";
    assert.equal(isReviewerListRequest(listMessage), true);
    assert.equal(resolveReviewerOrdinalFromMessage(listMessage), null);
    assert.equal(primaryRetrievalIntent(classifyMoonieIntents(listMessage)), "FIND_REVIEWERS");

    const ordinalMessage = "who is the 10th reviewer from that list";
    assert.equal(isReviewerListRequest(ordinalMessage), false);
    assert.equal(resolveReviewerOrdinalFromMessage(ordinalMessage), 9);
    assert.equal(
      primaryRetrievalIntent(
        classifyMoonieIntents(ordinalMessage, { hasPriorReviewerResults: true })
      ),
      "REVIEWER_OVERVIEW"
    );
  });

  it("does not treat bare top 10 as a catalogue title lookup", () => {
    assert.equal(isBareCatalogueTitleQuery("top 10"), false);
    const intents = classifyMoonieIntents("top 10", {
      hasPriorReviewerResults: true,
    });
    assert.equal(primaryRetrievalIntent(intents), "FIND_REVIEWERS");
    assert.equal(intents.includes("FIND_NOVEL"), false);
  });

  it("routes @username review phrasing variants to authored reviews", () => {
    for (const message of [
      "give me all of @mirascroll70 reviews",
      "show me all of @mirascroll70 reviews",
    ]) {
      assert.equal(isReviewerAuthoredReviewsMessage(message), true, message);
      const intents = classifyMoonieIntents(message);
      assert.equal(primaryRetrievalIntent(intents), "REVIEWER_OVERVIEW", message);
      assert.equal(intents.includes("CHAT"), false, message);
    }
  });
});

describe("reviewer ranking follow-up with fixture session", () => {
  const session = demoReviewerRankingSession(5);

  it("resolves top 1 from the displayed ranking session, not a global fetch", async () => {
    const response = await buildMoonieReviewerOverviewResponse({
      message: "which reviewer is top 1",
      reviewerSession: session,
    });

    assert.equal(response.reviewerOverview?.username, "fixturereviewer1");
    assert.equal(response.reviewerOverview?.reviewCount, 50);
    assert.match(response.reply, /Fixture Reviewer 1/i);
    assert.doesNotMatch(response.reply, /catalogue pick|novel discovery/i);
  });

  it("labels partial group details when output is capped below session size", async () => {
    const response = await buildMoonieReviewerGroupOverviewResponse({
      session: demoReviewerRankingSession(5),
      limit: 3,
    });

    assert.equal(response.reviewerGroupOverview?.reviewers.length, 3);
    assert.match(response.reply, /3 of 5 MoonVerse reviewers from your list/i);
  });

  it("returns full list profiles when the session limit matches the ranking size", async () => {
    const response = await buildMoonieReviewerGroupOverviewResponse({
      session: demoReviewerRankingSession(10),
      limit: 10,
    });

    assert.equal(response.reviewerGroupOverview?.reviewers.length, 10);
    assert.match(response.reply, /10 MoonVerse reviewers from your list/i);
    assert.equal(response.reviewerOverview?.username, undefined);
    assert.equal(response.reviewerSession?.reviewers.length, 10);
  });
});
