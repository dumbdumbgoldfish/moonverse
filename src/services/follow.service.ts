import { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import {
  getFollowerCount,
  getFollowingCount,
  getFollowingIds,
  isFollowing,
} from "@/services/follow-queries";
import type { ProfileFollowingUser } from "@/types/user";

export { getFollowerCount, getFollowingCount, getFollowingIds, isFollowing };

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

  const { createNotification } = await import("@/services/notification.service");
  await createNotification({
    userId: followingId,
    type: NotificationType.NEW_FOLLOWER,
    message: `${follower?.displayName ?? "Someone"} started following you`,
    link: `/users/${follower?.username ?? ""}`,
    actorId: followerId,
    metadata: {
      actorDisplayName: follower?.displayName,
      actorUsername: follower?.username,
    },
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

export async function getFollowingForUser(
  userId: string,
  viewerId?: string
): Promise<ProfileFollowingUser[]> {
  const follows = await db.follow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      following: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          _count: {
            select: {
              reviews: true,
              followers: true,
              following: true,
              folders: true,
            },
          },
        },
      },
    },
  });

  const followingIds = follows.map((follow) => follow.following.id);
  const viewerFollowing =
    viewerId && viewerId !== userId
      ? await getFollowingIds(viewerId, followingIds)
      : viewerId === userId
        ? new Set(followingIds)
        : new Set<string>();

  return follows.map((follow) => ({
    id: follow.following.id,
    username: follow.following.username,
    displayName: follow.following.displayName,
    avatarUrl: follow.following.avatarUrl,
    reviewCount: follow.following._count.reviews,
    followerCount: follow.following._count.followers,
    followingCount: follow.following._count.following,
    readingListCount: follow.following._count.folders,
    isFollowing: viewerFollowing.has(follow.following.id),
    followedAt: follow.createdAt.toISOString(),
  }));
}

export async function getFollowersForUser(
  userId: string,
  viewerId?: string
): Promise<ProfileFollowingUser[]> {
  const follows = await db.follow.findMany({
    where: { followingId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          _count: {
            select: {
              reviews: true,
              followers: true,
              following: true,
              folders: true,
            },
          },
        },
      },
    },
  });

  const followerIds = follows.map((follow) => follow.follower.id);
  const viewerFollowing =
    viewerId && viewerId !== userId
      ? await getFollowingIds(viewerId, followerIds)
      : new Set<string>();

  return follows.map((follow) => ({
    id: follow.follower.id,
    username: follow.follower.username,
    displayName: follow.follower.displayName,
    avatarUrl: follow.follower.avatarUrl,
    reviewCount: follow.follower._count.reviews,
    followerCount: follow.follower._count.followers,
    followingCount: follow.follower._count.following,
    readingListCount: follow.follower._count.folders,
    isFollowing: viewerFollowing.has(follow.follower.id),
    followedAt: follow.createdAt.toISOString(),
  }));
}
