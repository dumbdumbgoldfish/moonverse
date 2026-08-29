"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  validateAvatarUrl,
  validateBio,
  validateDisplayName,
  validateProfileBackgroundUrl,
} from "@/lib/validation";
import { updateUserProfile } from "@/services/user.service";

export type UserActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }
  return session.user.id;
}

export async function updateProfileAction(input: {
  displayName: string;
  bio: string;
  avatarUrl: string;
  profileBackgroundUrl: string;
}): Promise<
  UserActionResult & {
    displayName?: string;
    avatarUrl?: string | null;
    profileBackgroundUrl?: string | null;
  }
> {
  try {
    const userId = await requireUserId();

    const displayNameError = validateDisplayName(input.displayName);
    if (displayNameError) {
      return { success: false, error: displayNameError };
    }

    const bioError = validateBio(input.bio);
    if (bioError) {
      return { success: false, error: bioError };
    }

    const avatarError = validateAvatarUrl(input.avatarUrl);
    if (avatarError) {
      return { success: false, error: avatarError };
    }

    const backgroundError = validateProfileBackgroundUrl(input.profileBackgroundUrl);
    if (backgroundError) {
      return { success: false, error: backgroundError };
    }

    const updated = await updateUserProfile(userId, {
      displayName: input.displayName,
      bio: input.bio || null,
      avatarUrl: input.avatarUrl || null,
      profileBackgroundUrl: input.profileBackgroundUrl || null,
    });

    revalidatePath("/settings");
    revalidatePath(`/users/${updated.username}`);
    revalidatePath("/", "layout");

    return {
      success: true,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      profileBackgroundUrl: updated.profileBackgroundUrl,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update profile." };
  }
}
