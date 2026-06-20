import { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { createNotification } from "@/services/notification.service";

export async function followUser(
  followerId: string,
  followingId: string
): Promise<void> {
  if (followerId === followingId) {
    throw new Error("You cannot follow yourself.");
  }

  const target = await db.user.findUnique({
    where: { id: followingId },
    select: { id: true },
  });

  if (!target) {
    throw new Error("User not found.");
  }

  const existing = await db.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  if (existing) {
    return;
  }

  await db.follow.create({
    data: { followerId, followingId },
  });

  const follower = await db.user.findUnique({
    where: { id: followerId },
    select: { displayName: true, username: true },
  });

  await createNotification({
    userId: followingId,
    type: NotificationType.NEW_FOLLOWER,
    message: `${follower?.displayName ?? "Someone"} started following you`,
    link: `/users/${follower?.username ?? ""}`,
  });
}

export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<void> {
  if (followerId === followingId) {
    throw new Error("You cannot unfollow yourself.");
  }

  await db.follow.deleteMany({
    where: { followerId, followingId },
  });
}

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
