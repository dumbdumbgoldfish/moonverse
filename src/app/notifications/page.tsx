import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NotificationInbox } from "@/components/notifications/NotificationInbox";
import { NotificationSetupError } from "@/components/notifications/NotificationSetupError";
import {
  getEnrichedNotificationsByUser,
  getUnreadNotificationCount,
} from "@/services/notification.service";

export const metadata = {
  title: "Notifications · MoonVerse",
  description: "View your MoonVerse notifications.",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/notifications");
  }

  let notifications;
  let unreadCount;
  let setupMessage: string | undefined;

  try {
    [notifications, unreadCount] = await Promise.all([
      getEnrichedNotificationsByUser(session.user.id),
      getUnreadNotificationCount(session.user.id),
    ]);
  } catch (error) {
    setupMessage =
      error instanceof Error &&
      error.message.includes("actor_id")
        ? "The notifications table is missing new columns (`actor_id`, `metadata`). Apply migrations and restart the app."
        : undefined;
  }

  if (setupMessage) {
    return <NotificationSetupError message={setupMessage} />;
  }

  return (
    <NotificationInbox
      notifications={notifications!}
      unreadCount={unreadCount!}
    />
  );
}
