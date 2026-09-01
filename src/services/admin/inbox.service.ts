import {
  ContentModerationStatus,
  ReportStatus,
  ReportTargetType,
} from "@prisma/client";
import { computeModerationQueueTotal } from "@/lib/admin/moderation-queue-counts";
import { db } from "@/lib/db";
import { listReports, type ReportSummary } from "@/services/report.service";

export type InboxItemKind =
  | "report"
  | "review_flagged"
  | "comment_flagged"
  | "reading_link"
  | "tag_suggestion"
  | "reading_link_unhealthy";

export interface InboxItemBase {
  id: string;
  kind: InboxItemKind;
  priority: number;
  title: string;
  subtitle: string;
  detail: string | null;
  createdAt: string;
  ageHours: number;
  badge: string;
}

export interface InboxReportItem extends InboxItemBase {
  kind: "report";
  report: ReportSummary;
}

export interface InboxReviewItem extends InboxItemBase {
  kind: "review_flagged";
  reviewId: string;
  novelTitle: string;
  reviewerUsername: string;
  moderationStatus: ContentModerationStatus;
}

export interface InboxCommentItem extends InboxItemBase {
  kind: "comment_flagged";
  commentId: string;
  reviewId: string;
  authorUsername: string;
  bodyPreview: string;
  moderationStatus: ContentModerationStatus;
}

export interface InboxReadingLinkItem extends InboxItemBase {
  kind: "reading_link" | "reading_link_unhealthy";
  linkId: string;
  novelTitle: string;
  url: string;
  moderationStatus: string;
  healthStatus: string | null;
}

export interface InboxTagSuggestionItem extends InboxItemBase {
  kind: "tag_suggestion";
  suggestionId: string;
  tagName: string;
  suggestedByUsername: string;
  novelTitle: string | null;
}

export type InboxItem =
  | InboxReportItem
  | InboxReviewItem
  | InboxCommentItem
  | InboxReadingLinkItem
  | InboxTagSuggestionItem;

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function priorityFromAge(ageHours: number, base: number): number {
  const ageBoost = Math.min(48, Math.floor(ageHours / 6));
  return base + ageBoost;
}

export interface InboxFilters {
  kind?: InboxItemKind | "all";
}

export const INBOX_KIND_FILTER_VALUES: InboxItemKind[] = [
  "report",
  "review_flagged",
  "comment_flagged",
  "reading_link",
  "reading_link_unhealthy",
  "tag_suggestion",
];

export function isKnownInboxKindFilterParam(value?: string | null): boolean {
  if (!value || value === "all") return true;
  return INBOX_KIND_FILTER_VALUES.includes(value as InboxItemKind);
}

export function parseInboxKindFilter(value?: string | null): InboxItemKind | "all" {
  if (!value || value === "all") return "all";
  if (!INBOX_KIND_FILTER_VALUES.includes(value as InboxItemKind)) {
    throw new Error(`Unknown inbox kind filter: ${value}`);
  }
  return value as InboxItemKind;
}

export { inboxKindFilterCountKey } from "@/lib/admin/inbox-kind-filter";

/** Max rows fetched per inbox kind when building the merged priority queue. */
export const INBOX_PER_KIND_CAP = 1000;

export function sortInboxItems(items: InboxItem[]): InboxItem[] {
  return [...items].sort(
    (a, b) => b.priority - a.priority || b.ageHours - a.ageHours
  );
}

export interface InboxFetchOptions {
  perKindLimit?: number;
  /** When set, only load rows for this kind (or all kinds). */
  loadKind?: InboxItemKind | "all";
}

export function paginateAdminInboxItems<T>(
  items: T[],
  page = 1,
  pageSize = 50
): { items: T[]; page: number; pageSize: number; total: number; totalPages: number } {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((safePage - 1) * safePageSize, safePage * safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
    totalPages,
  };
}

