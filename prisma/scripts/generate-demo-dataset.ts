/**
 * Generates production-load seed data as JSONL under prisma/data/demo/.
 *
 * - REAL novel metadata only (curated web novels + Open Library records)
 * - ORIGINAL review text (never scraped)
 * - VERIFIED official reading links only
 *
 * Usage:
 *   npm run demo:generate
 *   npm run demo:generate -- --batch 1
 *   npm run demo:generate -- --batch full
 *   npm run demo:load          # generate full + seed Postgres
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRng } from "../lib/demo/rng";
import { generateDemoUsers } from "../lib/demo/names";
import {
  composeEditorialSynopsis,
  composeOriginalComment,
  composeOriginalReview,
  pickDifficulty,
  pickLengthBand,
} from "../lib/demo/review-composer";
import {
  buildRealWorldCatalog,
  loadRealWorldCatalogFromFile,
  type SeedCatalogEntry,
} from "../lib/novel-catalog";
import { fetchBooksBySubject } from "../lib/open-library";
import { GENRE_SEED_DATA } from "../../src/lib/genres";
import { GENRE_TAG_SLUGS, TAG_SEED_DATA } from "../../src/lib/tags";
import { normalizeReadingUrl } from "../../src/lib/normalize-url";
import { inferPlatformFromUrl } from "../../src/lib/reading-platforms";
import { resolveVerifiedReadingUrls } from "../lib/verified-reading-links";

const OUT_DIR = join(process.cwd(), "prisma/data/demo");

/** Full production-load target. */
const FULL_TARGET = {
  users: 100,
  novels: 1000,
  reviews: 2000,
  comments: 800,
  likes: 4000,
  follows: 250,
  folders: 100,
  folderItems: 450,
  notifications: 300,
} as const;

/**
 * Cumulative batches (users scale with novels so early batches stay coherent).
 * Batch 1: 20 users / 200 novels / 400 reviews
 * …
 * Batch 5: 100 users / 1000 novels / 2000 reviews
 */
const BATCH_PLAN = [
  { users: 20, novels: 200, reviews: 400 },
  { users: 40, novels: 400, reviews: 800 },
  { users: 60, novels: 600, reviews: 1200 },
  { users: 80, novels: 800, reviews: 1600 },
  { users: 100, novels: 1000, reviews: 2000 },
] as const;

const SUBJECT_QUERIES = [
  { subject: "fantasy", limit: 140, genre: "fantasy" },
  { subject: "science_fiction", limit: 120, genre: "sci-fi" },
  { subject: "romance", limit: 120, genre: "romance" },
  { subject: "horror", limit: 90, genre: "horror" },
  { subject: "adventure", limit: 90, genre: "adventure" },
  { subject: "mystery", limit: 80, genre: "mystery" },
  { subject: "young_adult", limit: 80, genre: "ya" },
  { subject: "historical_fiction", limit: 70, genre: "historical" },
  { subject: "thriller", limit: 70, genre: "thriller" },
  { subject: "humor", limit: 50, genre: "comedy" },
  { subject: "war", limit: 40, genre: "military" },
  { subject: "sports", limit: 40, genre: "sports" },
  { subject: "crime", limit: 50, genre: "crime" },
  { subject: "family", limit: 40, genre: "family" },
  { subject: "time_travel", limit: 40, genre: "time-travel" },
  { subject: "supernatural", limit: 50, genre: "supernatural" },
  { subject: "urban_fiction", limit: 40, genre: "urban" },
  { subject: "psychological_fiction", limit: 40, genre: "psychological" },
  { subject: "drama", limit: 40, genre: "drama" },
  { subject: "gaming", limit: 30, genre: "gaming" },
] as const;

const WEB_NOVEL_GENRE_CYCLE = [
  "xianxia", "wuxia", "murim", "cultivation", "system", "reincarnation",
  "regression", "transmigration", "villainess", "apocalypse", "bl", "gl",
  "lgbtq", "school-life", "virtual-reality", "isekai", "litrpg", "action",
  "adventure", "military", "crime", "sports", "family", "drama",
] as const;

const MIN_REVIEWS_PER_NOVEL = 2;
const MAX_REVIEWS_PER_NOVEL = 8;

