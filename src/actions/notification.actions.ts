"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markNotificationsAsRead,
} from "@/services/notification.service";

export type NotificationActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }
  return session.user.id;
}

function revalidateNotifications() {
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function markNotificationAsReadAction(
  notificationId: string
): Promise<NotificationActionResult> {
  try {
    const userId = await requireUserId();
    await markNotificationAsRead(notificationId, userId);
    revalidateNotifications();
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to mark notification as read." };
  }
}

export async function markNotificationsAsReadAction(
  notificationIds: string[]
): Promise<NotificationActionResult> {
  try {
    const userId = await requireUserId();
    await markNotificationsAsRead(notificationIds, userId);
    revalidateNotifications();
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to mark notifications as read." };
  }
}

export async function markAllNotificationsAsReadAction(): Promise<NotificationActionResult> {
  try {
    const userId = await requireUserId();
    await markAllNotificationsAsRead(userId);
    revalidateNotifications();
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to mark all notifications as read." };
  }
}
