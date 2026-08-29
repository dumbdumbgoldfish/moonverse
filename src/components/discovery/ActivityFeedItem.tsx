import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Bookmark,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { ActivityPreview } from "@/types/discovery";

const typeIcons: Record<string, typeof Heart> = {
  REVIEW_LIKE: Heart,
  COMMENT_ON_REVIEW: MessageCircle,
  COMMENT_REPLY: MessageCircle,
  REVIEW_SAVED: Bookmark,
  NEW_FOLLOWER: UserPlus,
};

interface ActivityFeedItemProps {
  activity: ActivityPreview;
  compact?: boolean;
}

export function ActivityFeedItem({ activity, compact = false }: ActivityFeedItemProps) {
  const Icon = typeIcons[activity.type] ?? MessageCircle;
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 bg-white px-4",
        compact ? "py-2.5" : "py-3"
      )}
    >
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback className="bg-moon-purple-soft text-[10px] text-primary">
          {activity.actorInitials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className={cn("leading-snug text-foreground", compact ? "text-xs" : "text-sm")}>
          {activity.message}
        </p>
        <time
          dateTime={activity.createdAt}
          className="mt-0.5 block text-[10px] text-muted-foreground"
        >
          {formatRelativeTime(activity.createdAt)}
        </time>
      </div>
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-moon-purple-soft text-primary">
        <Icon className="size-3.5" aria-hidden="true" />
      </div>
    </div>
  );

  if (activity.link) {
    return (
      <Link href={activity.link} className="block transition-colors hover:bg-muted/30">
        {content}
      </Link>
    );
  }

  return content;
}
