import { AppChrome } from "@/components/layout/AppChrome";
import { getSession } from "@/lib/session";
import {
  safeGetEnrichedNotificationsByUser,
  safeGetUnreadNotificationCount,
} from "@/services/notification.service";
import type { EnrichedNotificationItem } from "@/types/notification";

interface AppShellProps {
  children: React.ReactNode;
}

export const dynamic = "force-dynamic";

export async function AppShell({ children }: AppShellProps) {
  const session = await getSession();

  let unreadCount = 0;
  let latestNotifications: EnrichedNotificationItem[] = [];

  if (session?.user?.id) {
    [unreadCount, latestNotifications] = await Promise.all([
      safeGetUnreadNotificationCount(session.user.id),
      safeGetEnrichedNotificationsByUser(session.user.id, 20),
    ]);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-background">
      <AppChrome
        session={session}
        unreadCount={unreadCount}
        latestNotifications={latestNotifications}
      >
        {children}
      </AppChrome>
    </div>
  );
}
