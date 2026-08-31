"use client";

import { useState, useTransition } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import {
  shareReviewAction,
  toggleLikeAction,
} from "@/actions/interaction.actions";
import { useSignInPrompt } from "@/components/auth/SignInPromptProvider";
import { AddToFolderMenu } from "@/components/folders/AddToFolderMenu";
import { Button } from "@/components/ui/button";
import { publishCommunityReviewSync } from "@/lib/community-feed-sync";
import { buildReviewSharePayload } from "@/lib/review-share";
import { triggerMoonieReaction } from "@/lib/moonie/reactions";
import { cn } from "@/lib/utils";
import type { FolderListItem } from "@/types/folder";

interface ReviewActionBarProps {
  reviewId: string;
  reviewTitle: string;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  initialLiked: boolean;
  folders: FolderListItem[];
  savedFolderIds: string[];
  onCommentClick: () => void;
  isLoggedIn?: boolean;
  variant?: "default" | "literary";
  onLikeChange?: (liked: boolean, likeCount: number) => void;
}

interface ActionBarState {
  reviewId: string;
  baselineLiked: boolean;
  baselineLikeCount: number;
  baselineShareCount: number;
  liked: boolean;
  likes: number;
  shares: number;
}

function createActionBarState(
  reviewId: string,
  initialLiked: boolean,
  likeCount: number,
  shareCount: number
): ActionBarState {
  return {
    reviewId,
    baselineLiked: initialLiked,
    baselineLikeCount: likeCount,
    baselineShareCount: shareCount,
    liked: initialLiked,
    likes: likeCount,
    shares: shareCount,
  };
}

