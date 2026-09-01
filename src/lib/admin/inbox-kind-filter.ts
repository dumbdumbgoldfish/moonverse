import type { InboxItemKind } from "@/services/admin/inbox.service";

export type InboxKindFilterId = InboxItemKind | "all";

export interface InboxKindFilterOption {
  id: InboxKindFilterId;
  label: string;
}

export const INBOX_KIND_FILTER_OPTIONS: InboxKindFilterOption[] = [
  { id: "all", label: "All" },
  { id: "report", label: "Reports" },
  { id: "review_flagged", label: "Reviews" },
  { id: "comment_flagged", label: "Comments" },
  { id: "reading_link", label: "Links" },
  { id: "reading_link_unhealthy", label: "Unhealthy links" },
  { id: "tag_suggestion", label: "Tags" },
];

export function inboxKindFilterHref(kind: InboxKindFilterId): string {
  if (kind === "all") {
    return "/admin/inbox";
  }
  return `/admin/inbox?kind=${kind}`;
}

export function inboxKindFilterCountKey(
  kind: InboxKindFilterId
): InboxItemKind | "total" {
  return kind === "all" ? "total" : kind;
}

export function filterInboxItemsByKind<T extends { kind: InboxItemKind }>(
  items: T[],
  filter: InboxKindFilterId
): T[] {
  if (filter === "all") {
    return items;
  }
  return items.filter((item) => item.kind === filter);
}

export function inboxKindFilterEmptyMessage(filter: InboxKindFilterId): string {
  if (filter === "tag_suggestion") {
    return "No pending tag suggestions in the moderation queue.";
  }
  if (filter === "reading_link_unhealthy") {
    return "No unhealthy approved reading links in the moderation queue.";
  }
  return "Queue clear — nothing needs attention in this filter.";
}
