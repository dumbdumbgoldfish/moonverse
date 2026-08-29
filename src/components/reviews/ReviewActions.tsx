"use client";

import { useState, useTransition } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { ReportTargetType } from "@prisma/client";
import {
  shareReviewAction,
  toggleLikeAction,
} from "@/actions/interaction.actions";
import { useSignInPrompt } from "@/components/auth/SignInPromptProvider";
import { AddToFolderMenu } from "@/components/folders/AddToFolderMenu";
import { ReportButton } from "@/components/moderation/ReportButton";
import { Button } from "@/components/ui/button";
import { triggerMoonieReaction } from "@/lib/moonie/reactions";
import { cn } from "@/lib/utils";
import type { FolderListItem } from "@/types/folder";

interface ReviewActionsProps {
  reviewId: string;
  reviewTitle: string;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  initialLiked: boolean;
  isLoggedIn: boolean;
  folders: FolderListItem[];
  savedFolderIds: string[];
  isOwner?: boolean;
  onComment?: () => void;
  discussionOpen?: boolean;
}

const actionBtnClass =
  "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-2 text-[13px] font-semibold text-[#5a4d72] shadow-none hover:bg-[#6E46C7]/[0.06] hover:text-[#1a1033] sm:px-3";

export function ReviewActions({
  reviewId,
  reviewTitle,
  likeCount,
  commentCount,
  saveCount,
  shareCount: initialShareCount,
  initialLiked,
  isLoggedIn,
  folders,
  savedFolderIds,
  isOwner = false,
  onComment,
  discussionOpen = false,
}: ReviewActionsProps) {
  const { promptSignIn } = useSignInPrompt();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(likeCount);
  const [shares, setShares] = useState(initialShareCount);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLike = () => {
    if (!isLoggedIn) {
      promptSignIn(`/reviews/${reviewId}`);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await toggleLikeAction(reviewId);
      if (!result.success) {
        setError(result.error ?? "Unable to update like.");
        return;
      }
      if (result.liked !== undefined && result.likeCount !== undefined) {
        setLiked(result.liked);
        setLikes(result.likeCount);
        if (result.liked) {
          triggerMoonieReaction("likeReview");
        }
      }
    });
  };

  const handleComment = () => {
    onComment?.();
  };

  const handleShare = async () => {
    setShareFeedback(null);
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: reviewTitle,
          text: `Check out this review on MoonVerse: ${reviewTitle}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareFeedback("Link copied!");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        setShareFeedback("Link copied!");
      } catch {
        setShareFeedback("Unable to share.");
        return;
      }
    }

    startTransition(async () => {
      const result = await shareReviewAction(reviewId);
      if (result.success && result.shareCount !== undefined) {
        setShares(result.shareCount);
      }
    });

    if (!shareFeedback) {
      setShareFeedback("Shared!");
    }
    setTimeout(() => setShareFeedback(null), 2000);
  };

  return (
    <div className="space-y-2">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex w-full items-stretch gap-0.5 rounded-full bg-[#F8F1FA] p-1 ring-1 ring-[#6E46C7]/8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={isPending}
          aria-pressed={liked}
          aria-label={liked ? "Unlike review" : "Like review"}
          className={cn(
            actionBtnClass,
            liked && "text-[#6E46C7] hover:bg-[#6E46C7]/[0.06] hover:text-[#6E46C7]"
          )}
        >
          <Heart
            data-icon="inline-start"
            className={cn(liked && "fill-current")}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">{liked ? "Liked" : "Like"}</span>
          {likes}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleComment}
          aria-label={`View ${commentCount} comments`}
          aria-haspopup="dialog"
          aria-expanded={discussionOpen}
          className={actionBtnClass}
        >
          <MessageCircle data-icon="inline-start" aria-hidden="true" />
          <span className="hidden sm:inline">Comment</span>
          {commentCount}
        </Button>

        <div className="min-w-0 flex-1">
          <AddToFolderMenu
            reviewId={reviewId}
            folders={folders}
            savedFolderIds={savedFolderIds}
            isLoggedIn={isLoggedIn}
            appearance="pill"
            saveCount={saveCount}
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          disabled={isPending}
          aria-label="Share review"
          className={actionBtnClass}
        >
          <Share2 data-icon="inline-start" aria-hidden="true" />
          <span className="hidden sm:inline">Share</span>
          {shareFeedback ?? shares}
        </Button>
      </div>

      {!isOwner && isLoggedIn ? (
        <div className="flex justify-end px-1">
          <ReportButton
            targetType={ReportTargetType.REVIEW}
            targetId={reviewId}
            isLoggedIn={isLoggedIn}
            variant="text"
          />
        </div>
      ) : null}
    </div>
  );
}
