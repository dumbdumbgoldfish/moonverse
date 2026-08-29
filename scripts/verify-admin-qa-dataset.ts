/**
 * Verifies MoonVerse Admin QA dataset counts and basic admin query health.
 *
 * Usage: npm run verify:admin-qa
 */

import { PrismaClient } from "@prisma/client";
import { getAdminAnalyticsSnapshot, getAdminDailySeries } from "../src/services/admin/analytics.service";
import { getAdminDashboardAttention } from "../src/services/admin/dashboard.service";
import { getAdminUsers } from "../src/services/admin/users.service";
import { QA_EXTENSION_EMAIL_DOMAIN, QA_USER_ADD_COUNT } from "../prisma/lib/demo/qa-extension-targets";

const db = new PrismaClient();

async function main() {
  console.log("🔍 MoonVerse Admin QA verification\n");

  const [
    users,
    qaUsers,
    novels,
    reviews,
    comments,
    replies,
    likes,
    commentLikes,
    follows,
    folders,
    folderItems,
    notifications,
    reportsOpen,
    reportsResolved,
    reportsDismissed,
    tagSuggestionsPending,
    readingLinksPending,
    suspendedUsers,
    unverifiedUsers,
    moonieConversations,
    moonieEvents,
    auditLogs,
    readingStatuses,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { email: { endsWith: `@${QA_EXTENSION_EMAIL_DOMAIN}` } } }),
    db.novel.count(),
    db.review.count(),
    db.comment.count({ where: { parentCommentId: null } }),
    db.comment.count({ where: { parentCommentId: { not: null } } }),
    db.like.count(),
    db.commentLike.count(),
    db.follow.count(),
    db.folder.count(),
    db.folderReview.count(),
    db.notification.count(),
    db.report.count({ where: { status: "OPEN" } }),
    db.report.count({ where: { status: "RESOLVED" } }),
    db.report.count({ where: { status: "DISMISSED" } }),
    db.tagSuggestion.count({ where: { status: "PENDING" } }),
    db.readingLink.count({
      where: { moderationStatus: { in: ["PENDING", "NEEDS_REVIEW"] } },
    }),
    db.user.count({ where: { isSuspended: true } }),
    db.user.count({ where: { emailVerified: null } }),
    db.moonieConversation.count(),
    db.moonieRecommendationEvent.count(),
    db.moderationAuditLog.count(),
    db.novelReadingStatus.count(),
  ]);

  console.log("Entity counts:");
  console.log(`  Users:              ${users}`);
  console.log(`  QA users (@${QA_EXTENSION_EMAIL_DOMAIN}): ${qaUsers}`);
  console.log(`  Novels:             ${novels}`);
  console.log(`  Reviews:            ${reviews}`);
  console.log(`  Comments:           ${comments}`);
  console.log(`  Replies:            ${replies}`);
  console.log(`  Review likes:       ${likes}`);
  console.log(`  Comment likes:      ${commentLikes}`);
  console.log(`  Follows:            ${follows}`);
  console.log(`  Folders:            ${folders}`);
  console.log(`  Saves (folder):     ${folderItems}`);
  console.log(`  Notifications:      ${notifications}`);
  console.log(`  Open reports:       ${reportsOpen}`);
  console.log(`  Resolved reports:   ${reportsResolved}`);
  console.log(`  Dismissed reports:  ${reportsDismissed}`);
  console.log(`  Pending tag sug.:   ${tagSuggestionsPending}`);
  console.log(`  Pending links:      ${readingLinksPending}`);
  console.log(`  Suspended users:    ${suspendedUsers}`);
  console.log(`  Unverified users:   ${unverifiedUsers}`);
  console.log(`  Reading statuses:   ${readingStatuses}`);
  console.log(`  Moonie convos:      ${moonieConversations}`);
  console.log(`  Moonie events:      ${moonieEvents}`);
  console.log(`  Audit log entries:  ${auditLogs}`);

  const expectedMinUsers = 100 + QA_USER_ADD_COUNT;
  if (users < expectedMinUsers) {
    console.error(`\n❌ Expected at least ${expectedMinUsers} users, found ${users}`);
    process.exit(1);
  }
  if (qaUsers < QA_USER_ADD_COUNT) {
    console.error(`\n❌ Expected ${QA_USER_ADD_COUNT} QA users, found ${qaUsers}`);
    process.exit(1);
  }

  const [snapshot, attention, daily, userPage] = await Promise.all([
    getAdminAnalyticsSnapshot(),
    getAdminDashboardAttention(),
    getAdminDailySeries(30),
    getAdminUsers(undefined, 1, 50),
  ]);

  const dailyWithActivity = daily.filter(
    (d) => d.users > 0 || d.reviews > 0 || d.comments > 0
  );

  console.log("\nAdmin aggregation checks:");
  console.log(`  Dashboard total users: ${snapshot.totalUsers} (db: ${users})`);
  console.log(`  Dashboard total reviews: ${snapshot.totalReviews} (db: ${reviews})`);
  console.log(`  Dashboard total novels: ${snapshot.totalNovels} (db: ${novels})`);
  console.log(`  Dashboard open reports: ${snapshot.openReports} (db: ${reportsOpen})`);
  console.log(`  Attention queue total: ${
    attention.openReports +
    attention.pendingReadingLinks +
    attention.pendingTagSuggestions +
    attention.autoFlaggedReviews +
    attention.autoFlaggedComments
  }`);
  console.log(`  Daily series points (30d): ${daily.length} (${dailyWithActivity.length} with activity)`);
  console.log(`  Users page 1 size: ${userPage.items.length} / ${userPage.total} total`);

  if (snapshot.totalUsers !== users) {
    console.error("\n❌ Analytics snapshot user count mismatch");
    process.exit(1);
  }
  if (snapshot.totalReviews !== reviews) {
    console.error("\n❌ Analytics snapshot review count mismatch");
    process.exit(1);
  }
  if (dailyWithActivity.length < 7) {
    console.error("\n❌ Daily series lacks spread — expected activity on at least 7 days");
    process.exit(1);
  }

  console.log("\n✅ Admin QA verification passed");
}

main()
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
