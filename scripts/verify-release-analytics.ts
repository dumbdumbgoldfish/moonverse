/**
 * Release-readiness analytics + privacy label verification.
 * Run: npx tsx scripts/verify-release-analytics.ts
 */
import { getMoonieAdminMetrics } from "@/services/admin/moonie-analytics.service";
import { db } from "@/lib/db";

async function main() {
  const metrics = await getMoonieAdminMetrics();

  console.log("Moonie admin metrics (7d)");
  console.log(`  recommend requests: ${metrics.recommendRequests7d}`);
  console.log(`  lookup requests: ${metrics.lookupRequests7d}`);
  console.log(`  compare requests: ${metrics.compareRequests7d}`);
  console.log(`  image requests: ${metrics.imageRequests7d}`);
  console.log(`  clarification: ${metrics.clarificationEvents7d}`);
  console.log(`  no-result: ${metrics.noResultEvents7d}`);
  console.log(`  rate limits: ${metrics.rateLimitEvents7d}`);
  console.log(`  helpful: ${metrics.helpfulFeedback7d}`);
  console.log(`  not helpful: ${metrics.notHelpfulFeedback7d}`);
  console.log(`  avg result count: ${metrics.avgResultCount7d ?? "n/a"}`);
  console.log(
    `  intent distribution: ${
      metrics.intentDistribution.length
        ? metrics.intentDistribution
            .slice(0, 8)
            .map((row) => `${row.intent}=${row.count}`)
            .join(", ")
        : "(empty)"
    }`
  );

  const recent = await db.moonieRecommendationEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { meta: true, event: true },
  });
  const rawChat = recent.filter((row) => {
    const meta = row.meta as Record<string, unknown> | null;
    return Boolean(meta?.message || meta?.rawMessage || meta?.query);
  }).length;
  const withIntent = recent.filter((row) => {
    const meta = row.meta as Record<string, unknown> | null;
    return Boolean(meta?.intent);
  }).length;

  console.log(`\nRecent 30 events with meta.intent: ${withIntent}`);
  console.log(`Recent 30 events with raw chat in meta: ${rawChat}`);

  const ok =
    metrics.recommendRequests7d > 0 &&
    metrics.intentDistribution.length > 0 &&
    rawChat === 0;

  if (!ok) process.exitCode = 1;
  console.log(ok ? "\n[PASS] analytics dashboard has live data" : "\n[WARN] analytics may need more traffic");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
