import type { NotificationType } from "@prisma/client";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}
