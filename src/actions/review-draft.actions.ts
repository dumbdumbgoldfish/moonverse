"use server";

import { auth } from "@/lib/auth";
import type { ReviewDraftV1 } from "@/lib/review-draft";
import {
  deleteReviewDraft,
  deleteReviewDraftById,
  getReviewDraft,
  listReviewDrafts,
  upsertReviewDraft,
} from "@/services/review-draft.service";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }
  return session.user.id;
}

/** Best-effort server backup of the in-progress review draft. */
export async function syncReviewDraftAction(
  draft: ReviewDraftV1
): Promise<{ success: boolean }> {
  try {
    const userId = await requireUserId();
    await upsertReviewDraft(userId, draft);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function listServerReviewDraftsAction(): Promise<ReviewDraftV1[]> {
  try {
    const userId = await requireUserId();
    return await listReviewDrafts(userId);
  } catch {
    return [];
  }
}

export async function getServerReviewDraftAction(
  draftId?: string
): Promise<ReviewDraftV1 | null> {
  try {
    const userId = await requireUserId();
    return await getReviewDraft(userId, draftId);
  } catch {
    return null;
  }
}

export async function deleteServerReviewDraftAction(
  draftId: string
): Promise<{ success: boolean }> {
  try {
    const userId = await requireUserId();
    await deleteReviewDraftById(userId, draftId);
    return { success: true };
  } catch {
    return { success: false };
  }
}

/** @deprecated Deletes every server draft for the user. Prefer deleteServerReviewDraftAction. */
export async function clearServerReviewDraftAction(): Promise<{
  success: boolean;
}> {
  try {
    const userId = await requireUserId();
    await deleteReviewDraft(userId);
    return { success: true };
  } catch {
    return { success: false };
  }
}
