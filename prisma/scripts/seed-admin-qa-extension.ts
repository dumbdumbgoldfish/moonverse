/**
 * MoonVerse Admin QA extension — additive development dataset import.
 *
 * Adds 1,529 synthetic users (and related records) on top of the existing
 * 100-user demo dataset without wiping community tables.
 *
 * SAFETY:
 * - Requires `--confirm` flag (destructive wipe is NOT performed).
 * - Idempotent: skips if @moonverse.qa user count already meets target.
 * - Create a Postgres backup before running (see prisma/data/admin-qa/README.md).
 *
 * Usage:
 *   npm run demo:seed:admin-qa -- --confirm
 *   npm run demo:seed:admin-qa -- --dry-run
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ContentModerationStatus,
  NotificationType,
  PrismaClient,
  ReadingLinkCategory,
  ReadingLinkModerationStatus,
  ReportStatus,
  ReportTargetType,
  TagSuggestionStatus,
  ReadingStatusValue,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { createRng } from "../lib/demo/rng";
import {
  QA_EXTENSION_TARGETS,
  QA_RNG_SEED,
  QA_USER_ADD_COUNT,
  QA_EXTENSION_EMAIL_DOMAIN,
} from "../lib/demo/qa-extension-targets";
import {
  generateQaExtensionUsers,
  reviewQuotaForCohort,
  type QaExtensionUserSpec,
} from "../lib/demo/qa-extension-users";
import {
  composeOriginalComment,
  composeOriginalReview,
  pickDifficulty,
  pickLengthBand,
} from "../lib/demo/review-composer";
import { normalizeTagName, tagCompactKey } from "../../src/lib/tag-similarity";

const db = new PrismaClient();
const DEMO_PASSWORD = "Password123!";
const MANIFEST_DIR = join(process.cwd(), "prisma/data/admin-qa");

function parseArgs() {
  const confirm = process.argv.includes("--confirm");
  const dryRun = process.argv.includes("--dry-run");
  return { confirm, dryRun };
}

function ratingFromDistribution(rng: ReturnType<typeof createRng>): number {
  const roll = rng.next();
  if (roll < 0.07) return 1;
  if (roll < 0.16) return 2;
  if (roll < 0.34) return 3;
  if (roll < 0.72) return 4;
  return 5;
}

async function createManyInChunks<T>(
  label: string,
  rows: T[],
  chunkSize: number,
  write: (chunk: T[]) => Promise<unknown>
) {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await write(chunk);
    process.stdout.write(
      `\r  ↳ ${label}: ${Math.min(i + chunk.length, rows.length)}/${rows.length}`
    );
  }
  console.log("");
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function countEntities() {
  const [
    users,
    qaUsers,
    novels,
    reviews,
    comments,
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
    db.comment.count(),
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

  return {
    users,
    qaUsers,
    novels,
    reviews,
    comments,
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
  };
}

async function main() {
  const { confirm, dryRun } = parseArgs();
  const started = Date.now();

  console.log("🌙 MoonVerse Admin QA extension import\n");
  console.log("  Development/demo data only — not for production.\n");

  if (!confirm && !dryRun) {
    console.error(
      "  Refusing to run without --confirm. This script adds ~1,529 users and related records."
    );
    console.error("  Backup first, then: npm run demo:seed:admin-qa -- --confirm");
    process.exit(1);
  }

  const before = await countEntities();
  console.log(`  Users before: ${before.users} (${before.qaUsers} @${QA_EXTENSION_EMAIL_DOMAIN})`);

  const qaToAdd = Math.max(0, QA_USER_ADD_COUNT - before.qaUsers);
  if (qaToAdd === 0) {
    console.log("\n  ✓ QA extension already present. Nothing to import.");
    await db.$disconnect();
    return;
  }

  if (dryRun) {
    console.log(`\n  Dry run: would add ${qaToAdd} QA users and related records.`);
    await db.$disconnect();
    return;
  }

  const rng = createRng(QA_RNG_SEED);
  const existingUsers = await db.user.findMany({
    select: { username: true, email: true },
  });
  const existingUsernames = new Set(existingUsers.map((u) => u.username));
  const existingEmails = new Set(existingUsers.map((u) => u.email));

  const userSpecs = generateQaExtensionUsers(
    rng,
    qaToAdd,
    existingUsernames,
    existingEmails
  );

  const suspendedCount = Math.round(qaToAdd * QA_EXTENSION_TARGETS.suspendedFraction);
  const unverifiedCount = Math.round(qaToAdd * QA_EXTENSION_TARGETS.unverifiedFraction);
  const suspendedIndices = new Set(rng.shuffle([...Array(qaToAdd).keys()]).slice(0, suspendedCount));
  const unverifiedIndices = new Set(
    rng.shuffle([...Array(qaToAdd).keys()]).slice(0, unverifiedCount)
  );
  for (let i = 0; i < userSpecs.length; i++) {
    userSpecs[i].isSuspended = suspendedIndices.has(i);
    userSpecs[i].emailVerified = !unverifiedIndices.has(i);
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = Date.now();

  await createManyInChunks("users", userSpecs, 100, (chunk) =>
    db.user.createMany({
      data: chunk.map((u) => ({
        email: u.email,
        username: u.username,
        displayName: u.displayName,
        bio: u.readingPreferences
          ? `${u.bio}\nPreferences: ${u.readingPreferences}`
          : u.bio,
        avatarUrl: u.avatarUrl,
        passwordHash,
        role: "USER",
        isSuspended: u.isSuspended,
        emailVerified: u.emailVerified ? new Date(now - u.joinOffsetDays * 86400000) : null,
        onboardingCompletedAt: u.cohort === "inactive" ? null : new Date(now - u.joinOffsetDays * 86400000 + 3600000),
        createdAt: new Date(now - u.joinOffsetDays * 86400000),
      })),
      skipDuplicates: true,
    })
  );

  const qaUserRows = await db.user.findMany({
    where: { email: { endsWith: `@${QA_EXTENSION_EMAIL_DOMAIN}` } },
    select: { id: true, username: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const specByUsername = new Map(userSpecs.map((u) => [u.username, u]));
  const qaUserIds = qaUserRows.map((u) => u.id);
  const qaUserSpecs: QaExtensionUserSpec[] = qaUserRows.map(
    (u) => specByUsername.get(u.username)!
  );

  console.log(`  ✓ ${qaUserIds.length} QA users in database`);

  const genres = await db.genre.findMany({ select: { id: true, slug: true } });
  const genreBySlug = Object.fromEntries(genres.map((g) => [g.slug, g.id]));
  const tags = await db.tag.findMany({ select: { id: true, slug: true } });

  const preferredGenreRows: Array<{ userId: string; genreId: string }> = [];
  for (let i = 0; i < qaUserIds.length; i++) {
    const spec = qaUserSpecs[i];
    if (!spec || spec.cohort === "inactive") continue;
    for (const slug of spec.favouriteGenreSlugs.slice(0, rng.int(2, 4))) {
      const genreId = genreBySlug[slug];
      if (genreId) preferredGenreRows.push({ userId: qaUserIds[i], genreId });
    }
  }
  await createManyInChunks("preferredGenres", preferredGenreRows, 200, (chunk) =>
    db.userPreferredGenre.createMany({ data: chunk, skipDuplicates: true })
  );

  const novels = await db.novel.findMany({
    select: {
      id: true,
      title: true,
      author: true,
      genres: { select: { slug: true } },
      tags: { select: { slug: true } },
    },
  });
  const novelMeta = novels.map((n) => ({
    id: n.id,
    title: n.title,
    author: n.author ?? "Unknown",
    genreSlugs: n.genres.map((g) => g.slug),
    tagSlugs: n.tags.map((t) => t.slug),
  }));

  const existingPairs = await db.review.findMany({
    select: { novelId: true, userId: true },
  });
  const usedPairs = new Set(existingPairs.map((p) => `${p.novelId}:${p.userId}`));

  const reviewRows: Array<{
    novelId: string;
    userId: string;
    title: string;
    body: string;
    rating: number;
    moderationStatus: ContentModerationStatus;
    containsSpoilers: boolean;
    createdAt: Date;
  }> = [];

  const usedBodies = new Set<string>();
  const usedTitles = new Set<string>();

  for (let i = 0; i < qaUserIds.length; i++) {
    const spec = qaUserSpecs[i];
    const userId = qaUserIds[i];
    const quota = reviewQuotaForCohort(spec.cohort, rng);
    if (quota === 0) continue;

    const novelSample = rng.shuffle(novelMeta).slice(0, quota);
    for (const novel of novelSample) {
      const pair = `${novel.id}:${userId}`;
      if (usedPairs.has(pair)) continue;
      usedPairs.add(pair);

      const rating = ratingFromDistribution(rng);
      const style = spec.writingStyle;
      const lengthBand = pickLengthBand(rng, rng.chance(0.08));
      const spoiler = rng.chance(0.1);
      const translated = novel.tagSlugs.some((t) =>
        ["translated-cn", "chinese-original", "translated-jp", "translated-kr"].includes(t)
      );
      let composed = composeOriginalReview(
        {
          title: novel.title,
          author: novel.author,
          genres: novel.genreSlugs,
          rating,
          featured: false,
          style,
          lengthBand,
          spoiler,
          difficulty: pickDifficulty(rng, novel.genreSlugs),
          tagLabels: novel.tagSlugs.slice(0, 3),
          translated,
        },
        rng
      );
      if (usedBodies.has(composed.body) || usedTitles.has(composed.title)) {
        composed.title = `${composed.title} · ${spec.username}`;
      }
      usedBodies.add(composed.body);
      usedTitles.add(composed.title);

      const autoFlagged = rng.chance(QA_EXTENSION_TARGETS.autoFlaggedReviewFraction);
      reviewRows.push({
        novelId: novel.id,
        userId,
        title: composed.title,
        body: composed.body,
        rating,
        containsSpoilers: spoiler,
        moderationStatus: autoFlagged ? "AUTO_FLAGGED" : "OK",
        createdAt: hoursAgo(rng.int(2, 24 * 90)),
      });
      if (reviewRows.length >= QA_EXTENSION_TARGETS.reviews) break;
    }
    if (reviewRows.length >= QA_EXTENSION_TARGETS.reviews) break;
  }

  const createdReviewIds: string[] = [];
  for (let i = 0; i < reviewRows.length; i += 40) {
    const chunk = reviewRows.slice(i, i + 40);
    await db.$transaction(async (tx) => {
      for (const row of chunk) {
        const created = await tx.review.create({
          data: row,
          select: { id: true },
        });
        createdReviewIds.push(created.id);
      }
    });
    process.stdout.write(
      `\r  ↳ reviews: ${Math.min(i + chunk.length, reviewRows.length)}/${reviewRows.length}`
    );
  }
  console.log(`\n  ✓ ${createdReviewIds.length} reviews`);

  const reviewIdSample = await db.review.findMany({
    where: { userId: { in: qaUserIds } },
    select: { id: true, userId: true },
    take: QA_EXTENSION_TARGETS.reviews + 500,
  });
  const allReviewIds = (
    await db.review.findMany({ select: { id: true, userId: true } })
  ).map((r) => ({ id: r.id, userId: r.userId }));

  const commentRows: Array<{
    reviewId: string;
    userId: string;
    body: string;
    moderationStatus: ContentModerationStatus;
    parentCommentId?: string;
    createdAt: Date;
  }> = [];

  for (let i = 0; i < QA_EXTENSION_TARGETS.comments; i++) {
    const review = rng.pick(allReviewIds);
    const userId = rng.pick(qaUserIds);
    if (review.userId === userId) continue;
    const novelTitle =
      novelMeta[rng.int(0, Math.max(0, novelMeta.length - 1))]?.title ?? "this novel";
    commentRows.push({
      reviewId: review.id,
      userId,
      body: composeOriginalComment(rng, novelTitle),
      moderationStatus: rng.chance(QA_EXTENSION_TARGETS.autoFlaggedCommentFraction)
        ? "AUTO_FLAGGED"
        : "OK",
      createdAt: hoursAgo(rng.int(1, 24 * 60)),
    });
  }

  for (let i = 0; i < commentRows.length; i += 80) {
    const chunk = commentRows.slice(i, i + 80);
    await db.comment.createMany({
      data: chunk.map(({ parentCommentId: _p, ...row }) => row),
    });
    process.stdout.write(
      `\r  ↳ comments: ${Math.min(i + chunk.length, commentRows.length)}/${commentRows.length}`
    );
  }
  console.log(`\n  ✓ ${commentRows.length} comments`);

  const createdCommentIds = (
    await db.comment.findMany({
      where: { userId: { in: qaUserIds } },
      select: { id: true },
      take: commentRows.length + 100,
      orderBy: { createdAt: "desc" },
    })
  ).map((c) => c.id);

  const parentComments = await db.comment.findMany({
    where: { parentCommentId: null },
    select: { id: true, reviewId: true },
    take: 5000,
  });
  const replyRows = [];
  for (let i = 0; i < QA_EXTENSION_TARGETS.commentReplies; i++) {
    const parent = rng.pick(parentComments);
    replyRows.push({
      reviewId: parent.reviewId,
      userId: rng.pick(qaUserIds),
      parentCommentId: parent.id,
      body: composeOriginalComment(rng, "the thread above"),
      moderationStatus: "OK" as const,
      createdAt: hoursAgo(rng.int(1, 24 * 30)),
    });
  }
  await createManyInChunks("commentReplies", replyRows, 100, (chunk) =>
    db.comment.createMany({ data: chunk })
  );

  const likeKeys = new Set<string>();
  const likeRows = [];
  while (likeRows.length < QA_EXTENSION_TARGETS.likes) {
    const review = rng.pick(allReviewIds);
    const userId = rng.pick(qaUserIds);
    if (review.userId === userId) continue;
    const key = `${userId}:${review.id}`;
    if (likeKeys.has(key)) continue;
    likeKeys.add(key);
    likeRows.push({ userId, reviewId: review.id, createdAt: hoursAgo(rng.int(1, 24 * 45)) });
  }
  await createManyInChunks("likes", likeRows, 250, (chunk) =>
    db.like.createMany({ data: chunk, skipDuplicates: true })
  );

  const commentLikeKeys = new Set<string>();
  const allComments = await db.comment.findMany({ select: { id: true, userId: true }, take: 5000 });
  const commentLikeRows = [];
  while (commentLikeRows.length < QA_EXTENSION_TARGETS.commentLikes) {
    const comment = rng.pick(allComments);
    const userId = rng.pick(qaUserIds);
    if (comment.userId === userId) continue;
    const key = `${userId}:${comment.id}`;
    if (commentLikeKeys.has(key)) continue;
    commentLikeKeys.add(key);
    commentLikeRows.push({ userId, commentId: comment.id });
  }
  await createManyInChunks("commentLikes", commentLikeRows, 200, (chunk) =>
    db.commentLike.createMany({ data: chunk, skipDuplicates: true })
  );

  const followKeys = new Set<string>();
  const followRows = [];
  const allUserIds = (await db.user.findMany({ select: { id: true } })).map((u) => u.id);
  while (followRows.length < QA_EXTENSION_TARGETS.follows) {
    const followerId = rng.pick(allUserIds);
    const followingId = rng.pick(allUserIds);
    if (followerId === followingId) continue;
    const key = `${followerId}:${followingId}`;
    if (followKeys.has(key)) continue;
    followKeys.add(key);
    followRows.push({
      followerId,
      followingId,
      createdAt: daysAgo(rng.int(1, 120)),
    });
  }
  await createManyInChunks("follows", followRows, 200, (chunk) =>
    db.follow.createMany({ data: chunk, skipDuplicates: true })
  );

  const folderIdByIndex: string[] = [];
  const folderSpecs = [];
  for (let i = 0; i < QA_EXTENSION_TARGETS.folders; i++) {
    folderSpecs.push({
      userId: rng.pick(qaUserIds),
      name: rng.pick([
        "Night reads",
        "Completed favourites",
        "Slow burns",
        "Cultivation climbs",
        "Comfort rereads",
        "Maybe later",
        "Strong casts",
        "TBR queue",
      ]) + (rng.chance(0.3) ? ` ${rng.int(2, 40)}` : ""),
      description: "QA extension shelf for admin testing.",
      isPublic: rng.chance(0.5),
    });
  }
  for (let i = 0; i < folderSpecs.length; i += 50) {
    const chunk = folderSpecs.slice(i, i + 50);
    await db.$transaction(async (tx) => {
      for (const spec of chunk) {
        const folder = await tx.folder.create({ data: spec, select: { id: true } });
        folderIdByIndex.push(folder.id);
      }
    });
  }
  console.log(`  ✓ ${folderIdByIndex.length} folders`);

  const folderItemKeys = new Set<string>();
  const folderItemRows = [];
  while (folderItemRows.length < QA_EXTENSION_TARGETS.folderItems) {
    const folderId = rng.pick(folderIdByIndex);
    const reviewId = rng.pick(allReviewIds).id;
    const key = `${folderId}:${reviewId}`;
    if (folderItemKeys.has(key)) continue;
    folderItemKeys.add(key);
    folderItemRows.push({ folderId, reviewId });
  }
  await createManyInChunks("folderItems", folderItemRows, 200, (chunk) =>
    db.folderReview.createMany({ data: chunk, skipDuplicates: true })
  );

  const notificationRows = [];
  for (let i = 0; i < QA_EXTENSION_TARGETS.notifications; i++) {
    const review = rng.pick(allReviewIds);
    notificationRows.push({
      userId: review.userId,
      type: rng.pick([
        NotificationType.REVIEW_LIKE,
        NotificationType.COMMENT_ON_REVIEW,
        NotificationType.NEW_FOLLOWER,
        NotificationType.REVIEW_SAVED,
      ]),
      message: rng.pick([
        "Someone liked your review.",
        "New comment on your review.",
        "You have a new follower.",
        "Your review was saved to a folder.",
      ]),
      link: `/reviews/${review.id}`,
      isRead: rng.chance(0.4),
      createdAt: hoursAgo(rng.int(1, 24 * 14)),
    });
  }
  await createManyInChunks("notifications", notificationRows, 150, (chunk) =>
    db.notification.createMany({ data: chunk })
  );

  const readingStatusKeys = new Set<string>();
  const readingStatusRows = [];
  while (readingStatusRows.length < QA_EXTENSION_TARGETS.readingStatuses) {
    const userId = rng.pick(qaUserIds);
    const novelId = rng.pick(novelMeta).id;
    const key = `${userId}:${novelId}`;
    if (readingStatusKeys.has(key)) continue;
    readingStatusKeys.add(key);
    readingStatusRows.push({
      userId,
      novelId,
      status: rng.pick([
        ReadingStatusValue.WANT,
        ReadingStatusValue.READING,
        ReadingStatusValue.FINISHED,
      ]),
    });
  }
  await createManyInChunks("readingStatuses", readingStatusRows, 200, (chunk) =>
    db.novelReadingStatus.createMany({ data: chunk, skipDuplicates: true })
  );

  const admin = await db.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  const reportReasons = [
    "Spam or promotional content",
    "Harassment or abusive language",
    "Spoiler without warning",
    "Off-topic or low-effort",
    "Suspected fake account",
  ];
  const reportRows: Array<{
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    status: ReportStatus;
    resolvedById?: string;
    resolution?: string;
    createdAt: Date;
  }> = [];

  function pushReports(count: number, status: ReportStatus) {
    for (let i = 0; i < count; i++) {
      const targetRoll = rng.next();
      let targetType: ReportTargetType = "REVIEW";
      let targetId = rng.pick(allReviewIds).id;
      if (targetRoll > 0.55) {
        targetType = "COMMENT";
        targetId = rng.pick(allComments).id;
      } else if (targetRoll > 0.85) {
        targetType = "USER";
        targetId = rng.pick(qaUserIds);
      }
      reportRows.push({
        reporterId: rng.pick(qaUserIds),
        targetType,
        targetId,
        reason: rng.pick(reportReasons),
        status,
        resolvedById: status !== "OPEN" && admin ? admin.id : undefined,
        resolution: status !== "OPEN" ? rng.pick(["Removed content", "No violation found", "User warned"]) : undefined,
        createdAt: daysAgo(rng.int(1, 45)),
      });
    }
  }
  pushReports(QA_EXTENSION_TARGETS.reportsOpen, "OPEN");
  pushReports(QA_EXTENSION_TARGETS.reportsResolved, "RESOLVED");
  pushReports(QA_EXTENSION_TARGETS.reportsDismissed, "DISMISSED");
  await createManyInChunks("reports", reportRows, 80, (chunk) =>
    db.report.createMany({ data: chunk })
  );

  const tagSuggestionNames = [
    "slow romance arc",
    "dungeon economist",
    "found family vibes",
    "political marriage",
    "crafting focus",
    "villain redemption",
    "academy rivals",
    "ghost mentor",
    "time loop mystery",
    "cozy horror",
  ];
  const tagRows = [];
  const statuses: Array<{ status: TagSuggestionStatus; count: number }> = [
    { status: "PENDING", count: QA_EXTENSION_TARGETS.tagSuggestionsPending },
    { status: "APPROVED", count: QA_EXTENSION_TARGETS.tagSuggestionsApproved },
    { status: "REJECTED", count: QA_EXTENSION_TARGETS.tagSuggestionsRejected },
    { status: "MAPPED", count: QA_EXTENSION_TARGETS.tagSuggestionsMapped },
  ];
  for (const { status, count } of statuses) {
    for (let i = 0; i < count; i++) {
      const raw = `${rng.pick(tagSuggestionNames)} ${rng.int(1, 99)}`;
      tagRows.push({
        name: raw,
        normalizedName: normalizeTagName(raw),
        compactKey: tagCompactKey(raw),
        status,
        suggestedByUserId: rng.pick(qaUserIds),
        novelId: rng.chance(0.7) ? rng.pick(novelMeta).id : null,
        reason: "Suggested while reading for admin QA dataset.",
        reviewedByUserId: status !== "PENDING" && admin ? admin.id : null,
        reviewedAt: status !== "PENDING" ? daysAgo(rng.int(1, 20)) : null,
        rejectionReason: status === "REJECTED" ? "Duplicate of existing tag" : null,
        resolvedTagId: status === "MAPPED" ? rng.pick(tags).id : null,
        createdAt: daysAgo(rng.int(1, 30)),
      });
    }
  }
  await createManyInChunks("tagSuggestions", tagRows, 50, (chunk) =>
    db.tagSuggestion.createMany({ data: chunk })
  );

  const readingLinkRows = [];
  const linkStatuses: Array<{ status: ReadingLinkModerationStatus; count: number }> = [
    { status: "PENDING", count: QA_EXTENSION_TARGETS.readingLinksPending },
    { status: "NEEDS_REVIEW", count: QA_EXTENSION_TARGETS.readingLinksNeedsReview },
    { status: "REJECTED", count: QA_EXTENSION_TARGETS.readingLinksRejected },
  ];
  for (const { status, count } of linkStatuses) {
    for (let i = 0; i < count; i++) {
      const novel = rng.pick(novelMeta);
      const suffix = rng.int(1000, 9999);
      readingLinkRows.push({
        novelId: novel.id,
        submittedByUserId: rng.pick(qaUserIds),
        platform: rng.pick(["Community", "Fan scan", "Reader forum"]),
        url: `https://example-qa.moonverse.dev/read/${novel.id.slice(-6)}/${suffix}`,
        normalizedUrl: `https://example-qa.moonverse.dev/read/${novel.id.slice(-6)}/${suffix}`,
        category: ReadingLinkCategory.COMMUNITY,
        label: "QA community submission",
        moderationStatus: status,
        isOfficial: false,
        isVerified: false,
        rejectionReason: status === "REJECTED" ? "Unverified source" : null,
        active: status !== "REJECTED",
        createdAt: daysAgo(rng.int(1, 25)),
      });
    }
  }
  await createManyInChunks("readingLinks", readingLinkRows, 40, (chunk) =>
    db.readingLink.createMany({ data: chunk, skipDuplicates: true })
  );

  const moonieConversationIds: string[] = [];
  for (let i = 0; i < QA_EXTENSION_TARGETS.moonieConversations; i++) {
    const conv = await db.moonieConversation.create({
      data: {
        userId: rng.pick(qaUserIds),
        title: rng.pick(["Find me a cozy xianxia", "Something like my last read", "Short sci-fi picks"]),
        createdAt: daysAgo(rng.int(1, 14)),
      },
      select: { id: true },
    });
    moonieConversationIds.push(conv.id);
    const msgCount = rng.int(2, 6);
    for (let m = 0; m < msgCount; m++) {
      await db.moonieMessage.create({
        data: {
          conversationId: conv.id,
          role: m % 2 === 0 ? "user" : "assistant",
          content: m % 2 === 0 ? "Can you recommend something character-driven?" : "Here are a few titles that match your taste profile.",
          createdAt: hoursAgo(rng.int(1, 24 * 10)),
        },
      });
    }
  }
  console.log(`  ✓ ${moonieConversationIds.length} Moonie conversations`);

  const moonieEventRows = [];
  const intents = ["discover", "lookup", "compare", "mood", "similar"];
  for (let i = 0; i < QA_EXTENSION_TARGETS.moonieEvents; i++) {
    const event = rng.pick(["recommend", "recommend", "recommend", "rate_limit", "helpful", "not_helpful"]);
    const responseKind = rng.pick(["novel_bundle", "compare", "clarification"]);
    moonieEventRows.push({
      userId: rng.pick(qaUserIds),
      event,
      novelId: rng.chance(0.6) ? rng.pick(novelMeta).id : null,
      meta: {
        intent: rng.pick(intents),
        responseKind,
        resultCount: rng.int(0, 6),
        clarification: responseKind === "clarification",
        success: rng.chance(0.88),
        confidenceTier: rng.pick(["high", "medium", "low"]),
      },
      createdAt: daysAgo(rng.int(0, 7)),
    });
  }
  await createManyInChunks("moonieEvents", moonieEventRows, 120, (chunk) =>
    db.moonieRecommendationEvent.createMany({ data: chunk })
  );

  if (admin) {
    const auditRows = [];
    for (let i = 0; i < QA_EXTENSION_TARGETS.auditLogs; i++) {
      auditRows.push({
        actorId: admin.id,
        action: rng.pick([
          "review.hide",
          "review.restore",
          "comment.delete",
          "user.suspend",
          "reading_link.approve",
          "tag_suggestion.approve",
        ]),
        entityType: rng.pick(["Review", "Comment", "User", "ReadingLink", "TagSuggestion"]),
        entityId: rng.pick([...allReviewIds.map((r) => r.id), ...qaUserIds]),
        meta: { source: "admin-qa-extension" },
        createdAt: daysAgo(rng.int(1, 60)),
      });
    }
    await createManyInChunks("auditLogs", auditRows, 50, (chunk) =>
      db.moderationAuditLog.createMany({ data: chunk })
    );
  }

  // Sync denormalized review counts
  const reviewsToSync = await db.review.findMany({
    where: { userId: { in: qaUserIds } },
    select: { id: true },
  });
  for (let i = 0; i < reviewsToSync.length; i += 60) {
    const batch = reviewsToSync.slice(i, i + 60);
    await db.$transaction(async (tx) => {
      await Promise.all(
        batch.map(async (review) => {
          const [likeCount, commentCount, saveCount] = await Promise.all([
            tx.like.count({ where: { reviewId: review.id } }),
            tx.comment.count({ where: { reviewId: review.id } }),
            tx.folderReview.count({ where: { reviewId: review.id } }),
          ]);
          await tx.review.update({
            where: { id: review.id },
            data: { likeCount, commentCount, saveCount },
          });
        })
      );
    });
  }

  const after = await countEntities();
  mkdirSync(MANIFEST_DIR, { recursive: true });
  const manifest = {
    generatedAt: new Date().toISOString(),
    policy:
      "Additive Admin QA extension for development only. Synthetic users at @moonverse.qa with original composed review/comment text.",
    usersAdded: qaToAdd,
    before,
    after,
    cohortDistribution: {
      inactive: qaUserSpecs.filter((u) => u.cohort === "inactive").length,
      lurker: qaUserSpecs.filter((u) => u.cohort === "lurker").length,
      casual: qaUserSpecs.filter((u) => u.cohort === "casual").length,
      active: qaUserSpecs.filter((u) => u.cohort === "active").length,
      power: qaUserSpecs.filter((u) => u.cohort === "power").length,
    },
    durationMs: Date.now() - started,
  };
  writeFileSync(join(MANIFEST_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log("\n✅ Admin QA extension import complete");
  console.log(`   Users: ${before.users} → ${after.users}`);
  console.log(`   Reviews: ${before.reviews} → ${after.reviews}`);
  console.log(`   Comments: ${before.comments} → ${after.comments}`);
  console.log(`   Open reports: ${after.reportsOpen}`);
  console.log(`   Pending tag suggestions: ${after.tagSuggestionsPending}`);
  console.log(`   Duration: ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(`   Manifest: prisma/data/admin-qa/manifest.json`);
  console.log(`   Demo login (QA users): *@${QA_EXTENSION_EMAIL_DOMAIN} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("❌ Admin QA extension failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
