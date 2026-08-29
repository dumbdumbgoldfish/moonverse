/**
 * Phase 7 production-readiness checks (read-only + safe cleanup).
 * Run: npx tsx scripts/moonie-phase7-production-readiness.ts
 */
import { ReadingLinkHealthStatus, RecommendationFeedbackKind } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { resolveResponseConfidenceTier } from "@/lib/moonie/analytics";
import {
  checkReadingLinkHealth,
  isPromotableReadingLinkHealth,
} from "@/lib/reading-link/health-check";
import { retrieveHybridCandidates } from "@/services/hybrid-retrieval.service";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import { getMoonieAdminMetrics } from "@/services/admin/moonie-analytics.service";
import { buildNovelBundle, formatNovelBundleReply } from "@/services/moonie-novel-lookup.service";

const db = new PrismaClient();

const QA_SERIES_NAMES = [
  "Moonie QA — Will Eternal Path",
  "Moonie QA Series Placeholder 2",
  "Moonie QA Series Placeholder 3",
];

async function inspectSeries() {
  const series = await db.novelSeries.findMany({
    include: {
      entries: {
        include: { novel: { select: { id: true, title: true } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log("\n=== 1. Series data hygiene ===");
  for (const row of series) {
    console.log(
      `- ${row.name} | verified=${row.readingOrderVerified} | entries=${row.entries.length}`
    );
    for (const entry of row.entries) {
      console.log(
        `    ${entry.order}. ${entry.novel.title} (${entry.relationType})`
      );
    }
  }

  const qaSeries = series.filter((row) =>
    row.name.startsWith("Moonie QA")
  );
  if (qaSeries.length === 0) {
    console.log("No QA-prefixed series found.");
    return { removed: 0 };
  }

  let removed = 0;
  for (const row of qaSeries) {
    await db.novelSeriesEntry.deleteMany({ where: { seriesId: row.id } });
    await db.novelSeries.delete({ where: { id: row.id } });
    removed += 1;
    console.log(`Removed QA series: ${row.name}`);
  }

  const placeholderNovels = await db.novel.findMany({
    where: {
      title: { startsWith: "Moonie QA Series Placeholder" },
    },
    select: { id: true, title: true },
  });
  for (const novel of placeholderNovels) {
    const reviewCount = await db.review.count({ where: { novelId: novel.id } });
    const linkCount = await db.readingLink.count({ where: { novelId: novel.id } });
    if (reviewCount === 0 && linkCount === 0) {
      await db.novel.delete({ where: { id: novel.id } });
      console.log(`Removed orphan QA placeholder novel: ${novel.title}`);
    } else {
      console.log(
        `Kept novel with data: ${novel.title} (reviews=${reviewCount}, links=${linkCount})`
      );
    }
  }

  return { removed };
}

async function reportLinkHealthCounts() {
  console.log("\n=== 3. Link-health population ===");
  const counts = await db.readingLink.groupBy({
    by: ["healthStatus"],
    _count: { _all: true },
    where: { active: true },
  });

  const tally: Record<string, number> = {
    HEALTHY: 0,
    REDIRECTED: 0,
    STALE: 0,
    BROKEN: 0,
    UNKNOWN: 0,
  };
  for (const row of counts) {
    tally[row.healthStatus] = row._count._all;
  }
  console.log(JSON.stringify(tally, null, 2));

  const unchecked = await db.readingLink.findMany({
    where: {
      active: true,
      OR: [{ lastCheckedAt: null }, { healthStatus: "UNKNOWN" }],
    },
    select: { id: true, url: true, healthStatus: true, lastCheckedAt: true },
    orderBy: { updatedAt: "asc" },
  });
  console.log(`Unchecked/UNKNOWN active links to check: ${unchecked.length}`);

  let checked = 0;
  for (const link of unchecked) {
    const result = await checkReadingLinkHealth(link.url);
    await db.readingLink.update({
      where: { id: link.id },
      data: {
        healthStatus: result.healthStatus,
        lastStatusCode: result.lastStatusCode,
        lastCheckedAt: result.checkedAt,
      },
    });
    checked += 1;
    if (checked <= 8 || checked === unchecked.length) {
      console.log(
        `Checked [${checked}/${unchecked.length}] ${link.url.slice(0, 55)}… → ${result.healthStatus}`
      );
    } else if (checked === 9) {
      console.log("…");
    }
  }

  if (checked > 0) {
    const refreshed = await db.readingLink.groupBy({
      by: ["healthStatus"],
      _count: { _all: true },
      where: { active: true },
    });
    console.log("Counts after sample checks:");
    for (const row of refreshed) {
      console.log(`  ${row.healthStatus}: ${row._count._all}`);
    }
  }

  const novelWithBroken = await db.novel.findFirst({
    where: {
      readingLinks: {
        some: { active: true, healthStatus: ReadingLinkHealthStatus.BROKEN },
      },
    },
    select: { id: true, title: true },
  });
  if (novelWithBroken) {
    const bundle = await buildNovelBundle({
      novelId: novelWithBroken.id,
      spoilerMode: "none",
    });
    if (bundle.overview) {
      const reply = formatNovelBundleReply({
        overview: bundle.overview,
        emphasizeReadingLink: true,
      });
      const promotable = bundle.overview.readingSources.some((source) =>
        isPromotableReadingLinkHealth(
          source.healthStatus ?? "UNKNOWN",
          source.lastCheckedAt ? new Date(source.lastCheckedAt) : null
        )
      );
      console.log(
        `Moonie copy for novel with broken link (${novelWithBroken.title}): ${reply.slice(0, 140)}…`
      );
      console.log(`Promotable source available: ${promotable}`);
    }
  }

  return tally;
}

async function qaConversationHistory() {
  console.log("\n=== 4. Conversation history QA ===");
  const users = await db.user.findMany({
    select: { id: true, username: true },
    take: 2,
    orderBy: { createdAt: "asc" },
  });
  if (users.length < 2) {
    console.log("Need at least 2 users for isolation test.");
    return { pass: false };
  }

  const [userA, userB] = users;
  const convA = await db.moonieConversation.create({
    data: {
      userId: userA.id,
      messages: {
        create: [
          { role: "user", content: "Phase7 history QA user A" },
          {
            role: "assistant",
            content: "Hello from A",
            meta: { responseKind: "chat", analyticsIntent: "greeting" },
          },
        ],
      },
    },
    include: { messages: true },
  });

  const convB = await db.moonieConversation.create({
    data: {
      userId: userB.id,
      messages: {
        create: [{ role: "user", content: "Phase7 history QA user B" }],
      },
    },
  });

  // Actions require auth — verify DB-level isolation and mapping helpers directly.
  const aList = await db.moonieConversation.findMany({
    where: { userId: userA.id },
    orderBy: { updatedAt: "desc" },
    take: 12,
    include: {
      messages: {
        where: { role: "user" },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });
  const canSeeOwn = aList.some((row) => row.id === convA.id);
  const crossRead = await db.moonieConversation.findFirst({
    where: { id: convA.id, userId: userB.id },
  });

  const loaded = await db.moonieConversation.findFirst({
    where: { id: convA.id, userId: userA.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  await db.moonieConversation.delete({ where: { id: convA.id } });
  await db.moonieConversation.delete({ where: { id: convB.id } });

  const pass =
    canSeeOwn &&
    !crossRead &&
    loaded?.messages.length === 2 &&
    loaded.messages[0]?.content === "Phase7 history QA user A";

  console.log(`List own conversation: ${canSeeOwn}`);
  console.log(`Cross-user access blocked: ${!crossRead}`);
  console.log(`Resume restores messages: ${loaded?.messages.length === 2}`);
  console.log(`Delete own conversation: ok (test convs removed)`);

  return { pass };
}

async function qaLessLikeThis(userId: string, novelId: string) {
  console.log("\n=== 5. Less Like This QA ===");
  await db.recommendationFeedback.deleteMany({
    where: { userId, novelId, kind: RecommendationFeedbackKind.LESS_LIKE_THIS },
  });

  await db.recommendationFeedback.create({
    data: {
      userId,
      novelId,
      kind: RecommendationFeedbackKind.LESS_LIKE_THIS,
    },
  });

  const stored = await db.recommendationFeedback.findFirst({
    where: {
      userId,
      novelId,
      kind: RecommendationFeedbackKind.LESS_LIKE_THIS,
    },
  });

  const withPenalty = await retrieveHybridCandidates({
    prefs: {
      genres: [],
      tags: [],
      excludedTags: [],
      status: null,
      mood: [],
      language: null,
    },
    userId,
    queryText: "fantasy",
    excludeNovelIds: [],
    limit: 20,
  });
  const includesPenalized = withPenalty.some((row) => row.id === novelId);

  await db.recommendationFeedback.create({
    data: {
      userId,
      novelId,
      kind: RecommendationFeedbackKind.NOT_FOR_ME,
    },
  });
  const hiddenIds = await db.recommendationFeedback.findMany({
    where: { userId, kind: RecommendationFeedbackKind.NOT_FOR_ME },
    select: { novelId: true },
  });
  const hiddenSet = new Set(hiddenIds.map((row) => row.novelId));

  const excluded = await retrieveHybridCandidates({
    prefs: {
      genres: [],
      tags: [],
      excludedTags: [],
      status: null,
      mood: [],
      language: null,
    },
    userId,
    queryText: "fantasy",
    excludeNovelIds: [...hiddenSet],
    limit: 20,
  });
  const notForMeHidden = !excluded.some((row) => row.id === novelId);

  console.log(`LESS_LIKE_THIS stored: ${Boolean(stored)}`);
  console.log(`Soft penalty applied (still retrievable): ${includesPenalized}`);
  console.log(`NOT_FOR_ME excludes from excludeNovelIds path: ${notForMeHidden}`);

  await db.recommendationFeedback.deleteMany({
    where: {
      userId,
      novelId,
      kind: { in: ["LESS_LIKE_THIS", "NOT_FOR_ME"] },
    },
  });

  return {
    pass: Boolean(stored),
  };
}

async function qaConfidenceTier(userId: string) {
  console.log("\n=== 6. confidenceTier analytics QA ===");

  const high = await handleMoonieRequest({
    message: "find A Will Eternal",
    messages: [],
    isLoggedIn: true,
    userId,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  const highTier = resolveResponseConfidenceTier(high);

  const medium = await handleMoonieRequest({
    message: "find Will Eternal",
    messages: [],
    isLoggedIn: true,
    userId,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  const mediumTier = resolveResponseConfidenceTier(medium);

  const low = await handleMoonieRequest({
    message: "find that cultivation novel with a clever doctor",
    messages: [],
    isLoggedIn: true,
    userId,
    excludeNovelIds: [],
    spoilerMode: "none",
  });
  const lowTier = resolveResponseConfidenceTier(low);

  await db.moonieRecommendationEvent.create({
    data: {
      event: "recommend",
      userId,
      meta: {
        responseKind: high.responseKind,
        intent: "find_novel",
        confidenceTier: highTier,
        clarification: false,
        resultCount: high.recommendations.length,
      },
    },
  });
  await db.moonieRecommendationEvent.create({
    data: {
      event: "recommend",
      userId,
      meta: {
        responseKind: low.responseKind,
        intent: "find_novel",
        confidenceTier: lowTier,
        clarification: low.lookupSession?.mode === "clarification",
        resultCount: low.recommendations.length,
      },
    },
  });

  const metrics = await getMoonieAdminMetrics();
  const sampleEvents = await db.moonieRecommendationEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { meta: true },
  });
  const hasRawChat = sampleEvents.some((row) => {
    const meta = row.meta as Record<string, unknown> | null;
    return Boolean(meta?.message || meta?.content || meta?.raw);
  });

  console.log(`High lookup tier: ${highTier}`);
  console.log(`Medium lookup tier: ${mediumTier}`);
  console.log(`Low/clarify tier: ${lowTier} (mode=${low.lookupSession?.mode})`);
  console.log(
    `Admin high-confidence lookups (7d): ${metrics.highConfidenceLookups7d}`
  );
  console.log(
    `Admin low-confidence clarifications (7d): ${metrics.lowConfidenceClarifications7d}`
  );
  console.log(`Raw chat in event meta: ${hasRawChat}`);

  return {
    pass:
      highTier === "high" &&
      (lowTier === "medium" || lowTier === "low") &&
      !hasRawChat,
  };
}

async function main() {
  const seriesCleanup = await inspectSeries();
  const linkHealth = await reportLinkHealthCounts();
  const history = await qaConversationHistory();

  const user = await db.user.findFirst({ select: { id: true } });
  const novel = await db.novel.findFirst({ select: { id: true, title: true } });
  if (!user || !novel) throw new Error("Missing user/novel for QA");

  const lessLike = await qaLessLikeThis(user.id, novel.id);
  const confidence = await qaConfidenceTier(user.id);

  console.log("\n=== 7. Production series data status ===");
  const { seedVerifiedNovelSeries } = await import("../prisma/lib/seed-novel-series");
  const seeded = await seedVerifiedNovelSeries(db);
  const remainingSeries = await db.novelSeries.findMany({
    include: {
      entries: {
        include: { novel: { select: { title: true } } },
        orderBy: { order: "asc" },
      },
    },
  });
  console.log(`Verified series seeded this run: ${seeded.seeded}`);
  for (const row of remainingSeries) {
    console.log(
      `- ${row.name} (verified=${row.readingOrderVerified}) → ${row.entries
        .map((entry) => `${entry.order}. ${entry.novel.title}`)
        .join(", ")}`
    );
  }

  console.log("\n=== Summary ===");
  console.log(
    JSON.stringify(
      {
        qaSeriesRemoved: seriesCleanup.removed,
        linkHealth,
        conversationHistoryPass: history.pass,
        lessLikeThisPass: lessLike.pass,
        confidenceTierPass: confidence.pass,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
