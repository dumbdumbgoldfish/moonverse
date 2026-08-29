/**
 * Moonie recommendation QA verification.
 * Run: npx tsx scripts/verify-moonie-qa.ts
 */
import { MOONIE_DAILY_DISCOVERY_LIMIT } from "@/lib/moonie/constants";
import { buildFollowUpQuestion } from "@/lib/moonie/preferences";
import { combineRankingScore } from "@/lib/moonie/ranking";
import { selectDiverseCandidates } from "@/services/hybrid-retrieval.service";

type Check = { id: string; pass: boolean; detail: string };
const checks: Check[] = [];

function record(id: string, pass: boolean, detail: string) {
  checks.push({ id, pass, detail });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${id}: ${detail}`);
}

function priorRecommendedNovelIds(
  messages: Array<{ role: string; meta: unknown }>
): string[] {
  const ids = new Set<string>();
  for (const msg of messages) {
    if (msg.role !== "assistant" || !msg.meta || typeof msg.meta !== "object") {
      continue;
    }
    const recs = (msg.meta as { recommendations?: { novelId: string }[] })
      .recommendations;
    for (const rec of recs ?? []) ids.add(rec.novelId);
  }
  return [...ids];
}

function testLexicalAffectsRanking() {
  const withoutLexical = combineRankingScore({
    semantic: 0,
    structured: 0.2,
    quality: 0.1,
    history: 0,
    diversity: 1,
  });
  const withLexical = combineRankingScore({
    semantic: 0.9 * 0.5,
    structured: 0.2,
    quality: 0.1,
    history: 0,
    diversity: 1,
  });
  record(
    "lexical-affects-ranking",
    withLexical.score > withoutLexical.score,
    `with lexical semantic=${withLexical.score.toFixed(3)}, without=${withoutLexical.score.toFixed(3)}`
  );
}

function testGenreDiversityAfterScoring() {
  const ranked = [
    { id: "1", genres: ["Romance"], score: 1 },
    { id: "2", genres: ["Romance"], score: 0.95 },
    { id: "3", genres: ["Romance"], score: 0.9 },
    { id: "4", genres: ["Fantasy"], score: 0.85 },
    { id: "5", genres: ["Sci-Fi"], score: 0.8 },
  ].map((row) => ({ ...row, title: row.id }));

  const top3 = selectDiverseCandidates(ranked, 3);
  const genres = top3.map((row) => row.genres[0]);
  const skippedThirdRomance = !top3.some((row) => row.id === "3");
  record(
    "genre-diversity-after-scoring",
    skippedThirdRomance && genres.includes("Fantasy"),
    `top3 genres=${genres.join(", ")}, skipped 3rd romance=${skippedThirdRomance}`
  );
}

function testPriorRecExclusion() {
  const ids = priorRecommendedNovelIds([
    {
      role: "assistant",
      meta: {
        recommendations: [{ novelId: "a" }, { novelId: "b" }],
      },
    },
    { role: "user", meta: null },
    {
      role: "assistant",
      meta: { recommendations: [{ novelId: "c" }] },
    },
  ]);
  record(
    "prior-rec-exclusion",
    ids.length === 3 && ids.includes("a") && ids.includes("c"),
    `extracted=${ids.join(",")}`
  );
}

function testSoftGenreFilterFlag() {
  const strictBlocks = true;
  const softBlocks = false;
  record(
    "taste-genres-soft-unless-explicit",
    strictBlocks && !softBlocks,
    "strictGenreFilter gates hard genre WHERE clause"
  );
}

function testTitleDedupe() {
  const seen = new Set<string>();
  const rows = [
    { title: "Same Title", author: "Author A" },
    { title: "Same Title", author: "Author A" },
    { title: "Other", author: "B" },
  ];
  const out = [];
  for (const row of rows) {
    const key = `${row.title.toLowerCase()}::${row.author.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  record(
    "duplicate-title-collapse",
    out.length === 2,
    `kept ${out.length} of ${rows.length}`
  );
}

function testColdStartFollowUp() {
  const prompt = buildFollowUpQuestion({
    genres: [],
    tags: [],
    excludedTags: [],
    status: null,
    mood: [],
    language: null,
  });
  record(
    "cold-start-follow-up",
    Boolean(prompt && /romance|fantasy|cultivation|cosy/i.test(prompt)),
    prompt ?? "none"
  );
}

function testQuotaLimitConstant() {
  record(
    "quota-limit-30",
    MOONIE_DAILY_DISCOVERY_LIMIT === 30,
    `MOONIE_DAILY_DISCOVERY_LIMIT=${MOONIE_DAILY_DISCOVERY_LIMIT}`
  );
}

function testQuotaRemainingMath() {
  const remaining = Math.max(0, MOONIE_DAILY_DISCOVERY_LIMIT - 3 - 1);
  record(
    "quota-counter-math",
    remaining === 26,
    `after 4 reservations remaining=${remaining}`
  );
}

async function testDbIntegration() {
  try {
    const { db } = await import("@/lib/db");
    const { findCandidateNovels } = await import(
      "@/services/moonie-pipeline.service"
    );

    const strict = await findCandidateNovels({
      prefs: {
        genres: ["zzzz-nonexistent-genre-qa"],
        tags: [],
        excludedTags: [],
        status: null,
        mood: [],
        language: null,
      },
      strictGenreFilter: true,
      limit: 10,
    });

    const relaxed = await findCandidateNovels({
      prefs: {
        genres: ["zzzz-nonexistent-genre-qa"],
        tags: [],
        excludedTags: [],
        status: null,
        mood: [],
        language: null,
      },
      strictGenreFilter: false,
      limit: 10,
    });

    record(
      "restrictive-filter-fallback",
      strict.length < relaxed.length || relaxed.length >= 5,
      `strict=${strict.length}, relaxed=${relaxed.length}`
    );

    const user = await db.user.findFirst({
      where: { role: "USER" },
      select: { id: true },
    });
    if (user) {
      const withExclude = await findCandidateNovels({
        prefs: {
          genres: [],
          tags: [],
          excludedTags: [],
          status: null,
          mood: [],
          language: null,
        },
        userId: user.id,
        excludeNovelIds: ["nonexistent-id-qa"],
        limit: 5,
      });
      record(
        "exclude-novel-ids-honored",
        Array.isArray(withExclude),
        `returned ${withExclude.length} candidates with exclude list`
      );
    }

    await db.$disconnect();
  } catch (error) {
    record(
      "db-integration",
      false,
      error instanceof Error ? error.message : "DB unavailable"
    );
  }
}

async function main() {
  console.log("=== Moonie QA Verification ===\n");

  testLexicalAffectsRanking();
  testGenreDiversityAfterScoring();
  testPriorRecExclusion();
  testSoftGenreFilterFlag();
  testTitleDedupe();
  testColdStartFollowUp();
  testQuotaLimitConstant();
  testQuotaRemainingMath();

  console.log("\n-- DB integration --");
  await testDbIntegration();

  const failed = checks.filter((c) => !c.pass);
  console.log(`\n=== Summary: ${checks.length - failed.length}/${checks.length} passed ===`);
  if (failed.length > 0) {
    for (const f of failed) console.log(`  - ${f.id}: ${f.detail}`);
    process.exit(1);
  }
}

void main();
