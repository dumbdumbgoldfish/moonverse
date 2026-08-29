/**
 * Post-migration feedback enum verification.
 * Run: npx tsx scripts/verify-moonie-feedback.ts
 */
import { db } from "@/lib/db";
import { RecommendationFeedbackKind } from "@prisma/client";
import { retrieveHybridCandidates } from "@/services/hybrid-retrieval.service";

const FEEDBACK_KINDS: RecommendationFeedbackKind[] = [
  "HELPFUL",
  "NOT_HELPFUL",
  "MORE_LIKE_THIS",
  "LESS_LIKE_THIS",
  "NOT_FOR_ME",
];

async function main() {
  let passed = 0;
  const total = FEEDBACK_KINDS.length + 2;

  try {
    const user = await db.user.findFirst({
      select: { id: true, email: true },
    });
    if (!user) {
      console.error("No user found for feedback test");
      process.exitCode = 1;
      return;
    }

    const novel = await db.novel.findFirst({
      select: { id: true, title: true },
    });
    if (!novel) {
      console.error("No novel found for feedback test");
      process.exitCode = 1;
      return;
    }

    for (const kind of FEEDBACK_KINDS) {
      try {
        await db.recommendationFeedback.create({
          data: {
            userId: user.id,
            novelId: novel.id,
            kind,
            note: `release-readiness-${kind}`,
          },
        });
        console.log(`[PASS] feedback enum write: ${kind}`);
        passed += 1;
      } catch (error) {
        console.log(
          `[FAIL] feedback enum write: ${kind} — ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    const stored = await db.recommendationFeedback.findMany({
      where: {
        userId: user.id,
        novelId: novel.id,
        note: { startsWith: "release-readiness-" },
      },
      select: { kind: true },
    });
    const storedKinds = new Set(stored.map((row) => row.kind));
    const allStored = FEEDBACK_KINDS.every((kind) => storedKinds.has(kind));
    if (allStored) {
      console.log("[PASS] all five feedback kinds readable from DB");
      passed += 1;
    } else {
      console.log(
        `[FAIL] missing kinds in DB: ${FEEDBACK_KINDS.filter((k) => !storedKinds.has(k)).join(", ")}`
      );
    }

    await retrieveHybridCandidates({
      userId: user.id,
      prefs: {
        genres: [],
        tags: [],
        mood: [],
        excludedTags: [],
        status: null,
        language: null,
      },
      queryText: "fantasy",
      limit: 5,
      personalization: {
        useSavedNovels: true,
        useSavedReviews: true,
        useReadingList: true,
        useLikes: true,
        useFollowedReviewers: true,
        useSearchHistory: true,
      },
    });
    console.log("[PASS] hybrid retrieval with LESS_LIKE_THIS enum query");
    passed += 1;

    await db.recommendationFeedback.deleteMany({
      where: {
        userId: user.id,
        novelId: novel.id,
        note: { startsWith: "release-readiness-" },
      },
    });

    console.log(`\n${passed}/${total} feedback checks passed`);
    if (passed < total) process.exitCode = 1;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

main();
