"use client";

import Link from "next/link";
import {
  Bell,
  Bookmark,
  ChevronRight,
  Flag,
  Heart,
  Mail,
  MessageCircle,
  Newspaper,
  Sparkles,
  UserPlus,
} from "lucide-react";
import type { NotificationType } from "@prisma/client";
import { FollowButton } from "@/components/users/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatRelativeTime } from "@/lib/date-utils";
import {
  isPlatformAnnouncementMessage,
  PLATFORM_ANNOUNCEMENT_HEADLINE,
} from "@/lib/notifications/platform-announcement";
import { getInitials } from "@/lib/initials";
import { cn } from "@/lib/utils";
import type {
  EnrichedNotificationItem,
  GroupedNotificationItem,
  InboxRow,
} from "@/types/notification";

const typeLabels: Record<NotificationType, string> = {
  REVIEW_LIKE: "Like",
  COMMENT_ON_REVIEW: "Comment",
  COMMENT_REPLY: "Reply",
  REVIEW_SAVED: "Save",
  NEW_FOLLOWER: "Follow",
  MOONIE_DAILY_PICK: "Moonie pick",
  REPORT_UPDATE: "Trust & safety",
  DIGEST: "Digest",
  DIRECT_MESSAGE: "Message",
};

const platformAnnouncementTypeLabel = "System announcement";

const typeIcons: Record<NotificationType, typeof Heart> = {
  REVIEW_LIKE: Heart,
  COMMENT_ON_REVIEW: MessageCircle,
  COMMENT_REPLY: MessageCircle,
  REVIEW_SAVED: Bookmark,
  NEW_FOLLOWER: UserPlus,
  MOONIE_DAILY_PICK: Sparkles,
  REPORT_UPDATE: Flag,
  DIGEST: Newspaper,
  DIRECT_MESSAGE: Mail,
};

interface NotificationCardProps {
  row: InboxRow;
  onOpen?: (ids: string[]) => void;
  compact?: boolean;
}

