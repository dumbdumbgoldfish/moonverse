"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { CommunityReviewModal } from "@/components/community/CommunityReviewModal";
import type { CommunityReviewModalData } from "@/lib/community-review-modal.types";
import { loadCommunityReviewCached } from "@/lib/community-review-prefetch";

interface CommunityReviewModalLoaderProps {
  reviewId: string;
  focusComments?: boolean;
  onClose: () => void;
}

export function CommunityReviewModalLoader({
  reviewId,
  focusComments = false,
  onClose,
}: CommunityReviewModalLoaderProps) {
  const [data, setData] = useState<CommunityReviewModalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadCommunityReviewCached(reviewId)
      .then((payload) => {
        if (!cancelled && payload) setData(payload);
        if (!cancelled && !payload) {
          setError("Unable to load review.");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load review."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reviewId]);

  if (error) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--mv-overlay)] p-4">
        <div className="w-full max-w-md rounded-2xl bg-[var(--mv-bg)] p-6 shadow-xl">
          <p className="text-sm text-[var(--mv-text-muted)]">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--mv-violet)] px-4 py-2 text-sm font-semibold text-white"
          >
            <X className="size-4" aria-hidden />
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--mv-overlay)]">
        <div className="flex items-center gap-2 rounded-full bg-[var(--mv-bg)] px-4 py-3 text-sm font-medium text-[var(--mv-ink)] shadow-lg">
          <Loader2 className="size-4 animate-spin text-[var(--mv-violet)]" aria-hidden />
          Loading review…
        </div>
      </div>
    );
  }

  return (
    <CommunityReviewModal
      data={data}
      focusComments={focusComments}
      onClose={onClose}
    />
  );
}
