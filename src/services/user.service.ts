import { db } from "@/lib/db";
import { getInitials } from "@/lib/review-utils";
import {
  getFollowerCount,
  getFollowingCount,
  getFollowingIds,
} from "@/services/follow-queries";
import type { UserProfile, UserSettings, UpdateProfileInput } from "@/types/user";

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  avatarInitials: string;
  bio: string | null;
  reviewCount: number;
  readingListCount: number;
  followerCount: number;
  isFollowing: boolean;
}

export async function searchUsers(
  query: string,
  limit = 12,
  offset = 0,
  viewerId?: string
): Promise<UserSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const users = await db.user.findMany({
    where: {
      isSuspended: false,
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      _count: {
        select: {
          reviews: true,
          followers: true,
          folders: { where: { isPublic: true } },
        },
      },
    },
    orderBy: [{ reviews: { _count: "desc" } }, { displayName: "asc" }],
    skip: offset,
    take: limit,
  });

  const followingIds = viewerId
    ? await getFollowingIds(
        viewerId,
        users.map((user) => user.id)
      )
    : new Set<string>();

  return users.map((user) => ({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    avatarInitials: getInitials(user.displayName),
    bio: user.bio,
    reviewCount: user._count.reviews,
    readingListCount: user._count.folders,
    followerCount: user._count.followers,
    isFollowing: followingIds.has(user.id),
  }));
}

export async function countUsers(query: string): Promise<number> {
  const q = query.trim();
  if (!q) return 0;

  return db.user.count({
    where: {
      isSuspended: false,
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ],
    },
  });
}

export async function getUserByUsername(
  username: string
): Promise<UserProfile | null> {
  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      profileBackgroundUrl: true,
      bio: true,
      createdAt: true,
      _count: { select: { reviews: true } },
    },
  });

  if (!user) return null;

  const [followerCount, followingCount] = await Promise.all([
    getFollowerCount(user.id),
    getFollowingCount(user.id),
  ]);

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    profileBackgroundUrl: user.profileBackgroundUrl,
    bio: user.bio,
    followerCount,
    followingCount,
    reviewCount: user._count.reviews,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      profileBackgroundUrl: true,
      bio: true,
      createdAt: true,
      _count: { select: { reviews: true } },
    },
  });

  if (!user) return null;

  const [followerCount, followingCount] = await Promise.all([
    getFollowerCount(user.id),
    getFollowingCount(user.id),
  ]);

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    profileBackgroundUrl: user.profileBackgroundUrl,
    bio: user.bio,
    followerCount,
    followingCount,
    reviewCount: user._count.reviews,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      profileBackgroundUrl: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    profileBackgroundUrl: user.profileBackgroundUrl,
  };
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserSettings> {
  const user = await db.user.update({
    where: { id: userId },
    data: {
      displayName: input.displayName.trim(),
      bio: input.bio?.trim() || null,
      avatarUrl: input.avatarUrl?.trim() || null,
      profileBackgroundUrl: input.profileBackgroundUrl?.trim() || null,
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      profileBackgroundUrl: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    profileBackgroundUrl: user.profileBackgroundUrl,
  };
}
