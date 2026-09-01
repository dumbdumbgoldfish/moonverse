import { ReadingLinkModerationStatus, type Prisma } from "@prisma/client";
import { ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-styles";
import { buildReadingLinkModerationWhere } from "@/lib/admin/reading-link-moderation-filter";
import { db } from "@/lib/db";
import { normalizeReadingUrl } from "@/lib/normalize-url";
import {
  getPlatformLabel,
  inferPlatformFromUrl,
} from "@/lib/reading-platforms";
import type { ReadingLinkItem } from "@/types/reading-link";

/** Max distinct reading URLs one user may submit per novel. */
export const MAX_READING_LINKS_PER_USER_PER_NOVEL = 8;

export type SubmitReadingLinkResult =
  | {
      status: "created";
      linkId: string;
      moderationStatus: ReadingLinkModerationStatus;
      message: string;
    }
  | {
      status: "duplicate";
      linkId: string;
      moderationStatus: ReadingLinkModerationStatus;
      message: string;
    }
  | { status: "error"; message: string };

const publicLinkSelect = {
  id: true,
  platform: true,
  url: true,
  category: true,
  country: true,
  language: true,
  label: true,
  active: true,
  moderationStatus: true,
  sortOrder: true,
  isOfficial: true,
} satisfies Prisma.ReadingLinkSelect;

export function mapApprovedReadingLink(link: {
  id: string;
  platform: string;
  url: string;
  category: ReadingLinkItem["category"];
  country: string | null;
  language: string | null;
  label: string | null;
  active: boolean;
  moderationStatus: ReadingLinkModerationStatus;
}): ReadingLinkItem | null {
  if (!link.active) return null;
  if (link.moderationStatus !== "APPROVED") return null;

  const inferred = inferPlatformFromUrl(link.url);
  if (!inferred) return null;

  return {
    id: link.id,
    platform: link.platform,
    label: link.label || getPlatformLabel(link.platform) || inferred.label,
    url: link.url,
    category: inferred.category,
    country: link.country,
    language: link.language,
    active: true,
  };
}

/** Public “Where to read”. APPROVED + active only, unique by normalized URL. */
export async function getApprovedReadingLinksForNovel(
  novelId: string
): Promise<ReadingLinkItem[]> {
  const links = await db.readingLink.findMany({
    where: {
      novelId,
      active: true,
      moderationStatus: "APPROVED",
    },
    orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { platform: "asc" }, { createdAt: "asc" }],
    select: publicLinkSelect,
  });

  return links
    .map(mapApprovedReadingLink)
    .filter((link): link is ReadingLinkItem => link !== null);
}

export async function getApprovedReadingLinksByNovelIds(
  novelIds: string[]
): Promise<Map<string, ReadingLinkItem[]>> {
  const result = new Map<string, ReadingLinkItem[]>();
  if (novelIds.length === 0) return result;

  const links = await db.readingLink.findMany({
    where: {
      novelId: { in: novelIds },
      active: true,
      moderationStatus: "APPROVED",
    },
    orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { platform: "asc" }],
    select: { ...publicLinkSelect, novelId: true },
  });

  for (const id of novelIds) {
    result.set(id, []);
  }

  for (const link of links) {
    const mapped = mapApprovedReadingLink(link);
    if (!mapped) continue;
    const list = result.get(link.novelId) ?? [];
    list.push(mapped);
    result.set(link.novelId, list);
  }

  return result;
}

export interface SubmitReadingLinkInput {
  novelId: string;
  url: string;
  userId: string;
  reviewId?: string | null;
  language?: string | null;
  country?: string | null;
  /** Catalog / admin seed. skip pending and publish immediately. */
  autoApprove?: boolean;
}

/**
 * Submit a reading URL for a novel.
 * Unique by (novelId, normalizedUrl). Same platform + different URL → NEEDS_REVIEW.
 */
export async function submitReadingLinkForNovel(
  input: SubmitReadingLinkInput
): Promise<SubmitReadingLinkResult> {
  const rawUrl = input.url.trim();
  if (!rawUrl) {
    return { status: "error", message: "Please provide a reading link URL." };
  }

  const normalizedUrl = normalizeReadingUrl(rawUrl);
  if (!normalizedUrl) {
    return { status: "error", message: "That URL does not look valid." };
  }

  const inferred = inferPlatformFromUrl(rawUrl);
  if (!inferred) {
    return {
      status: "error",
      message:
        "That site is not an allowed reading source. Use an official publisher, bookstore or community database.",
    };
  }

  const existing = await db.readingLink.findUnique({
    where: {
      novelId_normalizedUrl: {
        novelId: input.novelId,
        normalizedUrl,
      },
    },
    select: { id: true, moderationStatus: true },
  });

  if (existing) {
    return {
      status: "duplicate",
      linkId: existing.id,
      moderationStatus: existing.moderationStatus,
      message: "This source is already listed for this novel.",
    };
  }

  const userSubmissionCount = await db.readingLink.count({
    where: {
      novelId: input.novelId,
      submittedByUserId: input.userId,
      moderationStatus: { not: "REJECTED" },
    },
  });

  if (
    !input.autoApprove &&
    userSubmissionCount >= MAX_READING_LINKS_PER_USER_PER_NOVEL
  ) {
    return {
      status: "error",
      message: `You can submit up to ${MAX_READING_LINKS_PER_USER_PER_NOVEL} reading links per novel.`,
    };
  }

  // Same platform, different title-page URL → admin should compare editions.
  const samePlatform = await db.readingLink.findFirst({
    where: {
      novelId: input.novelId,
      platform: inferred.platform,
      moderationStatus: { in: ["APPROVED", "PENDING", "NEEDS_REVIEW"] },
    },
    select: { id: true },
  });

  const moderationStatus: ReadingLinkModerationStatus = input.autoApprove
    ? "APPROVED"
    : samePlatform
      ? "NEEDS_REVIEW"
      : "PENDING";

  try {
    const created = await db.readingLink.create({
      data: {
        novelId: input.novelId,
        submittedByUserId: input.userId,
        submittedViaReviewId: input.reviewId ?? null,
        platform: inferred.platform,
        url: rawUrl,
        normalizedUrl,
        category: inferred.category,
        language: input.language ?? null,
        country: input.country ?? null,
        label: inferred.label,
        moderationStatus,
        isOfficial: inferred.category === "OFFICIAL" && !!input.autoApprove,
        isVerified: !!input.autoApprove,
        active: true,
      },
      select: { id: true, moderationStatus: true },
    });

    const message =
      created.moderationStatus === "APPROVED"
        ? "Reading source added."
        : created.moderationStatus === "NEEDS_REVIEW"
          ? "Submitted for admin review (same platform, different page)."
          : "Submitted for moderation. It will appear after approval.";

    return {
      status: "created",
      linkId: created.id,
      moderationStatus: created.moderationStatus,
      message,
    };
  } catch (error) {
    // Race: another request inserted the same normalized URL.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      const again = await db.readingLink.findUnique({
        where: {
          novelId_normalizedUrl: {
            novelId: input.novelId,
            normalizedUrl,
          },
        },
        select: { id: true, moderationStatus: true },
      });
      if (again) {
        return {
          status: "duplicate",
          linkId: again.id,
          moderationStatus: again.moderationStatus,
          message: "This source is already listed for this novel.",
        };
      }
    }
    throw error;
  }
}