function parseBatchArg(): number | "full" {
  const idx = process.argv.indexOf("--batch");
  if (idx === -1) return "full";
  const raw = process.argv[idx + 1];
  if (!raw || raw === "full") return "full";
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return "full";
  return Math.min(n, BATCH_PLAN.length);
}

function targetForBatch(batch: number | "full") {
  if (batch === "full") return { ...FULL_TARGET };
  const plan = BATCH_PLAN[batch - 1];
  const ratio = plan.reviews / FULL_TARGET.reviews;
  return {
    users: plan.users,
    novels: plan.novels,
    reviews: plan.reviews,
    comments: Math.round(FULL_TARGET.comments * ratio),
    likes: Math.round(FULL_TARGET.likes * ratio),
    follows: Math.round(FULL_TARGET.follows * ratio),
    folders: Math.round(FULL_TARGET.folders * ratio),
    folderItems: Math.round(FULL_TARGET.folderItems * ratio),
    notifications: Math.round(FULL_TARGET.notifications * ratio),
  };
}

function writeJsonl(path: string, rows: unknown[]) {
  writeFileSync(path, rows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
}

function genreSlugOrFallback(slug: string): string {
  return GENRE_SEED_DATA.some((g) => g.slug === slug) ? slug : "fantasy";
}

/**
 * Verified OFFICIAL publisher URLs only.
 * Never invents NovelUpdates / Open Library / Webnovel placeholders.
 */
function resolveReadingUrlsForNovel(
  title: string,
  entry: SeedCatalogEntry
): string[] {
  return resolveVerifiedReadingUrls(title, [
    entry.externalLink,
    ...(entry.readingUrls ?? []),
  ]);
}

function inferLanguage(tagSlugs: string[], origin: string): string {
  if (tagSlugs.includes("chinese-original") || tagSlugs.includes("translated-cn")) return "zh";
  if (tagSlugs.includes("korean-original") || tagSlugs.includes("translated-kr")) return "ko";
  if (tagSlugs.includes("japanese-original") || tagSlugs.includes("translated-jp")) return "ja";
  if (origin === "royal-road" || tagSlugs.includes("english-original")) return "en";
  return "en";
}

function inferPublisher(urls: string[]): string | null {
  for (const url of urls) {
    const inferred = inferPlatformFromUrl(url);
    if (inferred?.category === "OFFICIAL") return inferred.label;
  }
  const any = urls.map(inferPlatformFromUrl).find(Boolean);
  return any?.label ?? null;
}

/**
 * Assign only tags that fit the novel's genres / origin.
 * Never spray unrelated tags just to fill tag pages.
 */
function assignGenuineTags(
  novelRows: Array<{
    tagSlugs: string[];
    genreSlug: string;
    secondaryGenreSlug?: string;
    origin?: string;
  }>,
  rng: ReturnType<typeof createRng>
) {
  const valid = new Set(TAG_SEED_DATA.map((t) => t.slug));

  for (const novel of novelRows) {
    const fromGenres = [
      ...(GENRE_TAG_SLUGS[novel.genreSlug] ?? []),
      ...(novel.secondaryGenreSlug
        ? GENRE_TAG_SLUGS[novel.secondaryGenreSlug] ?? []
        : []),
    ].filter((slug) => valid.has(slug));

    const originTags: string[] = [];
    if (novel.origin === "translated-cn") {
      originTags.push("translated-cn", "chinese-original");
    }
    if (novel.origin === "royal-road") {
      originTags.push("english-original", "royal-road");
    }

    const pool = rng.shuffle([...new Set([...fromGenres, ...originTags])]);
    novel.tagSlugs = pool.slice(0, rng.int(3, Math.min(6, pool.length || 3)));
    if (novel.tagSlugs.length === 0 && fromGenres[0]) {
      novel.tagSlugs = [fromGenres[0]];
    }
  }
}

/** Every novel gets 2–10 reviews; extras concentrate on popular titles. */
function buildReviewSlots(
  novelCount: number,
  targetReviews: number,
  rng: ReturnType<typeof createRng>,
  popularFlags: boolean[]
): number[] {
  const slots = Array.from({ length: novelCount }, () => MIN_REVIEWS_PER_NOVEL);
  let remaining = Math.max(0, targetReviews - novelCount * MIN_REVIEWS_PER_NOVEL);

  const popularIdx = popularFlags
    .map((flag, i) => (flag ? i : -1))
    .filter((i) => i >= 0);
  const otherIdx = rng.shuffle(
    popularFlags.map((flag, i) => (!flag ? i : -1)).filter((i) => i >= 0)
  );

  // Fill popular novels toward the high end first.
  for (const i of rng.shuffle(popularIdx)) {
    while (remaining > 0 && slots[i] < MAX_REVIEWS_PER_NOVEL) {
      const bump = Math.min(
        remaining,
        rng.int(2, 4),
        MAX_REVIEWS_PER_NOVEL - slots[i]
      );
      slots[i] += bump;
      remaining -= bump;
    }
    if (remaining <= 0) break;
  }

  let cursor = 0;
  while (remaining > 0 && cursor < otherIdx.length * 20) {
    const i = otherIdx[cursor % otherIdx.length];
    const cap = 5;
    if (slots[i] < cap) {
      slots[i] += 1;
      remaining -= 1;
    }
    cursor += 1;
  }

  return slots;
}

async function expandCatalog(
  targetNovels: number,
  rng: ReturnType<typeof createRng>
): Promise<SeedCatalogEntry[]> {
  const fromFile = loadRealWorldCatalogFromFile();
  const built = buildRealWorldCatalog();
  const byTitle = new Map<string, SeedCatalogEntry>();

  for (const n of [...(fromFile ?? []), ...built]) {
    byTitle.set(n.title.toLowerCase(), n);
  }

  console.log(`  Catalog base: ${byTitle.size} real-world titles`);

  try {
    for (const { subject, limit, genre } of SUBJECT_QUERIES) {
      if (byTitle.size >= targetNovels) break;
      const genreSlug = genreSlugOrFallback(genre);
      const books = await fetchBooksBySubject(subject, limit);
      for (const book of books) {
        const key = book.title.toLowerCase();
        if (byTitle.has(key)) continue;
        const secondary = rng.chance(0.5)
          ? genreSlugOrFallback(rng.pick(WEB_NOVEL_GENRE_CYCLE))
          : undefined;
        byTitle.set(key, {
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          // Open Library is metadata only: not an official reading source.
          externalLink: "",
          genreSlug,
          secondaryGenreSlug: secondary && secondary !== genreSlug ? secondary : undefined,
          tagSlugs: (GENRE_TAG_SLUGS[genreSlug] ?? []).slice(0, 3),
          readingUrls: [],
          origin: "open-library",
        });
        if (byTitle.size >= targetNovels) break;
      }
      console.log(`    · ${subject}: catalog now ${byTitle.size}`);
      await new Promise((r) => setTimeout(r, 180));
    }
  } catch (error) {
    console.warn("  Open Library expand failed; continuing with base catalog.", error);
  }

  const list = [...byTitle.values()];
  let cycle = 0;
  for (let i = 0; i < list.length; i += 11) {
    const slug = genreSlugOrFallback(WEB_NOVEL_GENRE_CYCLE[cycle % WEB_NOVEL_GENRE_CYCLE.length]);
    if (!list[i].secondaryGenreSlug) list[i].secondaryGenreSlug = slug;
    else if (rng.chance(0.3)) list[i].genreSlug = slug;
    cycle += 1;
  }

  return list.slice(0, targetNovels);
}

function ratingFromDistribution(rng: ReturnType<typeof createRng>): number {
  const roll = rng.next();
  if (roll < 0.07) return 1;
  if (roll < 0.16) return 2;
  if (roll < 0.34) return 3;
  if (roll < 0.72) return 4;
  return 5;
}

function controversialRating(rng: ReturnType<typeof createRng>): number {
  return rng.chance(0.5) ? rng.pick([1, 2] as const) : rng.pick([4, 5] as const);
}

async function main() {
  const started = Date.now();
  mkdirSync(OUT_DIR, { recursive: true });
  const batch = parseBatchArg();
  const TARGET = targetForBatch(batch);
  const rng = createRng(20260716);

  console.log("🌙 Generating MoonVerse production-feel development dataset…");
  console.log(
    `   Batch: ${batch === "full" ? "full" : `${batch}/${BATCH_PLAN.length}`} → ${TARGET.users} users, ${TARGET.novels} novels, ${TARGET.reviews} reviews`
  );
  console.log(`   Constraint: ${MIN_REVIEWS_PER_NOVEL}–${MAX_REVIEWS_PER_NOVEL} reviews per novel\n`);

  const users = generateDemoUsers(rng, TARGET.users);
  writeJsonl(join(OUT_DIR, "users.jsonl"), users);
  console.log(`  ✓ ${users.length} users (${new Set(users.map((u) => u.persona)).size} personas)`);

  const novels = await expandCatalog(TARGET.novels, rng);
  const novelRows = novels.map((n, index) => {
    const tagSlugs = [
      ...new Set([
        ...(n.tagSlugs ?? []),
        ...((GENRE_TAG_SLUGS[n.genreSlug] ?? []).slice(0, 3)),
      ]),
    ].slice(0, 6);
    const readingUrls = resolveReadingUrlsForNovel(n.title, n);
    const genreSlug = genreSlugOrFallback(n.genreSlug);
    const secondaryGenreSlug = n.secondaryGenreSlug
      ? genreSlugOrFallback(n.secondaryGenreSlug)
      : undefined;
    const originalLanguage = inferLanguage(tagSlugs, n.origin);
    const publicationStatus = rng.pick(["Ongoing", "Completed", "Hiatus"] as const);
    const publisher = inferPublisher(readingUrls);
    const synopsis = composeEditorialSynopsis(
      n.title,
      n.author,
      [genreSlug, secondaryGenreSlug].filter(Boolean) as string[],
      tagSlugs,
      rng
    );

    return {
      key: `novel-${index}`,
      title: n.title,
      author: n.author,
      coverUrl: n.coverUrl,
      externalLink: readingUrls[0] ?? "",
      genreSlug,
      secondaryGenreSlug,
      tagSlugs,
      readingUrls,
      origin: n.origin,
      synopsis,
      originalLanguage,
      publicationStatus,
      publisher,
      controversial: rng.chance(0.09),
      popular: rng.chance(0.14),
    };
  });

  assignGenuineTags(novelRows, rng);
  writeJsonl(join(OUT_DIR, "novels.jsonl"), novelRows);
  console.log(`  ✓ ${novelRows.length} novels (real metadata + genre-matched tags)`);

  const reviewSlots = buildReviewSlots(
    novelRows.length,
    TARGET.reviews,
    rng,
    novelRows.map((n) => n.popular || n.controversial)
  );
  const plannedReviews = reviewSlots.reduce((a, b) => a + b, 0);
  console.log(
    `  · review slots planned: ${plannedReviews} (min ${Math.min(...reviewSlots)}, max ${Math.max(...reviewSlots)})`
  );

  const usedBodies = new Set<string>();
  const usedTitles = new Set<string>();
  const usedPairs = new Set<string>();
  const reviews: Array<Record<string, unknown>> = [];

  let reviewIndex = 0;
  for (let novelIndex = 0; novelIndex < novelRows.length; novelIndex++) {
    const novel = novelRows[novelIndex];
    const count = reviewSlots[novelIndex];
    const translated = novel.tagSlugs.some((t) =>
      ["translated-cn", "translated-jp", "translated-kr", "chinese-original"].includes(t)
    );

    for (let r = 0; r < count; r++) {
      let userIndex = rng.int(0, users.length - 1);
      let guard = 0;
      let pair = `${novel.key}:${userIndex}`;
      while (usedPairs.has(pair) && guard++ < 80) {
        userIndex = rng.int(0, users.length - 1);
        pair = `${novel.key}:${userIndex}`;
      }
      if (usedPairs.has(pair)) continue;
      usedPairs.add(pair);

      const featured = reviewIndex < Math.floor(plannedReviews * 0.07);
      const rating = novel.controversial
        ? controversialRating(rng)
        : ratingFromDistribution(rng);
      const style = users[userIndex]?.writingStyle ?? "casual";
      const lengthBand = pickLengthBand(rng, featured);
      const spoiler = rng.chance(0.11);
      const difficulty = pickDifficulty(rng, [
        novel.genreSlug,
        novel.secondaryGenreSlug,
      ].filter(Boolean) as string[]);

      let composed = composeOriginalReview(
        {
          title: novel.title,
          author: novel.author,
          genres: [novel.genreSlug, novel.secondaryGenreSlug].filter(Boolean) as string[],
          rating,
          featured,
          style,
          lengthBand,
          spoiler,
          difficulty,
          tagLabels: novel.tagSlugs.slice(0, 3),
          translated,
        },
        rng
      );

      let attempts = 0;
      while (
        (usedBodies.has(composed.body) || usedTitles.has(composed.title)) &&
        attempts++ < 12
      ) {
        composed = composeOriginalReview(
          {
            title: novel.title,
            author: novel.author,
            genres: [novel.genreSlug],
            rating,
            featured,
            style,
            lengthBand,
            spoiler,
            difficulty,
            tagLabels: novel.tagSlugs.slice(0, 2),
            translated,
          },
          rng
        );
        composed.title = `${composed.title} (${rng.int(2, 99)})`;
      }
      if (usedBodies.has(composed.body) || usedTitles.has(composed.title)) continue;
      usedBodies.add(composed.body);
      usedTitles.add(composed.title);

      reviews.push({
        key: `review-${reviewIndex}`,
        novelKey: novel.key,
        userIndex,
        title: composed.title,
        body: composed.body,
        rating,
        createdOffsetHours: rng.int(1, 24 * 420),
        featured,
        style: composed.style,
        lengthBand: composed.lengthBand,
        spoiler: composed.spoiler,
        difficulty: composed.difficulty,
        positives: composed.positives,
        negatives: composed.negatives,
        recommendedFor: composed.recommendedFor,
        favouriteCharacter: composed.favouriteCharacter,
        favouriteArc: composed.favouriteArc,
        pacingOpinion: composed.pacingOpinion,
        writingQuality: composed.writingQuality,
        translationQuality: composed.translationQuality,
        tagSlugs: spoiler ? ["spoilers", ...novel.tagSlugs.slice(0, 2)] : novel.tagSlugs.slice(0, 3),
      });
      reviewIndex += 1;
      if (reviewIndex % 500 === 0) console.log(`    · composed ${reviewIndex} reviews…`);
    }
  }

  // Top-up if uniqueness skips left us short of planned slots
  while (reviews.length < Math.min(TARGET.reviews, plannedReviews)) {
    const novelIndex = rng.int(0, novelRows.length - 1);
    const novel = novelRows[novelIndex];
    const userIndex = rng.int(0, users.length - 1);
    const pair = `${novel.key}:${userIndex}`;
    if (usedPairs.has(pair)) continue;
    const existingForNovel = reviews.filter((r) => r.novelKey === novel.key).length;
    if (existingForNovel >= MAX_REVIEWS_PER_NOVEL) continue;
    usedPairs.add(pair);
    const rating = ratingFromDistribution(rng);
    const composed = composeOriginalReview(
      {
        title: novel.title,
        author: novel.author,
        genres: [novel.genreSlug],
        rating,
        featured: false,
        style: users[userIndex]?.writingStyle ?? "casual",
        lengthBand: pickLengthBand(rng, false),
        spoiler: false,
        difficulty: pickDifficulty(rng, [novel.genreSlug]),
        tagLabels: novel.tagSlugs.slice(0, 2),
        translated: novel.tagSlugs.includes("translated-cn"),
      },
      rng
    );
    composed.title = `${composed.title} #${reviews.length}`;
    if (usedBodies.has(composed.body) || usedTitles.has(composed.title)) continue;
    usedBodies.add(composed.body);
    usedTitles.add(composed.title);
    reviews.push({
      key: `review-${reviews.length}`,
      novelKey: novel.key,
      userIndex,
      title: composed.title,
      body: composed.body,
      rating,
      createdOffsetHours: rng.int(1, 24 * 420),
      featured: false,
      style: composed.style,
      lengthBand: composed.lengthBand,
      spoiler: false,
      difficulty: composed.difficulty,
      positives: composed.positives,
      negatives: composed.negatives,
      recommendedFor: composed.recommendedFor,
      favouriteCharacter: composed.favouriteCharacter,
      favouriteArc: composed.favouriteArc,
      pacingOpinion: composed.pacingOpinion,
      writingQuality: composed.writingQuality,
      translationQuality: composed.translationQuality,
      tagSlugs: novel.tagSlugs.slice(0, 3),
    });
  }

  const capped = reviews.slice(0, Math.max(plannedReviews, Math.floor(TARGET.reviews * 0.95)));
  writeJsonl(join(OUT_DIR, "reviews.jsonl"), capped);

  const perNovel = new Map<string, number>();
  for (const r of capped) {
    const k = String(r.novelKey);
    perNovel.set(k, (perNovel.get(k) ?? 0) + 1);
  }
  const uncovered = novelRows.filter((n) => (perNovel.get(n.key) ?? 0) < MIN_REVIEWS_PER_NOVEL);
  if (uncovered.length) {
    console.warn(`  ⚠ ${uncovered.length} novels below ${MIN_REVIEWS_PER_NOVEL} reviews`);
  }

  const spoilerNovels = new Set(
    capped.filter((r) => r.spoiler).map((r) => String(r.novelKey))
  );
  for (const novel of novelRows) {
    if (spoilerNovels.has(novel.key) && !novel.tagSlugs.includes("spoilers")) {
      novel.tagSlugs = [...novel.tagSlugs, "spoilers"].slice(0, 8);
    }
  }
  writeJsonl(join(OUT_DIR, "novels.jsonl"), novelRows);

  const avgWords = Math.round(
    capped.reduce((sum, r) => sum + String(r.body).trim().split(/\s+/).length, 0) /
      Math.max(1, capped.length)
  );
  const lengthCounts = { short: 0, medium: 0, long: 0 };
  for (const r of capped) {
    lengthCounts[r.lengthBand as keyof typeof lengthCounts] += 1;
  }
  console.log(
    `  ✓ ${capped.length} original reviews (avg ~${avgWords} words; short/med/long ${lengthCounts.short}/${lengthCounts.medium}/${lengthCounts.long})`
  );

  const comments = [];
  for (let i = 0; i < TARGET.comments; i++) {
    const review = rng.pick(capped);
    const novel = novelRows.find((n) => n.key === review.novelKey)!;
    comments.push({
      reviewKey: review.key,
      userIndex: rng.int(0, users.length - 1),
      body: composeOriginalComment(rng, novel.title),
      createdOffsetHours: rng.int(0, Number(review.createdOffsetHours)),
    });
  }
  writeJsonl(join(OUT_DIR, "comments.jsonl"), comments);

  const likeKeys = new Set<string>();
  const likes = [];
  while (likes.length < TARGET.likes) {
    const review = rng.pick(capped);
    const userIndex = rng.int(0, users.length - 1);
    if (userIndex === review.userIndex) continue;
    const key = `${userIndex}:${review.key}`;
    if (likeKeys.has(key)) continue;
    likeKeys.add(key);
    likes.push({ userIndex, reviewKey: review.key });
  }
  writeJsonl(join(OUT_DIR, "likes.jsonl"), likes);

  const followKeys = new Set<string>();
  const follows = [];
  while (follows.length < TARGET.follows) {
    const a = rng.int(0, users.length - 1);
    const b = rng.int(0, users.length - 1);
    if (a === b) continue;
    const key = `${a}:${b}`;
    if (followKeys.has(key)) continue;
    followKeys.add(key);
    follows.push({ followerIndex: a, followingIndex: b });
  }
  writeJsonl(join(OUT_DIR, "follows.jsonl"), follows);

  const folders = [];
  for (let i = 0; i < TARGET.folders; i++) {
    folders.push({
      key: `folder-${i}`,
      userIndex: rng.int(0, users.length - 1),
      name:
        rng.pick([
          "Night reads",
          "Completed favourites",
          "Slow burns",
          "Cultivation climbs",
          "Comfort rereads",
          "Maybe later",
          "Strong casts",
          "Worldbuilding first",
          "Controversial shelf",
          "Quick wins",
        ]) + (rng.chance(0.35) ? ` ${rng.int(2, 20)}` : ""),
      description: "Personal shelf for MoonVerse development browsing.",
      isPublic: rng.chance(0.55),
    });
  }
  writeJsonl(join(OUT_DIR, "folders.jsonl"), folders);

  const folderItems = [];
  const folderItemKeys = new Set<string>();
  while (folderItems.length < TARGET.folderItems) {
    const folder = rng.pick(folders);
    const review = rng.pick(capped);
    const key = `${folder.key}:${review.key}`;
    if (folderItemKeys.has(key)) continue;
    folderItemKeys.add(key);
    folderItems.push({ folderKey: folder.key, reviewKey: review.key });
  }
  writeJsonl(join(OUT_DIR, "folder-items.jsonl"), folderItems);

  const notifications = [];
  for (let i = 0; i < TARGET.notifications; i++) {
    const review = rng.pick(capped);
    notifications.push({
      userIndex: review.userIndex,
      type: rng.pick([
        "REVIEW_LIKE",
        "COMMENT_ON_REVIEW",
        "NEW_FOLLOWER",
        "REVIEW_SAVED",
      ]),
      message: rng.pick([
        "Someone liked your review.",
        "New comment on your review.",
        "You have a new follower.",
        "Your review was saved to a folder.",
      ]),
      reviewKey: review.key,
    });
  }
  writeJsonl(join(OUT_DIR, "notifications.jsonl"), notifications);

  const readingLinkHints = novelRows.flatMap((novel) => {
    const urls = [...new Set((novel.readingUrls ?? []).filter(Boolean))];
    return urls
      .map((url) => {
        const normalizedUrl = normalizeReadingUrl(url);
        const inferred = inferPlatformFromUrl(url);
        // Official publishers only: never NovelUpdates / Open Library.
        if (!normalizedUrl || !inferred || inferred.category !== "OFFICIAL") {
          return null;
        }
        return {
          novelKey: novel.key,
          url,
          normalizedUrl,
          platform: inferred.platform,
          category: "OFFICIAL" as const,
          label: inferred.label,
          isOfficial: true,
        };
      })
      .filter(Boolean);
  });
  writeJsonl(join(OUT_DIR, "reading-links.jsonl"), readingLinkHints);
  console.log(
    `  ✓ ${readingLinkHints.length} verified official reading links (novels without sources stay empty)`
  );

  const tagCoverage: Record<string, number> = {};
  for (const tag of TAG_SEED_DATA) {
    tagCoverage[tag.slug] = novelRows.filter((n) => n.tagSlugs.includes(tag.slug)).length;
  }
  const usedTags = Object.entries(tagCoverage).filter(([, c]) => c > 0).length;
  console.log(`  ✓ tags assigned by genre match (${usedTags}/${TAG_SEED_DATA.length} tags in use)`);

  const genreCounts: Record<string, number> = {};
  for (const n of novelRows) {
    genreCounts[n.genreSlug] = (genreCounts[n.genreSlug] ?? 0) + 1;
    if (n.secondaryGenreSlug) {
      genreCounts[n.secondaryGenreSlug] = (genreCounts[n.secondaryGenreSlug] ?? 0) + 1;
    }
  }

  const manifest = {
    version: 3,
    generatedAt: new Date().toISOString(),
    batch,
    policy:
      "Reviews and comments are original MoonVerse demo text. Not scraped from Goodreads, NovelUpdates, Reddit or any other review site. Novel titles/authors/covers use real catalog or Open Library metadata. Synopses are original MoonVerse editorial blurbs.",
    targets: TARGET,
    actual: {
      users: users.length,
      novels: novelRows.length,
      reviews: capped.length,
      comments: comments.length,
      likes: likes.length,
      follows: follows.length,
      folders: folders.length,
      folderItems: folderItems.length,
      notifications: notifications.length,
      readingLinks: readingLinkHints.length,
      averageReviewWords: avgWords,
      lengthBands: lengthCounts,
      spoilerReviews: capped.filter((r) => r.spoiler).length,
      reviewsPerNovelMin: Math.min(...[...perNovel.values(), MIN_REVIEWS_PER_NOVEL]),
      reviewsPerNovelMax: Math.max(...[...perNovel.values(), 0]),
      novelsBelowMinReviews: uncovered.length,
      tagsInUse: usedTags,
    },
    tagCoverage,
    genreCounts,
    genres: GENRE_SEED_DATA.map((g) => g.slug),
    tags: TAG_SEED_DATA.map((t) => t.slug),
    durationMs: Date.now() - started,
  };
  writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log("\n✅ Development dataset generated");
  console.log(`   Output: ${OUT_DIR}`);
  console.log(`   Reviews/novel: ${manifest.actual.reviewsPerNovelMin}–${manifest.actual.reviewsPerNovelMax}`);
  console.log(`   Duration: ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log("   Next: npm run prisma:seed:demo");
}

main().catch((error) => {
  console.error("❌ generate-demo-dataset failed:", error);
  process.exit(1);
});
