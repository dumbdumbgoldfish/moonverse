import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MoonieWidget } from "@/components/moonie/MoonieWidget";
import {
  getNotificationsByUser,
  getUnreadNotificationCount,
} from "@/services/notification.service";
import type { NotificationItem } from "@/types/notification";

interface AppShellProps {
  children: React.ReactNode;
}

export const dynamic = "force-dynamic";

export async function AppShell({ children }: AppShellProps) {
  const session = await auth();

  let unreadCount = 0;
  let latestNotifications: NotificationItem[] = [];

  if (session?.user?.id) {
    [unreadCount, latestNotifications] = await Promise.all([
      getUnreadNotificationCount(session.user.id),
      getNotificationsByUser(session.user.id, 5),
    ]);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        session={session}
        unreadCount={unreadCount}
        latestNotifications={latestNotifications}
      />
      <main className="flex-1">{children}</main>
      <Footer />
      <MoonieWidget isLoggedIn={!!session?.user?.id} />
    </div>
  );
}
