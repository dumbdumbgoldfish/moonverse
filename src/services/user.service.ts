import { db } from "@/lib/db";
import {
  getFollowerCount,
  getFollowingCount,
} from "@/services/follow.service";
import type { UserProfile, UserSettings, UpdateProfileInput } from "@/types/user";

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
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  };
}
