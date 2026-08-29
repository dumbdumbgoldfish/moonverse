"use client";

import { useState, useTransition } from "react";
import { followUserAction } from "@/actions/follow.actions";
import type { TopReviewerPreview } from "@/types/discovery";

interface CommunityReviewerFollowBatchProps {
  reviewers: TopReviewerPreview[];
}

export function CommunityReviewerFollowBatch({
  reviewers,
}: CommunityReviewerFollowBatchProps) {
  const [isPending, startTransition] = useTransition();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const pending = reviewers.filter((reviewer) => !followedIds.has(reviewer.id));

  if (pending.length < 2) return null;

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const next = new Set(followedIds);
          for (const reviewer of pending) {
            const result = await followUserAction(reviewer.id, reviewer.username);
            if (result.success) next.add(reviewer.id);
          }
          setFollowedIds(next);
        });
      }}
      className="mt-3 w-full rounded-full border border-[var(--mv-plum)]/25 bg-[var(--mv-plum)]/[0.06] px-3 py-2 text-[12px] font-semibold text-[var(--mv-plum)] transition hover:border-[var(--mv-plum)]/40 disabled:opacity-60"
    >
      {isPending ? "Following…" : `Follow all ${pending.length}`}
    </button>
  );
}
