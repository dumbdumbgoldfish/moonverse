/**
 * MoonVerse Admin QA content extension — novels, reviews, comments, replies, likes.
 *
 * Additive phase-2 import on top of the user extension. Spreads activity across ~180 days
 * for meaningful admin charts.
 *
 * Usage:
 *   npm run demo:seed:admin-qa-content -- --dry-run
 *   npm run demo:seed:admin-qa-content -- --confirm
 *   npm run demo:seed:admin-qa-content -- --confirm --force
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ContentModerationStatus,
  NotificationType,
  PrismaClient,
} from "@prisma/client";
import { createRng } from "../lib/demo/rng";
import {
  QA_CONTENT_MANIFEST_VERSION,
  QA_CONTENT_RNG_SEED,
  QA_CONTENT_TARGETS,
} from "../lib/demo/qa-content-targets";
import {
  buildSyntheticNovelSeeds,
  catalogEntryToSeed,
  type NovelSeed,
} from "../lib/demo/qa-content-novels";
import {
  qaActivityTimestamp,
  reviewerWeight,
  weightedPick,
} from "../lib/demo/qa-time-distribution";
import { QA_EXTENSION_TARGETS } from "../lib/demo/qa-extension-targets";
import {
  composeEditorialSynopsis,
  composeOriginalComment,
  composeOriginalReview,
  pickDifficulty,
  pickLengthBand,
} from "../lib/demo/review-composer";
import {
  buildRealWorldCatalog,
  mergeCatalogEntries,
} from "../lib/novel-catalog";
import { fallbackCoverUrl } from "../lib/open-library";

const db = new PrismaClient();
const MANIFEST_DIR = join(process.cwd(), "prisma/data/admin-qa");
const CONTENT_MANIFEST_PATH = join(MANIFEST_DIR, "content-manifest.json");

function parseArgs() {
  return {
    confirm: process.argv.includes("--confirm"),
    dryRun: process.argv.includes("--dry-run"),
    force: process.argv.includes("--force"),
  };
}

function ratingFromDistribution(rng: ReturnType<typeof createRng>): number {
  const roll = rng.next();
  if (roll < 0.06) return 1;
  if (roll < 0.14) return 2;
  if (roll < 0.32) return 3;
  if (roll < 0.7) return 4;
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

interface ContentManifest {
  version: number;
  generatedAt: string;
  policy: string;
  before: Record<string, number>;
  after: Record<string, number>;
  created: Record<string, number>;
  durationMs: number;
}

function loadContentManifest(): ContentManifest | null {
  if (!existsSync(CONTENT_MANIFEST_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CONTENT_MANIFEST_PATH, "utf8")) as ContentManifest;
  } catch {
    return null;
  }
}

async function countEntities() {
  const [
    users,
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

  return {
    users,
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
  };
}

type ReviewStyle = "beginner" | "casual" | "analytical" | "emotional" | "humorous" | "veteran";

function styleForUser(reviewCount: number, rng: ReturnType<typeof createRng>): ReviewStyle {
  if (reviewCount >= 10) return rng.pick(["analytical", "veteran", "emotional"]);
  if (reviewCount >= 4) return rng.pick(["casual", "analytical", "humorous"]);
  if (reviewCount >= 1) return rng.pick(["beginner", "casual", "emotional"]);
  return rng.pick(["beginner", "casual"]);
}

async function syncReviewCounts(reviewIds: string[]) {
  for (let i = 0; i < reviewIds.length; i += 50) {
    const batch = reviewIds.slice(i, i + 50);
    await db.$transaction(async (tx) => {
      await Promise.all(
        batch.map(async (reviewId) => {
          const [likeCount, commentCount, saveCount] = await Promise.all([
            tx.like.count({ where: { reviewId } }),
            tx.comment.count({ where: { reviewId } }),
            tx.folderReview.count({ where: { reviewId } }),
          ]);
          await tx.review.update({
            where: { id: reviewId },
            data: { likeCount, commentCount, saveCount },
          });
        })
      );
    });
  }
}

async function syncCommentLikeCounts(commentIds: string[]) {
  for (let i = 0; i < commentIds.length; i += 80) {
    const batch = commentIds.slice(i, i + 80);
    await db.$transaction(async (tx) => {
      await Promise.all(
        batch.map(async (commentId) => {
          const likeCount = await tx.commentLike.count({ where: { commentId } });
          await tx.comment.update({ where: { id: commentId }, data: { likeCount } });
        })
      );
    });
  }
}

async function main() {
  const { confirm, dryRun, force } = parseArgs();
  const started = Date.now();

  console.log("🌙 MoonVerse Admin QA content extension\n");
  console.log("  Development/demo data only — not for production.\n");

  if (!confirm && !dryRun) {
    console.error("  Refusing to run without --confirm.");
    console.error("  Backup first, then: npm run demo:seed:admin-qa-content -- --confirm");
    process.exit(1);
  }

  const existingManifest = loadContentManifest();
  if (existingManifest?.version === QA_CONTENT_MANIFEST_VERSION && !force) {
    console.log("  ✓ Content extension already imported (content-manifest.json).");
    console.log("  Use --force to run again.");
    await db.$disconnect();
    return;
  }

  const before = await countEntities();
  console.log(`  Before: ${before.novels} novels, ${before.reviews} reviews, ${before.comments} comments`);

  if (dryRun) {
    console.log("\n  Dry run — would add:");
    console.log(`    Novels:           +${QA_CONTENT_TARGETS.novels}`);
    console.log(`    Reviews:          +${QA_CONTENT_TARGETS.reviews}`);
    console.log(`    Comments:         +${QA_CONTENT_TARGETS.topLevelComments}`);
    console.log(`    Replies:          +${QA_CONTENT_TARGETS.commentReplies}`);
    console.log(`    Review likes:     +${QA_CONTENT_TARGETS.reviewLikes}`);
    console.log(`    Comment likes:    +${QA_CONTENT_TARGETS.commentLikes}`);
    console.log(`    Folder saves:     +${QA_CONTENT_TARGETS.folderSaves}`);
    console.log(`    Notifications:    +${QA_CONTENT_TARGETS.notifications}`);
    await db.$disconnect();
    return;
  }

  const rng = createRng(QA_CONTENT_RNG_SEED);

  const genres = await db.genre.findMany({ select: { id: true, slug: true } });
  const genreBySlug = Object.fromEntries(genres.map((g) => [g.slug, g.id]));
  const tags = await db.tag.findMany({ select: { id: true, slug: true } });
  const tagBySlug = Object.fromEntries(tags.map((t) => [t.slug, t.id]));

  const existingNovelTitles = new Set(
    (
      await db.novel.findMany({ select: { title: true } })
    ).map((n) => n.title.toLowerCase().trim())
  );

  const catalog = mergeCatalogEntries(buildRealWorldCatalog(), []);
  const catalogSeeds: NovelSeed[] = [];
  for (const entry of catalog) {
    const key = entry.title.toLowerCase().trim();
    if (existingNovelTitles.has(key)) continue;
    existingNovelTitles.add(key);
    catalogSeeds.push(catalogEntryToSeed(entry));
    if (catalogSeeds.length >= QA_CONTENT_TARGETS.novels) break;
  }

  const syntheticNeeded = Math.max(0, QA_CONTENT_TARGETS.novels - catalogSeeds.length);
  const syntheticSeeds = buildSyntheticNovelSeeds(rng, syntheticNeeded, existingNovelTitles);
  const novelSeeds = [...catalogSeeds, ...syntheticSeeds].slice(0, QA_CONTENT_TARGETS.novels);

  const newNovelIds: string[] = [];
  for (let i = 0; i < novelSeeds.length; i += 20) {
    const chunk = novelSeeds.slice(i, i + 20);
    await db.$transaction(async (tx) => {
      for (const seed of chunk) {
        const genreConnect = [
          { id: genreBySlug[seed.genreSlug] ?? genreBySlug.fantasy },
          ...(seed.secondaryGenreSlug && genreBySlug[seed.secondaryGenreSlug]
            ? [{ id: genreBySlug[seed.secondaryGenreSlug] }]
            : []),
        ].filter((g) => g.id);
        const tagConnect = seed.tagSlugs
          .map((slug) => tagBySlug[slug])
          .filter(Boolean)
          .map((id) => ({ id: id as string }));

        const coverKey = seed.title.replace(/\s+/g, "-").toLowerCase();
        const created = await tx.novel.create({
          data: {
            title: seed.title,
            author: seed.author,
            coverUrl: fallbackCoverUrl(`qa-${coverKey}`),
            externalLink: seed.externalLink || null,
            synopsis:
              seed.synopsis ||
              composeEditorialSynopsis(
                seed.title,
                seed.author,
                [seed.genreSlug, ...(seed.secondaryGenreSlug ? [seed.secondaryGenreSlug] : [])],
                seed.tagSlugs,
                rng
              ),
            metadataSource: "admin-qa-content-v1",
            genres: { connect: genreConnect },
            tags: tagConnect.length ? { connect: tagConnect } : undefined,
            createdAt: qaActivityTimestamp(rng, QA_CONTENT_TARGETS.activityWindowDays),
          },
          select: { id: true },
        });
        newNovelIds.push(created.id);
      }
    });
    process.stdout.write(
      `\r  ↳ novels: ${Math.min(i + chunk.length, novelSeeds.length)}/${novelSeeds.length}`
    );
  }
  console.log(`\n  ✓ ${newNovelIds.length} novels`);

  const allNovels = await db.novel.findMany({
    select: {
      id: true,
      title: true,
      author: true,
      genres: { select: { slug: true } },
      tags: { select: { slug: true } },
    },
  });
  const novelMeta = allNovels.map((n) => ({
    id: n.id,
    title: n.title,
    author: n.author ?? "Unknown",
    genreSlugs: n.genres.map((g) => g.slug),
    tagSlugs: n.tags.map((t) => t.slug),
    isNew: newNovelIds.includes(n.id),
  }));

  const users = await db.user.findMany({
    select: { id: true, username: true },
  });
  const reviewCounts = await db.review.groupBy({
    by: ["userId"],
    _count: { _all: true },
  });
  const reviewCountByUser = Object.fromEntries(
    reviewCounts.map((r) => [r.userId, r._count._all])
  );

  const userPool = users.map((u) => ({
    id: u.id,
    username: u.username,
    reviewCount: reviewCountByUser[u.id] ?? 0,
    weight: reviewerWeight(reviewCountByUser[u.id] ?? 0),
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
    containsSpoilers: boolean;
    moderationStatus: ContentModerationStatus;
    createdAt: Date;
  }> = [];

  const usedBodies = new Set<string>();
  const usedTitles = new Set<string>();
  let attempts = 0;
  const maxAttempts = QA_CONTENT_TARGETS.reviews * 25;

  while (reviewRows.length < QA_CONTENT_TARGETS.reviews && attempts++ < maxAttempts) {
    const user = weightedPick(
      rng,
      userPool,
      userPool.map((u) => u.weight)
    );
    const novel = weightedPick(
      rng,
      novelMeta,
      novelMeta.map((n) => (n.isNew ? 2.4 : 1))
    );
    const pair = `${novel.id}:${user.id}`;
    if (usedPairs.has(pair)) continue;
    usedPairs.add(pair);

    const rating = ratingFromDistribution(rng);
    const style = styleForUser(user.reviewCount, rng);
    const lengthBand = pickLengthBand(rng, rng.chance(0.12));
    const spoiler = rng.chance(0.11);
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
      composed = {
        ...composed,
        title: `${composed.title} · ${user.username}`,
      };
    }
    usedBodies.add(composed.body);
    usedTitles.add(composed.title);

    const autoFlagged = rng.chance(QA_EXTENSION_TARGETS.autoFlaggedReviewFraction);
    reviewRows.push({
      novelId: novel.id,
      userId: user.id,
      title: composed.title,
      body: composed.body,
      rating,
      containsSpoilers: spoiler,
      moderationStatus: autoFlagged ? "AUTO_FLAGGED" : "OK",
      createdAt: qaActivityTimestamp(rng, QA_CONTENT_TARGETS.activityWindowDays),
    });
    user.reviewCount += 1;
    user.weight = reviewerWeight(user.reviewCount);
  }

  const createdReviewIds: string[] = [];
  for (let i = 0; i < reviewRows.length; i += 40) {
    const chunk = reviewRows.slice(i, i + 40);
    await db.$transaction(async (tx) => {
      for (const row of chunk) {
        const created = await tx.review.create({ data: row, select: { id: true } });
        createdReviewIds.push(created.id);
      }
    });
    process.stdout.write(
      `\r  ↳ reviews: ${Math.min(i + chunk.length, reviewRows.length)}/${reviewRows.length}`
    );
  }
  console.log(`\n  ✓ ${createdReviewIds.length} reviews`);

  const allReviews = await db.review.findMany({
    select: { id: true, userId: true, title: true, novel: { select: { title: true } } },
  });
  const reviewById = Object.fromEntries(allReviews.map((r) => [r.id, r]));

  const commentRows: Array<{
    reviewId: string;
    userId: string;
    body: string;
    moderationStatus: ContentModerationStatus;
    containsSpoilers: boolean;
    createdAt: Date;
  }> = [];

  const reviewWeights = allReviews.map((r) => {
    const ageBonus = createdReviewIds.includes(r.id) ? 1.2 : 1;
    return ageBonus;
  });

  for (let i = 0; i < QA_CONTENT_TARGETS.topLevelComments; i++) {
    const review = weightedPick(rng, allReviews, reviewWeights);
    let userId = rng.pick(users).id;
    let guard = 0;
    while (review.userId === userId && guard++ < 8) {
      userId = rng.pick(users).id;
    }
    const novelTitle = reviewById[review.id]?.novel.title ?? rng.pick(novelMeta).title;
    commentRows.push({
      reviewId: review.id,
      userId,
      body: composeOriginalComment(rng, novelTitle),
      containsSpoilers: rng.chance(0.04),
      moderationStatus: rng.chance(QA_EXTENSION_TARGETS.autoFlaggedCommentFraction)
        ? "AUTO_FLAGGED"
        : "OK",
      createdAt: qaActivityTimestamp(rng, QA_CONTENT_TARGETS.activityWindowDays),
    });
  }

  const createdTopLevelCommentIds: string[] = [];
  for (let i = 0; i < commentRows.length; i += 80) {
    const chunk = commentRows.slice(i, i + 80);
    const created = await db.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const row of chunk) {
        const comment = await tx.comment.create({ data: row, select: { id: true } });
        ids.push(comment.id);
      }
      return ids;
    });
    createdTopLevelCommentIds.push(...created);
    process.stdout.write(
      `\r  ↳ comments: ${Math.min(i + chunk.length, commentRows.length)}/${commentRows.length}`
    );
  }
  console.log(`\n  ✓ ${createdTopLevelCommentIds.length} top-level comments`);

  const replyParents = [
    ...createdTopLevelCommentIds.map((id) => ({ id, weight: 3 })),
    ...(
      await db.comment.findMany({
        where: { parentCommentId: null },
        select: { id: true },
        take: 4000,
      })
    ).map((c) => ({ id: c.id, weight: 1 })),
  ];

  const replyRows: Array<{
    reviewId: string;
    userId: string;
    parentCommentId: string;
    body: string;
    moderationStatus: ContentModerationStatus;
    containsSpoilers: boolean;
    createdAt: Date;
  }> = [];

  const parentMeta = await db.comment.findMany({
    where: { id: { in: replyParents.map((p) => p.id) } },
    select: { id: true, reviewId: true, userId: true },
  });
  const parentById = Object.fromEntries(parentMeta.map((p) => [p.id, p]));

  for (let i = 0; i < QA_CONTENT_TARGETS.commentReplies; i++) {
    const parent = weightedPick(
      rng,
      replyParents,
      replyParents.map((p) => p.weight)
    );
    const meta = parentById[parent.id];
    if (!meta) continue;
    let userId = rng.pick(users).id;
    let guard = 0;
    while (userId === meta.userId && guard++ < 8) {
      userId = rng.pick(users).id;
    }
    replyRows.push({
      reviewId: meta.reviewId,
      userId,
      parentCommentId: parent.id,
      body: composeOriginalComment(rng, "the thread above"),
      containsSpoilers: rng.chance(0.03),
      moderationStatus: "OK",
      createdAt: qaActivityTimestamp(rng, Math.min(120, QA_CONTENT_TARGETS.activityWindowDays)),
    });
  }

  const createdReplyIds: string[] = [];
  await createManyInChunks("replies", replyRows, 100, async (chunk) => {
    const ids = await db.$transaction(async (tx) => {
      const created: string[] = [];
      for (const row of chunk) {
        const comment = await tx.comment.create({ data: row, select: { id: true } });
        created.push(comment.id);
      }
      return created;
    });
    createdReplyIds.push(...ids);
  });

  const likeKeys = new Set<string>();
  const likeRows: Array<{ userId: string; reviewId: string; createdAt: Date }> = [];
  const reviewLikeWeights = allReviews.map((r) =>
    createdReviewIds.includes(r.id) ? 1.5 : 1
  );

  while (likeRows.length < QA_CONTENT_TARGETS.reviewLikes) {
    const review = weightedPick(rng, allReviews, reviewLikeWeights);
    const userId = rng.pick(users).id;
    if (review.userId === userId) continue;
    const key = `${userId}:${review.id}`;
    if (likeKeys.has(key)) continue;
    likeKeys.add(key);
    likeRows.push({
      userId,
      reviewId: review.id,
      createdAt: qaActivityTimestamp(rng, QA_CONTENT_TARGETS.activityWindowDays),
    });
  }
  await createManyInChunks("reviewLikes", likeRows, 300, (chunk) =>
    db.like.createMany({ data: chunk, skipDuplicates: true })
  );

  const allComments = await db.comment.findMany({
    select: { id: true, userId: true },
  });
  const commentLikeKeys = new Set<string>();
  const commentLikeRows: Array<{ userId: string; commentId: string; createdAt: Date }> = [];
  const newCommentIds = new Set([...createdTopLevelCommentIds, ...createdReplyIds]);
  const commentLikeWeights = allComments.map((c) => (newCommentIds.has(c.id) ? 2 : 1));

  while (commentLikeRows.length < QA_CONTENT_TARGETS.commentLikes) {
    const comment = weightedPick(rng, allComments, commentLikeWeights);
    const userId = rng.pick(users).id;
    if (comment.userId === userId) continue;
    const key = `${userId}:${comment.id}`;
    if (commentLikeKeys.has(key)) continue;
    commentLikeKeys.add(key);
    commentLikeRows.push({
      userId,
      commentId: comment.id,
      createdAt: qaActivityTimestamp(rng, QA_CONTENT_TARGETS.activityWindowDays),
    });
  }
  await createManyInChunks("commentLikes", commentLikeRows, 250, (chunk) =>
    db.commentLike.createMany({ data: chunk, skipDuplicates: true })
  );

  const folderIds = (await db.folder.findMany({ select: { id: true } })).map((f) => f.id);
  const folderItemKeys = new Set(
    (await db.folderReview.findMany({ select: { folderId: true, reviewId: true } })).map(
      (f) => `${f.folderId}:${f.reviewId}`
    )
  );
  const folderItemRows: Array<{ folderId: string; reviewId: string }> = [];
  while (folderItemRows.length < QA_CONTENT_TARGETS.folderSaves && folderIds.length > 0) {
    const folderId = rng.pick(folderIds);
    const review = weightedPick(rng, allReviews, reviewLikeWeights);
    const key = `${folderId}:${review.id}`;
    if (folderItemKeys.has(key)) continue;
    folderItemKeys.add(key);
    folderItemRows.push({ folderId, reviewId: review.id });
  }
  await createManyInChunks("folderSaves", folderItemRows, 250, (chunk) =>
    db.folderReview.createMany({ data: chunk, skipDuplicates: true })
  );

  const notificationRows: Array<{
    userId: string;
    type: NotificationType;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
  }> = [];

  for (let i = 0; i < QA_CONTENT_TARGETS.notifications; i++) {
    const review = weightedPick(rng, allReviews, reviewLikeWeights);
    const type = rng.pick([
      NotificationType.REVIEW_LIKE,
      NotificationType.COMMENT_ON_REVIEW,
      NotificationType.REVIEW_SAVED,
      NotificationType.NEW_FOLLOWER,
    ]);
    const messageByType: Record<NotificationType, string> = {
      [NotificationType.REVIEW_LIKE]: "Someone liked your review.",
      [NotificationType.COMMENT_ON_REVIEW]: "New comment on your review.",
      [NotificationType.REVIEW_SAVED]: "Your review was saved to a folder.",
      [NotificationType.NEW_FOLLOWER]: "You have a new follower.",
    } as Record<NotificationType, string>;

    notificationRows.push({
      userId: review.userId,
      type,
      message: messageByType[type] ?? "New activity on MoonVerse.",
      link: `/reviews/${review.id}`,
      isRead: rng.chance(0.42),
      createdAt: qaActivityTimestamp(rng, 90),
    });
  }
  await createManyInChunks("notifications", notificationRows, 200, (chunk) =>
    db.notification.createMany({ data: chunk })
  );

  const reviewsToSync = [
    ...new Set([
      ...createdReviewIds,
      ...commentRows.map((c) => c.reviewId),
      ...replyRows.map((r) => r.reviewId),
      ...likeRows.map((l) => l.reviewId),
      ...folderItemRows.map((f) => f.reviewId),
    ]),
  ];
  console.log(`  ↳ syncing ${reviewsToSync.length} review denormalized counts…`);
  await syncReviewCounts(reviewsToSync);

  const commentsToSync = [
    ...new Set([...createdTopLevelCommentIds, ...createdReplyIds, ...commentLikeRows.map((c) => c.commentId)]),
  ];
  console.log(`  ↳ syncing ${commentsToSync.length} comment like counts…`);
  await syncCommentLikeCounts(commentsToSync);

  const after = await countEntities();
  const created = {
    novels: after.novels - before.novels,
    reviews: after.reviews - before.reviews,
    comments: after.comments - before.comments,
    replies: after.replies - before.replies,
    likes: after.likes - before.likes,
    commentLikes: after.commentLikes - before.commentLikes,
    folderItems: after.folderItems - before.folderItems,
    notifications: after.notifications - before.notifications,
  };

  mkdirSync(MANIFEST_DIR, { recursive: true });
  const manifest: ContentManifest = {
    version: QA_CONTENT_MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    policy:
      "Additive Admin QA content extension. Novels, reviews, comments, replies, likes with 180-day activity spread.",
    before,
    after,
    created,
    durationMs: Date.now() - started,
  };
  writeFileSync(CONTENT_MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log("\n✅ Admin QA content extension complete");
  console.log(`   Novels:    ${before.novels} → ${after.novels} (+${created.novels})`);
  console.log(`   Reviews:   ${before.reviews} → ${after.reviews} (+${created.reviews})`);
  console.log(`   Comments:  ${before.comments} → ${after.comments} (+${created.comments})`);
  console.log(`   Replies:   ${before.replies} → ${after.replies} (+${created.replies})`);
  console.log(`   Likes:     ${before.likes} → ${after.likes} (+${created.likes})`);
  console.log(`   Duration:  ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(`   Manifest:  prisma/data/admin-qa/content-manifest.json`);
}

main()
  .catch((error) => {
    console.error("❌ Admin QA content extension failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
