import type { Prisma, ReadingLinkModerationStatus } from "@prisma/client";

/** Matches inbox `reading_link` count semantics. */
export const READING_LINK_MODERATION_QUEUE_STATUSES: ReadingLinkModerationStatus[] = [
  "PENDING",
  "NEEDS_REVIEW",
];

export const READING_LINK_MODERATION_FILTER_VALUES = [
  "ALL",
  "PENDING",
  "NEEDS_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;

export type ReadingLinkModerationFilterValue =
  | ReadingLinkModerationStatus
  | "ALL";

const FILTER_VALUE_SET = new Set<string>(READING_LINK_MODERATION_FILTER_VALUES);

/** Default (no/invalid status param) is the full moderation workload. */
export function parseReadingLinkModerationStatusFilter(
  raw?: string | null
): ReadingLinkModerationFilterValue {
  if (!raw || !FILTER_VALUE_SET.has(raw)) {
    return "ALL";
  }
  return raw as ReadingLinkModerationFilterValue;
}

export function buildReadingLinkModerationWhere(
  status: ReadingLinkModerationFilterValue
): Prisma.ReadingLinkWhereInput {
  if (status === "ALL") {
    return {
      moderationStatus: { in: READING_LINK_MODERATION_QUEUE_STATUSES },
    };
  }
  return { moderationStatus: status };
}

export function readingLinkModerationFilterHref(
  value: ReadingLinkModerationFilterValue
): string {
  return readingLinkModerationPageHref(value, 1);
}

export function normalizeReadingLinkModerationPage(
  requestedPage: number,
  totalPages: number
): number {
  const safeRequested = Math.max(1, requestedPage);
  const safeTotalPages = Math.max(1, totalPages);
  return Math.min(safeRequested, safeTotalPages);
}

export function readingLinkModerationPageHref(
  status: ReadingLinkModerationFilterValue,
  page: number
): string {
  const params = new URLSearchParams();
  if (status !== "ALL") {
    params.set("status", status);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `/admin/reading-links?${qs}` : "/admin/reading-links";
}
