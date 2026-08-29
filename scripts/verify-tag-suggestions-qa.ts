/**
 * End-to-end QA verification for tag suggestion governance.
 * Run: npx tsx scripts/verify-tag-suggestions-qa.ts
 */
import { TagSuggestionStatus } from "@prisma/client";
import { db } from "../src/lib/db";
import {
  findSimilarTags,
  getAdvisoryMatches,
  getBlockingCanonicalMatch,
  tagCompactKey,
} from "../src/lib/tag-similarity";
import {
  approveTagSuggestionAsNew,
  createTagSuggestion,
  evaluateTagSuggestionInput,
  mapTagSuggestionToExisting,
  rejectTagSuggestion,
} from "../src/services/tag-suggestion.service";

type Check = { id: string; pass: boolean; detail: string };

const checks: Check[] = [];

function record(id: string, pass: boolean, detail: string) {
  checks.push({ id, pass, detail });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`[${mark}] ${id}: ${detail}`);
}

async function getFixtureUsers() {
  const [user, admin] = await Promise.all([
    db.user.findFirst({ where: { role: "USER" }, select: { id: true, username: true } }),
    db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true, username: true } }),
  ]);
  if (!user || !admin) {
    throw new Error("Need at least one USER and one ADMIN in the database.");
  }
  return { user, admin };
}

async function findOrCreateCanonicalTag(name: string, slug: string) {
  const existing = await db.tag.findFirst({
    where: { OR: [{ slug }, { name }] },
    select: { id: true, name: true, slug: true },
  });
  if (existing) return existing;
  return db.tag.create({
    data: { name, slug },
    select: { id: true, name: true, slug: true },
  });
}

async function cleanupQaData(prefix: string) {
  await db.tagSuggestion.deleteMany({
    where: { normalizedName: { startsWith: prefix } },
  });
  await db.tag.deleteMany({
    where: { slug: { startsWith: prefix } },
  });
}

async function testSimilarityUtility() {
  const candidates = [
    { id: "t1", name: "Slow Burn", slug: "slow-burn" },
    { id: "t2", name: "Found Family", slug: "found-family" },
  ];

  const exact = findSimilarTags("slow burn", candidates);
  record(
    "1-exact",
    Boolean(exact.exactMatch?.tag.id === "t1"),
    exact.exactMatch ? `matched ${exact.exactMatch.tag.name}` : "no exact match"
  );

  const slug = findSimilarTags("slow-burn", candidates);
  record(
    "2-slug",
    Boolean(slug.slugMatch?.tag.id === "t1" || slug.exactMatch?.tag.id === "t1"),
    slug.slugMatch
      ? `slug matched ${slug.slugMatch.tag.name}`
      : slug.exactMatch
        ? `exact matched ${slug.exactMatch.tag.name}`
        : "no slug match"
  );

  const compact = findSimilarTags("slowburn", candidates);
  record(
    "3-compact",
    Boolean(compact.compactMatch?.tag.id === "t1"),
    compact.compactMatch
      ? `compact matched ${compact.compactMatch.tag.name}`
      : "no compact match"
  );

  const fuzzyOnly = findSimilarTags("slow burnn", candidates);
  const blocking = getBlockingCanonicalMatch(fuzzyOnly);
  const advisory = getAdvisoryMatches(fuzzyOnly);
  record(
    "4-fuzzy-advisory-only",
    !blocking && advisory.length > 0,
    `blocking=${blocking ? blocking.tag.name : "none"}, advisory=${advisory.map((m) => m.tag.name).join(", ")}`
  );
}

