import { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import type { AdminNotificationSummary } from "@/types/admin";

export async function getAdminNotifications(
  type?: NotificationType
): Promise<AdminNotificationSummary[]> {
  const notifications = await db.notification.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { username: true } },
    },
  });

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    message: notification.message,
    link: notification.link,
    isRead: notification.isRead,
    recipientUsername: notification.user.username,
    createdAt: notification.createdAt.toISOString(),
  }));
}
