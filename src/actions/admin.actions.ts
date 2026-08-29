"use server";

import { ContentModerationStatus, NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdminUserId } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  adminDeleteComment,
  adminSetCommentModerationStatus,
} from "@/services/admin/comments.service";
import {
  adminCreateGenre,
  adminCreateNovel,
  adminCreateTag,
  adminDeleteGenre,
  adminDeleteNovel,
  adminDeleteTag,
  adminUpdateGenre,
  adminUpdateNovel,
  adminUpdateTag,
} from "@/services/admin/catalog.service";
import {
  adminDeleteReview,
  adminSetReviewModerationStatus,
} from "@/services/admin/reviews.service";
import {
  approveReadingLink,
  rejectReadingLink,
} from "@/services/reading-link.service";
import {
  deleteUserSafely,
  demoteAdminToUser,
  promoteUserToAdmin,
  setUserSuspended,
} from "@/services/admin/users.service";
import {
  approveTagSuggestionAsNew,
  mapTagSuggestionToExisting,
  rejectTagSuggestion,
} from "@/services/tag-suggestion.service";
import { writeAuditLog } from "@/services/audit.service";
import { mergeNovels } from "@/services/admin/catalog.service";
import {
  createFeaturedNovel,
  deleteFeaturedNovel,
} from "@/services/featured.service";
import { toggleFolderFeatured } from "@/services/folder.service";
import {
  getSystemSettings,
  updateSystemSettings,
  type SystemSettingsValue,
} from "@/lib/system-settings";

export type AdminActionResult =
  | { success: true }
  | { success: false; error: string };

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/inbox");
  revalidatePath("/admin/users");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/comments");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/novels");
  revalidatePath("/admin/genres");
  revalidatePath("/admin/tags");
  revalidatePath("/admin/notifications");
  revalidatePath("/admin/reading-links");
  revalidatePath("/admin/featured");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/audit");
  revalidatePath("/reviews");
  revalidatePath("/discover");
  revalidatePath("/search");
  revalidatePath("/");
}

async function runAdminAction(
  action: (adminId: string) => Promise<void>
): Promise<AdminActionResult> {
  try {
    const adminId = await requireAdminUserId();
    await action(adminId);
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Action failed." };
  }
}

export async function promoteUserAction(userId: string): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await promoteUserToAdmin(userId);
    await writeAuditLog({
      actorId: adminId,
      action: "USER_PROMOTE",
      entityType: "User",
      entityId: userId,
    });
  });
}

export async function demoteUserAction(userId: string): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await demoteAdminToUser(userId);
    await writeAuditLog({
      actorId: adminId,
      action: "USER_DEMOTE",
      entityType: "User",
      entityId: userId,
    });
  });
}

export async function suspendUserAction(
  userId: string,
  suspended: boolean
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    if (userId === adminId && suspended) {
      throw new Error("You cannot suspend your own account.");
    }
    await setUserSuspended(userId, suspended);
    await writeAuditLog({
      actorId: adminId,
      action: suspended ? "USER_SUSPEND" : "USER_UNSUSPEND",
      entityType: "User",
      entityId: userId,
    });
  });
}

export async function deleteUserAction(userId: string): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await deleteUserSafely(userId, adminId);
    await writeAuditLog({
      actorId: adminId,
      action: "USER_DELETE",
      entityType: "User",
      entityId: userId,
    });
  });
}

export async function deleteReviewAction(reviewId: string): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await adminDeleteReview(reviewId);
    await writeAuditLog({
      actorId: adminId,
      action: "REVIEW_DELETE",
      entityType: "Review",
      entityId: reviewId,
    });
  });
}

export async function deleteCommentAction(
  commentId: string
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await adminDeleteComment(commentId);
    await writeAuditLog({
      actorId: adminId,
      action: "COMMENT_DELETE",
      entityType: "Comment",
      entityId: commentId,
    });
  });
}

