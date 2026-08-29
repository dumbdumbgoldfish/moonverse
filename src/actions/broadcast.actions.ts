"use server";

import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdminUserId } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/services/audit.service";

export type BroadcastActionResult =
  | { success: true; recipientCount: number }
  | { success: false; error: string };

const MAX_MESSAGE = 500;

export async function broadcastNotificationAction(input: {
  message: string;
  link?: string;
}): Promise<BroadcastActionResult> {
  try {
    const adminId = await requireAdminUserId();
    const message = input.message.trim().slice(0, MAX_MESSAGE);
    if (!message) {
      return { success: false, error: "Message is required." };
    }

    const users = await db.user.findMany({
      where: { isSuspended: false },
      select: { id: true },
    });

    if (users.length === 0) {
      return { success: false, error: "No active users to notify." };
    }

    await db.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        type: NotificationType.DIGEST,
        message: `[Platform] ${message}`,
        link: input.link?.trim() || null,
      })),
    });

    await writeAuditLog({
      actorId: adminId,
      action: "BROADCAST_NOTIFICATION",
      entityType: "Platform",
      entityId: "all-users",
      meta: { recipientCount: users.length, message },
    });

    revalidatePath("/admin/notifications");
    revalidatePath("/admin/audit");

    return { success: true, recipientCount: users.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Broadcast failed.",
    };
  }
}
