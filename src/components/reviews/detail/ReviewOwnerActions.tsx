"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteReviewAction } from "@/actions/review.actions";
import { ReviewDeleteConfirmDialog } from "@/components/reviews/ReviewDeleteConfirmDialog";
import { Button } from "@/components/ui/button";

interface ReviewOwnerActionsProps {
  reviewId: string;
}

export function ReviewOwnerActions({ reviewId }: ReviewOwnerActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirmDelete() {
    setError(null);
    startDelete(async () => {
      const result = await deleteReviewAction(reviewId, {
        redirectTo: "/my-reviews",
      });
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="rounded-full"
        render={<Link href={`/reviews/${reviewId}/edit`} />}
      >
        <Pencil data-icon="inline-start" aria-hidden />
        Edit
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="rounded-full text-destructive hover:bg-destructive/10"
        disabled={isDeleting}
        onClick={() => {
          setError(null);
          setDeleteDialogOpen(true);
        }}
      >
        <Trash2 data-icon="inline-start" aria-hidden />
        Delete
      </Button>
      {error && !deleteDialogOpen ? (
        <p className="w-full text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <ReviewDeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={error}
      />
    </div>
  );
}
