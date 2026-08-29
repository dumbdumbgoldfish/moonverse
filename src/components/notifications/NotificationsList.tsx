"use client";

import { NotificationInbox } from "@/components/notifications/NotificationInbox";
import type { EnrichedNotificationItem } from "@/types/notification";

interface NotificationsListProps {
  notifications: EnrichedNotificationItem[];
  unreadCount: number;
}

export function NotificationsList(props: NotificationsListProps) {
  return <NotificationInbox {...props} />;
}
