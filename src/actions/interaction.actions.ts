"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { assertEmailVerifiedForUser } from "@/lib/email-verification-gate";
import { createComment, deleteComment, toggleCommentLike, updateComment } from "@/services/comment.service";
import {
  incrementShareCount,
  toggleLike,
} from "@/services/like.service";
import type { CommentItem } from "@/types/review";

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
  revalidatePath("/discover");
  revalidatePath("/search");
  revalidatePath("/");
}

export async function createCommentAction(
  reviewId: string,
  body: string,
  parentCommentId?: string,
  containsSpoilers?: boolean
): Promise<ActionResult & { comment?: CommentItem }> {
  try {
    const userId = await requireUserId();
    await assertEmailVerifiedForUser(userId);

    if (!body.trim()) {
      return { success: false, error: "Comment cannot be empty." };
    }

    const comment = await createComment({
      reviewId,
      userId,
      body,
      parentCommentId,
      containsSpoilers,
    });

    revalidateReview(reviewId);
    return { success: true, comment };
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
): Promise<ActionResult & { decrementBy?: number }> {
  try {
    const userId = await requireUserId();
    const { decrementBy } = await deleteComment(commentId, userId);
    revalidateReview(reviewId);
    return { success: true, decrementBy };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete comment." };
  }
}

export async function updateCommentAction(
  commentId: string,
  reviewId: string,
  body: string
): Promise<ActionResult & { comment?: CommentItem }> {
  try {
    const userId = await requireUserId();
    const comment = await updateComment(commentId, userId, body);
    revalidateReview(reviewId);
    return { success: true, comment };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update comment." };
  }
}

export async function toggleCommentLikeAction(
  commentId: string
): Promise<ActionResult & { liked?: boolean; likeCount?: number }> {
  try {
    const userId = await requireUserId();
    const result = await toggleCommentLike(userId, commentId);
    return { success: true, liked: result.liked, likeCount: result.likeCount };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update like." };
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