export async function setReviewModerationStatusAction(
  reviewId: string,
  moderationStatus: ContentModerationStatus
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await adminSetReviewModerationStatus(reviewId, moderationStatus);
    await writeAuditLog({
      actorId: adminId,
      action: "REVIEW_MODERATION_UPDATE",
      entityType: "Review",
      entityId: reviewId,
      meta: { moderationStatus },
    });
  });
}

export async function setCommentModerationStatusAction(
  commentId: string,
  moderationStatus: ContentModerationStatus
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await adminSetCommentModerationStatus(commentId, moderationStatus);
    await writeAuditLog({
      actorId: adminId,
      action: "COMMENT_MODERATION_UPDATE",
      entityType: "Comment",
      entityId: commentId,
      meta: { moderationStatus },
    });
  });
}

export async function createNovelAction(input: {
  title: string;
  author?: string;
  coverUrl?: string;
  externalLink?: string;
  genreIds: string[];
  tagIds: string[];
}): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    const novel = await adminCreateNovel(input);
    await writeAuditLog({
      actorId: adminId,
      action: "NOVEL_CREATE",
      entityType: "Novel",
      entityId: novel.id,
    });
  });
}

export async function updateNovelAction(
  novelId: string,
  input: {
    title: string;
    author?: string;
    coverUrl?: string;
    externalLink?: string;
    genreIds: string[];
    tagIds: string[];
  }
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await adminUpdateNovel(novelId, input);
    await writeAuditLog({
      actorId: adminId,
      action: "NOVEL_UPDATE",
      entityType: "Novel",
      entityId: novelId,
    });
  });
}

export async function deleteNovelAction(novelId: string): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await adminDeleteNovel(novelId);
    await writeAuditLog({
      actorId: adminId,
      action: "NOVEL_DELETE",
      entityType: "Novel",
      entityId: novelId,
    });
  });
}

export async function mergeNovelsAction(
  sourceNovelId: string,
  targetNovelId: string
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await mergeNovels(sourceNovelId, targetNovelId);
    await writeAuditLog({
      actorId: adminId,
      action: "NOVEL_MERGE",
      entityType: "Novel",
      entityId: targetNovelId,
      meta: { sourceNovelId },
    });
  });
}

export async function createGenreAction(
  name: string,
  slug?: string
): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await adminCreateGenre(name, slug);
  });
}

export async function updateGenreAction(
  genreId: string,
  name: string,
  slug?: string
): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await adminUpdateGenre(genreId, name, slug);
  });
}

export async function deleteGenreAction(genreId: string): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await adminDeleteGenre(genreId);
  });
}

export async function createTagAction(
  name: string,
  slug?: string,
  kind?: "TROPE" | "MOOD" | "STYLE"
): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await adminCreateTag(name, slug, kind);
  });
}

export async function updateTagAction(
  tagId: string,
  name: string,
  slug?: string,
  kind?: "TROPE" | "MOOD" | "STYLE"
): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await adminUpdateTag(tagId, name, slug, kind);
  });
}

export async function deleteTagAction(tagId: string): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await adminDeleteTag(tagId);
  });
}

export async function approveTagSuggestionAction(
  suggestionId: string
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    const result = await approveTagSuggestionAsNew(suggestionId, adminId);
    await writeAuditLog({
      actorId: adminId,
      action: "TAG_SUGGESTION_APPROVE",
      entityType: "TagSuggestion",
      entityId: suggestionId,
      meta: { resolvedTagId: result.tag.id, tagName: result.tag.name },
    });
  });
}

export async function mapTagSuggestionAction(
  suggestionId: string,
  tagId: string
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    const result = await mapTagSuggestionToExisting(suggestionId, tagId, adminId);
    await writeAuditLog({
      actorId: adminId,
      action: "TAG_SUGGESTION_MAP",
      entityType: "TagSuggestion",
      entityId: suggestionId,
      meta: { resolvedTagId: result.tag.id, tagName: result.tag.name },
    });
  });
}

