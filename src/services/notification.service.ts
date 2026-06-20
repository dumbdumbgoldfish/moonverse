import { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import type { NotificationItem } from "@/types/notification";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
}

function mapNotification(notification: {
  id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}): NotificationItem {
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    link: notification.link,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      message: input.message,
      link: input.link,
    },
  });
}

export async function getNotificationsByUser(
  userId: string,
  limit?: number
): Promise<NotificationItem[]> {
  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });

  return notifications.map(mapNotification);
}

export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  return db.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  const notification = await db.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true },
  });

  if (!notification) {
    throw new Error("Notification not found.");
  }

  await db.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
