"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  markAllNotificationsAsReadAction,
  markNotificationsAsReadAction,
} from "@/actions/notification.actions";
import { NotificationDropdownRow } from "@/components/notifications/NotificationDropdownRow";
import { resolveBellOpenToggle } from "@/lib/notifications/bell-preview";
import {
  NOTIFICATION_DROPDOWN_BUCKET_LABELS,
  bucketDropdownNotifications,
} from "@/lib/notifications/inbox";
import { cn } from "@/lib/utils";
import type { EnrichedNotificationItem } from "@/types/notification";

interface NotificationDropdownProps {
  unreadCount: number;
  notifications: EnrichedNotificationItem[];
  className?: string;
  onOpen?: () => void;
}

interface InboxState {
  baselineSignature: string;
  baselineUnreadCount: number;
  notifications: EnrichedNotificationItem[];
  localUnreadCount: number;
}

function notificationBaselineSignature(
  notifications: EnrichedNotificationItem[],
  unreadCount: number
) {
  const readBits = notifications
    .map((notification) => `${notification.id}:${notification.isRead ? "1" : "0"}`)
    .sort();
  return `${unreadCount}|${readBits.join(",")}`;
}

function createInboxState(
  notifications: EnrichedNotificationItem[],
  unreadCount: number
): InboxState {
  return {
    baselineSignature: notificationBaselineSignature(notifications, unreadCount),
    baselineUnreadCount: unreadCount,
    notifications,
    localUnreadCount: unreadCount,
  };
}

export function NotificationDropdown({
  unreadCount,
  notifications: initialNotifications,
  className,
  onOpen,
}: NotificationDropdownProps) {
  const menuId = useId();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const requestGenerationRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorRecord, setErrorRecord] = useState<{
    signature: string;
    message: string;
  } | null>(null);
  const [inbox, setInbox] = useState(() =>
    createInboxState(initialNotifications, unreadCount)
  );

  const incomingSignature = notificationBaselineSignature(
    initialNotifications,
    unreadCount
  );
  let nextInbox = inbox;
  if (
    !isPending &&
    (inbox.baselineSignature !== incomingSignature ||
      inbox.baselineUnreadCount !== unreadCount)
  ) {
    nextInbox = createInboxState(initialNotifications, unreadCount);
    setInbox(nextInbox);
  }

  const notifications = nextInbox.notifications;
  const localUnreadCount = nextInbox.localUnreadCount;
  const error =
    errorRecord && errorRecord.signature === nextInbox.baselineSignature
      ? errorRecord.message
      : null;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const sections = bucketDropdownNotifications(notifications);

  const handleMarkAllRead = () => {
    const snapshot = {
      notifications: nextInbox.notifications,
      localUnreadCount: nextInbox.localUnreadCount,
      signature: nextInbox.baselineSignature,
    };
    const requestId = requestGenerationRef.current + 1;
    requestGenerationRef.current = requestId;
    setErrorRecord(null);
    setInbox((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
      localUnreadCount: 0,
    }));

    startTransition(async () => {
      const result = await markAllNotificationsAsReadAction();
      if (!result.success) {
        if (requestGenerationRef.current !== requestId) return;
        setErrorRecord({
          signature: snapshot.signature,
          message: result.error,
        });
        setInbox((current) => ({
          ...current,
          notifications: snapshot.notifications,
          localUnreadCount: snapshot.localUnreadCount,
        }));
        return;
      }
      router.refresh();
    });
  };

  const handleSelect = (notification: EnrichedNotificationItem) => {
    setErrorRecord(null);
    setOpen(false);

    const selected =
      nextInbox.notifications.find((item) => item.id === notification.id) ??
      notification;
    if (selected.isRead) return;

    requestGenerationRef.current += 1;
    setInbox((current) => {
      const currentItem = current.notifications.find(
        (item) => item.id === selected.id
      );
      if (!currentItem || currentItem.isRead) return current;
      return {
        ...current,
        notifications: current.notifications.map((item) =>
          item.id === selected.id ? { ...item, isRead: true } : item
        ),
        localUnreadCount: Math.max(0, current.localUnreadCount - 1),
      };
    });

    startTransition(async () => {
      await markNotificationsAsReadAction([selected.id]);
      router.refresh();
    });
  };

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <button
        type="button"
        id={`${menuId}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${menuId}-panel` : undefined}
        aria-label={
          localUnreadCount > 0
            ? `Notifications, ${localUnreadCount} unread`
            : "Notifications"
        }
        onClick={() => {
          const { nextOpen, shouldLoadPreview } = resolveBellOpenToggle(open);
          setOpen(nextOpen);
          if (shouldLoadPreview) onOpen?.();
        }}
        className={cn(
          "relative inline-flex size-11 items-center justify-center rounded-xl text-[#1A1224]/80 transition-colors",
          "hover:bg-[#F4ECF8]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/35",
          open && "bg-[#F4ECF8] text-[#4C2A67]"
        )}
      >
        <Bell className="size-5" aria-hidden />
        {localUnreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex min-w-[1.125rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {localUnreadCount > 9 ? "9+" : localUnreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={`${menuId}-panel`}
          role="menu"
          aria-labelledby={`${menuId}-trigger`}
          className={cn(
            "absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-1rem))] origin-top-right animate-in fade-in-0 zoom-in-95 duration-150 sm:w-[24rem]",
            "overflow-hidden rounded-2xl border border-[#E8DFEF]",
            "bg-[linear-gradient(180deg,#FFFFFF_0%,#FDFBFE_55%,#F8F1FA_100%)]",
            "shadow-[0_24px_60px_-28px_rgba(36,22,48,0.45)]"
          )}
        >
          <div className="flex items-center justify-between border-b border-[#EDE6F2] px-4 py-3">
            <p className="font-[family-name:var(--font-source-serif)] text-lg font-semibold tracking-tight text-[#1A1224]">
              Notifications
            </p>
            {localUnreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-[#6E46C7] transition-colors hover:bg-[#F4ECF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/35 disabled:opacity-50"
              >
                Mark all as read
              </button>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#F4ECF8] text-[#6E46C7]">
                <Bell className="size-5" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-[#1A1224]">
                You&apos;re all caught up
              </p>
              <p className="mt-1 text-xs text-[#7A7284]">
                Likes, comments, and follows will show up here.
              </p>
            </div>
          ) : (
            <div className="max-h-[min(28rem,calc(100dvh-var(--mv-nav-offset,4rem)-7rem))] overflow-y-auto overscroll-contain">
              {sections.map((section) => (
                <section key={section.bucket} aria-label={NOTIFICATION_DROPDOWN_BUCKET_LABELS[section.bucket]}>
                  <h3 className="sticky top-0 z-[1] bg-[#FDFBFE]/95 px-4 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9B93A8] backdrop-blur-sm">
                    {NOTIFICATION_DROPDOWN_BUCKET_LABELS[section.bucket]}
                  </h3>
                  <ul>
                    {section.items.map((notification) => (
                      <li key={notification.id} role="none">
                        <NotificationDropdownRow
                          notification={notification}
                          onSelect={handleSelect}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {error ? (
            <p className="border-t border-[#EDE6F2] px-4 py-2 text-xs text-rose-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="border-t border-[#EDE6F2] bg-[#FDFBFE]/95 px-4 py-2.5">
            <Link
              href="/notifications"
              className={cn(
                "block rounded-xl px-2 py-2 text-center text-sm font-semibold text-[#6E46C7]",
                "hover:bg-[#F4ECF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/35"
              )}
              onClick={() => setOpen(false)}
            >
              See all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