function TypeChip({
  type,
  platformAnnouncement,
}: {
  type: NotificationType;
  platformAnnouncement?: boolean;
}) {
  const Icon = typeIcons[type] ?? Bell;
  const label = platformAnnouncement
    ? platformAnnouncementTypeLabel
    : typeLabels[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
        platformAnnouncement
          ? "bg-[#4C2A67] text-white ring-[#4C2A67]/30"
          : "bg-violet-50 text-primary ring-violet-100"
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

function isPlatformAnnouncementRow(row: InboxRow): boolean {
  return (
    row.kind === "single" &&
    row.notification.type === "DIGEST" &&
    isPlatformAnnouncementMessage(row.notification.message)
  );
}

function ActorStack({
  actors,
}: {
  actors: GroupedNotificationItem["actors"];
}) {
  const visible = actors.slice(0, 3);
  return (
    <div className="flex -space-x-2">
      {visible.map((actor) => (
        <Avatar key={`${actor.username ?? actor.displayName}`} size="sm" className="ring-2 ring-white">
          {actor.avatarUrl ? <AvatarImage src={actor.avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-violet-100 text-[10px] font-bold text-primary">
            {getInitials(actor.displayName)}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

function VisualLead({
  row,
  compact,
}: {
  row: InboxRow;
  compact?: boolean;
}) {
  const sizeClass = compact ? "size-10" : "size-11";

  if (row.kind === "group") {
    return <ActorStack actors={row.actors} />;
  }

  const notification = row.notification;
  const platformAnnouncement = isPlatformAnnouncementRow(row);
  const showCover =
    notification.coverUrl &&
    notification.type !== "NEW_FOLLOWER" &&
    !platformAnnouncement;

  if (showCover) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-muted shadow-sm",
          compact ? "h-12 w-9" : "h-14 w-10"
        )}
      >
        <CoverImage
          src={notification.coverUrl}
          alt=""
          title={notification.novelTitle ?? "Novel cover"}
          sizes="48px"
          compactFallback
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const name =
    notification.actorDisplayName ??
    (notification.type === "MOONIE_DAILY_PICK" || platformAnnouncement
      ? "Moonie"
      : "MV");

  return (
    <Avatar className={cn(sizeClass, "shrink-0 ring-2 ring-white shadow-sm")}>
      {notification.actorAvatarUrl ? (
        <AvatarImage src={notification.actorAvatarUrl} alt="" />
      ) : null}
      <AvatarFallback
        className={cn(
          "font-bold text-primary",
          platformAnnouncement || notification.type === "MOONIE_DAILY_PICK"
            ? "bg-gradient-to-br from-[#4C2A67] to-[#6E46C7] text-white"
            : "bg-violet-100",
          compact ? "text-xs" : "text-sm"
        )}
      >
        {platformAnnouncement || notification.type === "MOONIE_DAILY_PICK"
          ? "M"
          : getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

function CardBody({
  row,
  compact,
}: {
  row: InboxRow;
  compact?: boolean;
}) {
  const isRead = row.kind === "group" ? row.isRead : row.notification.isRead;
  const type = row.kind === "group" ? row.type : row.notification.type;
  const platformAnnouncement = isPlatformAnnouncementRow(row);
  const headline =
    row.kind === "group"
      ? row.headline
      : platformAnnouncement
        ? PLATFORM_ANNOUNCEMENT_HEADLINE
        : row.notification.headline;
  const subline =
    row.kind === "group" ? row.subline : row.notification.subline;
  const createdAt =
    row.kind === "group" ? row.createdAt : row.notification.createdAt;

  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <TypeChip type={type} platformAnnouncement={platformAnnouncement} />
        <time
          dateTime={createdAt}
          className="text-xs text-muted-foreground"
        >
          {formatRelativeTime(createdAt)}
        </time>
      </div>
      <p
        className={cn(
          "mt-0.5 line-clamp-2 leading-snug text-[#1A1224]",
          compact ? "text-sm" : "text-sm",
          !isRead && "font-semibold"
        )}
      >
        {headline}
      </p>
      {subline ? (
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {subline}
        </p>
      ) : null}
    </div>
  );
}

function getFollowBackTarget(
  row: InboxRow
): { userId: string; username: string; isFollowing: boolean } | null {
  if (row.kind !== "single" || row.notification.type !== "NEW_FOLLOWER") {
    return null;
  }

  const { actorId, actorUsername, viewerIsFollowingActor } = row.notification;
  if (!actorId || !actorUsername) return null;

  return {
    userId: actorId,
    username: actorUsername,
    isFollowing: viewerIsFollowingActor ?? false,
  };
}

export function NotificationCard({
  row,
  onOpen,
  compact = false,
}: NotificationCardProps) {
  const isRead = row.kind === "group" ? row.isRead : row.notification.isRead;
  const link = row.kind === "group" ? row.link : row.notification.link;
  const ids =
    row.kind === "group"
      ? row.ids
      : [row.notification.id];
  const followBackTarget = getFollowBackTarget(row);
  const platformAnnouncement = isPlatformAnnouncementRow(row);
  const platformDetailHref =
    platformAnnouncement && row.kind === "single"
      ? `/notifications/${row.notification.id}`
      : null;

  const className = cn(
    "group w-full rounded-xl border px-3 py-2.5 text-left transition-all sm:px-4",
    platformAnnouncement ? "flex flex-col gap-0" : "flex items-center gap-3",
    "border-violet-100/80 bg-white shadow-[0_4px_16px_-12px_rgba(26,16,51,0.3)]",
    "hover:border-primary/20 hover:shadow-[0_10px_24px_-18px_rgba(98,70,234,0.24)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    !isRead && "border-l-[3px] border-l-rose-600 bg-violet-50/40 pl-2 sm:pl-3"
  );

  const mainContent = (
    <>
      <VisualLead row={row} compact={compact} />
      <CardBody row={row} compact={compact} />
    </>
  );

  if (followBackTarget && link && !link.startsWith("/messages")) {
    return (
      <div className={cn(className, "flex items-center gap-3")}>
        <Link
          href={link}
          className="flex min-w-0 flex-1 items-center gap-3"
          onClick={() => onOpen?.(ids)}
        >
          {mainContent}
        </Link>
        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <FollowButton
            userId={followBackTarget.userId}
            username={followBackTarget.username}
            initialFollowing={followBackTarget.isFollowing}
            appearance="pill"
            notFollowingLabel="Follow back"
          />
          <Link
            href={link}
            className="inline-flex text-muted-foreground/45 transition hover:text-primary"
            onClick={() => onOpen?.(ids)}
            aria-label="View profile"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  const content = (
    <div className="flex w-full items-center gap-3">
      {mainContent}
      <ChevronRight
        className="ml-1 size-4 shrink-0 text-muted-foreground/45 transition group-hover:text-primary sm:ml-2"
        aria-hidden
      />
    </div>
  );

  if (platformDetailHref) {
    return (
      <Link
        href={platformDetailHref}
        className={className}
        onClick={() => onOpen?.(ids)}
      >
        {content}
      </Link>
    );
  }

  if (link && !link.startsWith("/messages")) {
    return (
      <Link
        href={link}
        className={className}
        onClick={() => onOpen?.(ids)}
      >
        {content}
      </Link>
    );
  }

  if (platformAnnouncement) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => onOpen?.(ids)}
      >
        {content}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => onOpen?.(ids)}
    >
      {content}
    </button>
  );
}

export function notificationRowIsUnread(row: InboxRow): boolean {
  return row.kind === "group" ? !row.isRead : !row.notification.isRead;
}

export function notificationRowIds(row: InboxRow): string[] {
  return row.kind === "group" ? row.ids : [row.notification.id];
}

export type { EnrichedNotificationItem };
