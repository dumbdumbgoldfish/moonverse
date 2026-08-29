/**
 * Imports prisma/data/demo/*.jsonl into the development database.
 *
 * Reviews and comments are original generated text (not scraped).
 * Novels use real catalog / Open Library metadata where available.
 *
 * Safe to re-run: wipes community tables then imports inside batched transactions.
 *
 * Usage:
 *   npm run demo:generate
 *   npm run prisma:seed:demo
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { NotificationType, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { GENRE_SEED_DATA } from "../src/lib/genres";
import { TAG_SEED_DATA, tagKindForSlug } from "../src/lib/tags";
import { clearDatabase } from "./lib/seed-helpers";
import { enrichCatalogue } from "./lib/catalogue-enrichment";

const db = new PrismaClient();
const DEMO_DIR = join(process.cwd(), "prisma/data/demo");
const DEMO_PASSWORD = "Password123!";

function readJsonl<T>(name: string): T[] {
  const path = join(DEMO_DIR, name);
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}. Run: npm run demo:generate`);
  }
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

async function createManyInChunks<T extends Record<string, unknown>>(
  label: string,
  rows: T[],
  chunkSize: number,
  write: (chunk: T[]) => Promise<unknown>
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await write(chunk);
    process.stdout.write(
      `\r  ↳ ${label}: ${Math.min(i + chunk.length, rows.length)}/${rows.length}`
    );
  }
  console.log("");
}

async function main() {
  const started = Date.now();
  console.log("🌙 Importing MoonVerse development dataset…\n");

  const manifestPath = join(DEMO_DIR, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error("Demo dataset missing. Run: npm run demo:generate");
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    policy: string;
    actual: Record<string, number>;
    batch?: number | string;
  };
  console.log(`  Policy: ${manifest.policy}`);
  if (manifest.batch !== undefined) console.log(`  Batch: ${manifest.batch}`);
  console.log("");

  // Full wipe makes re-runs idempotent for development.
  await clearDatabase(db);

  const genres = await Promise.all(
    GENRE_SEED_DATA.map((g) => db.genre.create({ data: g }))
  );
  const genreBySlug = Object.fromEntries(genres.map((g) => [g.slug, g]));
  const tags = await Promise.all(
    TAG_SEED_DATA.map((t) =>
      db.tag.create({ data: { ...t, kind: tagKindForSlug(t.slug) } })
    )
  );
  const tagBySlug = Object.fromEntries(tags.map((t) => [t.slug, t]));
  console.log(`  ✓ ${genres.length} genres, ${tags.length} tags`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const userSpecs = readJsonl<{
    email: string;
    username: string;
    displayName: string;
    bio: string;
    avatarUrl?: string;
    readingPreferences?: string;
    joinOffsetDays: number;
    role?: "USER" | "ADMIN";
  }>("users.jsonl");

  const now = Date.now();
  await createManyInChunks("users", userSpecs, 50, (chunk) =>
    db.user.createMany({
      data: chunk.map((u) => ({
        email: u.email,
        username: u.username,
        displayName: u.displayName,
        bio: u.readingPreferences
          ? `${u.bio}\nPreferences: ${u.readingPreferences}`
          : u.bio,
        avatarUrl: u.avatarUrl ?? null,
        passwordHash,
        role: u.role === "ADMIN" ? "ADMIN" : "USER",
        createdAt: new Date(now - u.joinOffsetDays * 24 * 60 * 60 * 1000),
      })),
      skipDuplicates: true,
    })
  );
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, email: true },
  });
  // Stable index order matching generator order (createdAt asc with unique offsets).
  const userIdByIndex = users.map((u) => u.id);
  console.log(`  ✓ ${users.length} users`);

  const novelSpecs = readJsonl<{
    key: string;
    title: string;
    author: string;
    coverUrl: string | null;
    externalLink: string;
    genreSlug: string;
    secondaryGenreSlug?: string;
    tagSlugs: string[];
    synopsis?: string | null;
    originalLanguage?: string | null;
    publicationStatus?: string | null;
    publisher?: string | null;
  }>("novels.jsonl");

  const novelIdByKey = new Map<string, string>();
  for (let i = 0; i < novelSpecs.length; i += 25) {
    const chunk = novelSpecs.slice(i, i + 25);
    await db.$transaction(async (tx) => {
      const created = await Promise.all(
        chunk.map((novel) => {
          const genreConnect = [
            { id: genreBySlug[novel.genreSlug]?.id ?? genreBySlug.fantasy.id },
            ...(novel.secondaryGenreSlug && genreBySlug[novel.secondaryGenreSlug]
              ? [{ id: genreBySlug[novel.secondaryGenreSlug].id }]
              : []),
          ];
          const tagConnect = (novel.tagSlugs ?? [])
            .map((slug) => tagBySlug[slug]?.id)
            .filter(Boolean)
            .map((id) => ({ id: id as string }));

          return tx.novel.create({
            data: {
              title: novel.title,
              author: novel.author,
              coverUrl: novel.coverUrl,
              externalLink: novel.externalLink,
              synopsis: novel.synopsis ?? null,
              originalLanguage: novel.originalLanguage ?? null,
              publicationStatus: novel.publicationStatus ?? null,
              publisher: novel.publisher ?? null,
              genres: { connect: genreConnect },
              tags: tagConnect.length ? { connect: tagConnect } : undefined,
            },
            select: { id: true },
          });
        })
      );
      chunk.forEach((novel, idx) => novelIdByKey.set(novel.key, created[idx].id));
    });
    process.stdout.write(
      `\r  ↳ novels: ${Math.min(i + chunk.length, novelSpecs.length)}/${novelSpecs.length}`
    );
  }
  console.log(`\n  ✓ ${novelIdByKey.size} novels`);

  const readingLinks = readJsonl<{
    novelKey: string;
    url: string;
    normalizedUrl: string;
    platform: string;
    category: "OFFICIAL" | "COMMUNITY" | "FAN_TRANSLATION";
    label: string;
    isOfficial?: boolean;
  }>("reading-links.jsonl");

  const linkRows = [];
  const seenLink = new Set<string>();
  for (const link of readingLinks) {
    const novelId = novelIdByKey.get(link.novelKey);
    if (!novelId) continue;
    // Seed only official publisher links into “Where to read”.
    if (link.category !== "OFFICIAL") continue;
    const key = `${novelId}:${link.normalizedUrl}`;
    if (seenLink.has(key)) continue;
    seenLink.add(key);
    linkRows.push({
      novelId,
      platform: link.platform,
      url: link.url,
      normalizedUrl: link.normalizedUrl,
      category: "OFFICIAL" as const,
      label: link.label,
      language: "en",
      active: true,
      moderationStatus: "APPROVED" as const,
      isOfficial: true,
      isVerified: true,
    });
  }
  await createManyInChunks("readingLinks", linkRows, 100, (chunk) =>
    db.readingLink.createMany({ data: chunk, skipDuplicates: true })
  );

  const reviewSpecs = readJsonl<{
    key: string;
    novelKey: string;
    userIndex: number;
    title: string;
    body: string;
    rating: number;
    createdOffsetHours: number;
  }>("reviews.jsonl");

  const reviewIdByKey = new Map<string, string>();
  const usedPair = new Set<string>();
  for (let i = 0; i < reviewSpecs.length; i += 40) {
    const chunk = reviewSpecs.slice(i, i + 40);
    await db.$transaction(async (tx) => {
      const created = await Promise.all(
        chunk.map(async (review) => {
          const novelId = novelIdByKey.get(review.novelKey);
          const userId = userIdByIndex[review.userIndex];
          if (!novelId || !userId) return null;
          const pair = `${novelId}:${userId}`;
          if (usedPair.has(pair)) return null;
          usedPair.add(pair);
          return tx.review.create({
            data: {
              novelId,
              userId,
              title: review.title,
              body: review.body,
              rating: review.rating,
              createdAt: new Date(now - review.createdOffsetHours * 60 * 60 * 1000),
            },
            select: { id: true },
          });
        })
      );
      chunk.forEach((review, idx) => {
        const row = created[idx];
        if (row) reviewIdByKey.set(review.key, row.id);
      });
    });
    process.stdout.write(
      `\r  ↳ reviews: ${Math.min(i + chunk.length, reviewSpecs.length)}/${reviewSpecs.length}`
    );
  }
  console.log(`\n  ✓ ${reviewIdByKey.size} reviews`);

  const commentSpecs = readJsonl<{
    reviewKey: string;
    userIndex: number;
    body: string;
    createdOffsetHours: number;
  }>("comments.jsonl");
  const commentRows = commentSpecs
    .map((c) => {
      const reviewId = reviewIdByKey.get(c.reviewKey);
      const userId = userIdByIndex[c.userIndex];
      if (!reviewId || !userId) return null;
      return {
        reviewId,
        userId,
        body: c.body,
        createdAt: new Date(now - c.createdOffsetHours * 60 * 60 * 1000),
      };
    })
    .filter(Boolean) as Array<{
    reviewId: string;
    userId: string;
    body: string;
    createdAt: Date;
  }>;
  await createManyInChunks("comments", commentRows, 100, (chunk) =>
    db.comment.createMany({ data: chunk })
  );

  const likeSpecs = readJsonl<{ userIndex: number; reviewKey: string }>("likes.jsonl");
  const likeRows = likeSpecs
    .map((l) => {
      const reviewId = reviewIdByKey.get(l.reviewKey);
      const userId = userIdByIndex[l.userIndex];
      if (!reviewId || !userId) return null;
      return { reviewId, userId };
    })
    .filter(Boolean) as Array<{ reviewId: string; userId: string }>;
  await createManyInChunks("likes", likeRows, 200, (chunk) =>
    db.like.createMany({ data: chunk, skipDuplicates: true })
  );

  const followSpecs = readJsonl<{
    followerIndex: number;
    followingIndex: number;
  }>("follows.jsonl");
  await createManyInChunks(
    "follows",
    followSpecs
      .map((f) => ({
        followerId: userIdByIndex[f.followerIndex],
        followingId: userIdByIndex[f.followingIndex],
      }))
      .filter((f) => f.followerId && f.followingId && f.followerId !== f.followingId),
    100,
    (chunk) => db.follow.createMany({ data: chunk, skipDuplicates: true })
  );

  const folderSpecs = readJsonl<{
    key: string;
    userIndex: number;
    name: string;
    description: string;
    isPublic: boolean;
  }>("folders.jsonl");
  const folderIdByKey = new Map<string, string>();
  for (let i = 0; i < folderSpecs.length; i += 40) {
    const chunk = folderSpecs.slice(i, i + 40);
    await db.$transaction(async (tx) => {
      for (const folder of chunk) {
        const userId = userIdByIndex[folder.userIndex];
        if (!userId) continue;
        const created = await tx.folder.create({
          data: {
            userId,
            name: folder.name,
            description: folder.description,
            isPublic: folder.isPublic,
          },
          select: { id: true },
        });
        folderIdByKey.set(folder.key, created.id);
      }
    });
  }
  console.log(`  ✓ ${folderIdByKey.size} folders`);

  const folderItems = readJsonl<{ folderKey: string; reviewKey: string }>(
    "folder-items.jsonl"
  );
  await createManyInChunks(
    "folderItems",
    folderItems
      .map((item) => {
        const folderId = folderIdByKey.get(item.folderKey);
        const reviewId = reviewIdByKey.get(item.reviewKey);
        if (!folderId || !reviewId) return null;
        return { folderId, reviewId };
      })
      .filter(Boolean) as Array<{ folderId: string; reviewId: string }>,
    150,
    (chunk) => db.folderReview.createMany({ data: chunk, skipDuplicates: true })
  );

  const reviewIds = [...reviewIdByKey.values()];
  for (let i = 0; i < reviewIds.length; i += 80) {
    const batch = reviewIds.slice(i, i + 80);
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
    process.stdout.write(
      `\r  ↳ sync counts: ${Math.min(i + batch.length, reviewIds.length)}/${reviewIds.length}`
    );
  }
  console.log("");

  const notificationSpecs = readJsonl<{
    userIndex: number;
    type: string;
    message: string;
    reviewKey: string;
  }>("notifications.jsonl");
  await createManyInChunks(
    "notifications",
    notificationSpecs
      .map((n) => {
        const userId = userIdByIndex[n.userIndex];
        const reviewId = reviewIdByKey.get(n.reviewKey);
        if (!userId) return null;
        return {
          userId,
          type: (NotificationType as Record<string, NotificationType>)[n.type] ??
            NotificationType.REVIEW_LIKE,
          message: n.message,
          link: reviewId ? `/reviews/${reviewId}` : "/notifications",
        };
      })
      .filter(Boolean) as Array<{
      userId: string;
      type: NotificationType;
      message: string;
      link: string;
    }>,
    100,
    (chunk) => db.notification.createMany({ data: chunk })
  );

  const [userCount, novelCount, reviewCount, linkCount] = await Promise.all([
    db.user.count(),
    db.novel.count(),
    db.review.count(),
    db.readingLink.count(),
  ]);
  const sample = await db.review.findMany({ take: 80, select: { body: true, rating: true } });
  const avgWords = Math.round(
    sample.reduce((sum, r) => sum + r.body.trim().split(/\s+/).length, 0) /
      Math.max(1, sample.length)
  );

  await enrichCatalogue(db);

  const { seedVerifiedNovelSeries } = await import("./lib/seed-novel-series");
  const seriesResult = await seedVerifiedNovelSeries(db);
  console.log(
    `   Verified series seeded: ${seriesResult.seeded} (skipped entries: ${seriesResult.skipped})`
  );

  console.log("\n✅ Development import complete");
  console.log(`   Users: ${userCount}`);
  console.log(`   Novels: ${novelCount}`);
  console.log(`   Reviews: ${reviewCount}`);
  console.log(`   Reading links: ${linkCount}`);
  console.log(`   Avg review length (sample): ~${avgWords} words`);
  console.log(`   Duration: ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(`   Demo login: ${userSpecs[0]?.email} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("❌ seed-demo failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
