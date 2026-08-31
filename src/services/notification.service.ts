import { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  extractReviewIdFromLink,
  extractUsernameFromLink,
  parseNotificationMetadata,
} from "@/lib/notifications/inbox";
import {
  isPlatformAnnouncementMessage,
  parsePlatformAnnouncementMessage,
  PLATFORM_ANNOUNCEMENT_HEADLINE,
} from "@/lib/notifications/platform-announcement";
import { getFollowingIds } from "@/services/follow-queries";
import type {
  EnrichedNotificationItem,
  NotificationItem,
  NotificationMetadata,
} from "@/types/notification";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
  actorId?: string;
  metadata?: NotificationMetadata;
}

type NotificationRow = {
  id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  actorId: string | null;
  metadata: unknown;
  isRead: boolean;
  createdAt: Date;
};

function mapNotification(notification: NotificationRow): NotificationItem {
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    link: notification.link,
    actorId: notification.actorId,
    metadata: parseNotificationMetadata(notification.metadata),
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  };
}

function actionLabel(type: NotificationType): string {
  switch (type) {
    case "REVIEW_LIKE":
      return "liked your review";
    case "COMMENT_ON_REVIEW":
      return "commented on your review";
    case "COMMENT_REPLY":
      return "replied to your comment";
    case "REVIEW_SAVED":
      return "saved your review";
    case "NEW_FOLLOWER":
      return "started following you";
    case "MOONIE_DAILY_PICK":
      return "picked a story for you";
    case "REPORT_UPDATE":
      return "sent a trust & safety update";
    case "DIGEST":
      return "sent your reading digest";
    case "DIRECT_MESSAGE":
      return "sent you a message";
    default:
      return "sent you an update";
  }
}

function buildHeadline(
  type: NotificationType,
  message: string,
  actorDisplayName: string | null
): string {
  if (type === "MOONIE_DAILY_PICK") {
    return "Moonie's daily pick";
  }
  if (type === "DIGEST" && isPlatformAnnouncementMessage(message)) {
    return PLATFORM_ANNOUNCEMENT_HEADLINE;
  }
  if (type === "REPORT_UPDATE" || type === "DIGEST") {
    return message.split(".")[0] ?? message;
  }
  if (actorDisplayName) {
    return `${actorDisplayName} ${actionLabel(type)}`;
  }
  return message;
}

function buildSubline(
  type: NotificationType,
  metadata: NotificationMetadata | null,
  message: string
): string | null {
  if (metadata?.reviewTitle && metadata?.novelTitle) {
    return `${metadata.novelTitle} · "${metadata.reviewTitle}"`;
  }
  if (metadata?.reviewTitle) {
    return `"${metadata.reviewTitle}"`;
  }
  if (metadata?.novelTitle) {
    return metadata.novelTitle;
  }
  if (type === "MOONIE_DAILY_PICK") {
    return message.replace(/^Today's pick:\s*/i, "").split(".")[0] ?? null;
  }
  if (type === "DIGEST" && isPlatformAnnouncementMessage(message)) {
    const body = parsePlatformAnnouncementMessage(message);
    return body.length > 120 ? `${body.slice(0, 117).trim()}…` : body;
  }
  if (type === "NEW_FOLLOWER" && metadata?.actorUsername) {
    return `@${metadata.actorUsername}`;
  }
  return null;
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      message: input.message,
      link: input.link,
      actorId: input.actorId,
      metadata: input.metadata
        ? (input.metadata as Prisma.InputJsonValue)
        : undefined,
    },
    select: { id: true },
  });

  try {
    const {
      isTransactionalNotificationEmailType,
      sendTransactionalNotificationEmail,
    } = await import("@/lib/email/notification-emails");

    if (!isTransactionalNotificationEmailType(input.type)) {
      return;
    }

    await sendTransactionalNotificationEmail({
      notificationId: notification.id,
      userId: input.userId,
      type: input.type,
      link: input.link ?? "/notifications",
      actorId: input.actorId,
      metadata: input.metadata,
    });
  } catch (error) {
    console.error("[notification] transactional email failed:", error);
  }
}

async function fetchNotificationsForUser(
  userId: string,
  limit?: number
): Promise<NotificationRow[]> {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      message: true,
      link: true,
      actorId: true,
      metadata: true,
      isRead: true,
      createdAt: true,
    },
    ...(limit ? { take: limit } : {}),
  });
}

export async function getNotificationsByUser(
  userId: string,
  limit?: number
): Promise<NotificationItem[]> {
  const notifications = await fetchNotificationsForUser(userId, limit);
  return notifications.map(mapNotification);
}

export async function getEnrichedNotificationsByUser(
  userId: string,
  limit?: number
): Promise<EnrichedNotificationItem[]> {
  const notifications = await fetchNotificationsForUser(userId, limit);
  const items = notifications.map(mapNotification);
  return enrichNotifications(userId, items);
}

