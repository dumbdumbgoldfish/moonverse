"use client";

import Link from "next/link";
import { HardDrive, Star } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import {
  DeskDangerButton,
  DeskOutlineButton,
  DeskPrimaryButton,
  DeskSecondaryButton,
} from "@/components/reviews/write/WritingDeskButtons";
import {
  draftNovelLabel,
  draftProgressPercent,
  draftResumeHref,
  draftStatusLabel,
  formatDraftSavedAt,
  isDraftReadyToPublish,
  type ReviewDraftListItem,
} from "@/components/reviews/my-reviews/draft-card-utils";
import { cn } from "@/lib/utils";

interface MyReviewDraftCardProps {
  item: ReviewDraftListItem;
  confirmClear: boolean;
  clearing: boolean;
  publishing: boolean;
  onPublish: () => void;
  onRequestClear: () => void;
  onCancelClear: () => void;
  onConfirmClear: () => void;
  className?: string;
}

export function MyReviewDraftCard({
  item,
  confirmClear,
  clearing,
  publishing,
  onPublish,
  onRequestClear,
  onCancelClear,
  onConfirmClear,
  className,
}: MyReviewDraftCardProps) {
  const { draft } = item;
  const progress = draftProgressPercent(draft);
  const readyToPublish = isDraftReadyToPublish(draft);
  const preview = draft.reviewBody.trim();

  return (
    <article
      className={cn(
        "flex h-full min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-amber-200/85 bg-[linear-gradient(165deg,#fffdf8_0%,#ffffff_52%,#faf8ff_100%)] p-4 shadow-[0_14px_36px_-28px_rgba(180,83,9,0.4)]",
        className
      )}
    >
      <div className="relative mx-auto h-28 w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-violet-100 shadow-md ring-1 ring-black/5">
        <CoverImage
          src={draft.coverUrl?.startsWith("https://") ? draft.coverUrl : ""}
          alt=""
          title={draftNovelLabel(draft)}
          author={draft.novelAuthor || undefined}
          themeSeed={draft.novelTitle || draft.reviewTitle || item.id}
          sizes="72px"
          fill
          className="object-cover"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-900">
          <HardDrive className="size-3" aria-hidden />
          Draft
        </span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-violet-100">
          {draftStatusLabel(draft)}
        </span>
      </div>

      <div className="mt-3 min-h-0 flex-1 text-center">
        <h3 className="line-clamp-2 font-serif text-base font-bold leading-snug text-night-blue">
          {draft.reviewTitle.trim() || "Untitled review"}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-700">
          {draftNovelLabel(draft)}
        </p>
        {draft.novelAuthor.trim() ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
            by {draft.novelAuthor.trim()}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
          {draft.rating > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
              {draft.rating}/5
            </span>
          ) : (
            <span>No rating yet</span>
          )}
          <span aria-hidden>·</span>
          <span>Edited {formatDraftSavedAt(item.updatedAt)}</span>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            <span>Progress</span>
            <span className="tabular-nums text-[var(--mv-plum)]">{progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-violet-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--mv-gold)] via-[var(--mv-plum)] to-[var(--mv-violet)] transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-left text-xs leading-relaxed text-slate-500">
          {preview || "No review body yet. Continue editing to add your thoughts."}
        </p>
      </div>

      {confirmClear ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-left">
          <p className="text-xs font-bold text-amber-950">Discard this draft?</p>
          <p className="mt-0.5 text-[11px] text-amber-900/90">
            This only clears the saved draft in this browser.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <DeskOutlineButton type="button" deskSize="xs" onClick={onCancelClear}>
              Keep
            </DeskOutlineButton>
            <DeskDangerButton
              type="button"
              deskSize="xs"
              disabled={clearing}
              onClick={onConfirmClear}
            >
              {clearing ? "…" : "Discard"}
            </DeskDangerButton>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {readyToPublish ? (
            <DeskPrimaryButton
              type="button"
              deskSize="xs"
              className="w-full justify-center"
              disabled={publishing || clearing}
              onClick={onPublish}
            >
              {publishing ? "Publishing…" : "Publish"}
            </DeskPrimaryButton>
          ) : null}
          <DeskSecondaryButton
            deskSize="xs"
            className="w-full justify-center"
            render={<Link href={draftResumeHref(draft)} />}
          >
            Continue editing
          </DeskSecondaryButton>
          <DeskDangerButton
            type="button"
            deskSize="xs"
            className="w-full justify-center"
            onClick={onRequestClear}
          >
            Discard
          </DeskDangerButton>
        </div>
      )}
    </article>
  );
}
