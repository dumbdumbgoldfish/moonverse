"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/actions/notification.actions";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/notification";

interface NotificationDropdownProps {
  unreadCount: number;
  notifications: NotificationItem[];
}

export function NotificationDropdown({
  unreadCount,
  notifications,
}: NotificationDropdownProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAllRead = () => {
    setError(null);
    startTransition(async () => {
      const result = await markAllNotificationsAsReadAction();
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    setError(null);
    setOpen(false);

    startTransition(async () => {
      if (!notification.isRead) {
        await markNotificationAsReadAction(notification.id);
      }

      router.refresh();

      if (notification.link) {
        router.push(notification.link);
      }
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((current) => !current)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border/60 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <p className="text-sm font-medium">Notifications</p>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleMarkAllRead}
                disabled={isPending}
              >
                Mark all read
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNotificationClick(notification)}
                    disabled={isPending}
                    className={cn(
                      "flex w-full flex-col gap-1 border-b border-border/40 px-4 py-3 text-left transition-colors hover:bg-muted last:border-b-0",
                      !notification.isRead && "bg-moon-purple-soft/50"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm leading-snug",
                        !notification.isRead && "font-medium"
                      )}
                    >
                      {notification.message}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                      {!notification.isRead && (
                        <span className="ml-2 inline-block size-1.5 rounded-full bg-primary align-middle" />
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="px-4 py-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="border-t border-border/60 px-4 py-2">
            <Link
              href="/notifications"
              className="block rounded-md px-2 py-1.5 text-center text-sm font-medium text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
