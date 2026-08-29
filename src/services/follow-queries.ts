import { db } from "@/lib/db";

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const follow = await db.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  return !!follow;
}

export async function getFollowerCount(userId: string): Promise<number> {
  return db.follow.count({
    where: { followingId: userId },
  });
}

export async function getFollowingCount(userId: string): Promise<number> {
  return db.follow.count({
    where: { followerId: userId },
  });
}

export async function getFollowingIds(
  followerId: string,
  followingIds: string[]
): Promise<Set<string>> {
  if (!followingIds.length) return new Set();

  const follows = await db.follow.findMany({
    where: {
      followerId,
      followingId: { in: followingIds },
    },
    select: { followingId: true },
  });

  return new Set(follows.map((follow) => follow.followingId));
}
