import { db } from "@/lib/db";

export interface AdminAnalyticsSnapshot {
  newUsers7d: number;
  newReviews7d: number;
  newComments7d: number;
  openReports: number;
  moonieConversations7d: number;
  moonieMessages7d: number;
  autoFlaggedReviews: number;
  autoFlaggedComments: number;
  pendingReadingLinks: number;
  totalUsers: number;
  totalReviews: number;
  totalNovels: number;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function getAdminAnalyticsSnapshot(): Promise<AdminAnalyticsSnapshot> {
  const since7d = daysAgo(7);

  const [
    newUsers7d,
    newReviews7d,
    newComments7d,
    openReports,
    moonieConversations7d,
    moonieMessages7d,
    autoFlaggedReviews,
    autoFlaggedComments,
    pendingReadingLinks,
    totalUsers,
    totalReviews,
    totalNovels,
  ] = await Promise.all([
    db.user.count({ where: { createdAt: { gte: since7d } } }),
    db.review.count({ where: { createdAt: { gte: since7d } } }),
    db.comment.count({ where: { createdAt: { gte: since7d } } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.moonieConversation.count({ where: { createdAt: { gte: since7d } } }),
    db.moonieMessage.count({ where: { createdAt: { gte: since7d } } }),
    db.review.count({ where: { moderationStatus: "AUTO_FLAGGED" } }),
    db.comment.count({ where: { moderationStatus: "AUTO_FLAGGED" } }),
    db.readingLink.count({ where: { moderationStatus: { in: ["PENDING", "NEEDS_REVIEW"] } } }),
    db.user.count(),
    db.review.count(),
    db.novel.count(),
  ]);

  return {
    newUsers7d,
    newReviews7d,
    newComments7d,
    openReports,
    moonieConversations7d,
    moonieMessages7d,
    autoFlaggedReviews,
    autoFlaggedComments,
    pendingReadingLinks,
    totalUsers,
    totalReviews,
    totalNovels,
  };
}

export interface DailySeriesPoint {
  date: string;
  users: number;
  reviews: number;
  comments: number;
}

export interface QueueBreakdownItem {
  key: string;
  label: string;
  count: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

/** Daily new-user, review, and comment counts for the last N days. */
export async function getAdminDailySeries(days = 14): Promise<DailySeriesPoint[]> {
  const since = daysAgo(days);

  const [users, reviews, comments] = await Promise.all([
    db.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.review.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    db.comment.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const buckets = new Map<string, { users: number; reviews: number; comments: number }>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = daysAgo(i).toISOString().slice(0, 10);
    buckets.set(date, { users: 0, reviews: 0, comments: 0 });
  }

  for (const user of users) {
    const key = user.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.users += 1;
  }
  for (const review of reviews) {
    const key = review.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.reviews += 1;
  }
  for (const comment of comments) {
    const key = comment.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.comments += 1;
  }

  return [...buckets.entries()].map(([date, counts]) => ({ date, ...counts }));
}

/** Open moderation workload by queue type (only non-zero counts). */
export async function getModerationQueueBreakdown(): Promise<QueueBreakdownItem[]> {
  const [
    openReports,
    autoFlaggedReviews,
    autoFlaggedComments,
    pendingReadingLinks,
    pendingTagSuggestions,
  ] = await Promise.all([
    db.report.count({ where: { status: "OPEN" } }),
    db.review.count({ where: { moderationStatus: "AUTO_FLAGGED" } }),
    db.comment.count({ where: { moderationStatus: "AUTO_FLAGGED" } }),
    db.readingLink.count({
      where: { moderationStatus: { in: ["PENDING", "NEEDS_REVIEW"] } },
    }),
    db.tagSuggestion.count({ where: { status: "PENDING" } }),
  ]);

  return [
    { key: "reports", label: "Reports", count: openReports },
    { key: "reviews", label: "Flagged reviews", count: autoFlaggedReviews },
    { key: "comments", label: "Flagged comments", count: autoFlaggedComments },
    { key: "links", label: "Reading links", count: pendingReadingLinks },
    { key: "tags", label: "Tag suggestions", count: pendingTagSuggestions },
  ].filter((item) => item.count > 0);
}

/** Open reports grouped by reason (top reasons first). */
export async function getOpenReportReasonBreakdown(
  limit = 8
): Promise<LabelCount[]> {
  const reports = await db.report.findMany({
    where: { status: "OPEN" },
    select: { reason: true },
  });

  const counts = new Map<string, number>();
  for (const report of reports) {
    const reason = report.reason.trim() || "Unspecified";
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Admin audit actions in the last N days, grouped by action type. */
export async function getAuditActionBreakdown(
  days = 7,
  limit = 8
): Promise<LabelCount[]> {
  const since = daysAgo(days);
  const logs = await db.moderationAuditLog.findMany({
    where: { createdAt: { gte: since } },
    select: { action: true },
  });

  const counts = new Map<string, number>();
  for (const log of logs) {
    counts.set(log.action, (counts.get(log.action) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
