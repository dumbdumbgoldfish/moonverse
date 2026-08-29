"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import {
  shareReviewAction,
  toggleLikeAction,
} from "@/actions/interaction.actions";
import { useSignInPrompt } from "@/components/auth/SignInPromptProvider";
import { AddToFolderMenu } from "@/components/folders/AddToFolderMenu";
import { Button } from "@/components/ui/button";
import { publishCommunityReviewSync } from "@/lib/community-feed-sync";
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
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(likeCount);
  const [shares, setShares] = useState(initialShareCount);
  const incomingLikeKey = `${initialLiked}:${likeCount}:${initialShareCount}`;

  useEffect(() => {
    setLiked(initialLiked);
    setLikes(likeCount);
    setShares(initialShareCount);
  }, [incomingLikeKey, initialLiked, likeCount, initialShareCount]);
  const [error, setError] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const literary = variant === "literary";

  const actionBtnClass = literary
    ? "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-2 text-[13px] font-semibold text-[#5a4d72] shadow-none hover:bg-[#6E46C7]/[0.06] hover:text-[#1a1033] sm:px-3"
    : "min-h-11 min-w-0 flex-1 rounded-lg px-1 text-[12px] font-semibold text-[var(--mv-muted,#6F6884)] sm:min-h-10 sm:px-1.5 sm:text-[13px] fine-hover:hover:bg-[var(--mv-surface-soft,#F3EFFF)] fine-hover:hover:text-[var(--mv-ink,#201738)]";

  const handleLike = () => {
    if (!isLoggedIn) {
      promptSignIn(`/reviews/${reviewId}`);
      return;
    }
    setError(null);
    const previousLiked = liked;
    const previousLikes = likes;
    const nextLiked = !liked;
    const nextLikes = liked ? Math.max(0, likes - 1) : likes + 1;
    setLiked(nextLiked);
    setLikes(nextLikes);
    onLikeChange?.(nextLiked, nextLikes);
    publishCommunityReviewSync({
      reviewId,
      liked: nextLiked,
      likeCount: nextLikes,
    });

    startTransition(async () => {
      const result = await toggleLikeAction(reviewId);
      if (!result.success) {
        setLiked(previousLiked);
        setLikes(previousLikes);
        onLikeChange?.(previousLiked, previousLikes);
        setError(result.error ?? "Unable to update like.");
        return;
      }
      if (result.liked !== undefined && result.likeCount !== undefined) {
        setLiked(result.liked);
        setLikes(result.likeCount);
        onLikeChange?.(result.liked, result.likeCount);
        publishCommunityReviewSync({
          reviewId,
          liked: result.liked,
          likeCount: result.likeCount,
        });
        if (result.liked) triggerMoonieReaction("likeReview");
      }
    });
  };

  const handleShare = async () => {
    setShareFeedback(null);
    const url = `${window.location.origin}/reviews/${reviewId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: reviewTitle,
          text: `Check out this review on MoonVerse: ${reviewTitle}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareFeedback("Copied");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setShareFeedback("Copied");
      } catch {
        setShareFeedback("Unable to share");
        return;
      }
    }

    startTransition(async () => {
      const result = await shareReviewAction(reviewId);
      if (result.success && result.shareCount !== undefined) {
        setShares(result.shareCount);
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
          onClick={onCommentClick}
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
