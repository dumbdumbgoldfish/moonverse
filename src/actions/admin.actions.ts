"use server";

import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdminUserId } from "@/lib/admin-auth";
import { adminDeleteComment } from "@/services/admin/comments.service";
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
import { adminDeleteReview } from "@/services/admin/reviews.service";
import {
  deleteUserSafely,
  demoteAdminToUser,
  promoteUserToAdmin,
  setUserSuspended,
} from "@/services/admin/users.service";

export type AdminActionResult =
  | { success: true }
  | { success: false; error: string };

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/comments");
  revalidatePath("/admin/novels");
  revalidatePath("/admin/genres");
  revalidatePath("/admin/tags");
  revalidatePath("/admin/notifications");
  revalidatePath("/reviews");
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
  return runAdminAction(async () => {
    await promoteUserToAdmin(userId);
  });
}

export async function demoteUserAction(userId: string): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await demoteAdminToUser(userId);
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
  });
}

export async function deleteUserAction(userId: string): Promise<AdminActionResult> {
  return runAdminAction(async (adminId) => {
    await deleteUserSafely(userId, adminId);
  });
}

export async function deleteReviewAction(reviewId: string): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await adminDeleteReview(reviewId);
  });
}

export async function deleteCommentAction(
  commentId: string
): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await adminDeleteComment(commentId);
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
  return runAdminAction(async () => {
    await adminCreateNovel(input);
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
  return runAdminAction(async () => {
    await adminUpdateNovel(novelId, input);
  });
}

export async function deleteNovelAction(novelId: string): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await adminDeleteNovel(novelId);
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
  slug?: string
): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await adminCreateTag(name, slug);
  });
}

export async function updateTagAction(
  tagId: string,
  name: string,
  slug?: string
): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await adminUpdateTag(tagId, name, slug);
  });
}

export async function deleteTagAction(tagId: string): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    await adminDeleteTag(tagId);
  });
}

export type { NotificationType };
