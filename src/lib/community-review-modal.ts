import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveSessionImageUrl } from "@/lib/session-image";
import { guestReviewPreviewBody } from "@/lib/review-utils";
import type { FolderListItem } from "@/types/folder";
import { getCommentsByReviewId } from "@/services/comment.service";
import {
  getFoldersByUser,
  getReviewSavedFolderIds,
} from "@/services/folder.service";
import { isFollowing } from "@/services/follow-queries";
import { isLikedByUser } from "@/services/like.service";
import { getReviewById, getReviewerPublicStats } from "@/services/review.service";
import type { CommunityReviewModalData } from "@/lib/community-review-modal.types";

export type { CommunityReviewModalData } from "@/lib/community-review-modal.types";

export async function loadCommunityReviewModal(
  id: string
): Promise<CommunityReviewModalData | null> {
  const [review, session] = await Promise.all([getReviewById(id), auth()]);
  if (!review) return null;

  const userId = session?.user?.id;
  const isLoggedIn = Boolean(userId);
  const isOwner = userId === review.userId;

  const [
    comments,
    reviewerStats,
    initialLiked,
    initialFollowing,
    folders,
    savedFolderIds,
    viewer,
  ] = await Promise.all([
    getCommentsByReviewId(id, userId),
    getReviewerPublicStats(review.userId),
    userId ? isLikedByUser(userId, id) : Promise.resolve(false),
    userId && userId !== review.userId
      ? isFollowing(userId, review.userId)
      : Promise.resolve(false),
    userId ? getFoldersByUser(userId) : Promise.resolve([] as FolderListItem[]),
    userId ? getReviewSavedFolderIds(id, userId) : Promise.resolve([] as string[]),
    userId
      ? db.user.findUnique({
          where: { id: userId },
          select: { avatarUrl: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    review: isLoggedIn
      ? review
      : {
          ...review,
          body: guestReviewPreviewBody(review.body, review.excerpt),
        },
    comments,
    reviewerStats,
    isLoggedIn,
    isOwner,
    initialLiked,
    initialFollowing,
    folders,
    savedFolderIds,
    currentUserId: userId,
    currentUserName: session?.user?.name ?? undefined,
    currentUserImage:
      resolveSessionImageUrl(
        viewer?.avatarUrl ?? session?.user?.image ?? null,
        userId ?? "",
      ) ?? null,
  };
}
