import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import {
  getNotificationsByUser,
  getUnreadNotificationCount,
} from "@/services/notification.service";

export const metadata = {
  title: "Notifications — MoonVerse",
  description: "View your MoonVerse notifications.",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const [notifications, unreadCount] = await Promise.all([
    getNotificationsByUser(session.user.id),
    getUnreadNotificationCount(session.user.id),
  ]);

  return (
    <NotificationsList
      notifications={notifications}
      unreadCount={unreadCount}
    />
  );
}
