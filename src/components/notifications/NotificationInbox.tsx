"use client";

import { Suspense, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Settings2 } from "lucide-react";
import {
  markAllNotificationsAsReadAction,
  markNotificationsAsReadAction,
} from "@/actions/notification.actions";
import {
  NotificationCard,
} from "@/components/notifications/NotificationCard";
import { MoonieEmptyState } from "@/components/moonie/MoonieEmptyState";
import { Button } from "@/components/ui/button";
import {
  bucketInboxRows,
  buildInboxInsight,
  countUnreadByFilter,
  groupInboxRows,
  notificationMatchesFilter,
  notificationInboxVersion,
  parseNotificationInboxFilter,
} from "@/lib/notifications/inbox";
import { moonieLoggedInEntryHref } from "@/lib/moonie/open-moonie";
import { SITE_PAGE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import type {
  EnrichedNotificationItem,
  NotificationInboxFilter,
} from "@/types/notification";
import {
  NOTIFICATION_DATE_BUCKET_LABELS,
  NOTIFICATION_FILTER_LABELS,
} from "@/types/notification";

interface NotificationInboxProps {
  notifications: EnrichedNotificationItem[];
  unreadCount: number;
}

const FILTERS: NotificationInboxFilter[] = [
  "all",
  "engagement",
  "social",
  "moonie",
  "system",
];

const EMPTY_COPY: Record<
  NotificationInboxFilter,
  { title: string; description: string }
> = {
  all: {
    title: "You are all caught up",
    description: "Review engagement and new follows show up here.",
  },
  engagement: {
    title: "No engagement yet",
    description: "Likes, comments, and saves on your reviews show here.",
  },
  social: {
    title: "No social updates",
    description: "New followers and reader connections show up here.",
  },
  moonie: {
    title: "No Moonie picks yet",
    description: "Moonie daily picks and personal nudges show up here.",
  },
  system: {
    title: "No system updates",
    description: "Digests, messages, and safety updates show up here.",
  },
};

export function NotificationInbox(props: NotificationInboxProps) {
  return (
    <Suspense fallback={<NotificationInboxFallback />}>
      <NotificationInboxInner
        key={notificationInboxVersion(props.notifications, props.unreadCount)}
        {...props}
      />
    </Suspense>
  );
}

function NotificationInboxFallback() {
  return (
    <div className="bg-[#FFFBFF] pb-10">
      <div className={cn(SITE_PAGE_SHELL_CLASS, "py-4")}>
        <div className="h-8 w-32 animate-pulse rounded-lg bg-[#1A1224]/8" />
        <div className="mt-4 h-10 w-full max-w-xl animate-pulse rounded-xl bg-[#1A1224]/6" />
      </div>
    </div>
  );
}

function NotificationInboxInner({
  notifications: initialNotifications,
  unreadCount: initialUnreadCount,
}: NotificationInboxProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parseNotificationInboxFilter(searchParams.get("tab"));
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();

  function selectFilter(next: NotificationInboxFilter) {
    if (next === filter) return;

    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const filtered = useMemo(
    () => notifications.filter((item) => notificationMatchesFilter(item.type, filter)),
    [notifications, filter]
  );

  const rows = useMemo(() => groupInboxRows(filtered), [filtered]);
  const sections = useMemo(() => bucketInboxRows(rows), [rows]);
  const insight = useMemo(() => buildInboxInsight(notifications), [notifications]);

  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((key) => [key, countUnreadByFilter(notifications, key)])
      ) as Record<NotificationInboxFilter, number>,
    [notifications]
  );

  function markIdsRead(ids: string[]) {
    if (ids.length === 0) return;
    const unreadIds = ids.filter((id) => {
      const item = notifications.find((n) => n.id === id);
      return item && !item.isRead;
    });
    if (unreadIds.length === 0) return;

    setNotifications((current) =>
      current.map((item) =>
        unreadIds.includes(item.id) ? { ...item, isRead: true } : item
      )
    );
    setUnreadCount((count) => Math.max(0, count - unreadIds.length));

    startTransition(async () => {
      await markNotificationsAsReadAction(unreadIds);
      router.refresh();
    });
  }

  function handleOpen(ids: string[]) {
    markIdsRead(ids);
  }

  function handleMarkAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    startTransition(async () => {
      await markAllNotificationsAsReadAction();
      router.refresh();
    });
  }

  return (
    <div className="bg-[#FFFBFF] pb-10">
      <div className="sticky top-0 z-20 border-b border-violet-100/80 bg-[#FFFBFF]/95 backdrop-blur-md md:top-16">
        <div className={cn(SITE_PAGE_SHELL_CLASS, "py-4")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-serif text-2xl font-bold text-[#1A1224]">Inbox</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} unread · updates about your reading circle`
                    : "All caught up on your reading circle"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/settings/notifications" />}
                >
                  <Settings2 data-icon="inline-start" aria-hidden />
                  Preferences
                </Button>
                {unreadCount > 0 ? (
                  <Button
                    size="sm"
                    onClick={handleMarkAllRead}
                    disabled={isPending}
                  >
                    Mark all read
                  </Button>
                ) : null}
              </div>
            </div>

          <div className="mt-4 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#F3EFFF]/70 p-1 scrollbar-hide ring-1 ring-violet-100/80">
            {FILTERS.map((key) => {
                const active = filter === key;
                const count = filterCounts[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectFilter(key)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/30",
                      active
                        ? "bg-white text-[#1A1224] shadow-[0_1px_3px_rgba(36,22,48,0.1)]"
                        : "text-[#1A1224]/55 hover:bg-white/60 hover:text-[#6E46C7]"
                    )}
                  >
                    {NOTIFICATION_FILTER_LABELS[key]}
                    {count > 0 ? (
                      <span
                        className={cn(
                          "min-w-[1.125rem] rounded-md px-1 py-0.5 text-center text-[10px] font-bold leading-none",
                          active
                            ? "bg-[#6E46C7]/12 text-[#6E46C7]"
                            : "bg-violet-100/80 text-[#6E46C7]/80"
                        )}
                      >
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      <div className={cn(SITE_PAGE_SHELL_CLASS, "pt-5")}>
        {insight && filter === "all" ? (
          <div className="mb-5 rounded-2xl border border-violet-100/90 bg-gradient-to-r from-violet-50/90 via-white to-fuchsia-50/70 px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Moonie insight
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[#1A1224]/80">
              {insight}
            </p>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <MoonieEmptyState
            context="notificationEmpty"
            variant="happy"
            title={EMPTY_COPY[filter].title}
            description={EMPTY_COPY[filter].description}
            descriptionClassName="max-w-none whitespace-nowrap"
            action={
              filter === "all" ? (
                <Button size="sm" render={<Link href="/reviews/new" />}>
                  Write a review
                </Button>
              ) : filter === "moonie" ? (
                <Button size="sm" render={<Link href={moonieLoggedInEntryHref()} />}>
                  Ask Moonie
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.bucket} aria-label={NOTIFICATION_DATE_BUCKET_LABELS[section.bucket]}>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {NOTIFICATION_DATE_BUCKET_LABELS[section.bucket]}
                </h2>
                <div className="space-y-2">
                  {section.rows.map((row) => (
                    <NotificationCard
                      key={
                        row.kind === "group"
                          ? `group:${row.ids.join("-")}`
                          : row.notification.id
                      }
                      row={row}
                      onOpen={handleOpen}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
