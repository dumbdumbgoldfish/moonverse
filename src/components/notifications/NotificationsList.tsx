"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/actions/notification.actions";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/notification";

interface NotificationsListProps {
  notifications: NotificationItem[];
  unreadCount: number;
}

export function NotificationsList({
  notifications,
  unreadCount,
}: NotificationsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsAsReadAction();
      router.refresh();
    });
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    startTransition(async () => {
      if (!notification.isRead) {
        await markNotificationAsReadAction(notification.id);
      }
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comments, likes, saves, and new followers.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="shrink-0 rounded-xl"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-white px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No notifications yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            When someone interacts with your reviews or follows you, you&apos;ll
            see it here.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
          {notifications.map((notification) => {
            const content = (
              <div className="flex gap-3">
                {!notification.isRead && (
                  <span
                    className="mt-2 size-2.5 shrink-0 rounded-full bg-primary"
                    aria-label="Unread"
                  />
                )}
                {notification.isRead && (
                  <span className="mt-2 size-2.5 shrink-0" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm leading-relaxed",
                      !notification.isRead && "font-semibold text-foreground"
                    )}
                  >
                    {notification.message}
                  </p>
                  <time
                    dateTime={notification.createdAt}
                    className="mt-1 block text-xs text-muted-foreground"
                  >
                    {formatRelativeTime(notification.createdAt)}
                  </time>
                </div>
              </div>
            );

            return (
              <li key={notification.id} className="border-b border-border/50 last:border-0">
                {notification.link ? (
                  <Link
                    href={notification.link}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "block px-4 py-4 transition-colors hover:bg-muted/60",
                      !notification.isRead && "bg-moon-purple-soft/40"
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    disabled={isPending}
                    className={cn(
                      "block w-full px-4 py-4 text-left transition-colors hover:bg-muted/60",
                      !notification.isRead && "bg-moon-purple-soft/40"
                    )}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
