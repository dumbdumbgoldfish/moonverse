import { AppClientChrome } from "@/components/layout/AppClientChrome";
import { getSession } from "@/lib/session";
import type { EnrichedNotificationItem } from "@/types/notification";

interface AppShellProps {
  children: React.ReactNode;
}

export const dynamic = "force-dynamic";

export async function AppShell({ children }: AppShellProps) {
  const session = await getSession();
  const latestNotifications: EnrichedNotificationItem[] = [];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5FA] dark:bg-background">
      <AppClientChrome
        session={session}
        unreadCount={0}
        latestNotifications={latestNotifications}
      >
        {children}
      </AppClientChrome>
    </div>
  );
}
