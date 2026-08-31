import type { NotificationType } from "@prisma/client";
import type {
  EnrichedNotificationItem,
  GroupedNotificationItem,
  InboxRow,
  NotificationDateBucket,
  NotificationInboxFilter,
  NotificationItem,
  NotificationMetadata,
} from "@/types/notification";

const ENGAGEMENT_TYPES = new Set<NotificationType>([
  "REVIEW_LIKE",
  "COMMENT_ON_REVIEW",
  "COMMENT_REPLY",
  "REVIEW_SAVED",
]);

const SOCIAL_TYPES = new Set<NotificationType>(["NEW_FOLLOWER"]);
const MOONIE_TYPES = new Set<NotificationType>(["MOONIE_DAILY_PICK"]);
const SYSTEM_TYPES = new Set<NotificationType>([
  "REPORT_UPDATE",
  "DIGEST",
  "DIRECT_MESSAGE",
]);

const GROUPABLE_TYPES = new Set<NotificationType>(["REVIEW_LIKE", "REVIEW_SAVED"]);
const GROUP_WINDOW_MS = 48 * 60 * 60 * 1000;

const INBOX_FILTERS: NotificationInboxFilter[] = [
  "all",
  "engagement",
  "social",
  "moonie",
  "system",
];

export function notificationInboxVersion(
  notifications: EnrichedNotificationItem[],
  unreadCount: number
): string {
  return `${unreadCount}|${notifications
    .map((notification) => `${notification.id}:${notification.isRead ? "1" : "0"}`)
    .join(",")}`;
}

export function parseNotificationInboxFilter(
  value: string | null | undefined
): NotificationInboxFilter {
  if (value && INBOX_FILTERS.includes(value as NotificationInboxFilter)) {
    return value as NotificationInboxFilter;
  }
  return "all";
}

export function notificationMatchesFilter(
  type: NotificationType,
  filter: NotificationInboxFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "engagement") return ENGAGEMENT_TYPES.has(type);
  if (filter === "social") return SOCIAL_TYPES.has(type);
  if (filter === "moonie") return MOONIE_TYPES.has(type);
  return SYSTEM_TYPES.has(type);
}

export function countUnreadByFilter(
  notifications: NotificationItem[],
  filter: NotificationInboxFilter
): number {
  return notifications.filter(
    (n) => !n.isRead && notificationMatchesFilter(n.type, filter)
  ).length;
}

export function getDateBucket(isoDate: string, now = new Date()): NotificationDateBucket {
  const date = new Date(isoDate);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (date >= startOfToday) return "today";
  if (date >= startOfYesterday) return "yesterday";
  if (date >= startOfWeek) return "this_week";
  return "earlier";
}

export function groupInboxRows(
  notifications: EnrichedNotificationItem[]
): InboxRow[] {
  const rows: InboxRow[] = [];
  let index = 0;

  while (index < notifications.length) {
    const current = notifications[index]!;
    const reviewId = current.metadata?.reviewId ?? null;

    if (
      reviewId &&
      GROUPABLE_TYPES.has(current.type) &&
      !current.isRead
    ) {
      const group: EnrichedNotificationItem[] = [current];
      let next = index + 1;

      while (next < notifications.length) {
        const candidate = notifications[next]!;
        const candidateReviewId = candidate.metadata?.reviewId ?? null;
        const withinWindow =
          Math.abs(
            new Date(current.createdAt).getTime() -
              new Date(candidate.createdAt).getTime()
          ) <= GROUP_WINDOW_MS;

        if (
          candidate.type === current.type &&
          candidateReviewId === reviewId &&
          withinWindow &&
          !candidate.isRead
        ) {
          group.push(candidate);
          next += 1;
          continue;
        }
        break;
      }

      if (group.length > 1) {
        rows.push(buildGroupedRow(group));
        index = next;
        continue;
      }
    }

    rows.push({ kind: "single", notification: current });
    index += 1;
  }

  return rows;
}