export function ReviewActionBar({
  reviewId,
  reviewTitle,
  likeCount,
  commentCount,
  saveCount,
  shareCount: initialShareCount,
  initialLiked,
  folders,
  savedFolderIds,
  onCommentClick,
  isLoggedIn = true,
  variant = "default",
  onLikeChange,
}: ReviewActionBarProps) {
  const { promptSignIn } = useSignInPrompt();
  const [isPending, startTransition] = useTransition();
  const [actionState, setActionState] = useState(() =>
    createActionBarState(reviewId, initialLiked, likeCount, initialShareCount)
  );
  const [errorRecord, setErrorRecord] = useState<{
    reviewId: string;
    message: string;
  } | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const literary = variant === "literary";

  let nextState = actionState;
  if (actionState.reviewId !== reviewId) {
    nextState = createActionBarState(
      reviewId,
      initialLiked,
      likeCount,
      initialShareCount
    );
    setActionState(nextState);
  } else if (!isPending) {
    const likedChanged = actionState.baselineLiked !== initialLiked;
    const likesChanged = actionState.baselineLikeCount !== likeCount;
    const sharesChanged = actionState.baselineShareCount !== initialShareCount;
    if (likedChanged || likesChanged || sharesChanged) {
      nextState = {
        ...actionState,
        baselineLiked: likedChanged ? initialLiked : actionState.baselineLiked,
        liked: likedChanged ? initialLiked : actionState.liked,
        baselineLikeCount: likesChanged
          ? likeCount
          : actionState.baselineLikeCount,
        likes: likesChanged ? likeCount : actionState.likes,
        baselineShareCount: sharesChanged
          ? initialShareCount
          : actionState.baselineShareCount,
        shares: sharesChanged ? initialShareCount : actionState.shares,
      };
      setActionState(nextState);
    }
  }

  const liked = nextState.liked;
  const likes = nextState.likes;
  const shares = nextState.shares;
  const error =
    errorRecord && errorRecord.reviewId === reviewId
      ? errorRecord.message
      : null;

  const actionBtnClass = literary
    ? "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-2 text-[13px] font-semibold text-[#5a4d72] shadow-none hover:bg-[#6E46C7]/[0.06] hover:text-[#1a1033] sm:px-3"
    : "min-h-11 min-w-0 flex-1 rounded-lg px-1 text-[12px] font-semibold text-[var(--mv-muted,#6F6884)] sm:min-h-10 sm:px-1.5 sm:text-[13px] fine-hover:hover:bg-[var(--mv-surface-soft,#F3EFFF)] fine-hover:hover:text-[var(--mv-ink,#201738)]";

  const handleLike = () => {
    if (!isLoggedIn) {
      promptSignIn(`/reviews/${reviewId}`);
      return;
    }
    setErrorRecord(null);
    const previousLiked = liked;
    const previousLikes = likes;
    const nextLiked = !liked;
    const nextLikes = liked ? Math.max(0, likes - 1) : likes + 1;
    const requestReviewId = reviewId;
    setActionState((current) => {
      if (current.reviewId !== requestReviewId) return current;
      return { ...current, liked: nextLiked, likes: nextLikes };
    });
    onLikeChange?.(nextLiked, nextLikes);
    publishCommunityReviewSync({
      reviewId: requestReviewId,
      liked: nextLiked,
      likeCount: nextLikes,
    });

    startTransition(async () => {
      const result = await toggleLikeAction(requestReviewId);
      if (!result.success) {
        setActionState((current) => {
          if (current.reviewId !== requestReviewId) return current;
          return { ...current, liked: previousLiked, likes: previousLikes };
        });
        onLikeChange?.(previousLiked, previousLikes);
        setErrorRecord({
          reviewId: requestReviewId,
          message: result.error ?? "Unable to update like.",
        });
        return;
      }
      if (result.liked !== undefined && result.likeCount !== undefined) {
        const confirmedLiked = result.liked;
        const confirmedLikes = result.likeCount;
        setActionState((current) => {
          if (current.reviewId !== requestReviewId) return current;
          return { ...current, liked: confirmedLiked, likes: confirmedLikes };
        });
        onLikeChange?.(confirmedLiked, confirmedLikes);
        publishCommunityReviewSync({
          reviewId: requestReviewId,
          liked: confirmedLiked,
          likeCount: confirmedLikes,
        });
        if (confirmedLiked) triggerMoonieReaction("likeReview");
      }
    });
  };

  const handleShare = async () => {
    setShareFeedback(null);
    const requestReviewId = reviewId;
    const { url, title, text } = buildReviewSharePayload(
      requestReviewId,
      reviewTitle
    );
    let shared = false;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        shared = true;
      } else {
        await navigator.clipboard.writeText(url);
        setShareFeedback("Copied");
        shared = true;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setShareFeedback("Copied");
        shared = true;
      } catch {
        setShareFeedback("Unable to share");
        return;
      }
    }

    if (!shared) return;

    startTransition(async () => {
      const result = await shareReviewAction(requestReviewId);
      if (result.success && result.shareCount !== undefined) {
        const confirmedShares = result.shareCount;
        setActionState((current) => {
          if (current.reviewId !== requestReviewId) return current;
          return { ...current, shares: confirmedShares };
        });
      }
    });

    window.setTimeout(() => setShareFeedback(null), 2000);
  };

  return (
    <div className="space-y-1">
      {error ? (
        <p className="px-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div
        className={cn(
          "flex w-full items-stretch gap-0.5",
          literary
            ? "rounded-full bg-[#F8F1FA] p-1 ring-1 ring-[#6E46C7]/8"
            : "py-0.5"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={isPending}
          aria-pressed={liked}
          aria-label={liked ? "Unlike review" : "Like review"}
          className={cn(
            actionBtnClass,
            liked &&
              (literary
                ? "text-[#6E46C7] hover:bg-[#6E46C7]/[0.06] hover:text-[#6E46C7]"
                : "text-primary hover:bg-violet-50 hover:text-primary")
          )}
        >
          <Heart
            data-icon="inline-start"
            className={cn(liked && "fill-current")}
            aria-hidden
          />
          <span>{liked ? "Liked" : "Like"}</span>
          <span className="tabular-nums">{likes}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => {
            if (!isLoggedIn) {
              promptSignIn(`/reviews/${reviewId}#comments`);
              return;
            }
            onCommentClick();
          }}
          aria-label={`Comment (${commentCount})`}
          className={actionBtnClass}
        >
          <MessageCircle data-icon="inline-start" aria-hidden />
          <span>Comment</span>
          <span className="tabular-nums">{commentCount}</span>
        </Button>

        <div className="min-w-0 flex-1">
          <AddToFolderMenu
            reviewId={reviewId}
            folders={folders}
            savedFolderIds={savedFolderIds}
            isLoggedIn={isLoggedIn}
            appearance={literary ? "pill" : "toolbar"}
            buttonId={`save-review-${reviewId}`}
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
          <Share2 data-icon="inline-start" aria-hidden />
          <span>{shareFeedback ?? "Share"}</span>
          {!shareFeedback ? (
            <span className="tabular-nums">{shares}</span>
          ) : null}
        </Button>
      </div>
    </div>
  );
}
