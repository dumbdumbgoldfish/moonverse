"use client";

import dynamic from "next/dynamic";
import type { Session } from "next-auth";
import type { EnrichedNotificationItem } from "@/types/notification";

const AppChrome = dynamic(() =>
  import("@/components/layout/AppChrome").then((mod) => mod.AppChrome)
);

interface AppClientChromeProps {
  session: Session | null;
  unreadCount: number;
  latestNotifications: EnrichedNotificationItem[];
  children: React.ReactNode;
}

/** Client boundary that keeps AppChrome out of the root `app/layout` webpack chunk. */
export function AppClientChrome({
  session,
  unreadCount,
  latestNotifications,
  children,
}: AppClientChromeProps) {
  return (
    <AppChrome
      session={session}
      unreadCount={unreadCount}
      latestNotifications={latestNotifications}
    >
      {children}
    </AppChrome>
  );
}