function buildGroupedRow(
  group: EnrichedNotificationItem[]
): GroupedNotificationItem {
  const first = group[0]!;
  const actors = group.map((item) => ({
    id: item.actorId,
    displayName: item.actorDisplayName ?? "Someone",
    username: item.actorUsername,
    avatarUrl: item.actorAvatarUrl,
  }));

  const action =
    first.type === "REVIEW_SAVED"
      ? "saved your review"
      : "liked your review";

  const headline =
    actors.length === 2
      ? `${actors[0]!.displayName} and ${actors[1]!.displayName} ${action}`
      : `${actors[0]!.displayName} and ${actors.length - 1} others ${action}`;

  return {
    kind: "group",
    ids: group.map((item) => item.id),
    type: first.type,
    link: first.link,
    isRead: group.every((item) => item.isRead),
    createdAt: first.createdAt,
    actors,
    reviewTitle: first.reviewTitle,
    novelTitle: first.novelTitle,
    coverUrl: first.coverUrl,
    headline,
    subline: first.reviewTitle ?? first.novelTitle,
  };
}

export function bucketInboxRows(
  rows: InboxRow[],
  now = new Date()
): Array<{ bucket: NotificationDateBucket; rows: InboxRow[] }> {
  const map = new Map<NotificationDateBucket, InboxRow[]>();
  const order: NotificationDateBucket[] = [
    "today",
    "yesterday",
    "this_week",
    "earlier",
  ];

  for (const row of rows) {
    const createdAt =
      row.kind === "group" ? row.createdAt : row.notification.createdAt;
    const bucket = getDateBucket(createdAt, now);
    const list = map.get(bucket) ?? [];
    list.push(row);
    map.set(bucket, list);
  }

  return order
    .filter((bucket) => (map.get(bucket)?.length ?? 0) > 0)
    .map((bucket) => ({ bucket, rows: map.get(bucket)! }));
}

export function buildInboxInsight(
  notifications: EnrichedNotificationItem[]
): string | null {
  const unread = notifications.filter((n) => !n.isRead);
  if (unread.length === 0) return null;

  const engagement = unread.filter((n) => ENGAGEMENT_TYPES.has(n.type)).length;
  const followers = unread.filter((n) => n.type === "NEW_FOLLOWER").length;
  const moonie = unread.filter((n) => MOONIE_TYPES.has(n.type)).length;

  const parts: string[] = [];
  if (engagement > 0) {
    parts.push(
      `${engagement} review interaction${engagement === 1 ? "" : "s"}`
    );
  }
  if (followers > 0) {
    parts.push(`${followers} new follower${followers === 1 ? "" : "s"}`);
  }
  if (moonie > 0) {
    parts.push(`${moonie} Moonie pick${moonie === 1 ? "" : "s"}`);
  }

  if (parts.length === 0) {
    return `${unread.length} unread update${unread.length === 1 ? "" : "s"} waiting for you.`;
  }

  return `Moonie spotted ${parts.join(", ")}.`;
}

export type NotificationDropdownBucket = "today" | "earlier";

export const NOTIFICATION_DROPDOWN_BUCKET_LABELS: Record<
  NotificationDropdownBucket,
  string
> = {
  today: "Today",
  earlier: "Earlier",
};

export function bucketDropdownNotifications(
  notifications: EnrichedNotificationItem[],
  now = new Date()
): Array<{ bucket: NotificationDropdownBucket; items: EnrichedNotificationItem[] }> {
  const today: EnrichedNotificationItem[] = [];
  const earlier: EnrichedNotificationItem[] = [];

  for (const notification of notifications) {
    if (getDateBucket(notification.createdAt, now) === "today") {
      today.push(notification);
    } else {
      earlier.push(notification);
    }
  }

  const sections: Array<{
    bucket: NotificationDropdownBucket;
    items: EnrichedNotificationItem[];
  }> = [];

  if (today.length > 0) {
    sections.push({ bucket: "today", items: today });
  }
  if (earlier.length > 0) {
    sections.push({ bucket: "earlier", items: earlier });
  }

  return sections;
}

export function parseNotificationMetadata(
  value: unknown
): NotificationMetadata | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as NotificationMetadata;
}

export function extractReviewIdFromLink(link: string | null): string | null {
  if (!link) return null;
  const match = link.match(/\/reviews\/([^#/?]+)/);
  return match?.[1] ?? null;
}

export function extractUsernameFromLink(link: string | null): string | null {
  if (!link) return null;
  const match = link.match(/\/users\/([^/?]+)/);
  return match?.[1] ?? null;
}
