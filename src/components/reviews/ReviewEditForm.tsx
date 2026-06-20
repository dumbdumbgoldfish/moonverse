"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import {
  deleteReviewAction,
  updateReviewAction,
} from "@/actions/review.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { LIMITS } from "@/lib/validation";
import type { ReviewDetail } from "@/types/review";

interface ReviewEditFormProps {
  review: ReviewDetail;
}

export function ReviewEditForm({ review }: ReviewEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title);
  const [body, setBody] = useState(review.body);

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateReviewAction({
        reviewId: review.id,
        title,
        body,
        rating,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/reviews/${review.id}`);
      router.refresh();
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review? This action cannot be undone."
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteReviewAction(review.id);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Edit Review"
        description={`Editing your review of "${review.novelTitle}"`}
      />

      {error && (
        <p
          className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      <fieldset className="mb-8 space-y-3 rounded-xl border border-border/60 bg-bg-elevated p-6">
        <legend className="px-1 text-lg font-semibold">Novel (read-only)</legend>
        <p className="font-medium">{review.novelTitle}</p>
        <p className="text-sm text-muted-foreground">by {review.novelAuthor}</p>
        <div className="flex flex-wrap gap-2">
          {review.genres.map((genre) => (
            <Badge key={genre} variant="secondary">
              {genre}
            </Badge>
          ))}
        </div>
        {review.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {review.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </fieldset>

      <form
        className="space-y-6"
        onSubmit={handleUpdate}
        aria-label="Edit review form"
      >
        <fieldset className="space-y-4 rounded-xl border border-border/60 bg-bg-elevated p-6">
          <legend className="px-1 text-lg font-semibold">Your review</legend>

          <div className="space-y-2">
            <span id="edit-rating-label" className="text-sm font-medium">
              Rating
            </span>
            <div
              className="flex gap-1"
              role="radiogroup"
              aria-labelledby="edit-rating-label"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  disabled={isPending}
                  className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value !== 1 ? "s" : ""}`}
                >
                  <Star
                    size={24}
                    className={cn(
                      value <= rating
                        ? "fill-accent text-accent"
                        : "fill-transparent text-muted-foreground/40"
                    )}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-review-title">Review title</Label>
            <Input
              id="edit-review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={LIMITS.reviewTitle.min}
              maxLength={LIMITS.reviewTitle.max}
              aria-required="true"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-review-body">Review body</Label>
            <Textarea
              id="edit-review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              required
              minLength={LIMITS.reviewBody.min}
              maxLength={LIMITS.reviewBody.max}
              aria-required="true"
              disabled={isPending}
              className="min-h-[200px] font-serif"
            />
          </div>
        </fieldset>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            Delete review
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              render={<Link href={`/reviews/${review.id}`} />}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