export async function rejectTagSuggestionAction(
  suggestionId: string,
  rejectionReason?: string
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await rejectTagSuggestion(suggestionId, adminId, rejectionReason);
    await writeAuditLog({
      actorId: adminId,
      action: "TAG_SUGGESTION_REJECT",
      entityType: "TagSuggestion",
      entityId: suggestionId,
      meta: rejectionReason ? { rejectionReason } : undefined,
    });
  });
}

export async function approveReadingLinkAction(
  linkId: string
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await approveReadingLink(linkId);
    await writeAuditLog({
      actorId: adminId,
      action: "READING_LINK_APPROVE",
      entityType: "ReadingLink",
      entityId: linkId,
    });
  });
}

export async function rejectReadingLinkAction(
  linkId: string,
  reason?: string
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await rejectReadingLink(linkId, reason);
    await writeAuditLog({
      actorId: adminId,
      action: "READING_LINK_REJECT",
      entityType: "ReadingLink",
      entityId: linkId,
      meta: reason ? { reason } : undefined,
    });
  });
}

export async function checkReadingLinkHealthAction(
  linkId: string
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    const link = await db.readingLink.findUnique({ where: { id: linkId } });
    if (!link) throw new Error("Reading link not found.");

    const { checkReadingLinkHealth } = await import(
      "@/lib/reading-link/health-check"
    );
    const result = await checkReadingLinkHealth(link.url);
    await db.readingLink.update({
      where: { id: linkId },
      data: {
        healthStatus: result.healthStatus,
        lastStatusCode: result.lastStatusCode,
        lastCheckedAt: result.checkedAt,
      },
    });
    await writeAuditLog({
      actorId: adminId,
      action: "READING_LINK_HEALTH_CHECK",
      entityType: "ReadingLink",
      entityId: linkId,
      meta: {
        healthStatus: result.healthStatus,
        lastStatusCode: result.lastStatusCode,
      },
    });
  });
}

export async function createFeaturedNovelAction(input: {
  novelId: string;
  slot?: number;
  startsAt?: string;
  endsAt?: string;
}): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await createFeaturedNovel({
      novelId: input.novelId,
      slot: input.slot,
      startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      createdById: adminId,
    });
    await writeAuditLog({
      actorId: adminId,
      action: "FEATURED_NOVEL_CREATE",
      entityType: "Novel",
      entityId: input.novelId,
    });
    revalidatePath("/home");
    revalidatePath("/reviews");
  revalidatePath("/discover");
  revalidatePath("/search");
  });
}

export async function deleteFeaturedNovelAction(
  id: string
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await deleteFeaturedNovel(id);
    await writeAuditLog({
      actorId: adminId,
      action: "FEATURED_NOVEL_DELETE",
      entityType: "FeaturedNovel",
      entityId: id,
    });
    revalidatePath("/home");
    revalidatePath("/reviews");
  revalidatePath("/discover");
  revalidatePath("/search");
  });
}

export async function adminToggleFolderFeaturedAction(
  folderId: string,
  isFeatured: boolean
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await toggleFolderFeatured(folderId, adminId, isFeatured, true);
    await writeAuditLog({
      actorId: adminId,
      action: isFeatured ? "FOLDER_FEATURE" : "FOLDER_UNFEATURE",
      entityType: "Folder",
      entityId: folderId,
    });
    revalidatePath("/lists");
  });
}

export async function updateSystemSettingsAction(
  patch: Partial<SystemSettingsValue>
): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    const before = await getSystemSettings();
    await updateSystemSettings(patch);
    await writeAuditLog({
      actorId: adminId,
      action: "SYSTEM_SETTINGS_UPDATE",
      entityType: "SystemSetting",
      entityId: "platform",
      meta: JSON.parse(JSON.stringify({ before, patch })),
    });
    revalidatePath("/admin/settings");
  });
}

export type { NotificationType };
