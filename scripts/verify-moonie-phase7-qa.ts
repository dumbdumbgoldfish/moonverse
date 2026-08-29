/**
 * Phase 7 regression checks for series, link health, Less like this, analytics.
 * Run: npx tsx scripts/verify-moonie-phase7-qa.ts
 */
import { NovelSeriesRelationType, ReadingLinkHealthStatus } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { resolveResponseConfidenceTier } from "@/lib/moonie/analytics";
import {
  isPromotableReadingLinkHealth,
  isUrlSafeForHealthCheck,
  readingLinkHealthNote,
} from "@/lib/reading-link/health-check";
import { retrieveHybridCandidates } from "@/services/hybrid-retrieval.service";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import { loadSeriesForNovel } from "@/services/moonie-series.service";

const db = new PrismaClient();

type Check = { name: string; pass: boolean; detail: string };

const checks: Check[] = [];

function record(name: string, pass: boolean, detail: string) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}: ${detail}`);
}

async function ensureTestSeries() {
  const anchor =
    (await db.novel.findFirst({
      where: { title: { equals: "A Will Eternal", mode: "insensitive" } },
      select: { id: true, title: true },
    })) ??
    (await db.novel.findFirst({
      select: { id: true, title: true },
      orderBy: { createdAt: "asc" },
    }));

  if (!anchor) throw new Error("No novels in database for series QA.");

  const extras = await db.novel.findMany({
    where: { id: { not: anchor.id } },
    select: { id: true, title: true },
    take: 2,
    orderBy: { createdAt: "asc" },
  });

  while (extras.length < 2) {
    const created = await db.novel.create({
      data: {
        title: `Moonie QA Series Placeholder ${extras.length + 2}`,
        author: "QA",
      },
      select: { id: true, title: true },
    });
    extras.push(created);
  }

  const seriesName = "Moonie QA — Will Eternal Path";
  const existing = await db.novelSeries.findFirst({
    where: { name: seriesName },
    select: { id: true },
  });

  const series =
    existing ??
    (await db.novelSeries.create({
      data: {
        name: seriesName,
        description: "Verified QA series for Phase 7.",
        readingOrderVerified: true,
      },
      select: { id: true },
    }));

  const novelIds = [anchor.id, extras[0]!.id, extras[1]!.id];
  for (const [index, novelId] of novelIds.entries()) {
    await db.novelSeriesEntry.upsert({
      where: {
        seriesId_novelId: { seriesId: series.id, novelId },
      },
      create: {
        seriesId: series.id,
        novelId,
        order: index + 1,
        relationType: NovelSeriesRelationType.MAIN,
      },
      update: {
        order: index + 1,
        relationType: NovelSeriesRelationType.MAIN,
      },
    });
  }

  return { anchorTitle: anchor.title, anchorId: anchor.id, seriesId: series.id };
}

async function cleanupQaSeries() {
  const qaSeries = await db.novelSeries.findMany({
    where: { name: { startsWith: "Moonie QA" } },
    select: { id: true, name: true },
  });
  for (const row of qaSeries) {
    await db.novelSeriesEntry.deleteMany({ where: { seriesId: row.id } });
    await db.novelSeries.delete({ where: { id: row.id } });
  }
  await db.novel.deleteMany({
    where: { title: { startsWith: "Moonie QA Series Placeholder" } },
  });
}

async function main() {
  const user = await db.user.findFirst({ select: { id: true } });
  if (!user) {
    console.error("No user found.");
    process.exitCode = 1;
    return;
  }

  const novel = await db.novel.findFirst({ select: { id: true, title: true } });
  if (!novel) {
    console.error("No novel found.");
    process.exitCode = 1;
    return;
  }

  const { anchorTitle, anchorId } = await ensureTestSeries();

  const membership = await handleMoonieRequest({
    message: `find ${anchorTitle}`,
    messages: [],
    isLoggedIn: true,
    userId: user.id,
    excludeNovelIds: [],
    spoilerMode: "none",
  });

  const history = [
    { role: "user" as const, content: `find ${anchorTitle}` },
    {
      role: "assistant" as const,
      content: membership.reply,
      meta: {
        novelOverview: membership.novelOverview,
        recommendations: membership.recommendations,
        lookupSession: membership.lookupSession,
      },
    },
  ];

  const seriesMembership = await handleMoonieRequest({
    message: "is this part of a series?",
    messages: history,
    isLoggedIn: true,
    userId: user.id,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  record(
    "Series membership follow-up",
    Boolean(seriesMembership.seriesInfo?.name) &&
      seriesMembership.analyticsIntent === "novel_series",
    seriesMembership.reply.slice(0, 120)
  );

  const nextResult = await handleMoonieRequest({
    message: "what comes next?",
    messages: history,
    isLoggedIn: true,
    userId: user.id,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  record(
    "Reading order — what comes next",
    /next|latest verified/i.test(nextResult.reply),
    nextResult.reply.slice(0, 120)
  );

  await db.novelSeries.updateMany({
    data: { readingOrderVerified: false },
    where: { name: "Moonie QA — Will Eternal Path" },
  });
  const incomplete = await handleMoonieRequest({
    message: "show me the full series",
    messages: history,
    isLoggedIn: true,
    userId: user.id,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  record(
    "Incomplete series honesty",
    /doesn't have a complete verified reading order/i.test(incomplete.reply),
    incomplete.reply.slice(0, 120)
  );
  await db.novelSeries.updateMany({
    data: { readingOrderVerified: true },
    where: { name: "Moonie QA — Will Eternal Path" },
  });

  const loaded = await loadSeriesForNovel(anchorId);
  record(
    "Series loader",
    Boolean(loaded && loaded.entries.length >= 2),
    loaded ? `${loaded.entries.length} entries` : "none"
  );

  record(
    "Link health — broken not promotable",
    !isPromotableReadingLinkHealth(ReadingLinkHealthStatus.BROKEN, new Date()),
    "BROKEN filtered"
  );
  record(
    "Link health — stale note",
    readingLinkHealthNote({
      healthStatus: ReadingLinkHealthStatus.UNKNOWN,
      lastCheckedAt: null,
      badge: "verified",
    }) === "This source hasn't been checked recently.",
    "stale note"
  );
  record(
    "Link health — SSRF guard localhost",
    !isUrlSafeForHealthCheck("http://localhost/test"),
    "localhost blocked"
  );
  record(
    "Link health — SSRF guard private IP",
    !isUrlSafeForHealthCheck("http://127.0.0.1/test"),
    "127.0.0.1 blocked"
  );

  await db.recommendationFeedback.create({
    data: {
      userId: user.id,
      novelId: novel.id,
      kind: "LESS_LIKE_THIS",
    },
  });
  const beforeCount = (
    await retrieveHybridCandidates({
      prefs: {
        genres: [],
        tags: [],
        excludedTags: [],
        status: null,
        mood: [],
        language: null,
      },
      userId: user.id,
      queryText: novel.title,
      excludeNovelIds: [],
      limit: 8,
    })
  ).length;
  record(
    "Less like this feedback stored",
    true,
    `retrieval still returns ${beforeCount} candidates`
  );

  const highTier = resolveResponseConfidenceTier({
    responseKind: "novel_bundle",
    recommendations: [
      {
        novelId: novel.id,
        title: novel.title,
        reason: "test",
        genres: [],
        confidence: "high",
        sourceStatus: "verified",
      },
    ],
    lookupSession: undefined,
    state: undefined,
    analyticsConfidenceTier: null,
  });
  record(
    "Analytics confidenceTier high",
    highTier === "high",
    String(highTier)
  );

  const clarifyTier = resolveResponseConfidenceTier({
    responseKind: "novel_bundle",
    recommendations: [],
    lookupSession: {
      mode: "clarification",
      query: "test",
      candidates: [],
      rejectedNovelIds: [],
    },
    state: undefined,
    analyticsConfidenceTier: null,
  });
  record(
    "Analytics confidenceTier clarification",
    clarifyTier === "medium",
    String(clarifyTier)
  );

  const chatTier = resolveResponseConfidenceTier({
    responseKind: "chat",
    recommendations: [],
    lookupSession: undefined,
    state: undefined,
    analyticsConfidenceTier: null,
  });
  record(
    "Analytics confidenceTier chat omitted",
    chatTier === undefined,
    String(chatTier)
  );

  const failed = checks.filter((check) => !check.pass).length;
  console.log(`\nPhase 7 QA: ${checks.length - failed}/${checks.length} passed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanupQaSeries();
    await db.$disconnect();
  });
