/**
 * Reset today's Moonie discovery quota for a user (development only).
 *
 * Prerequisites:
 *   MOONIE_DEV_QUOTA_TOOLS=true in .env (local machine only)
 *
 * Usage:
 *   npm run moonie:reset-quota -- --email you@example.com
 *   npm run moonie:reset-quota -- --username yourname
 *   npm run moonie:reset-quota -- --user-id <cuid>
 */
import "dotenv/config";

import { db } from "@/lib/db";
import {
  isMoonieDevQuotaToolsEnabled,
  logMoonieDevQuotaToolsStatus,
  resetMoonieDailyQuota,
} from "@/lib/moonie/dev-quota";
import { peekMoonieQuota } from "@/lib/moonie/rate-limit";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function resolveUserId(): Promise<string> {
  const userId = readArg("--user-id");
  if (userId) return userId;

  const email = readArg("--email");
  if (email) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true },
    });
    if (!user) {
      throw new Error(`No user found with email ${email}`);
    }
    console.info(
      `[moonie:dev] Found user ${user.username ?? user.email} (${user.id})`
    );
    return user.id;
  }

  const username = readArg("--username");
  if (username) {
    const user = await db.user.findUnique({
      where: { username },
      select: { id: true, email: true, username: true },
    });
    if (!user) {
      throw new Error(`No user found with username ${username}`);
    }
    console.info(
      `[moonie:dev] Found user ${user.username} (${user.id})`
    );
    return user.id;
  }

  throw new Error(
    "Provide --email, --username, or --user-id. Example: npm run moonie:reset-quota -- --email you@example.com"
  );
}

async function main() {
  if (!isMoonieDevQuotaToolsEnabled()) {
    console.error(
      "[moonie:dev] Refusing to reset quota outside local development.\n" +
        "Set MOONIE_DEV_QUOTA_TOOLS=true in .env, then retry."
    );
    process.exitCode = 1;
    return;
  }

  logMoonieDevQuotaToolsStatus();

  const userId = await resolveUserId();
  const before = await peekMoonieQuota(userId);
  console.info(
    `[moonie:dev] Before reset: ${before.used} used, ${before.remaining} remaining today.`
  );

  const removed = await resetMoonieDailyQuota(userId);
  const after = await peekMoonieQuota(userId);
  console.info(
    `[moonie:dev] After reset: ${after.used} used, ${after.remaining} remaining today (removed ${removed} event(s)).`
  );
}

main()
  .catch((error) => {
    console.error(
      `[moonie:dev] ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
