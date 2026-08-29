import type { NotificationType } from "@prisma/client";

export interface NotificationMetadata {
  actorDisplayName?: string;
  actorUsername?: string;
  actorAvatarUrl?: string | null;
  reviewId?: string;
  reviewTitle?: string;
  novelId?: string;
  novelTitle?: string;
  coverUrl?: string | null;
  folderName?: string;
  snippet?: string;
  commentId?: string;
  emailSentAt?: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  actorId: string | null;
  metadata: NotificationMetadata | null;
  isRead: boolean;
  createdAt: string;
}

export interface EnrichedNotificationItem extends NotificationItem {
  actorDisplayName: string | null;
  actorUsername: string | null;
  actorAvatarUrl: string | null;
  reviewTitle: string | null;
  novelTitle: string | null;
  coverUrl: string | null;
  headline: string;
  subline: string | null;
  /** Whether the inbox owner already follows the actor (follower notifications). */
  viewerIsFollowingActor?: boolean;
}

export type NotificationInboxFilter =
  | "all"
  | "engagement"
  | "social"
  | "moonie"
  | "system";

export interface GroupedNotificationItem {
  kind: "group";
  ids: string[];
  type: NotificationType;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  actors: Array<{
    id: string | null;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  }>;
  reviewTitle: string | null;
  novelTitle: string | null;
  coverUrl: string | null;
  headline: string;
  subline: string | null;
}

export type InboxRow =
  | { kind: "single"; notification: EnrichedNotificationItem }
  | GroupedNotificationItem;

export type NotificationDateBucket =
  | "today"
  | "yesterday"
  | "this_week"
  | "earlier";

export const NOTIFICATION_FILTER_LABELS: Record<
  NotificationInboxFilter,
  string
> = {
  all: "All",
  engagement: "Engagement",
  social: "Social",
  moonie: "Moonie",
  system: "System",
};

export const NOTIFICATION_DATE_BUCKET_LABELS: Record<
  NotificationDateBucket,
  string
> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This week",
  earlier: "Earlier",
};
