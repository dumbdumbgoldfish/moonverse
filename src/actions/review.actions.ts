"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  validateReviewBody,
  validateReviewTitle,
} from "@/lib/validation";
import { createNovel } from "@/services/novel.service";
import {
  createReview,
  deleteReview,
  updateReview,
  userHasReviewForNovel,
  userOwnsReview,
} from "@/services/review.service";

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
  genreIds: string[];
  tagIds: string[];
  reviewTitle: string;
  reviewBody: string;
  rating: number;
}

export interface UpdateReviewPayload {
  reviewId: string;
  title: string;
  body: string;
  rating: number;
}

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }
  return session.user.id;
}

export async function createReviewAction(
  payload: CreateReviewPayload
): Promise<ActionResult & { reviewId?: string }> {
  try {
    const userId = await requireUserId();

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

      const novel = await createNovel({
        title: novelTitle,
        author: payload.novelAuthor,
        coverUrl: payload.coverUrl,
        externalLink: payload.externalLink,
        genreIds: payload.genreIds,
        tagIds: payload.tagIds,
      });
      novelId = novel.id;
    }

    if (await userHasReviewForNovel(userId, novelId)) {
      return {
        success: false,
        error: "You have already reviewed this novel.",
      };
    }

    const review = await createReview({
      userId,
      novelId,
      title: reviewTitle,
      body: reviewBody,
      rating: payload.rating,
    });

    revalidatePath("/reviews");
    revalidatePath("/");
    revalidatePath(`/novels/${novelId}`);

    return { success: true, reviewId: review.id };
  } catch {
    return { success: false, error: "Failed to publish review. Please try again." };
  }
}

export async function updateReviewAction(
  payload: UpdateReviewPayload
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();

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
    });

    revalidatePath("/reviews");
    revalidatePath(`/reviews/${payload.reviewId}`);
    revalidatePath(`/novels/${review.novelId}`);
    revalidatePath("/");

    return { success: true };
  } catch {
    return { success: false, error: "Failed to update review. Please try again." };
  }
}

export async function deleteReviewAction(reviewId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();

    const ownsReview = await userOwnsReview(reviewId, userId);
    if (!ownsReview) {
      return { success: false, error: "You can only delete your own reviews." };
    }

    await deleteReview(reviewId);

    revalidatePath("/reviews");
    revalidatePath("/");
  } catch (error) {
    if (error instanceof Error && error.message === "You must be logged in.") {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete review. Please try again." };
  }

  redirect("/reviews");
}
