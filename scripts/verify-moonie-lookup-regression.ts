import { PrismaClient } from "@prisma/client";
import {
  classifyMoonieIntents,
  extractNovelQuery,
  extractReviewNovelQuery,
  isNovelReviewRequest,
  isReviewFollowUpMessage,
  normalizeLookupQueryText,
  primaryRetrievalIntent,
  resolveNovelContextFollowUpIntent,
  extractDirectTitleQuery,
  isRecommendationDiscoveryMessage,
} from "@/lib/moonie/intent";
import { isExplicitTitleLookup } from "@/lib/moonie/lookup-exclusions";
import {
  identifyNovels,
  resolveExactLookupNovelIds,
} from "@/services/moonie-identification.service";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import {
  isReadingLinkRequest,
  moonieDisplayContent,
  resolveMoonieCardMode,
  resolveMoonieReplyIntent,
} from "@/lib/moonie/presentation";

type Check = { id: string; pass: boolean; detail: string };
const checks: Check[] = [];

function record(id: string, pass: boolean, detail: string) {
  checks.push({ id, pass, detail });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${id}: ${detail}`);
}

const HOB_STRAIGHT = "Heaven Official's Blessing";
const HOB_CURLY = "Heaven Official\u2019s Blessing";
const LOVES_DUEL = "Love's Duel";
const FBA = "From Blood and Ash";
const WILL_ETERNAL = "A Will Eternal";
const TWAW = "To Woo a Wife";
const GDBBM = "Genius Doctor: Black Belly Miss";

async function testReviewIntentExtraction() {
  const reviewMsg = "find all review for Love's Duel";
  const intents = classifyMoonieIntents(reviewMsg);
  record(
    "review-intent-primary",
    primaryRetrievalIntent(intents) === "NOVEL_REVIEWS",
    primaryRetrievalIntent(intents) ?? "none"
  );
  record(
    "review-title-extraction",
    extractReviewNovelQuery(reviewMsg) === LOVES_DUEL,
    String(extractReviewNovelQuery(reviewMsg))
  );
  record(
    "review-not-wrapper-in-title",
    extractNovelQuery(reviewMsg) === LOVES_DUEL,
    String(extractNovelQuery(reviewMsg))
  );
  record(
    "review-article-preserved",
    extractReviewNovelQuery("reviews for A Will Eternal") === "A Will Eternal",
    String(extractReviewNovelQuery("reviews for A Will Eternal"))
  );
  record(
    "recommend-romance-reviews-not-lookup",
    !isNovelReviewRequest("recommend me romance reviews") &&
      primaryRetrievalIntent(
        classifyMoonieIntents("recommend me romance reviews")
      ) === "RECOMMEND",
    classifyMoonieIntents("recommend me romance reviews").join(",")
  );

  const reviewLinkMsg = `give me all review link for ${FBA}`;
  const reviewLinkIntents = classifyMoonieIntents(reviewLinkMsg);
  record(
    "review-link-intent-primary",
    primaryRetrievalIntent(reviewLinkIntents) === "NOVEL_REVIEWS" &&
      !reviewLinkIntents.includes("FIND_READING_SOURCE"),
    reviewLinkIntents.join(",")
  );
  record(
    "review-link-title-extraction",
    extractReviewNovelQuery(reviewLinkMsg) === FBA,
    String(extractReviewNovelQuery(reviewLinkMsg))
  );
  record(
    "review-links-article-preserved",
    extractReviewNovelQuery(`review links for ${WILL_ETERNAL}`) === WILL_ETERNAL,
    String(extractReviewNovelQuery(`review links for ${WILL_ETERNAL}`))
  );
  record(
    "review-links-follow-up-detected",
    isReviewFollowUpMessage("give me all review links") &&
      isNovelReviewRequest("give me all review links"),
    "give me all review links"
  );
  record(
    "recommend-good-reviews-not-lookup",
    !isNovelReviewRequest("recommend me novels with good reviews") &&
      primaryRetrievalIntent(
        classifyMoonieIntents("recommend me novels with good reviews")
      ) === "RECOMMEND",
    classifyMoonieIntents("recommend me novels with good reviews").join(",")
  );

  const reviewLinkOfMsg = `send me all review link of ${TWAW}`;
  record(
    "review-link-of-title",
    extractReviewNovelQuery(reviewLinkOfMsg) === TWAW,
    String(extractReviewNovelQuery(reviewLinkOfMsg))
  );
  record(
    "review-link-of-intent",
    primaryRetrievalIntent(classifyMoonieIntents(reviewLinkOfMsg)) ===
      "NOVEL_REVIEWS",
    classifyMoonieIntents(reviewLinkOfMsg).join(",")
  );
  record(
    "reading-link-of-not-review",
    isReadingLinkRequest(`send me a link of ${TWAW}`) &&
      !isNovelReviewRequest(`send me a link of ${TWAW}`),
    "send me a link of"
  );
  record(
    "review-link-not-reading-link-request",
    !isReadingLinkRequest(reviewLinkOfMsg) &&
      isNovelReviewRequest(reviewLinkOfMsg),
    reviewLinkOfMsg
  );
  record(
    "send-review-links-follow-up",
    isReviewFollowUpMessage("send me all review links") &&
      isNovelReviewRequest("send me all review links"),
    "send me all review links"
  );
}

async function testReviewConversationSequence() {
  const linkResult = await handleMoonieRequest({
    message: "find link for Love's Duel",
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });

  record(
    "review-seq-link-setup",
    linkResult.novelOverview?.title === LOVES_DUEL,
    linkResult.novelOverview?.title ?? "none"
  );

  const priorMeta = {
    lookupSession: linkResult.lookupSession,
    novelOverview: linkResult.novelOverview,
    recommendations: linkResult.recommendations,
  };
  const priorMessages = [
    { role: "user", content: "find link for Love's Duel" },
    { role: "assistant", content: linkResult.reply, meta: priorMeta },
  ];
  const exclude = linkResult.recommendations?.map((rec) => rec.novelId) ?? [];

  const explicitReviews = await handleMoonieRequest({
    message: "find all review for Love's Duel",
    messages: priorMessages,
    isLoggedIn: true,
    excludeNovelIds: exclude,
    spoilerMode: "none",
  });
  record(
    "review-seq-a-intent-bundle",
    explicitReviews.novelOverview?.title === LOVES_DUEL &&
      explicitReviews.lookupSession?.mode === "confirmed" &&
      /MoonVerse review/.test(explicitReviews.reply) &&
      (explicitReviews.novelOverview?.community?.previews?.length ?? 0) > 0,
    `mode=${explicitReviews.lookupSession?.mode ?? "none"} previews=${explicitReviews.novelOverview?.community?.previews?.length ?? 0}`
  );
  record(
    "review-seq-a-no-clarification",
    (explicitReviews.lookupSession?.candidates?.length ?? 0) <= 1,
    `candidates=${explicitReviews.lookupSession?.candidates?.length ?? 0}`
  );

  const activeReviews = await handleMoonieRequest({
    message: "show me all reviews",
    messages: priorMessages,
    isLoggedIn: true,
    excludeNovelIds: exclude,
    spoilerMode: "none",
  });
  record(
    "review-seq-b-active-novel",
    activeReviews.novelOverview?.title === LOVES_DUEL &&
      /MoonVerse review/.test(activeReviews.reply) &&
      (activeReviews.novelOverview?.community?.previews?.length ?? 0) > 0,
    `${activeReviews.novelOverview?.title ?? "none"} previews=${activeReviews.novelOverview?.community?.previews?.length ?? 0}`
  );

  const readersThink = await handleMoonieRequest({
    message: "what do readers think about Love's Duel",
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  record(
    "review-seq-c-readers-think",
    readersThink.novelOverview?.title === LOVES_DUEL,
    readersThink.novelOverview?.title ?? "none"
  );
}

async function testReviewLinkConversationSequence() {
  const linkResult = await handleMoonieRequest({
    message: `give me novel link of ${FBA}`,
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });

  record(
    "review-link-seq-setup",
    linkResult.novelOverview?.title === FBA,
    linkResult.novelOverview?.title ?? "none"
  );

  const priorMeta = {
    lookupSession: linkResult.lookupSession,
    novelOverview: linkResult.novelOverview,
    recommendations: linkResult.recommendations,
  };
  const priorMessages = [
    { role: "user", content: `give me novel link of ${FBA}` },
    { role: "assistant", content: linkResult.reply, meta: priorMeta },
  ];
  const exclude = linkResult.recommendations?.map((rec) => rec.novelId) ?? [];

  const explicitReviews = await handleMoonieRequest({
    message: `give me all review link for ${FBA}`,
    messages: priorMessages,
    isLoggedIn: true,
    excludeNovelIds: exclude,
    spoilerMode: "none",
  });
  record(
    "review-link-seq-a-intent-bundle",
    explicitReviews.novelOverview?.title === FBA &&
      explicitReviews.lookupSession?.mode === "confirmed" &&
      /MoonVerse review/.test(explicitReviews.reply) &&
      (explicitReviews.novelOverview?.community?.previews?.length ?? 0) > 0,
    `mode=${explicitReviews.lookupSession?.mode ?? "none"} previews=${explicitReviews.novelOverview?.community?.previews?.length ?? 0}`
  );
  record(
    "review-link-seq-a-no-clarification",
    (explicitReviews.lookupSession?.candidates?.length ?? 0) <= 1,
    `candidates=${explicitReviews.lookupSession?.candidates?.length ?? 0}`
  );

  const activeReviews = await handleMoonieRequest({
    message: "give me all review links",
    messages: priorMessages,
    isLoggedIn: true,
    excludeNovelIds: exclude,
    spoilerMode: "none",
  });
  record(
    "review-link-seq-b-active-novel",
    activeReviews.novelOverview?.title === FBA &&
      /MoonVerse review/.test(activeReviews.reply) &&
      (activeReviews.novelOverview?.community?.previews?.length ?? 0) > 0,
    `${activeReviews.novelOverview?.title ?? "none"} previews=${activeReviews.novelOverview?.community?.previews?.length ?? 0}`
  );

  const articleReviews = await handleMoonieRequest({
    message: `review links for ${WILL_ETERNAL}`,
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  record(
    "review-link-seq-c-article",
    articleReviews.novelOverview?.title === WILL_ETERNAL,
    articleReviews.novelOverview?.title ?? "none"
  );
}

async function testToWooAWifeReviewSequence() {
  const linkResult = await handleMoonieRequest({
    message: `send me a novel link of ${TWAW}`,
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });

  record(
    "twaw-link-setup",
    linkResult.novelOverview?.title === TWAW &&
      linkResult.analyticsIntent === "reading_source",
    `${linkResult.novelOverview?.title ?? "none"} intent=${linkResult.analyticsIntent ?? "none"}`
  );

  const priorMeta = {
    lookupSession: linkResult.lookupSession,
    novelOverview: linkResult.novelOverview,
    recommendations: linkResult.recommendations,
  };
  const priorMessages = [
    { role: "user", content: `send me a novel link of ${TWAW}` },
    { role: "assistant", content: linkResult.reply, meta: priorMeta },
  ];

  const reviewMsg = `send me all review link of ${TWAW}`;
  const reviewResult = await handleMoonieRequest({
    message: reviewMsg,
    messages: priorMessages,
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });

  const previewCount =
    reviewResult.novelOverview?.community?.previews?.length ?? 0;
  const reviewCount = reviewResult.novelOverview?.community?.reviewCount ?? 0;

  record(
    "twaw-seq-a-reviews",
    reviewResult.analyticsIntent === "novel_reviews" &&
      reviewResult.novelOverview?.title === TWAW &&
      reviewCount > 0 &&
      previewCount > 0 &&
      /MoonVerse review/.test(reviewResult.reply) &&
      !/couldn't verify a reading link/i.test(reviewResult.reply),
    `intent=${reviewResult.analyticsIntent ?? "none"} reviews=${reviewCount} previews=${previewCount}`
  );

  const uiMessage = {
    id: "twaw-review-test",
    role: "assistant" as const,
    content: reviewResult.reply,
    recommendations: reviewResult.recommendations,
    novelOverview: reviewResult.novelOverview,
    lookupSession: reviewResult.lookupSession,
    responseKind: reviewResult.responseKind,
  };
  record(
    "twaw-seq-a-presentation",
    resolveMoonieReplyIntent(uiMessage, reviewMsg) === "novel_reviews" &&
      resolveMoonieCardMode(uiMessage, reviewMsg) === "reviews" &&
      !/couldn't verify a reading link/i.test(
        moonieDisplayContent(uiMessage, reviewMsg)
      ),
    `${resolveMoonieReplyIntent(uiMessage, reviewMsg)} card=${resolveMoonieCardMode(uiMessage, reviewMsg)}`
  );

  const ofOnly = await handleMoonieRequest({
    message: `review links of ${TWAW}`,
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  record(
    "twaw-seq-b-review-links-of",
    ofOnly.analyticsIntent === "novel_reviews" &&
      ofOnly.novelOverview?.title === TWAW,
    `${ofOnly.analyticsIntent ?? "none"} title=${ofOnly.novelOverview?.title ?? "none"}`
  );

  const activeReviews = await handleMoonieRequest({
    message: "send me all review links",
    messages: priorMessages,
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  record(
    "twaw-seq-c-active-novel",
    activeReviews.novelOverview?.title === TWAW &&
      (activeReviews.novelOverview?.community?.previews?.length ?? 0) > 0,
    `${activeReviews.novelOverview?.title ?? "none"} previews=${activeReviews.novelOverview?.community?.previews?.length ?? 0}`
  );

  const readingOnly = classifyMoonieIntents(`send me a link of ${TWAW}`);
  record(
    "twaw-seq-d-reading-link",
    primaryRetrievalIntent(readingOnly) === "FIND_READING_SOURCE" &&
      !readingOnly.includes("NOVEL_REVIEWS"),
    readingOnly.join(",")
  );
}

async function testTitleExtractionAndIntent() {
  const turn1 = "find me Heaven Official's Blessing novel link";
  const intents1 = classifyMoonieIntents(turn1);
  record(
    "seq-a-intent-reading-source",
    primaryRetrievalIntent(intents1) === "FIND_READING_SOURCE",
    primaryRetrievalIntent(intents1) ?? "none"
  );
  record(
    "seq-a-title-extraction",
    extractNovelQuery(turn1) === HOB_STRAIGHT,
    String(extractNovelQuery(turn1))
  );
  record(
    "seq-a-no-recommend-intent",
    !intents1.includes("RECOMMEND"),
    intents1.join(",")
  );

  const turn3 = "find Heaven Official's Blessing";
  const intents3 = classifyMoonieIntents(turn3);
  record(
    "seq-c-intent-find-novel",
    primaryRetrievalIntent(intents3) === "FIND_NOVEL",
    primaryRetrievalIntent(intents3) ?? "none"
  );
  record(
    "seq-c-not-chat",
    !intents3.includes("CHAT"),
    intents3.join(",")
  );
}

async function testApostropheNormalization(db: PrismaClient) {
  const straight = normalizeLookupQueryText(HOB_CURLY);
  record(
    "apostrophe-normalized-to-straight",
    straight === HOB_STRAIGHT,
    straight
  );

  const ids = await resolveExactLookupNovelIds(HOB_CURLY);
  const hob = await db.novel.findFirst({
    where: { title: { equals: HOB_STRAIGHT, mode: "insensitive" } },
    select: { id: true },
  });
  record(
    "apostrophe-exact-id-match",
    Boolean(hob?.id && ids.includes(hob.id)),
    `ids=${ids.join(",")}`
  );

  const identification = await identifyNovels({
    query: HOB_CURLY,
    readingLinkIntent: true,
    preferRawTitleQuery: true,
    explicitTitleLookup: true,
  });
  record(
    "apostrophe-identify-confirmed",
    identification.mode === "high_confidence" &&
      identification.candidates[0]?.title === HOB_STRAIGHT,
    `${identification.mode} top=${identification.candidates[0]?.title ?? "none"}`
  );
}

async function testRecommendationExclusionDoesNotBlockExplicitLookup(
  db: PrismaClient
) {
  const hob = await db.novel.findFirst({
    where: { title: { equals: HOB_STRAIGHT, mode: "insensitive" } },
    select: { id: true, title: true },
  });
  if (!hob) {
    record("hob-seeded", false, "Heaven Official's Blessing missing from DB");
    return;
  }

  const fakeRecommendations = [
    {
      novelId: hob.id,
      title: hob.title,
      reason: "",
      genres: [],
      confidence: "high" as const,
      sourceStatus: "none" as const,
    },
    {
      novelId: "bunny-demo-id",
      title: "Bunny",
      reason: "",
      genres: [],
      confidence: "high" as const,
      sourceStatus: "none" as const,
    },
  ];

  const priorMessages = [
    { role: "user", content: "recommend me BL novels" },
    {
      role: "assistant",
      content: "Here are a few BL picks.",
      meta: { recommendations: fakeRecommendations },
    },
  ];

  const exclude = fakeRecommendations.map((rec) => rec.novelId);
  const lookupMessage = `where can I read ${HOB_STRAIGHT}`;
  const intents = classifyMoonieIntents(lookupMessage, {
    hasPriorRecommendations: true,
    recentMessages: priorMessages,
  });

  record(
    "seq-b-explicit-lookup-detected",
    isExplicitTitleLookup(lookupMessage, intents),
    intents.join(",")
  );

  const result = await handleMoonieRequest({
    message: lookupMessage,
    messages: priorMessages,
    isLoggedIn: true,
    excludeNovelIds: exclude,
    spoilerMode: "none",
  });

  record(
    "seq-b-exact-novel-retrieved",
    result.novelOverview?.title === HOB_STRAIGHT,
    `overview=${result.novelOverview?.title ?? "none"}`
  );
  record(
    "seq-b-not-fuzzy-clarification",
    result.lookupSession?.mode === "confirmed" ||
      (result.lookupSession?.candidates?.length ?? 0) <= 1,
    `mode=${result.lookupSession?.mode ?? "none"} candidates=${result.lookupSession?.candidates?.length ?? 0}`
  );
  record(
    "seq-b-reading-bundle",
    /verified reading source|where to read|reading link|could not verify a reading link/i.test(
      result.reply
    ),
    result.reply.slice(0, 80)
  );
}

async function testSequenceA() {
  const result = await handleMoonieRequest({
    message: "find me Heaven Official's Blessing novel link",
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });

  record(
    "seq-a-confirmed-bundle",
    result.novelOverview?.title === HOB_STRAIGHT &&
      result.lookupSession?.mode === "confirmed",
    `overview=${result.novelOverview?.title ?? "none"} mode=${result.lookupSession?.mode ?? "none"}`
  );
  record(
    "seq-a-no-unrelated-recs",
    (result.recommendations?.length ?? 0) <= 1,
    `recs=${result.recommendations?.length ?? 0}`
  );
}

async function testExplicitLookupAfterRecommend(db: PrismaClient) {
  const samples = await db.novel.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });

  for (const novel of samples) {
    const recs = [
      {
        novelId: novel.id,
        title: novel.title,
        reason: "",
        genres: [],
        confidence: "high" as const,
        sourceStatus: "none" as const,
      },
    ];
    const result = await handleMoonieRequest({
      message: `find ${novel.title}`,
      messages: [
        { role: "user", content: "recommend something" },
        {
          role: "assistant",
          content: "pick",
          meta: { recommendations: recs },
        },
      ],
      isLoggedIn: true,
      excludeNovelIds: [novel.id],
      spoilerMode: "none",
    });

    record(
      `explicit-after-rec-${novel.id.slice(0, 6)}`,
      result.novelOverview?.novelId === novel.id ||
        result.lookupSession?.candidates?.[0]?.novelId === novel.id,
      `wanted=${novel.title} got=${result.novelOverview?.title ?? result.lookupSession?.candidates?.[0]?.title ?? "none"}`
    );
  }
}

async function followUpAfter(
  turn1: string,
  turn2: string
): Promise<{
  first: Awaited<ReturnType<typeof handleMoonieRequest>>;
  second: Awaited<ReturnType<typeof handleMoonieRequest>>;
}> {
  const first = await handleMoonieRequest({
    message: turn1,
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  const priorMeta = {
    lookupSession: first.lookupSession,
    novelOverview: first.novelOverview,
    recommendations: first.recommendations,
  };
  const messages = [
    { role: "user", content: turn1 },
    { role: "assistant", content: first.reply, meta: priorMeta },
  ];
  const second = await handleMoonieRequest({
    message: turn2,
    messages,
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  return { first, second };
}

async function testContextualFollowUpSequences() {
  record(
    "followup-detail-information-intent",
    resolveNovelContextFollowUpIntent("tell me detail information") ===
      "NOVEL_OVERVIEW",
    String(resolveNovelContextFollowUpIntent("tell me detail information"))
  );
  record(
    "followup-more-details-intent",
    resolveNovelContextFollowUpIntent("more details") === "NOVEL_OVERVIEW",
    String(resolveNovelContextFollowUpIntent("more details"))
  );

  const seqA = await followUpAfter(
    `show me reviews for ${LOVES_DUEL}`,
    "tell me detail information"
  );
  record(
    "followup-seq-a-overview-after-reviews",
    seqA.second.analyticsIntent === "novel_overview" &&
      seqA.second.novelOverview?.title === LOVES_DUEL &&
      seqA.second.responseKind === "novel_bundle",
    `${seqA.second.analyticsIntent ?? "none"} title=${seqA.second.novelOverview?.title ?? "none"}`
  );

  const seqB = await followUpAfter(`find ${TWAW}`, "more details");
  record(
    "followup-seq-b-overview",
    seqB.second.analyticsIntent === "novel_overview" &&
      seqB.second.novelOverview?.title === TWAW,
    `${seqB.second.analyticsIntent ?? "none"} title=${seqB.second.novelOverview?.title ?? "none"}`
  );

  const seqC = await followUpAfter(`find ${TWAW}`, "and reviews?");
  record(
    "followup-seq-c-reviews",
    seqC.second.analyticsIntent === "novel_reviews" &&
      seqC.second.novelOverview?.title === TWAW &&
      (seqC.second.novelOverview?.community?.previews?.length ?? 0) > 0,
    `${seqC.second.analyticsIntent ?? "none"} previews=${seqC.second.novelOverview?.community?.previews?.length ?? 0}`
  );

  const seqD = await followUpAfter(`find ${TWAW}`, "where to read?");
  record(
    "followup-seq-d-reading-source",
    seqD.second.analyticsIntent === "reading_source" &&
      seqD.second.novelOverview?.title === TWAW,
    `${seqD.second.analyticsIntent ?? "none"} title=${seqD.second.novelOverview?.title ?? "none"}`
  );

  const novelA = LOVES_DUEL;
  const switchFirst = await handleMoonieRequest({
    message: `find ${novelA}`,
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  let messages = [
    { role: "user", content: `find ${novelA}` },
    {
      role: "assistant",
      content: switchFirst.reply,
      meta: {
        lookupSession: switchFirst.lookupSession,
        novelOverview: switchFirst.novelOverview,
        recommendations: switchFirst.recommendations,
      },
    },
  ];
  const switchSecond = await handleMoonieRequest({
    message: `find ${TWAW}`,
    messages,
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  messages = [
    ...messages,
    { role: "user", content: `find ${TWAW}` },
    {
      role: "assistant",
      content: switchSecond.reply,
      meta: {
        lookupSession: switchSecond.lookupSession,
        novelOverview: switchSecond.novelOverview,
        recommendations: switchSecond.recommendations,
      },
    },
  ];
  const switchFollowUp = await handleMoonieRequest({
    message: "tell me more",
    messages,
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  record(
    "followup-seq-e-novel-switch",
    switchFollowUp.analyticsIntent === "novel_overview" &&
      switchFollowUp.novelOverview?.title === TWAW,
    `${switchFollowUp.novelOverview?.title ?? "none"}`
  );
}

async function testGeniusDoctorMultiTaskSequence() {
  record(
    "gdbbm-title-novel-link-intent",
    primaryRetrievalIntent(classifyMoonieIntents(`${GDBBM} novel link`)) ===
      "FIND_READING_SOURCE" &&
      extractDirectTitleQuery(`${GDBBM} novel link`) === GDBBM,
    classifyMoonieIntents(`${GDBBM} novel link`).join(",")
  );
  record(
    "gdbbm-title-novel-link-not-recommend",
    !isRecommendationDiscoveryMessage(`${GDBBM} novel link`) &&
      !classifyMoonieIntents(`${GDBBM} novel link`).includes("RECOMMEND"),
    classifyMoonieIntents(`${GDBBM} novel link`).join(",")
  );

  let messages: Array<{
    role: string;
    content: string;
    meta?: unknown;
  }> = [];
  let anchorId = "";

  const steps: Array<{
    id: string;
    message: string;
    expectIntent: string;
    check?: (result: Awaited<ReturnType<typeof handleMoonieRequest>>) => boolean;
  }> = [
    {
      id: "gdbbm-seq-find",
      message: `find ${GDBBM}`,
      expectIntent: "find_novel",
    },
    {
      id: "gdbbm-seq-novel-link-followup",
      message: "novel link",
      expectIntent: "reading_source",
      check: (r) =>
        /doesn't currently have a verified reading source/i.test(r.reply) &&
        (r.lookupSession?.candidates?.length ?? 0) <= 1,
    },
    {
      id: "gdbbm-seq-review-link-followup",
      message: "review link",
      expectIntent: "novel_reviews",
      check: (r) =>
        (r.novelOverview?.community?.previews?.length ?? 0) > 0 &&
        !/several possible matches/i.test(r.reply),
    },
    {
      id: "gdbbm-seq-show-reviews",
      message: "show all reviews",
      expectIntent: "novel_reviews",
    },
    {
      id: "gdbbm-seq-tell-me-more",
      message: "tell me more",
      expectIntent: "novel_overview",
    },
    {
      id: "gdbbm-seq-explicit-novel-link",
      message: `novel link for ${GDBBM}`,
      expectIntent: "reading_source",
      check: (r) =>
        /doesn't currently have a verified reading source/i.test(r.reply) ||
        (r.novelOverview?.readingSources?.length ?? 0) > 0,
    },
  ];

  for (const step of steps) {
    const result = await handleMoonieRequest({
      message: step.message,
      messages,
      isLoggedIn: true,
      excludeNovelIds: [],
      spoilerMode: "none",
    });
    const novelId =
      result.novelOverview?.novelId ??
      result.lookupSession?.confirmedNovelId ??
      "";
    if (!anchorId && novelId) anchorId = novelId;

    const pass =
      result.analyticsIntent === step.expectIntent &&
      result.novelOverview?.title === GDBBM &&
      Boolean(novelId) &&
      novelId === anchorId &&
      (result.recommendations?.length ?? 0) <= 1 &&
      (step.check?.(result) ?? true);

    record(
      step.id,
      pass,
      `intent=${result.analyticsIntent ?? "none"} id=${novelId} title=${result.novelOverview?.title ?? "none"}`
    );

    messages = [
      ...messages,
      { role: "user", content: step.message },
      {
        role: "assistant",
        content: result.reply,
        meta: {
          lookupSession: result.lookupSession,
          novelOverview: result.novelOverview,
          recommendations: result.recommendations,
        },
      },
    ];
  }

  const directLink = await handleMoonieRequest({
    message: `${GDBBM} novel link`,
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  record(
    "gdbbm-direct-title-novel-link",
    directLink.analyticsIntent === "reading_source" &&
      directLink.novelOverview?.title === GDBBM &&
      (directLink.recommendations?.length ?? 0) <= 1 &&
      !directLink.analyticsIntent?.includes("recommend"),
    `${directLink.analyticsIntent ?? "none"} recs=${directLink.recommendations?.length ?? 0}`
  );
}

async function testCorrectnessPass() {
  const freshClarifications: Array<{
    id: string;
    message: string;
    expectReply: RegExp;
    expectQuotaFree: boolean;
  }> = [
    {
      id: "fresh-give-me-link",
      message: "give me link",
      expectReply: /which novel/i,
      expectQuotaFree: true,
    },
    {
      id: "fresh-show-reviews",
      message: "show me reviews",
      expectReply: /which novel would you like to see reviews/i,
      expectQuotaFree: true,
    },
    {
      id: "fresh-summarise-readers",
      message: "summarise what MoonVerse readers think",
      expectReply: /which novel would you like me to summarise reader opinions/i,
      expectQuotaFree: true,
    },
    {
      id: "fresh-tell-me-more",
      message: "tell me more",
      expectReply: /what would you like to know more about/i,
      expectQuotaFree: true,
    },
    {
      id: "fresh-and",
      message: "and?",
      expectReply: /what would you like me to continue with/i,
      expectQuotaFree: true,
    },
  ];

  for (const step of freshClarifications) {
    const result = await handleMoonieRequest({
      message: step.message,
      messages: [],
      isLoggedIn: true,
      excludeNovelIds: [],
      spoilerMode: "none",
    });
    record(
      step.id,
      step.expectReply.test(result.reply) &&
        (result.consumesQuota === false) === step.expectQuotaFree &&
        (result.recommendations?.length ?? 0) === 0,
      `${result.reply.slice(0, 80)} quota=${String(result.consumesQuota)}`
    );
  }

  const aweChain = await (async () => {
    const first = await handleMoonieRequest({
      message: `find ${WILL_ETERNAL}`,
      messages: [],
      isLoggedIn: true,
      excludeNovelIds: [],
      spoilerMode: "none",
    });
    let messages: Array<{ role: string; content: string; meta?: unknown }> = [
      { role: "user", content: `find ${WILL_ETERNAL}` },
      {
        role: "assistant",
        content: first.reply,
        meta: {
          lookupSession: first.lookupSession,
          novelOverview: first.novelOverview,
          recommendations: first.recommendations,
        },
      },
    ];

    for (const step of [
      {
        id: "awe-reading-links",
        message: "find verified reading links",
        intent: "reading_source",
      },
      {
        id: "awe-summarise-readers",
        message: "summarise what readers think",
        intent: "novel_reviews",
      },
      {
        id: "awe-show-reviews",
        message: "show me reviews",
        intent: "novel_reviews",
      },
    ]) {
      const result = await handleMoonieRequest({
        message: step.message,
        messages,
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      record(
        step.id,
        result.novelOverview?.title === WILL_ETERNAL &&
          result.analyticsIntent === step.intent,
        `${result.analyticsIntent ?? "none"} title=${result.novelOverview?.title ?? "none"}`
      );
      messages = [
        ...messages,
        { role: "user", content: step.message },
        {
          role: "assistant",
          content: result.reply,
          meta: {
            lookupSession: result.lookupSession,
            novelOverview: result.novelOverview,
            recommendations: result.recommendations,
          },
        },
      ];
    }
  })();

  void aweChain;

  const fake = await handleMoonieRequest({
    message: "find Fake Novel XYZ",
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  record(
    "fake-novel-no-substitution",
    /couldn't verify "Fake Novel XYZ"/i.test(fake.reply) &&
      fake.novelOverview?.title !== "Threads of Fate" &&
      (fake.recommendations?.length ?? 0) === 0,
    fake.reply.slice(0, 100)
  );

  const guestHi = await handleMoonieRequest({
    message: "hi",
    messages: [],
    isLoggedIn: false,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  record(
    "guest-hi-greeting-only",
    guestHi.responseKind === "chat" &&
      guestHi.consumesQuota === false &&
      (guestHi.recommendations?.length ?? 0) === 0 &&
      guestHi.state !== "no_results",
    `${guestHi.responseKind} quota=${String(guestHi.consumesQuota)} state=${guestHi.state ?? "none"}`
  );

  const seriesDiscovery = await handleMoonieRequest({
    message: "find a novel with verified series data",
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  const truthfulNoSeries =
    /doesn't currently have a verified series entry available/i.test(
      seriesDiscovery.reply
    );
  const hasVerifiedSeries =
    Boolean(seriesDiscovery.seriesInfo) &&
    seriesDiscovery.seriesInfo?.readingOrderComplete === true;
  record(
    "verified-series-discovery",
    truthfulNoSeries || hasVerifiedSeries,
    seriesDiscovery.reply.slice(0, 120)
  );
}

async function main() {
  console.log("Moonie lookup regression QA\n");
  const db = new PrismaClient();
  try {
    await testTitleExtractionAndIntent();
    await testReviewIntentExtraction();
    await testReviewConversationSequence();
    await testReviewLinkConversationSequence();
    await testToWooAWifeReviewSequence();
    await testContextualFollowUpSequences();
    await testGeniusDoctorMultiTaskSequence();
    await testApostropheNormalization(db);
    await testSequenceA();
    await testRecommendationExclusionDoesNotBlockExplicitLookup(db);
    await testExplicitLookupAfterRecommend(db);
    await testCorrectnessPass();
  } finally {
    await db.$disconnect();
  }

  const failed = checks.filter((check) => !check.pass);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
  if (failed.length > 0) {
    console.log("\nFailed:");
    for (const check of failed) {
      console.log(` - ${check.id}: ${check.detail}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
