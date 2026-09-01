"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { ReviewDraftV1 } from "@/lib/review-draft";
import {
  isDraftReadyToPublish,
  validateDraftReadingUrls,
} from "@/lib/review-draft";
import {
  canUserPublishDraft,
  mapReviewDraftToCreatePayload,
} from "@/lib/review-draft-publish";
import {
  createReviewAction,
  type CreateReviewActionResult,
} from "@/actions/review.actions";
import {
  deleteReviewDraft,
  deleteReviewDraftById,
  getReviewDraft,
  getReviewDraftOwnerId,
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

/** Publish a saved draft from My Reviews without opening Writing Studio. */
export async function publishReviewDraftAction(
  draft: ReviewDraftV1
): Promise<CreateReviewActionResult> {
  try {
    const userId = await requireUserId();

    if (!draft.id?.trim()) {
      return { success: false, error: "Draft id is required." };
    }

    const ownerId = await getReviewDraftOwnerId(draft.id);
    if (!canUserPublishDraft(userId, ownerId)) {
      return { success: false, error: "You can only publish your own drafts." };
    }

    if (!isDraftReadyToPublish(draft)) {
      return {
        success: false,
        error: "Complete your draft before publishing.",
      };
    }

    const readingUrlError = validateDraftReadingUrls(draft);
    if (readingUrlError) {
      return { success: false, error: readingUrlError };
    }

    const result = await createReviewAction(mapReviewDraftToCreatePayload(draft));

    if (result.success) {
      await deleteReviewDraftById(userId, draft.id);
      revalidatePath("/my-reviews");
      revalidatePath(`/reviews/${result.reviewId}`);
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Failed to publish review. Please try again.",
    };
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
