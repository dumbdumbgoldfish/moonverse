"use server";

import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdminUserId } from "@/lib/admin-auth";
import { db } from "@/lib/db";

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

    const recipientCount = await db.$transaction(async (tx) => {
      const inserted = await tx.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          type: NotificationType.DIGEST,
          message: `[Platform] ${message}`,
          link: input.link?.trim() || null,
        })),
      });
      await tx.moderationAuditLog.create({
        data: {
          actorId: adminId,
          action: "BROADCAST_NOTIFICATION",
          entityType: "Platform",
          entityId: "all-users",
          meta: { recipientCount: inserted.count, message },
        },
      });
      return inserted.count;
    });

    revalidatePath("/admin/notifications");
    revalidatePath("/admin/audit");
    revalidatePath("/notifications");
    revalidatePath("/", "layout");

    return { success: true, recipientCount };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Broadcast failed.",
    };
  }
}
