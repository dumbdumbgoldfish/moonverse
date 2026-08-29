"use client";

import Link from "next/link";
import {
  Bell,
  Bookmark,
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
import { getInitials } from "@/lib/review-utils";
import { cn } from "@/lib/utils";
import type { EnrichedNotificationItem } from "@/types/notification";

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

const badgeStyles: Record<NotificationType, string> = {
  REVIEW_LIKE: "bg-sky-500 text-white",
  COMMENT_ON_REVIEW: "bg-[#6E46C7] text-white",
  COMMENT_REPLY: "bg-violet-500 text-white",
  REVIEW_SAVED: "bg-emerald-500 text-white",
  NEW_FOLLOWER: "bg-[#4C2A67] text-white",
  MOONIE_DAILY_PICK: "bg-fuchsia-500 text-white",
  REPORT_UPDATE: "bg-amber-500 text-white",
  DIGEST: "bg-slate-500 text-white",
  DIRECT_MESSAGE: "bg-blue-500 text-white",
};

function getPreview(notification: EnrichedNotificationItem): string | null {
  const snippet = notification.metadata?.snippet?.trim();
  if (snippet) return snippet;
  return notification.subline;
}

function NotificationAvatar({
  notification,
}: {
  notification: EnrichedNotificationItem;
}) {
  const Icon = typeIcons[notification.type] ?? Bell;
  const badgeClass = badgeStyles[notification.type] ?? "bg-[#6E46C7] text-white";
  const showCover =
    notification.coverUrl && notification.type !== "NEW_FOLLOWER";
  const actorName =
    notification.actorDisplayName ??
    (notification.type === "MOONIE_DAILY_PICK" ? "Moonie" : "MV");

  return (
    <div className="relative shrink-0">
      {showCover ? (
        <div className="relative size-12 overflow-hidden rounded-full border border-[#E8DFEF] bg-muted shadow-sm">
          <CoverImage
            src={notification.coverUrl}
            alt=""
            title={notification.novelTitle ?? "Novel cover"}
            sizes="48px"
            compactFallback
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <Avatar className="size-12 ring-2 ring-white shadow-sm">
          {notification.actorAvatarUrl ? (
            <AvatarImage src={notification.actorAvatarUrl} alt="" />
          ) : null}
          <AvatarFallback
            className={cn(
              "text-sm font-bold text-[#4C2A67]",
              notification.type === "MOONIE_DAILY_PICK"
                ? "bg-fuchsia-50"
                : "bg-[#F4ECF8]"
            )}
          >
            {notification.type === "MOONIE_DAILY_PICK"
              ? "M"
              : getInitials(actorName)}
          </AvatarFallback>
        </Avatar>
      )}
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-white shadow-sm",
          badgeClass
        )}
      >
        <Icon className="size-2.5" aria-hidden />
      </span>
    </div>
  );
}

interface NotificationDropdownRowProps {
  notification: EnrichedNotificationItem;
  onSelect: (notification: EnrichedNotificationItem) => void;
}

function getFollowBackTarget(
  notification: EnrichedNotificationItem
): { userId: string; username: string; isFollowing: boolean } | null {
  if (notification.type !== "NEW_FOLLOWER") return null;

  const { actorId, actorUsername, viewerIsFollowingActor } = notification;
  if (!actorId || !actorUsername) return null;

  return {
    userId: actorId,
    username: actorUsername,
    isFollowing: viewerIsFollowingActor ?? false,
  };
}

export function NotificationDropdownRow({
  notification,
  onSelect,
}: NotificationDropdownRowProps) {
  const preview = getPreview(notification);
  const followBackTarget = getFollowBackTarget(notification);
  const link =
    notification.link && !notification.link.startsWith("/messages")
      ? notification.link
      : null;

  const className = cn(
    "relative flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors sm:px-4",
    "hover:bg-[#F8F1FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6E46C7]/35",
    !notification.isRead && "bg-[#F4ECF8]/75 hover:bg-[#F0E8F8]"
  );

  const mainContent = (
    <>
      <NotificationAvatar notification={notification} />
      <div className={cn("min-w-0 flex-1", followBackTarget ? "pr-1" : "pr-4")}>
        <p
          className={cn(
            "text-sm leading-snug text-[#1A1224]",
            !notification.isRead && "font-semibold"
          )}
        >
          {notification.headline}
        </p>
        {preview ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#7A7284]">
            {preview}
          </p>
        ) : null}
        <time
          dateTime={notification.createdAt}
          className="mt-1 block text-[11px] font-medium text-[#9B93A8]"
        >
          {formatRelativeTime(notification.createdAt)}
        </time>
      </div>
    </>
  );

  if (followBackTarget) {
    return (
      <div className={className}>
        {link ? (
          <Link
            href={link}
            className="flex min-w-0 flex-1 items-start gap-3"
            onClick={() => onSelect(notification)}
          >
            {mainContent}
          </Link>
        ) : (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
            onClick={() => onSelect(notification)}
          >
            {mainContent}
          </button>
        )}
        <div
          className="flex shrink-0 flex-col items-end gap-2 self-center"
          onClick={(event) => event.stopPropagation()}
        >
          {!notification.isRead ? (
            <span
              className="size-2 rounded-full bg-[#6E46C7] ring-2 ring-white"
              aria-hidden
            />
          ) : null}
          <FollowButton
            userId={followBackTarget.userId}
            username={followBackTarget.username}
            initialFollowing={followBackTarget.isFollowing}
            appearance="pill"
            notFollowingLabel="Follow back"
          />
        </div>
      </div>
    );
  }

  const content = (
    <>
      {mainContent}
      {!notification.isRead ? (
        <span
          className="absolute right-3 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[#6E46C7] ring-2 ring-white sm:right-4"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (link) {
    return (
      <Link
        href={link}
        className={className}
        onClick={() => onSelect(notification)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => onSelect(notification)}
    >
      {content}
    </button>
  );
}
