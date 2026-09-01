"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { assertEmailVerifiedForUser } from "@/lib/email-verification-gate";
import { validateReviewBody, validateReviewTitle } from "@/lib/validation";
import { isValidNovelCoverUrl } from "@/lib/novel-cover";
import {
  createNovel,
  findLikelyDuplicateNovels,
  getNovelWriteContext,
  type NovelWriteContext,
} from "@/services/novel.service";
import {
  createReview,
  deleteReview,
  getUserReviewIdForNovel,
  updateReview,
  userHasReviewForNovel,
  userOwnsReview,
} from "@/services/review.service";
import { submitReadingLinksFromReview } from "@/services/reading-link.service";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export interface CreateReviewPayload {
  novelMode: "existing" | "new";
  novelId?: string;
  novelTitle?: string;
  novelAuthor?: string;
  coverUrl?: string;
  externalLink?: string;
  synopsis?: string;
  originalLanguage?: string;
  publicationStatus?: string;
  /** Additional legitimate reading URLs to attach to the novel (moderated). */
  readingUrls?: string[];
  genreIds?: string[];
  tagIds?: string[];
  genreNames?: string[];
  tagNames?: string[];
  /** User acknowledged a likely duplicate and still wants a new novel. */
  acknowledgeDuplicate?: boolean;
  reviewTitle: string;
  reviewBody: string;
  rating: number;
  containsSpoilers?: boolean;
}

export interface UpdateReviewPayload {
  reviewId: string;
  title: string;
  body: string;
  rating: number;
  containsSpoilers?: boolean;
}

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }
  return session.user.id;
}

export type CreateReviewActionResult =
  | { success: true; reviewId: string }
  | { success: false; error: string; reviewId?: string };

export async function createReviewAction(
  payload: CreateReviewPayload
): Promise<CreateReviewActionResult> {
  try {
    const userId = await requireUserId();
    await assertEmailVerifiedForUser(userId);

    const reviewTitle = payload.reviewTitle.trim();
    const reviewBody = payload.reviewBody.trim();

    const titleError = validateReviewTitle(reviewTitle);
    if (titleError) {
      return { success: false, error: titleError };
    }

    const bodyError = validateReviewBody(reviewBody);
    if (bodyError) {
      return { success: false, error: bodyError };
    }

    if (payload.rating < 1 || payload.rating > 5) {
      return { success: false, error: "Please select a rating between 1 and 5." };
    }

    let novelId: string;

    if (payload.novelMode === "existing") {
      if (!payload.novelId) {
        return { success: false, error: "Please select a novel." };
      }
      novelId = payload.novelId;
    } else {
      const novelTitle = payload.novelTitle?.trim();
      if (!novelTitle) {
        return { success: false, error: "Novel title is required." };
      }

      const novelAuthor = payload.novelAuthor?.trim();
      if (!novelAuthor) {
        return { success: false, error: "Author is required for a new novel." };
      }

      const genreIds = payload.genreIds ?? [];
      if (genreIds.length === 0) {
        return {
          success: false,
          error: "Please select at least one genre for the new novel.",
        };
      }
      if (genreIds.length > 8) {
        return { success: false, error: "You can select up to 8 genres." };
      }
      if ((payload.tagIds?.length ?? 0) > 10) {
        return { success: false, error: "You can select up to 10 tags." };
      }

      const coverUrl = payload.coverUrl?.trim();
      if (coverUrl && !isValidNovelCoverUrl(coverUrl)) {
        return {
          success: false,
          error: "Cover must be an uploaded image (JPEG, PNG, or WebP).",
        };
      }

      const duplicates = await findLikelyDuplicateNovels(novelTitle, novelAuthor);
      if (duplicates.length > 0 && !payload.acknowledgeDuplicate) {
        return {
          success: false,
          error:
            "This title may already exist on MoonVerse. Select the existing novel or confirm you are adding a different work.",
        };
      }

      const novel = await createNovel({
        title: novelTitle,
        author: novelAuthor,
        coverUrl,
        externalLink: payload.externalLink,
        synopsis: payload.synopsis,
        originalLanguage: payload.originalLanguage,
        publicationStatus: payload.publicationStatus,
        genreIds,
        tagIds: payload.tagIds,
        // Only connect existing taxonomy IDs from the write form.
        genreNames: [],
        tagNames: [],
      });
      novelId = novel.id;
    }

    if (await userHasReviewForNovel(userId, novelId)) {
      const existingReviewId = await getUserReviewIdForNovel(userId, novelId);
      return {
        success: false,
        error: "You have already reviewed this novel.",
        reviewId: existingReviewId ?? undefined,
      };
    }

    const review = await createReview({
      userId,
      novelId,
      title: reviewTitle,
      body: reviewBody,
      rating: payload.rating,
      containsSpoilers: Boolean(payload.containsSpoilers),
    });

    const readingUrls = [
      ...(payload.externalLink?.trim() ? [payload.externalLink.trim()] : []),
      ...(payload.readingUrls ?? []),
    ];

    if (readingUrls.length > 0) {
      await submitReadingLinksFromReview({
        novelId,
        userId,
        reviewId: review.id,
        urls: readingUrls,
      });
    }

    revalidatePath("/reviews");
    revalidatePath("/discover");
    revalidatePath("/search");
    revalidatePath("/");
    revalidatePath(`/novels/${novelId}`);
    revalidatePath("/my-reviews");

    return { success: true, reviewId: review.id };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("createReviewAction failed", error);
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to publish review. Please try again." };
  }
}

export async function getNovelWriteContextAction(
  novelId: string
): Promise<NovelWriteContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!novelId.trim()) return null;
  return getNovelWriteContext(novelId.trim());
}

export async function updateReviewAction(
  payload: UpdateReviewPayload
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await assertEmailVerifiedForUser(userId);

    const title = payload.title.trim();
    const body = payload.body.trim();

    const titleError = validateReviewTitle(title);
    if (titleError) {
      return { success: false, error: titleError };
    }

    const bodyError = validateReviewBody(body);
    if (bodyError) {
      return { success: false, error: bodyError };
    }

    if (payload.rating < 1 || payload.rating > 5) {
      return { success: false, error: "Please select a rating between 1 and 5." };
    }

    const ownsReview = await userOwnsReview(payload.reviewId, userId);
    if (!ownsReview) {
      return { success: false, error: "You can only edit your own reviews." };
    }

    const review = await updateReview(payload.reviewId, {
      title,
      body,
      rating: payload.rating,
      containsSpoilers: Boolean(payload.containsSpoilers),
    });

    revalidatePath("/reviews");
    revalidatePath("/discover");
    revalidatePath("/search");
    revalidatePath(`/reviews/${payload.reviewId}`);
    revalidatePath(`/novels/${review.novelId}`);
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update review. Please try again." };
  }
}

export async function deleteReviewAction(
  reviewId: string,
  options?: { redirectTo?: string | null }
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();

    const ownsReview = await userOwnsReview(reviewId, userId);
    if (!ownsReview) {
      return { success: false, error: "You can only delete your own reviews." };
    }

    await deleteReview(reviewId);

    revalidatePath("/reviews");
    revalidatePath("/my-reviews");
    revalidatePath("/discover");
    revalidatePath("/search");
    revalidatePath("/");
  } catch (error) {
    if (error instanceof Error && error.message === "You must be logged in.") {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete review. Please try again." };
  }

  const redirectTo =
    options?.redirectTo === undefined ? "/discover" : options.redirectTo;
  if (redirectTo) {
    redirect(redirectTo);
  }

  return { success: true };
}