async function enrichNotifications(
  viewerId: string,
  items: NotificationItem[]
): Promise<EnrichedNotificationItem[]> {
  const reviewIds = new Set<string>();
  const usernames = new Set<string>();
  const actorIds = new Set<string>();

  for (const item of items) {
    const reviewId =
      item.metadata?.reviewId ?? extractReviewIdFromLink(item.link);
    if (reviewId) reviewIds.add(reviewId);

    const username =
      item.metadata?.actorUsername ?? extractUsernameFromLink(item.link);
    if (username) usernames.add(username);

    if (item.actorId) actorIds.add(item.actorId);
  }

  const [reviews, usersByUsername, actorsById] = await Promise.all([
    reviewIds.size
      ? db.review.findMany({
          where: { id: { in: [...reviewIds] } },
          select: {
            id: true,
            title: true,
            novel: {
              select: {
                id: true,
                title: true,
                coverUrl: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    usernames.size
      ? db.user.findMany({
          where: { username: { in: [...usernames] } },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        })
      : Promise.resolve([]),
    actorIds.size
      ? db.user.findMany({
          where: { id: { in: [...actorIds] } },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const reviewById = new Map(reviews.map((review) => [review.id, review]));
  const userByUsername = new Map(usersByUsername.map((user) => [user.username, user]));
  const actorById = new Map(actorsById.map((user) => [user.id, user]));

  const followerActorIds = [
    ...new Set(
      items
        .map((item) => {
          if (item.type !== "NEW_FOLLOWER") return null;
          if (item.actorId) return item.actorId;
          const username = item.metadata?.actorUsername;
          return username ? userByUsername.get(username)?.id ?? null : null;
        })
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const followingBackIds =
    followerActorIds.length > 0
      ? await getFollowingIds(viewerId, followerActorIds)
      : new Set<string>();

  return items.map((item) => {
    const metadata = { ...(item.metadata ?? {}) };
    const reviewId =
      metadata.reviewId ?? extractReviewIdFromLink(item.link) ?? undefined;
    const review = reviewId ? reviewById.get(reviewId) : undefined;

    if (review) {
      metadata.reviewId ??= review.id;
      metadata.reviewTitle ??= review.title;
      metadata.novelId ??= review.novel.id;
      metadata.novelTitle ??= review.novel.title;
      metadata.coverUrl ??= review.novel.coverUrl;
    }

    const actorFromId = item.actorId ? actorById.get(item.actorId) : undefined;
    const actorFromUsername = metadata.actorUsername
      ? userByUsername.get(metadata.actorUsername)
      : undefined;
    const actor = actorFromId ?? actorFromUsername ?? null;

    const actorDisplayName =
      metadata.actorDisplayName ?? actor?.displayName ?? null;
    const actorUsername = metadata.actorUsername ?? actor?.username ?? null;
    const actorAvatarUrl = metadata.actorAvatarUrl ?? actor?.avatarUrl ?? null;
    const resolvedActorId = item.actorId ?? actor?.id ?? null;

    return {
      ...item,
      actorId: resolvedActorId,
      metadata,
      actorDisplayName,
      actorUsername,
      actorAvatarUrl,
      reviewTitle: metadata.reviewTitle ?? null,
      novelTitle: metadata.novelTitle ?? null,
      coverUrl: metadata.coverUrl ?? null,
      headline: buildHeadline(item.type, item.message, actorDisplayName),
      subline: buildSubline(item.type, metadata, item.message),
      viewerIsFollowingActor:
        item.type === "NEW_FOLLOWER" && resolvedActorId
          ? followingBackIds.has(resolvedActorId)
          : undefined,
    };
  });
}

export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  return db.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  const notification = await db.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true },
  });

  if (!notification) {
    throw new Error("Notification not found.");
  }

  await db.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markNotificationsAsRead(
  notificationIds: string[],
  userId: string
): Promise<void> {
  if (notificationIds.length === 0) return;

  await db.notification.updateMany({
    where: {
      userId,
      id: { in: notificationIds },
      isRead: false,
    },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function getEnrichedNotificationForUser(
  userId: string,
  notificationId: string
): Promise<EnrichedNotificationItem | null> {
  const notification = await db.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) return null;
  const enriched = await enrichNotifications(userId, [mapNotification(notification)]);
  return enriched[0] ?? null;
}

export async function safeGetEnrichedNotificationsByUser(
  userId: string,
  limit?: number
): Promise<EnrichedNotificationItem[]> {
  try {
    return await getEnrichedNotificationsByUser(userId, limit);
  } catch (error) {
    console.error("Failed to load enriched notifications:", error);
    return [];
  }
}

export async function safeGetUnreadNotificationCount(
  userId: string
): Promise<number> {
  try {
    return await getUnreadNotificationCount(userId);
  } catch (error) {
    console.error("Failed to load unread notification count:", error);
    return 0;
  }
}
