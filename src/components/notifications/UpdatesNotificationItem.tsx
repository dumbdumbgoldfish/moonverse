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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/notification";

const badgeStyles: Record<NotificationType, string> = {
  REVIEW_LIKE: "bg-sky-500 text-white",
  COMMENT_ON_REVIEW: "bg-orange-500 text-white",
  COMMENT_REPLY: "bg-violet-500 text-white",
  REVIEW_SAVED: "bg-emerald-500 text-white",
  NEW_FOLLOWER: "bg-primary text-primary-foreground",
  MOONIE_DAILY_PICK: "bg-fuchsia-500 text-white",
  REPORT_UPDATE: "bg-amber-500 text-white",
  DIGEST: "bg-slate-500 text-white",
  DIRECT_MESSAGE: "bg-blue-500 text-white",
};

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

interface UpdatesNotificationItemProps {
  notification: NotificationItem;
  onClick?: () => void;
}

function actorInitials(message: string): string {
  const word = message.split(" ")[0] ?? "MV";
  return word.slice(0, 2).toUpperCase();
}

function renderMessage(message: string) {
  const match = message.match(/^(.+?)\s+(commented|liked|replied|started|saved)/i);
  if (!match) return message;
  return (
    <>
      <span className="font-bold">{match[1]}</span>{" "}
      {message.slice(match[1].length).trim()}
    </>
  );
}

export function UpdatesNotificationItem({
  notification,
  onClick,
}: UpdatesNotificationItemProps) {
  const Icon = typeIcons[notification.type] ?? Bell;
  const badgeClass = badgeStyles[notification.type] ?? "bg-muted text-foreground";

  const content = (
    <div className="flex gap-3 px-4 py-3">
      <div className="relative shrink-0">
        <Avatar size="lg">
          <AvatarFallback className="bg-muted text-sm font-medium text-muted-foreground">
            {actorInitials(notification.message)}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-white",
            badgeClass
          )}
        >
          <Icon className="size-2.5" aria-hidden="true" />
        </span>
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-sm leading-snug text-foreground">
          {renderMessage(notification.message)}{" "}
          <time
            dateTime={notification.createdAt}
            className="whitespace-nowrap text-muted-foreground"
          >
            · {formatRelativeTime(notification.createdAt)}
          </time>
        </p>
      </div>
    </div>
  );

  const className = cn(
    "block transition-colors",
    !notification.isRead ? "bg-sky-50/80" : "hover:bg-muted/30"
  );

  const link =
    notification.link && !notification.link.startsWith("/messages")
      ? notification.link
      : null;

  if (link) {
    return (
      <Link href={link} onClick={onClick} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(className, "w-full text-left")}>
      {content}
    </button>
  );
}
