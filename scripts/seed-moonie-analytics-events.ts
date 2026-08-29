/**
 * Generate fresh Moonie analytics events for admin dashboard verification.
 * Run: npx tsx scripts/seed-moonie-analytics-events.ts
 */
import { db } from "@/lib/db";
import { trackMoonieEvent } from "@/lib/moonie/analytics";

async function main() {
  try {
    const user = await db.user.findFirst({ select: { id: true, email: true } });
    if (!user) {
      console.error("No user found");
      process.exitCode = 1;
      return;
    }

    const novel = await db.novel.findFirst({ select: { id: true } });

    const scenarios: Array<{ label: string; event: string; meta: Record<string, unknown>; novelId?: string }> = [
      {
        label: "recommendation",
        event: "recommend",
        meta: {
          responseKind: "recommendations",
          intent: "recommend",
          resultCount: 5,
          success: true,
          consumesQuota: true,
        },
      },
      {
        label: "find novel",
        event: "recommend",
        meta: {
          responseKind: "novel_bundle",
          intent: "lookup",
          resultCount: 1,
          success: true,
        },
      },
      {
        label: "reading source",
        event: "recommend",
        meta: {
          responseKind: "novel_bundle",
          intent: "reading_source",
          resultCount: 1,
          success: true,
        },
      },
      {
        label: "compare",
        event: "recommend",
        meta: {
          responseKind: "compare",
          intent: "compare",
          resultCount: 2,
          success: true,
        },
      },
      {
        label: "image lookup",
        event: "recommend",
        meta: {
          responseKind: "novel_bundle",
          intent: "image_lookup",
          resultCount: 1,
          success: true,
          attachmentType: "image",
        },
      },
      {
        label: "clarification",
        event: "recommend",
        meta: {
          responseKind: "novel_bundle",
          intent: "lookup",
          resultCount: 0,
          success: false,
          clarification: true,
        },
      },
      {
        label: "no-result",
        event: "recommend",
        meta: {
          responseKind: "recommendations",
          intent: "recommend",
          resultCount: 0,
          success: false,
        },
      },
      {
        label: "helpful",
        event: "helpful",
        meta: { intent: "feedback" },
        novelId: novel?.id,
      },
      {
        label: "not helpful",
        event: "not_helpful",
        meta: { intent: "feedback" },
        novelId: novel?.id,
      },
      {
        label: "rate limit",
        event: "rate_limit",
        meta: { intent: "rate_limit" },
      },
    ];

    for (const scenario of scenarios) {
      await trackMoonieEvent({
        event: scenario.event,
        userId: user.id,
        novelId: scenario.novelId,
        meta: scenario.meta,
      });
      console.log(`[OK] ${scenario.label}`);
    }

    const recent = await db.moonieRecommendationEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { event: true, meta: true },
    });

    const withIntent = recent.filter(
      (row) =>
        row.meta &&
        typeof row.meta === "object" &&
        "intent" in (row.meta as object)
    ).length;
    const withRaw = recent.filter((row) => {
      const meta = row.meta as Record<string, unknown> | null;
      return Boolean(meta?.message || meta?.rawMessage || meta?.query);
    }).length;

    console.log(`\nRecent events with intent: ${withIntent}/${recent.length}`);
    console.log(`Recent events with raw chat in meta: ${withRaw}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

main();
