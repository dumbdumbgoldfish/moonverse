/**
 * Refresh demo/admin-QA user presentation: display names, avatars, profile backgrounds.
 *
 * Updates presentation fields only — usernames, emails, passwords, roles, and IDs are preserved.
 * Admin accounts are skipped entirely so demo login stays recognizable.
 *
 * SAFETY:
 * - Back up Postgres before running (see README output when invoked without --confirm).
 * - Requires `--confirm` to write changes.
 * - Idempotent / safely re-runnable.
 *
 * Usage:
 *   npm run demo:generate:profile-assets
 *   npm run demo:refresh:user-profiles -- --dry-run
 *   npm run demo:refresh:user-profiles -- --confirm
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient, UserRole } from "@prisma/client";
import { createRng } from "../lib/demo/rng";
import {
  generateUniqueDisplayName,
  PRESERVED_ADMIN_DISPLAY_NAMES,
} from "../lib/demo/demo-display-names";
import {
  assignProfileAssetPairs,
  ensureDemoProfileAssets,
  listDemoAvatarPaths,
  listDemoBannerPaths,
} from "../lib/demo/demo-profile-assets";

const db = new PrismaClient();
const RNG_SEED = 20260829_3;
const PREVIEW_PATH = join(process.cwd(), "prisma/data/admin-qa/profile-refresh-preview.json");

function parseArgs() {
  return {
    confirm: process.argv.includes("--confirm"),
    dryRun: process.argv.includes("--dry-run"),
    /** Update avatar + banner only; keep existing display names. */
    imagesOnly: process.argv.includes("--images-only"),
  };
}

interface UserRow {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  profileBackgroundUrl: string | null;
  role: UserRole;
}

function isProtectedAdmin(user: UserRow): boolean {
  if (user.role === UserRole.ADMIN) return true;
  if (PRESERVED_ADMIN_DISPLAY_NAMES.has(user.displayName)) return true;
  return false;
}

async function main() {
  const { confirm, dryRun, imagesOnly } = parseArgs();

  console.log("🌙 MoonVerse demo user profile refresh\n");
  console.log("  Updates displayName, avatarUrl, profileBackgroundUrl only.\n");

  if (!confirm && !dryRun) {
    console.error("  Refusing to run without --confirm or --dry-run.\n");
    console.error("  1. Back up the database first:");
    console.error(
      '     PGPASSWORD=moonverse pg_dump -h localhost -p 5433 -U moonverse -d moonverse \\'
    );
    console.error(
      "       -F p -f prisma/backups/backup-before-profile-refresh-$(date +%Y%m%d-%H%M%S).sql"
    );
    console.error("\n  2. Generate assets (if needed):");
    console.error("     npm run demo:generate:profile-assets");
    console.error("\n  3. Preview:");
    console.error("     npm run demo:refresh:user-profiles -- --dry-run");
    console.error("\n  4. Apply:");
    console.error("     npm run demo:refresh:user-profiles -- --confirm");
    process.exit(1);
  }

  const assetWrite = ensureDemoProfileAssets();
  if (assetWrite.avatars > 0 || assetWrite.banners > 0) {
    console.log(
      `  ✓ Ensured demo assets (wrote ${assetWrite.avatars} avatars, ${assetWrite.banners} banners)`
    );
  }

  const avatars = listDemoAvatarPaths();
  const banners = listDemoBannerPaths();
  if (avatars.length === 0 || banners.length === 0) {
    console.error("  No demo images found in public/demo/avatars or public/demo/banners.");
    console.error("  Add PNG/JPG/WebP files or run: npm run demo:generate:profile-assets");
    process.exit(1);
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      profileBackgroundUrl: true,
      role: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const targets = users.filter((u) => !isProtectedAdmin(u));
  const skippedAdmins = users.length - targets.length;
  const pairs = assignProfileAssetPairs(targets.length, avatars, banners);
  const rng = createRng(RNG_SEED);
  const usedNames = new Set<string>(
    users.filter((u) => isProtectedAdmin(u)).map((u) => u.displayName.toLowerCase())
  );

  const updates = targets.map((user, index) => ({
    id: user.id,
    before: {
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      profileBackgroundUrl: user.profileBackgroundUrl,
    },
    after: {
      displayName: imagesOnly
        ? user.displayName
        : generateUniqueDisplayName(rng, usedNames),
      avatarUrl: pairs[index].avatarUrl,
      profileBackgroundUrl: pairs[index].profileBackgroundUrl,
    },
  }));

  const preview = updates.slice(0, 5).map((row) => {
    const user = targets.find((u) => u.id === row.id)!;
    return {
      username: user.username,
      email: user.email,
      before: row.before,
      after: row.after,
    };
  });

  console.log(`  Users in database:     ${users.length}`);
  console.log(`  Will update:           ${updates.length}`);
  console.log(`  Skipped (admin):       ${skippedAdmins}`);
  console.log(`  Avatar pool:           ${avatars.length} (${avatars[0]} …)`);
  console.log(`  Banner pool:           ${banners.length} (${banners[0]} …)`);
  if (imagesOnly) console.log(`  Mode:                  images only (display names unchanged)`);

  console.log("\n  Example preview (first 5 non-admin users):");
  for (const item of preview) {
    console.log(`    @${item.username}`);
    console.log(`      display: ${item.before.displayName} → ${item.after.displayName}`);
    console.log(`      avatar:  ${item.before.avatarUrl ?? "(none)"} → ${item.after.avatarUrl}`);
    console.log(
      `      banner:  ${item.before.profileBackgroundUrl ?? "(none)"} → ${item.after.profileBackgroundUrl}`
    );
  }

  if (dryRun) {
    console.log("\n  Dry run complete — no database changes made.");
    await db.$disconnect();
    return;
  }

  let updated = 0;
  for (let i = 0; i < updates.length; i += 50) {
    const chunk = updates.slice(i, i + 50);
    await db.$transaction(async (tx) => {
      for (const row of chunk) {
        await tx.user.update({
          where: { id: row.id },
          data: imagesOnly
            ? {
                avatarUrl: row.after.avatarUrl,
                profileBackgroundUrl: row.after.profileBackgroundUrl,
              }
            : {
                displayName: row.after.displayName,
                avatarUrl: row.after.avatarUrl,
                profileBackgroundUrl: row.after.profileBackgroundUrl,
              },
        });
        updated++;
      }
    });
    process.stdout.write(`\r  ↳ updated ${Math.min(i + chunk.length, updates.length)}/${updates.length}`);
  }
  console.log("");

  mkdirSync(join(process.cwd(), "prisma/data/admin-qa"), { recursive: true });
  writeFileSync(
    PREVIEW_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        updated,
        skippedAdmins,
        preview,
      },
      null,
      2
    )
  );

  console.log("\n✅ Profile refresh complete");
  console.log(`   Updated users: ${updated}`);
  console.log(`   Skipped admins: ${skippedAdmins}`);
  console.log(`   Usernames preserved: yes (unchanged)`);
  console.log(`   Preview saved: prisma/data/admin-qa/profile-refresh-preview.json`);
}

main()
  .catch((error) => {
    console.error("❌ Profile refresh failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
