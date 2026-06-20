"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderMinus } from "lucide-react";
import { removeReviewFromFolderAction } from "@/actions/folder.actions";
import { SocialReviewCard } from "@/components/reviews/SocialReviewCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FolderDetail } from "@/types/folder";

interface FolderDetailViewProps {
  folder: FolderDetail;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function FolderDetailView({ folder }: FolderDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingReviewId, setPendingReviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = (reviewId: string) => {
    setError(null);
    setPendingReviewId(reviewId);

    startTransition(async () => {
      const result = await removeReviewFromFolderAction(folder.id, reviewId);
      setPendingReviewId(null);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="h-3 gradient-moonverse" aria-hidden="true" />
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{folder.name}</h1>
            {folder.isPublic ? (
              <Badge variant="secondary" className="rounded-full">Public</Badge>
            ) : (
              <Badge variant="outline" className="rounded-full">Private</Badge>
            )}
          </div>
          {folder.description && (
            <p className="mt-3 text-muted-foreground">{folder.description}</p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            {folder.reviewCount} saved review
            {folder.reviewCount !== 1 ? "s" : ""}
            {" · "}
            <time dateTime={folder.createdAt}>
              Created {formatDate(folder.createdAt)}
            </time>
          </p>
        </div>
      </header>

      {error && (
        <p className="mb-6 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {folder.reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-white px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No reviews saved yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse reviews and use &ldquo;Save to Folder&rdquo; to add them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {folder.reviews.map((review) => (
            <div key={review.id} className="space-y-2">
              <SocialReviewCard review={review} variant="feed" />
              {folder.canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(review.id)}
                  disabled={isPending && pendingReviewId === review.id}
                  aria-label={`Remove ${review.title} from folder`}
                >
                  <FolderMinus data-icon="inline-start" aria-hidden="true" />
                  Remove from folder
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
