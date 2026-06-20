"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createComment, deleteComment } from "@/services/comment.service";
import {
  incrementShareCount,
  toggleLike,
} from "@/services/like.service";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }
  return session.user.id;
}

function revalidateReview(reviewId: string) {
  revalidatePath(`/reviews/${reviewId}`);
  revalidatePath("/reviews");
  revalidatePath("/");
}

export async function createCommentAction(
  reviewId: string,
  body: string,
  parentCommentId?: string
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();

    if (!body.trim()) {
      return { success: false, error: "Comment cannot be empty." };
    }

    await createComment({
      reviewId,
      userId,
      body,
      parentCommentId,
    });

    revalidateReview(reviewId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to post comment." };
  }
}

export async function deleteCommentAction(
  commentId: string,
  reviewId: string
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await deleteComment(commentId, userId);
    revalidateReview(reviewId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete comment." };
  }
}

export async function toggleLikeAction(
  reviewId: string
): Promise<
  ActionResult & { liked?: boolean; likeCount?: number }
> {
  try {
    const userId = await requireUserId();
    const result = await toggleLike(userId, reviewId);
    revalidateReview(reviewId);
    return { success: true, liked: result.liked, likeCount: result.likeCount };
  } catch (error) {
    if (error instanceof Error && error.message === "You must be logged in.") {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update like." };
  }
}

export async function shareReviewAction(
  reviewId: string
): Promise<ActionResult & { shareCount?: number }> {
  try {
    const shareCount = await incrementShareCount(reviewId);
    revalidateReview(reviewId);
    return { success: true, shareCount };
  } catch {
    return { success: false, error: "Failed to record share." };
  }
}