/** Submit multiple URLs from a review; returns human-readable notes. */
export async function submitReadingLinksFromReview(input: {
  novelId: string;
  userId: string;
  reviewId: string;
  urls: string[];
}): Promise<{ created: number; duplicates: number; errors: string[]; notes: string[] }> {
  const notes: string[] = [];
  const errors: string[] = [];
  let created = 0;
  let duplicates = 0;

  const uniqueRaw = [...new Set(input.urls.map((u) => u.trim()).filter(Boolean))];

  for (const url of uniqueRaw) {
    const result = await submitReadingLinkForNovel({
      novelId: input.novelId,
      userId: input.userId,
      reviewId: input.reviewId,
      url,
    });

    if (result.status === "created") {
      created += 1;
      notes.push(result.message);
    } else if (result.status === "duplicate") {
      duplicates += 1;
      notes.push(result.message);
    } else {
      errors.push(result.message);
    }
  }

  return { created, duplicates, errors, notes };
}

export async function listReadingLinksForModeration(options?: {
  status?: ReadingLinkModerationStatus | "ALL";
  page?: number;
  pageSize?: number;
}) {
  const status = options?.status ?? "ALL";
  const pageSize = options?.pageSize ?? ADMIN_LIST_PAGE_SIZE;
  const safePage = Math.max(1, options?.page ?? 1);
  const where = buildReadingLinkModerationWhere(status);

  const [total, links] = await Promise.all([
    db.readingLink.count({ where }),
    db.readingLink.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: {
        novel: { select: { id: true, title: true, author: true } },
        submittedByUser: {
          select: { id: true, username: true, displayName: true },
        },
        submittedViaReview: { select: { id: true, title: true } },
      },
    }),
  ]);

  return {
    items: links,
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function applyReadingLinkHealthCheck(linkId: string) {
  const link = await db.readingLink.findUnique({ where: { id: linkId } });
  if (!link) {
    throw new Error("Reading link not found.");
  }

  const { checkReadingLinkHealth } = await import("@/lib/reading-link/health-check");
  const result = await checkReadingLinkHealth(link.url);

  return db.readingLink.update({
    where: { id: link.id },
    data: {
      healthStatus: result.healthStatus,
      lastStatusCode: result.lastStatusCode,
      lastCheckedAt: result.checkedAt,
    },
    select: {
      id: true,
      healthStatus: true,
      lastCheckedAt: true,
      lastStatusCode: true,
    },
  });
}

export async function approveReadingLink(linkId: string): Promise<void> {
  await db.readingLink.update({
    where: { id: linkId },
    data: {
      moderationStatus: "APPROVED",
      isVerified: true,
      rejectionReason: null,
      active: true,
    },
  });
}

export async function rejectReadingLink(
  linkId: string,
  reason?: string
): Promise<void> {
  await db.readingLink.update({
    where: { id: linkId },
    data: {
      moderationStatus: "REJECTED",
      rejectionReason: reason?.trim() || "Rejected by moderator",
      active: false,
    },
  });
}

/** Pending links submitted through a specific review (editable by author). */
export async function getPendingLinksForReview(reviewId: string) {
  return db.readingLink.findMany({
    where: {
      submittedViaReviewId: reviewId,
      moderationStatus: { in: ["PENDING", "NEEDS_REVIEW"] },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function deletePendingLinkOwnedByUser(
  linkId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const link = await db.readingLink.findUnique({
    where: { id: linkId },
    select: {
      submittedByUserId: true,
      moderationStatus: true,
    },
  });

  if (!link) {
    return { ok: false, message: "Link not found." };
  }
  if (link.submittedByUserId !== userId) {
    return { ok: false, message: "You can only remove links you submitted." };
  }
  if (
    link.moderationStatus !== "PENDING" &&
    link.moderationStatus !== "NEEDS_REVIEW"
  ) {
    return {
      ok: false,
      message: "Approved links cannot be removed from a review. Contact a moderator to suggest a correction.",
    };
  }

  await db.readingLink.delete({ where: { id: linkId } });
  return { ok: true };
}
