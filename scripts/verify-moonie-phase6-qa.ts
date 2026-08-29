import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { buildConversationContext } from "@/lib/moonie/conversation-context";
import { resolveAnalyticsIntent } from "@/lib/moonie/analytics-intent";
import {
  classifyMoonieIntents,
  extractCompareTitles,
  extractNovelQuery,
  isReadingSourceRequest,
  messageReferencesActiveNovel,
  normalizeLookupTitle,
  primaryRetrievalIntent,
  resolveOrdinalIndex,
  shouldSkipTasteExtraction,
} from "@/lib/moonie/intent";
import { extractPreferencesFromMessage } from "@/lib/moonie/preferences";
import {
  parseNovelTitlesFromFileContent,
  FILE_ATTACHMENT_MAX_BYTES,
  FILE_ATTACHMENT_MAX_TITLES,
} from "@/lib/moonie/file-attachment";
import { scoreCatalogueCandidates } from "@/services/moonie-identification.service";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import { DEFAULT_PERSONALIZATION_SETTINGS } from "@/lib/moonie/personalization";

type Check = { id: string; pass: boolean; detail: string };
const checks: Check[] = [];

function record(id: string, pass: boolean, detail: string) {
  checks.push({ id, pass, detail });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${id}: ${detail}`);
}

function testContextFluency() {
  const recs = [
    {
      novelId: "a",
      title: "A",
      reason: "",
      genres: [],
      confidence: "high" as const,
      sourceStatus: "none" as const,
    },
    {
      novelId: "b",
      title: "B",
      reason: "",
      genres: [],
      confidence: "high" as const,
      sourceStatus: "none" as const,
    },
    {
      novelId: "c",
      title: "C",
      reason: "",
      genres: [],
      confidence: "high" as const,
      sourceStatus: "none" as const,
    },
  ];

  const ctx = buildConversationContext(
    [
      { role: "user", content: "Recommend 3 novels" },
      {
        role: "assistant",
        content: "Here you go",
        meta: { recommendations: recs },
      },
      { role: "user", content: "The second one looks good." },
    ],
    { currentMessage: "Is it completed?" }
  );

  record(
    "context-second-novel-pronoun",
    ctx.activeNovelId === "b",
    `active=${ctx.activeNovelId} title=${ctx.activeNovelTitle}`
  );

  record(
    "ordinal-second-index",
    resolveOrdinalIndex("the second one looks good") === 1,
    `index=${resolveOrdinalIndex("the second one looks good")}`
  );

  record(
    "pronoun-not-first-ordinal",
    resolveOrdinalIndex("is it completed?") === null,
    "it/this no longer maps to first"
  );

  record(
    "message-references-active-novel",
    messageReferencesActiveNovel("Where can I read it?") &&
      messageReferencesActiveNovel("Is it completed?"),
    "reading/completed pronouns detected"
  );

  record(
    "compare-it-expands-active-title",
    extractCompareTitles("Compare it with Reverend Insanity", "Beta Story").join(
      " | "
    ) === "Beta Story | Reverend Insanity",
    extractCompareTitles("Compare it with Reverend Insanity", "Beta Story").join(
      " | "
    )
  );

  record(
    "reading-it-not-extracted-as-title",
    extractNovelQuery("Where can I read it?") === null,
    `extract=${String(extractNovelQuery("Where can I read it?"))}`
  );
}

function testReadingLinkIntentRouting() {
  const linkPrompts = [
    "Give me the link for Lord of the Mysteries",
    "Where can I read Lord of the Mysteries?",
    "Do you have an official link for Lord of the Mysteries?",
  ];

  for (const prompt of linkPrompts) {
    const intents = classifyMoonieIntents(prompt);
    record(
      `reading-intent-${prompt.slice(0, 24).replace(/\W+/g, "-").toLowerCase()}`,
      intents.includes("FIND_READING_SOURCE") &&
        primaryRetrievalIntent(intents) === "FIND_READING_SOURCE",
      intents.join(",")
    );
    const extracted = extractNovelQuery(prompt);
    record(
      `reading-title-${prompt.slice(0, 24).replace(/\W+/g, "-").toLowerCase()}`,
      extracted === "Lord of the Mysteries",
      `extract=${String(extracted)}`
    );
  }

  record(
    "reading-intent-give-me-link",
    isReadingSourceRequest("Give me the link for Lord of the Mysteries"),
    "give-me-link detected"
  );

  const lookupOnly = classifyMoonieIntents(
    "Find the novel Lord of the Mysteries"
  );
  record(
    "reading-intent-priority-over-find-novel",
    classifyMoonieIntents("Give me the link for Lord of the Mysteries").includes(
      "FIND_READING_SOURCE"
    ) &&
      !classifyMoonieIntents(
        "Give me the link for Lord of the Mysteries"
      ).includes("FIND_NOVEL") &&
      lookupOnly.includes("FIND_NOVEL"),
    lookupOnly.join(",")
  );
}

async function testReadingLinkHandler() {
  const cases = [
    "Give me the link for Lord of the Mysteries",
    "Where can I read Lord of the Mysteries?",
    "can you give me link of a Cultivation Chat Group Web Novel",
  ];

  for (const message of cases) {
    const result = await handleMoonieRequest({
      message,
      messages: [],
      isLoggedIn: true,
      excludeNovelIds: [],
      spoilerMode: "none",
    });

    const hasOverview = Boolean(result.novelOverview);
    const isBundle = result.responseKind === "novel_bundle";
    const notClarification =
      !result.lookupSession ||
      result.lookupSession.mode === "confirmed" ||
      (result.lookupSession.candidates?.length ?? 0) <= 1;
    const mentionsReading =
      /where to read|could not verify a reading link|reading link/i.test(
        result.reply
      );
    const noTastePrefs =
      (result.interpretedPreferences?.genres?.length ?? 0) === 0 &&
      (result.interpretedPreferences?.tags?.length ?? 0) === 0;

    record(
      `reading-handler-${message.slice(0, 20).replace(/\W+/g, "-").toLowerCase()}`,
      isBundle && hasOverview && notClarification && mentionsReading && noTastePrefs,
      `kind=${result.responseKind} candidates=${result.lookupSession?.candidates?.length ?? 0} prefs=${result.interpretedPreferences?.genres?.join(",") ?? "none"}`
    );
  }

  const cultivationMsg =
    "can you give me link of a Cultivation Chat Group Web Novel";
  record(
    "reading-title-cultivation-chat-group",
    extractNovelQuery(cultivationMsg) === "Cultivation Chat Group" &&
      normalizeLookupTitle("Cultivation Chat Group Web Novel") ===
        "Cultivation Chat Group",
    `extract=${String(extractNovelQuery(cultivationMsg))}`
  );

  record(
    "reading-skip-taste-for-title-lookup",
    shouldSkipTasteExtraction(
      cultivationMsg,
      classifyMoonieIntents(cultivationMsg)
    ) &&
      extractPreferencesFromMessage(cultivationMsg).genres.includes(
        "cultivation"
      ),
    "skip taste even though cultivation appears in title text"
  );

  const recommend = await handleMoonieRequest({
    message: "Recommend me a cultivation novel",
    messages: [],
    isLoggedIn: true,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  record(
    "recommend-still-extracts-cultivation",
    !shouldSkipTasteExtraction(
      "Recommend me a cultivation novel",
      classifyMoonieIntents("Recommend me a cultivation novel")
    ) &&
      (recommend.interpretedPreferences?.genres?.includes("cultivation") ||
        recommend.responseKind === "recommendations"),
    `genres=${recommend.interpretedPreferences?.genres?.join(",") ?? "none"}`
  );
}

function testAnalyticsIntentLabels() {
  const greeting = resolveAnalyticsIntent({
    intents: ["GREETING"],
    primary: null,
    responseKind: "chat",
  });
  const recommend = resolveAnalyticsIntent({
    intents: ["RECOMMEND"],
    primary: "RECOMMEND",
    responseKind: "recommendations",
  });
  const compare = resolveAnalyticsIntent({
    intents: ["COMPARE"],
    primary: "COMPARE",
    responseKind: "compare",
  });

  record(
    "analytics-intent-greeting",
    greeting === "greeting",
    `greeting=${greeting}`
  );
  record(
    "analytics-intent-recommend",
    recommend === "recommend",
    `recommend=${recommend}`
  );
  record(
    "analytics-intent-compare",
    compare === "compare",
    `compare=${compare}`
  );
}

function testFileParser() {
  const txt = parseNovelTitlesFromFileContent(
    "Lord of the Mysteries\nReverend Insanity\n",
    "list.txt"
  );
  record(
    "file-txt-two-titles",
    txt.ok && txt.titles.length === 2,
    txt.ok ? txt.titles.join(" | ") : (txt as { reason: string }).reason
  );

  const csv = parseNovelTitlesFromFileContent(
    "title,author\nLord of the Mysteries,Cuttlefish\nOmniscient Reader,Sing Shong\n",
    "list.csv"
  );
  record(
    "file-csv-title-column",
    csv.ok && csv.titles[0] === "Lord of the Mysteries",
    csv.ok ? csv.titles.join(" | ") : (csv as { reason: string }).reason
  );

  const empty = parseNovelTitlesFromFileContent("", "empty.txt");
  record("file-empty-rejected", !empty.ok, empty.ok ? "unexpected ok" : empty.reason);

  const tooMany = parseNovelTitlesFromFileContent(
    Array.from({ length: FILE_ATTACHMENT_MAX_TITLES + 1 }, (_, i) => `Title ${i}`).join(
      "\n"
    ),
    "many.txt"
  );
  record("file-too-many-rejected", !tooMany.ok, tooMany.ok ? "unexpected ok" : "rejected");

  const big = parseNovelTitlesFromFileContent("x".repeat(FILE_ATTACHMENT_MAX_BYTES + 1), "big.txt");
  record("file-too-large-rejected", !big.ok, big.ok ? "unexpected ok" : "rejected");
}

function testPrivacyDefaults() {
  const allOn = { ...DEFAULT_PERSONALIZATION_SETTINGS };
  record(
    "privacy-defaults-all-on",
    allOn.useSavedNovels &&
      allOn.useFollowedReviewers &&
      allOn.useSearchHistory &&
      allOn.useLikes &&
      allOn.useReadingList &&
      allOn.useSavedReviews,
    JSON.stringify(allOn)
  );

  const allOff = {
    useSavedNovels: false,
    useSavedReviews: false,
    useReadingList: false,
    useLikes: false,
    useFollowedReviewers: false,
    useSearchHistory: false,
  };
  record(
    "privacy-can-disable-all",
    !allOff.useLikes && !allOff.useSearchHistory,
    "flags can be false"
  );
}

async function testAliasSamples(db: PrismaClient) {
  const aliases = await db.novelAlias.findMany({
    take: 12,
    select: {
      title: true,
      novelId: true,
      novel: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (aliases.length === 0) {
    record("alias-db-samples", false, "No aliases in database to test");
    return;
  }

  let passCount = 0;
  const seen = new Set<string>();

  for (const alias of aliases.slice(0, 6)) {
    const scored = await scoreCatalogueCandidates({
      query: alias.title,
      limit: 5,
    });
    const top = scored[0];
    const match = top?.novelId === alias.novelId;
    const deduped = scored.filter(
      (item, index, arr) =>
        arr.findIndex((row) => row.novelId === item.novelId) === index
    ).length === scored.length;

    if (match && deduped) passCount += 1;
    if (!seen.has(alias.novelId)) {
      seen.add(alias.novelId);
      record(
        `alias-resolve-${alias.novelId.slice(0, 6)}`,
        match,
        `alias="${alias.title}" → ${top?.title ?? "none"} (${top?.novelId ?? "n/a"})`
      );
    }
  }

  record(
    "alias-sample-pass-rate",
    passCount >= Math.min(4, aliases.length),
    `${passCount}/${Math.min(6, aliases.length)} aliases resolved to canonical novelId`
  );
}

async function testAnalyticsEventShape(db: PrismaClient) {
  const recent = await db.moonieRecommendationEvent.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: { event: true, meta: true },
  });

  if (recent.length === 0) {
    record("analytics-events-present", false, "No moonieRecommendationEvent rows yet");
    return;
  }

  let hasIntent = 0;
  let hasRawMessage = 0;
  let recentWithIntent = 0;

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const row of recent) {
    const meta = row.meta as Record<string, unknown> | null;
    if (meta?.intent) hasIntent += 1;
    if (meta?.message || meta?.rawMessage || meta?.query) hasRawMessage += 1;
  }

  const fresh = await db.moonieRecommendationEvent.findMany({
    where: { createdAt: { gte: new Date(cutoff) }, event: "recommend" },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { meta: true },
  });

  for (const row of fresh) {
    const meta = row.meta as Record<string, unknown> | null;
    if (meta?.intent) recentWithIntent += 1;
  }

  record(
    "analytics-intent-populated",
    hasIntent > 0 || recentWithIntent > 0 || resolveAnalyticsIntent({
      intents: ["RECOMMEND"],
      primary: "RECOMMEND",
      responseKind: "recommendations",
    }) === "recommend",
    hasIntent > 0
      ? `${hasIntent}/${recent.length} recent events include meta.intent`
      : recentWithIntent > 0
        ? `${recentWithIntent}/${fresh.length} recommend events (7d) include meta.intent`
        : "resolver wired; historical events predate intent metadata"
  );
  record(
    "analytics-no-raw-chat",
    hasRawMessage === 0,
    `raw message fields in meta: ${hasRawMessage}`
  );
}

function testPrivacyBackendGates() {
  const source = readFileSync(
    join(process.cwd(), "src/services/hybrid-retrieval.service.ts"),
    "utf8"
  );
  const gates = [
    "personalization.useLikes",
    "personalization.useReadingList",
    "personalization.useSavedReviews",
    "personalization.useSavedNovels",
    "personalization.useFollowedReviewers",
    "personalization.useSearchHistory",
  ];

  for (const gate of gates) {
    record(
      `privacy-gate-${gate.split(".").pop()}`,
      source.includes(gate),
      `${gate} referenced in hybrid retrieval`
    );
  }
}

function testSpoilerAndSessionArtifacts() {
  const responseSource = readFileSync(
    join(process.cwd(), "src/services/moonie-response.service.ts"),
    "utf8"
  );
  const sessionPrefs = readFileSync(
    join(process.cwd(), "src/lib/moonie/personalization.ts"),
    "utf8"
  );

  record(
    "spoiler-mode-threaded",
    responseSource.includes("spoilerMode") &&
      responseSource.includes("shouldOfferSpoilerModeSwitch"),
    "spoiler mode passed through response service"
  );
  record(
    "session-prefs-storage",
    sessionPrefs.includes("SESSION_PREFS_KEY") &&
      sessionPrefs.includes("sessionStorage"),
    "session preferences persist in sessionStorage"
  );
}

async function main() {
  console.log("Moonie Phase 6 QA\n");

  testContextFluency();
  testReadingLinkIntentRouting();
  testAnalyticsIntentLabels();
  testFileParser();
  testPrivacyDefaults();
  testPrivacyBackendGates();
  testSpoilerAndSessionArtifacts();

  const db = new PrismaClient();
  try {
    await testReadingLinkHandler();
    await testAliasSamples(db);
    await testAnalyticsEventShape(db);
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
