"use server";

import { DigestCadence } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { updateNotificationPreference } from "@/services/notification-preference.service";

export type NotificationPreferenceActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateNotificationPreferenceAction(patch: {
  emailEnabled?: boolean;
  digestCadence?: DigestCadence;
  moonieDailyEmail?: boolean;
}): Promise<NotificationPreferenceActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("You must be logged in.");
    }
    await updateNotificationPreference(session.user.id, patch);
    revalidatePath("/settings/notifications");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update notification preferences." };
  }
}
