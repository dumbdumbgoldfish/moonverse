"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import {
  shareReviewAction,
  toggleLikeAction,
} from "@/actions/interaction.actions";
import { AddToFolderMenu } from "@/components/folders/AddToFolderMenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FolderListItem } from "@/types/folder";

interface ReviewActionsProps {
  reviewId: string;
  reviewTitle: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  initialLiked: boolean;
  isLoggedIn: boolean;
  folders: FolderListItem[];
  savedFolderIds: string[];
}

export function ReviewActions({
  reviewId,
  reviewTitle,
  likeCount,
  commentCount,
  shareCount: initialShareCount,
  initialLiked,
  isLoggedIn,
  folders,
  savedFolderIds,
}: ReviewActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(likeCount);
  const [shares, setShares] = useState(initialShareCount);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const handleLike = () => {
    if (!isLoggedIn) {
      setAuthMessage("Log in to like this review.");
      return;
    }

    setAuthMessage(null);
    startTransition(async () => {
      const result = await toggleLikeAction(reviewId);
      if (!result.success) {
        setAuthMessage(result.error);
        return;
      }
      if (result.liked !== undefined && result.likeCount !== undefined) {
        setLiked(result.liked);
        setLikes(result.likeCount);
      }
    });
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
    <div className="space-y-3">
      {authMessage && (
        <p className="text-sm text-muted-foreground" role="status">
          {authMessage}{" "}
          {!isLoggedIn && (
            <Link
              href={`/login?callbackUrl=/reviews/${reviewId}`}
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
            >
              Log in
            </Link>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={liked ? "default" : "outline"}
          size="sm"
          onClick={handleLike}
          disabled={isPending}
          aria-pressed={liked}
          aria-label={liked ? "Unlike review" : "Like review"}
        >
          <Heart
            data-icon="inline-start"
            className={cn(liked && "fill-current")}
            aria-hidden="true"
          />
          {likes}
        </Button>

        <Button
          variant="outline"
          size="sm"
          render={<a href="#comments" />}
          aria-label={`View ${commentCount} comments`}
        >
          <MessageCircle data-icon="inline-start" aria-hidden="true" />
          {commentCount}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={isPending}
          aria-label="Share review"
        >
          <Share2 data-icon="inline-start" aria-hidden="true" />
          {shareFeedback ?? shares}
        </Button>

        <AddToFolderMenu
          reviewId={reviewId}
          folders={folders}
          savedFolderIds={savedFolderIds}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  );
}