async function testUserFlows(userId: string, adminId: string) {
  const prefix = "qa-tag-";
  await cleanupQaData(prefix);

  const canonical = await findOrCreateCanonicalTag("Slow Burn", "slow-burn");
  const catalog = await db.tag.findMany({
    select: { id: true, name: true, slug: true },
  });

  const exactEval = await evaluateTagSuggestionInput("Slow Burn", catalog);
  record(
    "1-server-exact-block",
    !exactEval.ok &&
      (exactEval.code === "EXACT_EXISTS" || exactEval.code === "SLUG_EXISTS"),
    exactEval.ok ? "unexpectedly allowed" : `${exactEval.code}: ${exactEval.error}`
  );

  const slugEval = await evaluateTagSuggestionInput("slow-burn", catalog);
  record(
    "2-server-slug-block",
    !slugEval.ok &&
      (slugEval.code === "SLUG_EXISTS" || slugEval.code === "EXACT_EXISTS"),
    slugEval.ok ? "unexpectedly allowed" : slugEval.error
  );

  const compactEval = await evaluateTagSuggestionInput("slowburn", catalog);
  record(
    "3-server-compact-block",
    !compactEval.ok && compactEval.code === "COMPACT_EXISTS",
    compactEval.ok ? "unexpectedly allowed" : compactEval.error
  );

  const fuzzyEval = await evaluateTagSuggestionInput("slow brun", catalog);
  record(
    "4-server-fuzzy-allow",
    fuzzyEval.ok === true,
    fuzzyEval.ok ? "can suggest" : fuzzyEval.error
  );

  const uniqueName = `${prefix}found-family-betrayal`;
  const firstSuggest = await createTagSuggestion({
    userId,
    rawName: uniqueName,
  });
  record(
    "5a-create-pending",
    firstSuggest.success === true,
    firstSuggest.success ? `id=${firstSuggest.suggestion.id}` : firstSuggest.error
  );

  const dupPending = await createTagSuggestion({
    userId,
    rawName: uniqueName,
  });
  record(
    "5b-duplicate-pending-block",
    !dupPending.success && dupPending.code === "PENDING_DUPLICATE",
    dupPending.success ? "unexpectedly allowed duplicate" : dupPending.error
  );

  const pendingRow = await db.tagSuggestion.findFirst({
    where: { normalizedName: uniqueName },
  });
  record(
    "6-pending-not-in-tag-table",
    Boolean(pendingRow) &&
      (await db.tag.count({ where: { name: uniqueName } })) === 0,
    pendingRow ? "pending exists, no canonical tag" : "pending row missing"
  );

  const approveName = `${prefix}new-canonical`;
  const toApprove = await createTagSuggestion({ userId, rawName: approveName });
  if (!toApprove.success) throw new Error(toApprove.error);

  const approved = await approveTagSuggestionAsNew(toApprove.suggestion.id, adminId);
  const approvedRow = await db.tagSuggestion.findUnique({
    where: { id: toApprove.suggestion.id },
  });
  record(
    "8-approve-as-new",
    approvedRow?.status === TagSuggestionStatus.APPROVED &&
      approvedRow.resolvedTagId === approved.tag.id &&
      approvedRow.reviewedByUserId === adminId &&
      Boolean(approvedRow.reviewedAt),
    `status=${approvedRow?.status}, resolvedTagId=${approvedRow?.resolvedTagId}`
  );

  const mapName = `${prefix}map-target`;
  const toMap = await createTagSuggestion({ userId, rawName: mapName });
  if (!toMap.success) throw new Error(toMap.error);
  const mapped = await mapTagSuggestionToExisting(
    toMap.suggestion.id,
    canonical.id,
    adminId
  );
  const mappedRow = await db.tagSuggestion.findUnique({
    where: { id: toMap.suggestion.id },
  });
  const tagCountBefore = await db.tag.count();
  record(
    "9-map-to-existing",
    mappedRow?.status === TagSuggestionStatus.MAPPED &&
      mappedRow.resolvedTagId === canonical.id &&
      mapped.tag.id === canonical.id &&
      Boolean(mappedRow.reviewedByUserId) &&
      Boolean(mappedRow.reviewedAt),
    `status=${mappedRow?.status}, resolvedTagId=${mappedRow?.resolvedTagId}, tagCount=${tagCountBefore}`
  );

  const rejectName = `${prefix}reject-me`;
  const toReject = await createTagSuggestion({ userId, rawName: rejectName });
  if (!toReject.success) throw new Error(toReject.error);
  await rejectTagSuggestion(toReject.suggestion.id, adminId, "Not distinct enough");
  const rejectedRow = await db.tagSuggestion.findUnique({
    where: { id: toReject.suggestion.id },
  });
  record(
    "10-reject",
    rejectedRow?.status === TagSuggestionStatus.REJECTED &&
      rejectedRow.resolvedTagId === null &&
      rejectedRow.rejectionReason === "Not distinct enough" &&
      Boolean(rejectedRow.reviewedByUserId) &&
      Boolean(rejectedRow.reviewedAt),
    `status=${rejectedRow?.status}, reason=${rejectedRow?.rejectionReason}`
  );

  const raceName = `${prefix}race-dup`;
  const raceSuggest = await createTagSuggestion({ userId, rawName: raceName });
  if (!raceSuggest.success) throw new Error(raceSuggest.error);

  const raceSlug = tagCompactKey(raceName).replace(/^qa-tag-/, "qa-tag-race-");
  await db.tag.create({
    data: {
      name: "QA Race Existing",
      slug: raceSlug,
    },
  });

  let raceBlocked = false;
  try {
    await approveTagSuggestionAsNew(raceSuggest.suggestion.id, adminId);
  } catch (error) {
    raceBlocked =
      error instanceof Error &&
      error.message.includes("canonical tag already exists");
  }
  record(
    "11-race-dedup-in-transaction",
    raceBlocked,
    raceBlocked ? "approve blocked by in-tx duplicate check" : "approve incorrectly succeeded"
  );

  await cleanupQaData(prefix);
  await db.tag.deleteMany({ where: { slug: raceSlug } });
}

async function main() {
  console.log("=== Tag Suggestion QA Verification ===\n");

  const tableExists = await db.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'tag_suggestions'
    ) AS exists
  `;
  record(
    "migration-table-exists",
    tableExists[0]?.exists === true,
    tableExists[0]?.exists ? "tag_suggestions table present" : "tag_suggestions table missing"
  );

  if (!tableExists[0]?.exists) {
    console.log("\nCannot run DB integration tests without migration.");
    process.exit(1);
  }

  console.log("\n-- Similarity utility --");
  await testSimilarityUtility();

  console.log("\n-- Service / DB flows --");
  const { user, admin } = await getFixtureUsers();
  await testUserFlows(user.id, admin.id);

  const failed = checks.filter((c) => !c.pass);
  console.log(`\n=== Summary: ${checks.length - failed.length}/${checks.length} passed ===`);
  if (failed.length > 0) {
    console.log("Failed checks:");
    for (const f of failed) console.log(`  - ${f.id}: ${f.detail}`);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
