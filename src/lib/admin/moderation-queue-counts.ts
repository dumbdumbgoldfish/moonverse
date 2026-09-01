import type { InboxItemKind } from "@/services/admin/inbox.service";

export type ModerationQueueCounts = Record<InboxItemKind | "total", number>;

export type ModerationQueueCountParts = Omit<ModerationQueueCounts, "total">;

/** Matches inbox list semantics: pending moderation vs approved-but-unhealthy are separate buckets. */
export function computeModerationQueueTotal(
  parts: ModerationQueueCountParts
): number {
  return (
    parts.report +
    parts.review_flagged +
    parts.comment_flagged +
    parts.reading_link +
    parts.reading_link_unhealthy +
    parts.tag_suggestion
  );
}

export interface ModerationQueueBreakdownItem {
  key: string;
  label: string;
  count: number;
}

export function buildModerationQueueBreakdown(
  counts: ModerationQueueCounts
): ModerationQueueBreakdownItem[] {
  return [
    { key: "reports", label: "Reports", count: counts.report },
    {
      key: "reviews",
      label: "Flagged reviews",
      count: counts.review_flagged,
    },
    {
      key: "comments",
      label: "Flagged comments",
      count: counts.comment_flagged,
    },
    {
      key: "links",
      label: "Pending reading links",
      count: counts.reading_link,
    },
    {
      key: "links_unhealthy",
      label: "Unhealthy reading links",
      count: counts.reading_link_unhealthy,
    },
    {
      key: "tags",
      label: "Tag suggestions",
      count: counts.tag_suggestion,
    },
  ].filter((item) => item.count > 0);
}