export async function getAdminInboxItems(
  filters: InboxFilters = {},
  fetchOptions: InboxFetchOptions = {}
): Promise<InboxItem[]> {
  const activeKind = filters.kind ?? "all";
  const loadKind = fetchOptions.loadKind ?? activeKind;
  const limit = fetchOptions.perKindLimit;
  const shouldLoad = (kind: InboxItemKind) =>
    loadKind === "all" || loadKind === kind;

  const [
    openReports,
    flaggedReviews,
    flaggedComments,
    pendingLinks,
    unhealthyLinks,
    tagSuggestions,
  ] = await Promise.all([
    shouldLoad("report")
      ? listReports({ status: ReportStatus.OPEN, take: limit })
      : Promise.resolve([] as ReportSummary[]),
    shouldLoad("review_flagged")
      ? db.review.findMany({
          where: { moderationStatus: ContentModerationStatus.AUTO_FLAGGED },
          orderBy: { createdAt: "desc" },
          ...(limit !== undefined ? { take: limit } : {}),
          include: {
            user: { select: { username: true } },
            novel: { select: { title: true } },
          },
        })
      : Promise.resolve([]),
    shouldLoad("comment_flagged")
      ? db.comment.findMany({
          where: { moderationStatus: ContentModerationStatus.AUTO_FLAGGED },
          orderBy: { createdAt: "desc" },
          ...(limit !== undefined ? { take: limit } : {}),
          include: {
            user: { select: { username: true } },
            review: { select: { id: true } },
          },
        })
      : Promise.resolve([]),
    shouldLoad("reading_link")
      ? db.readingLink.findMany({
          where: { moderationStatus: { in: ["PENDING", "NEEDS_REVIEW"] } },
          orderBy: { createdAt: "desc" },
          ...(limit !== undefined ? { take: limit } : {}),
          include: { novel: { select: { title: true } } },
        })
      : Promise.resolve([]),
    shouldLoad("reading_link_unhealthy")
      ? db.readingLink.findMany({
          where: {
            moderationStatus: "APPROVED",
            healthStatus: { in: ["BROKEN", "REDIRECTED", "STALE", "UNKNOWN"] },
          },
          orderBy: { updatedAt: "desc" },
          ...(limit !== undefined ? { take: limit } : {}),
          include: { novel: { select: { title: true } } },
        })
      : Promise.resolve([]),
    shouldLoad("tag_suggestion")
      ? db.tagSuggestion.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          ...(limit !== undefined ? { take: limit } : {}),
          include: {
            suggestedBy: { select: { username: true } },
            novel: { select: { title: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const items: InboxItem[] = [];

  for (const report of openReports) {
    const ageHours = hoursSince(report.createdAt);
    items.push({
      id: `report-${report.id}`,
      kind: "report",
      priority: priorityFromAge(ageHours, 90),
      title: `${report.targetType} report`,
      subtitle: report.targetPreview ?? report.targetId,
      detail: report.reason,
      createdAt: report.createdAt,
      ageHours,
      badge: "Report",
      report,
    });
  }

  for (const review of flaggedReviews) {
    const createdAt = review.createdAt.toISOString();
    const ageHours = hoursSince(createdAt);
    items.push({
      id: `review-${review.id}`,
      kind: "review_flagged",
      priority: priorityFromAge(ageHours, 70),
      title: review.title,
      subtitle: `${review.novel.title} · @${review.user.username}`,
      detail: "Auto-flagged for moderation review",
      createdAt,
      ageHours,
      badge: "Review",
      reviewId: review.id,
      novelTitle: review.novel.title,
      reviewerUsername: review.user.username,
      moderationStatus: review.moderationStatus,
    });
  }

  for (const comment of flaggedComments) {
    const createdAt = comment.createdAt.toISOString();
    const ageHours = hoursSince(createdAt);
    items.push({
      id: `comment-${comment.id}`,
      kind: "comment_flagged",
      priority: priorityFromAge(ageHours, 65),
      title: "Flagged comment",
      subtitle: `@${comment.user.username}`,
      detail: comment.body.slice(0, 160),
      createdAt,
      ageHours,
      badge: "Comment",
      commentId: comment.id,
      reviewId: comment.review.id,
      authorUsername: comment.user.username,
      bodyPreview: comment.body.slice(0, 200),
      moderationStatus: comment.moderationStatus,
    });
  }

  for (const link of pendingLinks) {
    const createdAt = link.createdAt.toISOString();
    const ageHours = hoursSince(createdAt);
    items.push({
      id: `link-${link.id}`,
      kind: "reading_link",
      priority: priorityFromAge(ageHours, 60),
      title: link.novel.title,
      subtitle: link.url,
      detail: `Status: ${link.moderationStatus}`,
      createdAt,
      ageHours,
      badge: "Reading link",
      linkId: link.id,
      novelTitle: link.novel.title,
      url: link.url,
      moderationStatus: link.moderationStatus,
      healthStatus: link.healthStatus,
    });
  }

  for (const link of unhealthyLinks) {
    const createdAt = link.updatedAt.toISOString();
    const ageHours = hoursSince(createdAt);
    items.push({
      id: `link-health-${link.id}`,
      kind: "reading_link_unhealthy",
      priority: priorityFromAge(ageHours, 55),
      title: link.novel.title,
      subtitle: link.url,
      detail: `Health: ${link.healthStatus ?? "unknown"}`,
      createdAt,
      ageHours,
      badge: "Broken link",
      linkId: link.id,
      novelTitle: link.novel.title,
      url: link.url,
      moderationStatus: link.moderationStatus,
      healthStatus: link.healthStatus,
    });
  }

  for (const suggestion of tagSuggestions) {
    const createdAt = suggestion.createdAt.toISOString();
    const ageHours = hoursSince(createdAt);
    items.push({
      id: `tag-${suggestion.id}`,
      kind: "tag_suggestion",
      priority: priorityFromAge(ageHours, 50),
      title: suggestion.name,
      subtitle: `@${suggestion.suggestedBy.username}`,
      detail: suggestion.novel?.title ?? suggestion.reason ?? null,
      createdAt,
      ageHours,
      badge: "Tag",
      suggestionId: suggestion.id,
      tagName: suggestion.name,
      suggestedByUsername: suggestion.suggestedBy.username,
      novelTitle: suggestion.novel?.title ?? null,
    });
  }

  const filtered =
    activeKind !== "all"
      ? items.filter((item) => item.kind === activeKind)
      : items;

  return sortInboxItems(filtered);
}

export async function findInboxPageForSelectedItem(
  selectedId: string,
  pageSize = 50,
  filters: InboxFilters = {}
): Promise<number | null> {
  const activeKind = filters.kind ?? "all";
  const counts = await getInboxCounts();
  const expectedTotal =
    activeKind === "all" ? counts.total : counts[activeKind];

  let perKindLimit = pageSize;
  while (perKindLimit <= INBOX_PER_KIND_CAP) {
    const items = await getAdminInboxItems(filters, {
      perKindLimit,
      loadKind: activeKind,
    });
    const index = items.findIndex((item) => item.id === selectedId);
    if (index !== -1) {
      return Math.floor(index / pageSize) + 1;
    }

    if (activeKind !== "all") {
      if (items.length < Math.min(perKindLimit, expectedTotal)) {
        return null;
      }
    } else if (items.length >= expectedTotal) {
      return null;
    }

    if (perKindLimit >= INBOX_PER_KIND_CAP) {
      return null;
    }
    perKindLimit = Math.min(perKindLimit + pageSize, INBOX_PER_KIND_CAP);
  }

  return null;
}

export async function getAdminInboxPage(
  page = 1,
  pageSize = 50,
  filters: InboxFilters = {}
) {
  const activeKind = filters.kind ?? "all";
  const safePage = Math.max(1, page);
  const counts = await getInboxCounts();
  const total = activeKind === "all" ? counts.total : counts[activeKind];
  const perKindLimit = Math.min(
    safePage * pageSize,
    total,
    INBOX_PER_KIND_CAP
  );

  const sorted = await getAdminInboxItems(filters, {
    perKindLimit,
    loadKind: activeKind,
  });

  const start = (safePage - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);

  return {
    items,
    page: safePage,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getInboxCounts(): Promise<Record<InboxItemKind | "total", number>> {
  const [
    report,
    reviewFlagged,
    commentFlagged,
    readingLink,
    readingLinkUnhealthy,
    tagSuggestion,
  ] = await Promise.all([
    db.report.count({ where: { status: ReportStatus.OPEN } }),
    db.review.count({
      where: { moderationStatus: ContentModerationStatus.AUTO_FLAGGED },
    }),
    db.comment.count({
      where: { moderationStatus: ContentModerationStatus.AUTO_FLAGGED },
    }),
    db.readingLink.count({
      where: { moderationStatus: { in: ["PENDING", "NEEDS_REVIEW"] } },
    }),
    db.readingLink.count({
      where: {
        moderationStatus: "APPROVED",
        healthStatus: { in: ["BROKEN", "REDIRECTED", "STALE", "UNKNOWN"] },
      },
    }),
    db.tagSuggestion.count({ where: { status: "PENDING" } }),
  ]);
  const counts: Record<InboxItemKind | "total", number> = {
    report,
    review_flagged: reviewFlagged,
    comment_flagged: commentFlagged,
    reading_link: readingLink,
    reading_link_unhealthy: readingLinkUnhealthy,
    tag_suggestion: tagSuggestion,
    total: computeModerationQueueTotal({
      report,
      review_flagged: reviewFlagged,
      comment_flagged: commentFlagged,
      reading_link: readingLink,
      reading_link_unhealthy: readingLinkUnhealthy,
      tag_suggestion: tagSuggestion,
    }),
  };
  return counts;
}

export function getReportRemediationOptions(
  targetType: ReportTargetType
): Array<{ id: string; label: string }> {
  switch (targetType) {
    case ReportTargetType.REVIEW:
      return [
        { id: "hide_review", label: "Hide review & resolve" },
        { id: "resolve_only", label: "Resolve without hiding" },
      ];
    case ReportTargetType.COMMENT:
      return [
        { id: "hide_comment", label: "Hide comment & resolve" },
        { id: "resolve_only", label: "Resolve without hiding" },
      ];
    case ReportTargetType.USER:
      return [
        { id: "suspend_user", label: "Suspend user & resolve" },
        { id: "resolve_only", label: "Resolve without suspension" },
      ];
  }
  return [{ id: "resolve_only", label: "Resolve report" }];
}
