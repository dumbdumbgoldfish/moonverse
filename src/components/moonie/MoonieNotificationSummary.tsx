"use client";

import { FloatingMoonie } from "@/components/brand/FloatingMoonie";
import type { NotificationItem } from "@/types/notification";

interface MoonieNotificationSummaryProps {
  notifications: NotificationItem[];
}

export function MoonieNotificationSummary({
  notifications,
}: MoonieNotificationSummaryProps) {
  const unread = notifications.filter((n) => !n.isRead);
  if (unread.length === 0) return null;

  const counts = {
    reviews: 0,
    followers: 0,
    updates: 0,
  };

  for (const n of unread) {
    if (n.type === "NEW_FOLLOWER") counts.followers += 1;
    else if (n.type === "COMMENT_ON_REVIEW" || n.type === "COMMENT_REPLY")
      counts.updates += 1;
    else counts.reviews += 1;
  }

  const lines: string[] = [];
  if (counts.reviews > 0) {
    lines.push(`${counts.reviews} new review interaction${counts.reviews === 1 ? "" : "s"}`);
  }
  if (counts.followers > 0) {
    lines.push(`${counts.followers} new follower${counts.followers === 1 ? "" : "s"}`);
  }
  if (counts.updates > 0) {
    lines.push(`${counts.updates} stor${counts.updates === 1 ? "y" : "ies"} updated`);
  }

  if (lines.length === 0) return null;

  return (
    <div className="relative mx-4 mb-4 flex items-start gap-2 overflow-visible">
      <FloatingMoonie context="notification" size={60} />
      <div className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Moonie noticed
        </p>
        <ul className="mt-1 space-y-0.5 text-sm">
          {lines.map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
