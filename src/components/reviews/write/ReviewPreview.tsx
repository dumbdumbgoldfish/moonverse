"use client";

import { Bookmark, Eye, Heart, MessageCircle, PencilLine, ShieldAlert } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReviewSpoilerGate } from "@/components/reviews/detail/ReviewSpoilerGate";
import { ReviewStructuredBody } from "@/components/reviews/detail/ReviewStructuredBody";
import { ReviewVerdictChip } from "@/components/reviews/detail/ReviewVerdictChip";
import {
  DETAIL_CHIP,
  DETAIL_MODULE_LABEL,
  DETAIL_STAGE,
} from "@/lib/reviews/detail-surface";
import { estimateReadMinutes } from "@/lib/review-reading";
import { cn } from "@/lib/utils";

interface ReviewPreviewProps {
  novelTitle: string;
  novelAuthor: string | null;
  coverUrl: string | null;
  userName: string;
  userUsername?: string;
  userImage?: string | null;
  rating: number;
  reviewTitle: string;
  reviewBody: string;
  containsSpoilers: boolean;
  tagNames: string[];
  genreNames?: string[];
  readingSources: string[];
  onEditNovel: () => void;
  onEditReview: () => void;
  compact?: boolean;
  actionsDisabled?: boolean;
}

function PreviewEngagementStub() {
  const items = [
    { icon: Heart, label: "Like" },
    { icon: MessageCircle, label: "Discuss" },
    { icon: Bookmark, label: "Save" },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-t border-[#1a1033]/6 px-4 py-3 sm:px-6"
      aria-hidden
    >
      <p className="mr-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mv-text-muted)]">
        Engagement preview
      </p>
      {items.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#1a1033]/8 bg-[#FBF7F1] px-3 py-1.5 text-xs font-semibold text-[#5a4d72]"
        >
          <Icon className="size-3.5 opacity-60" />
          {label}
        </span>
      ))}
    </div>
  );
}

export function ReviewPreview({
  novelTitle,
  novelAuthor,
  coverUrl,
  userName,
  userUsername,
  userImage,
  rating,
  reviewTitle,
  reviewBody,
  containsSpoilers,
  tagNames,
  genreNames = [],
  readingSources,
  onEditNovel,
  onEditReview,
  compact = false,
  actionsDisabled = false,
}: ReviewPreviewProps) {
  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const readMinutes = estimateReadMinutes(reviewBody);

  return (
    <div className="space-y-4">
      {!compact ? (
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--mv-plum)]">
            <Eye className="size-3.5" aria-hidden />
            Salon preview
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-[var(--mv-ink)]">
            How readers will see your review
          </h2>
          <p className="mt-1 text-sm text-[var(--mv-text-muted)]">
            Mirrors the published review layout. Check hierarchy, verdict, and
            spoiler handling before you publish.
          </p>
        </div>
      ) : null}

      <article className={cn(DETAIL_STAGE, compact && "shadow-none")}>
        <div className="border-b border-[#1a1033]/6 bg-[linear-gradient(135deg,#FFFCF8_0%,#FFFFFF_42%,#F7F0FB_100%)] p-4 sm:p-5">
          <div className="flex gap-4 sm:gap-5">
            <div className="relative aspect-[2/3] w-[5.5rem] shrink-0 overflow-hidden rounded-xl shadow-[0_12px_28px_-16px_rgba(20,17,31,0.35)] ring-1 ring-[#6E46C7]/12 sm:w-24">
              <CoverImage
                src={coverUrl ?? ""}
                alt=""
                title={novelTitle}
                author={novelAuthor ?? undefined}
                themeSeed={novelTitle}
                sizes="96px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C89B4A]">
                Community review
              </p>
              <p className="mt-1 font-heading text-lg font-semibold leading-tight text-[#1a1033] sm:text-xl">
                {novelTitle}
              </p>
              <p className="mt-2 font-serif text-base italic leading-snug text-[#4C35C4] sm:text-lg">
                {reviewTitle}
              </p>
              <p className="mt-1 text-sm text-[#5a4d72]">
                {novelAuthor ? `by ${novelAuthor}` : "Author not listed"}
              </p>
              {genreNames.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  <p className={DETAIL_MODULE_LABEL}>Genres</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {genreNames.map((genre) => (
                      <li key={genre}>
                        <span className={DETAIL_CHIP}>{genre}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {tagNames.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  <p className={DETAIL_MODULE_LABEL}>Tags</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {tagNames.map((tag) => (
                      <li key={tag}>
                        <span className={DETAIL_CHIP}>{tag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <header className="flex flex-col gap-4 border-b border-[#1a1033]/6 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar className="size-12 ring-1 ring-[#6E46C7]/12">
              {userImage ? <AvatarImage src={userImage} alt="" /> : null}
              <AvatarFallback className="bg-[#F4ECF8] text-sm font-bold text-[#6E46C7]">
                {initials || "MV"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-heading text-lg font-semibold text-[#1a1033]">
                {userName}
              </p>
              <p className="mt-1 text-sm text-[#5a4d72]">
                {userUsername ? `@${userUsername}` : "MoonVerse reader"}
                <span className="text-[#c5bed4]"> · </span>
                Publishing publicly
                <span className="text-[#c5bed4]"> · </span>
                {readMinutes} min read
              </p>
            </div>
          </div>
          <ReviewVerdictChip rating={rating} size="md" />
        </header>

        <div className="space-y-4 px-4 py-5 sm:px-6 sm:py-6">
          {containsSpoilers ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="inline-flex items-center gap-1.5 font-bold">
                <ShieldAlert className="size-4" aria-hidden />
                Contains spoilers
              </p>
              <p className="mt-1 text-xs">
                Readers will see an interactive spoiler gate before the review
                body.
              </p>
            </div>
          ) : null}

          <ReviewSpoilerGate containsSpoilers={containsSpoilers}>
            <ReviewStructuredBody
              body={reviewBody}
              isLoggedIn
              forceExpanded
            />
          </ReviewSpoilerGate>

          {readingSources.length > 0 ? (
            <div className="rounded-xl border border-[#1a1033]/8 bg-[#FBF6FC] px-4 py-3 text-sm">
              <p className="font-semibold text-[#1a1033]">Reading sources</p>
              <p className="mt-0.5 text-xs text-[#5a4d72]">
                Pending moderation before appearing publicly
              </p>
              <ul className="mt-2 space-y-1 break-all text-[#5a4d72]">
                {readingSources.map((url) => (
                  <li key={url}>{url}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <PreviewEngagementStub />
      </article>

      {!compact ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onEditNovel}
            disabled={actionsDisabled}
            className="min-h-10 gap-1.5 rounded-xl border-[var(--mv-border)]"
          >
            <PencilLine className="size-4" aria-hidden />
            Edit novel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onEditReview}
            disabled={actionsDisabled}
            className="min-h-10 gap-1.5 rounded-xl border-[var(--mv-border)]"
          >
            <PencilLine className="size-4" aria-hidden />
            Edit review
          </Button>
        </div>
      ) : null}
    </div>
  );
}
