"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookMarked,
  BookOpen,
  HardDrive,
  Heart,
  PencilLine,
  Star,
} from "lucide-react";
import { MyReviewsArchive } from "@/components/reviews/my-reviews/MyReviewsArchive";
import { toDraftListItem } from "@/components/reviews/my-reviews/draft-card-utils";
import { MyReviewsDraftCarousel } from "@/components/reviews/my-reviews/MyReviewsDraftCarousel";
import type { ReviewDraftListItem } from "@/components/reviews/my-reviews/draft-card-utils";
import {
  DeskPrimaryButton,
  DeskTabButton,
  DeskTabCount,
} from "@/components/reviews/write/WritingDeskButtons";
import {
  WritingStatChip,
  WritingStudioBackdrop,
} from "@/components/reviews/write/WritingStudioChrome";
import {
  deleteServerReviewDraftAction,
  listServerReviewDraftsAction,
} from "@/actions/review-draft.actions";
import { deleteReviewAction } from "@/actions/review.actions";
import {
  deleteReviewDraft,
  loadReviewDrafts,
  mergeReviewDrafts,
  saveReviewDrafts,
} from "@/lib/review-draft";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

interface MyReviewsViewProps {
  userId: string;
  reviews: ReviewListItem[];
}

type TabId = "all" | "drafts" | "published";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function MyReviewsView({ userId, reviews }: MyReviewsViewProps) {
  const router = useRouter();
  const isClient = useIsClient();
  const [drafts, setDrafts] = useState<ReviewDraftListItem[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [confirmClearId, setConfirmClearId] = useState<string | null>(null);
  const [clearingDraft, setClearingDraft] = useState(false);
  const [tab, setTab] = useState<TabId>("all");
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hiddenReviewIds, setHiddenReviewIds] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrateDrafts() {
      setDraftsLoading(true);
      const local = loadReviewDrafts(userId);
      const server = await listServerReviewDraftsAction();
      if (cancelled) return;
      const merged = mergeReviewDrafts(local, server);
      saveReviewDrafts(userId, merged);
      setDrafts(merged.map(toDraftListItem));
      setDraftsLoading(false);
    }

    void hydrateDrafts();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const visibleReviews = useMemo(
    () => reviews.filter((review) => !hiddenReviewIds.has(review.id)),
    [reviews, hiddenReviewIds]
  );

  const avgRating = useMemo(() => {
    if (visibleReviews.length === 0) return "-";
    const sum = visibleReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / visibleReviews.length).toFixed(1);
  }, [visibleReviews]);

  const totalLikes = useMemo(
    () => visibleReviews.reduce((acc, review) => acc + review.likeCount, 0),
    [visibleReviews]
  );

  async function handleClearDraft(draftId: string) {
    if (!confirmClearId) return;

    setClearingDraft(true);
    deleteReviewDraft(userId, draftId);
    await deleteServerReviewDraftAction(draftId);
    setDrafts((current) => current.filter((item) => item.id !== draftId));
    setConfirmClearId(null);
    setClearingDraft(false);
  }

  async function handleDeleteReview(reviewId: string) {
    if (
      !window.confirm("Delete this review? This cannot be undone.")
    ) {
      return;
    }

    setDeleteError(null);
    setDeletingReviewId(reviewId);
    try {
      const result = await deleteReviewAction(reviewId, { redirectTo: null });
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }
      setHiddenReviewIds((current) => new Set(current).add(reviewId));
      router.refresh();
    } finally {
      setDeletingReviewId(null);
    }
  }

  const showDrafts = tab === "all" || tab === "drafts";
  const showPublished = tab === "all" || tab === "published";

  return (
    <div className="safe-bottom-pad relative min-h-[70vh] bg-[#faf8ff]">
      <header className="relative overflow-hidden border-b border-violet-100/80">
        <WritingStudioBackdrop />
        <div className={cn(SITE_SHELL_CLASS, "relative py-9 lg:py-11")}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary ring-1 ring-violet-100">
                <BookMarked className="size-3.5" aria-hidden />
                Writing desk
              </p>
              <h1 className="mt-3 font-serif text-[clamp(2rem,4vw,2.75rem)] font-black tracking-tight text-night-blue">
                My Reviews
              </h1>
              <p className="mt-2 text-sm leading-snug text-slate-600 sm:text-base">
                Your published voice on MoonVerse, plus any draft saved in this browser. Resume, clear, or start something new from one place.
              </p>
            </div>
            <DeskPrimaryButton render={<Link href="/reviews/new" />}>
              <PencilLine className="size-4" aria-hidden />
              Write a review
            </DeskPrimaryButton>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <WritingStatChip
              icon={BookOpen}
              label="Published"
              value={visibleReviews.length}
            />
            <WritingStatChip
              icon={HardDrive}
              label="Saved drafts"
              value={
                !isClient || draftsLoading
                  ? "…"
                  : drafts.length > 0
                    ? String(drafts.length)
                    : "None"
              }
            />
            <WritingStatChip icon={Star} label="Avg rating" value={avgRating} />
            <WritingStatChip icon={Heart} label="Likes" value={totalLikes} />
          </div>
        </div>
      </header>

      <main className={cn(SITE_SHELL_CLASS, "relative py-8")}>
        <div
          className="mb-8 flex flex-wrap gap-1.5 rounded-full bg-white/90 p-1.5 ring-1 ring-violet-100/90 shadow-[0_12px_32px_-24px_rgba(76,29,149,0.2)]"
          role="tablist"
          aria-label="My reviews filter"
        >
          {(
            [
              { id: "all", label: "Everything", count: visibleReviews.length + drafts.length },
              { id: "drafts", label: "Drafts", count: drafts.length },
              { id: "published", label: "Published", count: visibleReviews.length },
            ] as const
          ).map((item) => (
            <DeskTabButton
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              active={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              <DeskTabCount active={tab === item.id}>{item.count}</DeskTabCount>
            </DeskTabButton>
          ))}
        </div>

        {showDrafts ? (
          <MyReviewsDraftCarousel
            drafts={drafts}
            loading={!isClient || draftsLoading}
            confirmClearId={confirmClearId}
            clearing={clearingDraft}
            onRequestClear={setConfirmClearId}
            onCancelClear={() => setConfirmClearId(null)}
            onConfirmClear={() => {
              if (confirmClearId) {
                void handleClearDraft(confirmClearId);
              }
            }}
          />
        ) : null}

        {showPublished ? (
          <section aria-labelledby="published-heading" className="space-y-5">
            <MyReviewsArchive
              reviews={visibleReviews}
              deletingReviewId={deletingReviewId}
              deleteError={deleteError}
              onDelete={handleDeleteReview}
            />
          </section>
        ) : null}
      </main>
    </div>
  );
}
