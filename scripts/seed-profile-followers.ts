/**
 * Add followers to a profile (development only).
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/seed-profile-followers.ts --username yuexian --count 5
 */
import "dotenv/config";

import { db } from "@/lib/db";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const username = readArg("--username");
  const count = Number(readArg("--count") ?? "5");

  if (!username) {
    console.error("Usage: --username <handle> [--count 5]");
    process.exit(1);
  }

  if (!Number.isFinite(count) || count < 1) {
    console.error("--count must be a positive number");
    process.exit(1);
  }

  const target = await db.user.findFirst({
    where: { username },
    select: { id: true, username: true, displayName: true },
  });

  if (!target) {
    console.error(`User @${username} not found`);
    process.exit(1);
  }

  const existing = await db.follow.findMany({
    where: { followingId: target.id },
    select: { followerId: true },
  });
  const existingIds = new Set(existing.map((follow) => follow.followerId));

  const candidates = await db.user.findMany({
    where: {
      id: { not: target.id, notIn: [...existingIds] },
    },
    select: { id: true, username: true, displayName: true },
    take: count,
    orderBy: { createdAt: "asc" },
  });

  if (candidates.length === 0) {
    console.error("No available users to follow this profile.");
    process.exit(1);
  }

  await db.follow.createMany({
    data: candidates.map((user) => ({
      followerId: user.id,
      followingId: target.id,
    })),
    skipDuplicates: true,
  });

  const total = await db.follow.count({ where: { followingId: target.id } });

  console.log(`Followers for ${target.displayName} (@${target.username}):`);
  for (const user of candidates) {
    console.log(`  + ${user.displayName} (@${user.username})`);
  }
  console.log(`Total followers now: ${total}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
