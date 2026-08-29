import { db } from "@/lib/db";

export interface MoonieAdminMetrics {
  totalEvents7d: number;
  recommendRequests7d: number;
  lookupRequests7d: number;
  compareRequests7d: number;
  imageRequests7d: number;
  clarificationEvents7d: number;
  noResultEvents7d: number;
  rateLimitEvents7d: number;
  helpfulFeedback7d: number;
  notHelpfulFeedback7d: number;
  highConfidenceLookups7d: number;
  lowConfidenceClarifications7d: number;
  avgResultCount7d: number | null;
  intentDistribution: Array<{ intent: string; count: number }>;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function metaField(meta: unknown, key: string): unknown {
  if (!meta || typeof meta !== "object") return undefined;
  return (meta as Record<string, unknown>)[key];
}

export async function getMoonieAdminMetrics(): Promise<MoonieAdminMetrics> {
  const since7d = daysAgo(7);

  const events = await db.moonieRecommendationEvent.findMany({
    where: { createdAt: { gte: since7d } },
    select: { event: true, meta: true },
    take: 5000,
    orderBy: { createdAt: "desc" },
  });

  let recommendRequests7d = 0;
  let lookupRequests7d = 0;
  let compareRequests7d = 0;
  let imageRequests7d = 0;
  let clarificationEvents7d = 0;
  let noResultEvents7d = 0;
  let rateLimitEvents7d = 0;
  let helpfulFeedback7d = 0;
  let notHelpfulFeedback7d = 0;
  let highConfidenceLookups7d = 0;
  let lowConfidenceClarifications7d = 0;
  const resultCounts: number[] = [];
  const intentCounts = new Map<string, number>();

  for (const row of events) {
    const responseKind = String(metaField(row.meta, "responseKind") ?? "");
    const intent = String(metaField(row.meta, "intent") ?? "unknown");
    const resultCount = metaField(row.meta, "resultCount");
    const clarification = metaField(row.meta, "clarification") === true;
    const success = metaField(row.meta, "success");
    const confidenceTier = String(metaField(row.meta, "confidenceTier") ?? "");

    if (row.event === "recommend" || row.event === "guest_recommend") {
      recommendRequests7d += 1;
      if (responseKind === "novel_bundle") lookupRequests7d += 1;
      if (responseKind === "compare") compareRequests7d += 1;
      if (typeof resultCount === "number") resultCounts.push(resultCount);
      if (success === false || resultCount === 0) noResultEvents7d += 1;
      if (clarification) clarificationEvents7d += 1;
      if (
        responseKind === "novel_bundle" &&
        confidenceTier === "high" &&
        !clarification
      ) {
        highConfidenceLookups7d += 1;
      }
      if (clarification && confidenceTier === "low") {
        lowConfidenceClarifications7d += 1;
      }
      if (metaField(row.meta, "attachmentType") === "image") {
        imageRequests7d += 1;
      }
      intentCounts.set(intent, (intentCounts.get(intent) ?? 0) + 1);
    }

    if (row.event === "rate_limit") rateLimitEvents7d += 1;
    if (row.event === "helpful") helpfulFeedback7d += 1;
    if (row.event === "not_helpful" || row.event === "less_like_this") {
      notHelpfulFeedback7d += 1;
    }
  }

  const avgResultCount7d =
    resultCounts.length > 0
      ? resultCounts.reduce((sum, value) => sum + value, 0) / resultCounts.length
      : null;

  return {
    totalEvents7d: events.length,
    recommendRequests7d,
    lookupRequests7d,
    compareRequests7d,
    imageRequests7d,
    clarificationEvents7d,
    noResultEvents7d,
    rateLimitEvents7d,
    helpfulFeedback7d,
    notHelpfulFeedback7d,
    highConfidenceLookups7d,
    lowConfidenceClarifications7d,
    avgResultCount7d,
    intentDistribution: [...intentCounts.entries()]
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}
