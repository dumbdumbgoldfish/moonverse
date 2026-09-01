"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FilePlus2, PencilLine } from "lucide-react";
import { NovelCarouselArrow } from "@/components/novels/NovelCarouselArrow";
import { MyReviewDraftCard } from "@/components/reviews/my-reviews/MyReviewDraftCard";
import type { ReviewDraftListItem } from "@/components/reviews/my-reviews/draft-card-utils";
import { WritingSectionHeader } from "@/components/reviews/write/WritingStudioChrome";
import {
  DeskPrimaryButton,
  DeskSecondaryButton,
} from "@/components/reviews/write/WritingDeskButtons";
import { cn } from "@/lib/utils";

function useDraftCardsPerPage() {
  const [cardsPerPage, setCardsPerPage] = useState(3);

  useEffect(() => {
    function update() {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setCardsPerPage(3);
      } else if (window.matchMedia("(min-width: 640px)").matches) {
        setCardsPerPage(2);
      } else {
        setCardsPerPage(1);
      }
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return cardsPerPage;
}

interface MyReviewsDraftCarouselProps {
  drafts: ReviewDraftListItem[];
  loading: boolean;
  confirmClearId: string | null;
  clearing: boolean;
  publishingDraftId: string | null;
  publishError: string | null;
  publishSuccess: string | null;
  onPublish: (draftId: string) => void;
  onRequestClear: (draftId: string) => void;
  onCancelClear: () => void;
  onConfirmClear: () => void;
}

export function MyReviewsDraftCarousel({
  drafts,
  loading,
  confirmClearId,
  clearing,
  publishingDraftId,
  publishError,
  publishSuccess,
  onPublish,
  onRequestClear,
  onCancelClear,
  onConfirmClear,
}: MyReviewsDraftCarouselProps) {
  const cardsPerPage = useDraftCardsPerPage();
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(drafts.length / cardsPerPage));

  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * cardsPerPage;
  const visibleDrafts = drafts.slice(start, start + cardsPerPage);
  const showPager = drafts.length > cardsPerPage;

  return (
    <section aria-labelledby="drafts-heading" className="mb-12 space-y-5">
      <WritingSectionHeader
        eyebrow="Local only"
        title="Saved drafts"
        description="Pick up where you left off. Browse drafts in rows, and use the arrows when you have more than fit on screen."
      />

      {loading ? (
        <div className="rounded-2xl border border-violet-100 bg-white px-5 py-8 text-sm text-slate-500">
          Checking this browser for drafts…
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-violet-200 bg-white/90 px-6 py-12 text-center shadow-[0_16px_40px_-36px_rgba(76,29,149,0.35)]">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f7f3ff] text-primary ring-1 ring-violet-100">
            <FilePlus2 className="size-6" aria-hidden />
          </span>
          <p className="mt-4 font-serif text-xl font-bold text-night-blue">
            No drafts saved yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Start a review in Writing Studio and save a draft. It will appear
            here as a card you can resume any time.
          </p>
          <DeskSecondaryButton render={<Link href="/reviews/new" />} className="mt-5">
            <PencilLine className="size-4" aria-hidden />
            Start a draft
          </DeskSecondaryButton>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200/70 bg-white/80 p-3 shadow-[0_16px_40px_-34px_rgba(180,83,9,0.28)] sm:p-4">
          {publishError ? (
            <p
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {publishError}
            </p>
          ) : null}
          {publishSuccess ? (
            <p
              className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              role="status"
            >
              {publishSuccess}
            </p>
          ) : null}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-serif text-lg font-bold text-night-blue">
                {drafts.length} saved {drafts.length === 1 ? "draft" : "drafts"}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {showPager
                  ? `Showing ${start + 1}–${Math.min(start + cardsPerPage, drafts.length)}`
                  : "Ready to continue"}
              </p>
            </div>
            {showPager ? (
              <div className="flex items-center gap-2">
                <NovelCarouselArrow
                  direction="prev"
                  disabled={safePage === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  label="Show previous drafts"
                />
                <span className="min-w-[3.5rem] text-center text-xs font-semibold tabular-nums text-slate-500">
                  {safePage + 1} / {pageCount}
                </span>
                <NovelCarouselArrow
                  direction="next"
                  disabled={safePage >= pageCount - 1}
                  onClick={() =>
                    setPage((current) => Math.min(pageCount - 1, current + 1))
                  }
                  label="Show next drafts"
                />
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "grid gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 sm:gap-4",
              cardsPerPage === 1 && "grid-cols-1",
              cardsPerPage === 2 && "grid-cols-1 sm:grid-cols-2",
              cardsPerPage >= 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}
            key={`drafts-${safePage}-${cardsPerPage}`}
          >
            {visibleDrafts.map((item) => (
              <MyReviewDraftCard
                key={item.id}
                item={item}
                confirmClear={confirmClearId === item.id}
                clearing={clearing && confirmClearId === item.id}
                publishing={publishingDraftId === item.id}
                onPublish={() => onPublish(item.id)}
                onRequestClear={() => onRequestClear(item.id)}
                onCancelClear={onCancelClear}
                onConfirmClear={onConfirmClear}
              />
            ))}
          </div>

          <div className="mt-4 flex justify-center sm:justify-end">
            <DeskPrimaryButton deskSize="sm" render={<Link href="/reviews/new" />}>
              <PencilLine className="size-4" aria-hidden />
              New draft
            </DeskPrimaryButton>
          </div>
        </div>
      )}
    </section>
  );
}
