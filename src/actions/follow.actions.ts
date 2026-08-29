"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { followUser, unfollowUser } from "@/services/follow.service";

export type FollowActionResult =
  | { success: true; following: boolean }
  | { success: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }
  return session.user.id;
}

function revalidateProfile(username: string) {
  revalidatePath(`/users/${username}`);
}

export async function followUserAction(
  followingId: string,
  username: string
): Promise<FollowActionResult> {
  try {
    const followerId = await requireUserId();
    await followUser(followerId, followingId);
    revalidateProfile(username);
    revalidatePath("/notifications");
    return { success: true, following: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to follow user." };
  }
}

export async function unfollowUserAction(
  followingId: string,
  username: string
): Promise<FollowActionResult> {
  try {
    const followerId = await requireUserId();
    await unfollowUser(followerId, followingId);
    revalidateProfile(username);
    return { success: true, following: false };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to unfollow user." };
  }
}
