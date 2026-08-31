"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  addReviewToFolder,
  createFolder,
  deleteFolder,
  removeReviewFromFolder,
  saveReviewToLibrary,
  toggleFolderFeatured,
  updateFolder,
} from "@/services/folder.service";
import type { CreateFolderInput, FolderListItem, UpdateFolderInput } from "@/types/folder";

export type FolderActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }
  return session.user.id;
}

function revalidateFolderPaths(folderId?: string, reviewId?: string) {
  revalidatePath("/folders");
  if (folderId) {
    revalidatePath(`/folders/${folderId}`);
  }
  if (reviewId) {
    revalidatePath(`/reviews/${reviewId}`);
  }
}

export async function createFolderAction(
  data: CreateFolderInput
): Promise<FolderActionResult & { folderId?: string; folder?: FolderListItem }> {
  try {
    const userId = await requireUserId();
    const folder = await createFolder(userId, data);
    revalidateFolderPaths();
    return { success: true, folderId: folder.id, folder };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create folder." };
  }
}

export async function updateFolderAction(
  folderId: string,
  data: UpdateFolderInput
): Promise<FolderActionResult> {
  try {
    const userId = await requireUserId();
    await updateFolder(folderId, userId, data);
    revalidateFolderPaths(folderId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update folder." };
  }
}

export async function deleteFolderAction(
  folderId: string
): Promise<FolderActionResult> {
  try {
    const userId = await requireUserId();
    await deleteFolder(folderId, userId);
    revalidateFolderPaths(folderId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete folder." };
  }
}

export async function addReviewToFolderAction(
  folderId: string,
  reviewId: string
): Promise<FolderActionResult & { added?: boolean; saveCount?: number }> {
  try {
    const userId = await requireUserId();
    const result = await addReviewToFolder(folderId, reviewId, userId);
    revalidateFolderPaths(folderId, reviewId);
    return {
      success: true,
      added: result.added,
      saveCount: result.saveCount,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to save review to folder." };
  }
}

export async function saveReviewToLibraryAction(
  reviewId: string
): Promise<
  FolderActionResult & {
    added?: boolean;
    folderId?: string;
    folderName?: string;
  }
> {
  try {
    const userId = await requireUserId();
    const result = await saveReviewToLibrary(reviewId, userId);
    // Revalidate only library paths; refreshing /home reshuffles Discover and
    // can remove the newly saved review from personalized shelves.
    revalidateFolderPaths(result.folderId, reviewId);
    return {
      success: true,
      added: result.added,
      folderId: result.folderId,
      folderName: result.folderName,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to add to library." };
  }
}

export async function toggleFolderFeaturedAction(
  folderId: string,
  isFeatured: boolean
): Promise<FolderActionResult> {
  try {
    const userId = await requireUserId();
    await toggleFolderFeatured(folderId, userId, isFeatured);
    revalidateFolderPaths(folderId);
    revalidatePath("/lists");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update featured status." };
  }
}

export async function removeReviewFromFolderAction(
  folderId: string,
  reviewId: string
): Promise<FolderActionResult & { removed?: boolean; saveCount?: number }> {
  try {
    const userId = await requireUserId();
    const result = await removeReviewFromFolder(folderId, reviewId, userId);
    revalidateFolderPaths(folderId, reviewId);
    return {
      success: true,
      removed: result.removed,
      saveCount: result.saveCount,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to remove review from folder." };
  }
}
