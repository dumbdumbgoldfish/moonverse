"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  BookmarkPlus,
  Check,
  ExternalLink,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { recordRecommendationFeedbackAction } from "@/actions/moonie.actions";
import { MoonieCommunityBlock } from "@/components/moonie/MoonieCommunityBlock";
import { CoverImage } from "@/components/ui/CoverImage";
import { NEGATIVE_FEEDBACK_REASONS } from "@/lib/moonie/personalization";
import {
  formatPublicationStatus,
  primaryReason,
  type MoonieCardDensity,
  type MoonieCardMode,
} from "@/lib/moonie/presentation";
import { saveReviewToLibraryAction } from "@/actions/folder.actions";
import { Button } from "@/components/ui/button";
import type { MoonieRecommendation } from "@/types/moonie";
import { confidenceLabel } from "@/lib/moonie/provenance";
import { cn } from "@/lib/utils";

interface MoonieLuxuryCardProps {
  recommendation: MoonieRecommendation;
  isLoggedIn: boolean;
  onMoreLikeThis?: (novelId: string) => void;
  onNotForMe?: (novelId: string) => void;
  community?: import("@/types/moonie").MoonieCommunityInsight | null;
  density?: MoonieCardDensity;
  mode?: MoonieCardMode;
}

function SourceBadge({
  recommendation,
  subtle,
}: {
  recommendation: MoonieRecommendation;
  subtle?: boolean;
}) {
  if (recommendation.sourceStatus === "verified") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-semibold ring-1",
          subtle
            ? "bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700 ring-emerald-200"
            : "bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700 ring-emerald-200"
        )}
      >
        <ShieldCheck className="size-3.5" aria-hidden />
        Verified source
      </span>
    );
  }
  if (recommendation.sourceStatus === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
        Awaiting verification
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
      No verified reading source yet
    </span>
  );
}

function RatingLine({ recommendation }: { recommendation: MoonieRecommendation }) {
  const parts: string[] = [];
  if (recommendation.averageRating != null) {
    parts.push(`★ ${recommendation.averageRating.toFixed(1)}`);
  }
  const count = recommendation.reviewCount ?? 0;
  parts.push(`${count} review${count === 1 ? "" : "s"}`);
  if (parts.length === 0) return null;
  return <p className="text-xs text-slate-500">{parts.join(" · ")}</p>;
}

function isCatalogueMatchReason(text: string): boolean {
  return /exact canonical|catalogue match|verified match|verified catalogue|strong title/i.test(
    text
  );
}

function readingSourceBadgeLabel(
  badge: NonNullable<MoonieRecommendation["readingSources"]>[number]["badge"]
): string {
  if (badge === "official") return "Official";
  if (badge === "verified") return "Verified";
  if (badge === "community") return "Community";
  return "Unverified";
}

export function MoonieLuxuryCard({
  recommendation,
  isLoggedIn,
  onMoreLikeThis,
  onNotForMe,
  community,
  density = "desk",
  mode = "recommendation",
}: MoonieLuxuryCardProps) {
  const [pending, startTransition] = useTransition();
  const resolvedCommunity = community ?? recommendation.community ?? null;
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [liked, setLiked] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  const isWidget = density === "widget";
  const isReadingLink = mode === "reading_link";
  const hasReadingSource =
    recommendation.sourceStatus === "verified" ||
    Boolean(recommendation.primaryReadUrl) ||
    (recommendation.readingSources?.length ?? 0) > 0;
  const reason = primaryReason(recommendation);
  const showUncertainConfidence =
    !isReadingLink &&
    recommendation.confidence === "low";
  const showMatchReason =
    !isReadingLink &&
    Boolean(reason) &&
    !(isWidget && isCatalogueMatchReason(reason));
  const showReadingSourceSection =
    hasReadingSource &&
    !isWidget &&
    (isReadingLink || recommendation.sourceStatus === "verified");
  const primaryReadingSource = recommendation.readingSources?.[0] ?? null;

  if (hidden) return null;

  const novelHref = `/novels/${recommendation.novelId}`;
  const coverWidth = isWidget ? "w-[72px]" : "w-[88px] sm:w-[104px]";
  const statusLabel = formatPublicationStatus(recommendation.publicationStatus);
  const metaLine = [
    statusLabel,
    recommendation.averageRating != null
      ? `★ ${recommendation.averageRating.toFixed(1)}`
      : null,
    `${recommendation.reviewCount ?? 0} review${
      (recommendation.reviewCount ?? 0) === 1 ? "" : "s"
    }`,
  ]
    .filter(Boolean)
    .join(" · ");

  function save() {
    setError(null);
    if (!recommendation.reviewId) return;
    startTransition(async () => {
      const result = await saveReviewToLibraryAction(recommendation.reviewId!);
      if (!result.success) {
        setError(result.error);
        return;
      }
      await recordRecommendationFeedbackAction({
        novelId: recommendation.novelId,
        kind: "SAVED",
      });
      setSaved(true);
      setLiveMessage(`${recommendation.title} saved to your library`);
    });
  }

  function goodMatch() {
    setError(null);
    startTransition(async () => {
      const result = await recordRecommendationFeedbackAction({
        novelId: recommendation.novelId,
        kind: "HELPFUL",
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setLiked(true);
      setLiveMessage(`${recommendation.title} marked as a good match`);
    });
  }

  function notForMe() {
    setError(null);
    startTransition(async () => {
      const result = await recordRecommendationFeedbackAction({
        novelId: recommendation.novelId,
        kind: "NOT_FOR_ME",
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setHidden(true);
      setLiveMessage(`${recommendation.title} hidden from future Moonie picks`);
      onNotForMe?.(recommendation.novelId);
    });
  }

  function moreLikeThis() {
    setError(null);
    startTransition(async () => {
      const result = await recordRecommendationFeedbackAction({
        novelId: recommendation.novelId,
        kind: "MORE_LIKE_THIS",
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      onMoreLikeThis?.(recommendation.novelId);
    });
  }

  function lessLikeThis() {
    setError(null);
    startTransition(async () => {
      const result = await recordRecommendationFeedbackAction({
        novelId: recommendation.novelId,
        kind: "LESS_LIKE_THIS",
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setActionsOpen(false);
      setLiveMessage(
        `Moonie will show fewer recommendations like ${recommendation.title}`
      );
    });
  }

  const menuActionClass =
    "h-8 w-full justify-start gap-2 rounded-lg px-2 text-[#4C2A67] hover:bg-violet-100/80";
  const savedActionClass =
    "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 opacity-100";
  const likedActionClass = "opacity-100";

  return (
    <article
      className={cn(
        "max-w-full min-w-0 w-full",
        isWidget ? "overflow-visible" : "overflow-hidden",
        isWidget
          ? "rounded-xl border border-violet-100/90 bg-gradient-to-b from-white to-[#FFFBFF] shadow-[0_8px_24px_-18px_rgba(36,22,48,0.28)]"
          : "rounded-2xl border border-violet-100 bg-white shadow-[0_12px_32px_-20px_rgba(36,22,48,0.35)]"
      )}
    >
      <div className={cn("flex min-w-0 gap-3", isWidget ? "p-3" : "p-3 sm:gap-4 sm:p-4")}>
        <Link
          href={novelHref}
          className={cn(
            "relative aspect-[2/3] shrink-0 overflow-hidden rounded-xl bg-violet-50 ring-1 ring-violet-100",
            coverWidth
          )}
          onClick={() =>
            isLoggedIn
              ? void recordRecommendationFeedbackAction({
                  novelId: recommendation.novelId,
                  kind: "CLICKED",
                })
              : undefined
          }
        >
          <CoverImage
            src={recommendation.coverUrl}
            alt=""
            title={recommendation.title}
            author={recommendation.author}
            genres={recommendation.genres}
            rating={recommendation.averageRating}
            reviewCount={recommendation.reviewCount}
            themeSeed={recommendation.novelId}
            sizes={isWidget ? "72px" : "104px"}
            compactFallback
            className="object-cover"
          />
        </Link>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={novelHref}
                className={cn(
                  "font-[family-name:var(--font-source-serif)] font-semibold leading-snug text-night-blue hover:text-primary",
                  isWidget ? "text-base" : "text-lg"
                )}
              >
                {recommendation.title}
              </Link>
              {recommendation.author ? (
                <p className="mt-0.5 text-sm text-slate-500">
                  by {recommendation.author}
                </p>
              ) : null}
              {recommendation.matchedAlias && !isWidget ? (
                <p className="mt-0.5 text-xs text-slate-500">
                  Also known as {recommendation.matchedAlias}
                </p>
              ) : null}
            </div>
            {showUncertainConfidence ? (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {confidenceLabel(recommendation.confidence)}
              </span>
            ) : null}
          </div>

          {isReadingLink || isWidget ? (
            metaLine ? (
              <p className="text-xs text-slate-500">{metaLine}</p>
            ) : null
          ) : (
            <>
              {statusLabel ? (
                <p className="text-xs text-slate-500">{statusLabel}</p>
              ) : null}
              <RatingLine recommendation={recommendation} />
            </>
          )}

          {!isReadingLink && showMatchReason ? (
            <p
              className={cn(
                "leading-relaxed text-slate-700",
                isWidget ? "line-clamp-2 text-xs" : "text-sm"
              )}
            >
              {reason}
            </p>
          ) : null}

          {isWidget && isReadingLink && hasReadingSource ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <SourceBadge recommendation={recommendation} subtle />
              {primaryReadingSource ? (
                <a
                  href={primaryReadingSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-violet-100 bg-white px-2.5 py-1 text-[11px] font-medium text-[#1A1224] hover:bg-violet-50"
                >
                  <span className="truncate">{primaryReadingSource.label}</span>
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {readingSourceBadgeLabel(primaryReadingSource.badge)}
                  </span>
                </a>
              ) : null}
            </div>
          ) : null}

          {!isWidget && !isReadingLink ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {recommendation.genres.slice(0, 3).map((label) => (
                <span
                  key={`genre-${label}`}
                  className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "min-w-0 space-y-3 border-t border-violet-50",
          isWidget ? "px-3 py-2.5" : "px-4 py-3"
        )}
      >
        {showReadingSourceSection ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Where to read
            </p>
            <div className="mt-2 space-y-2">
              <SourceBadge recommendation={recommendation} subtle />
              {(recommendation.readingSources ?? [])
                .slice(0, isWidget ? 2 : 3)
                .map((source) => (
                  <a
                    key={`${source.url}-${source.label}`}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full min-w-0 w-fit items-center gap-2 rounded-xl border border-violet-100 px-3 py-2 text-sm text-[#1A1224] hover:bg-violet-50"
                  >
                    <span className="min-w-0 truncate font-medium">{source.label}</span>
                    {!isWidget ? (
                      <span className="shrink-0 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                        {readingSourceBadgeLabel(source.badge)}
                      </span>
                    ) : null}
                  </a>
                ))}
            </div>
          </div>
        ) : null}

        {!isReadingLink && !isWidget && recommendation.drawback ? (
          <p className="text-xs leading-relaxed text-slate-500">
            Caveat: {recommendation.drawback}
          </p>
        ) : null}

        {!isWidget && !isReadingLink && resolvedCommunity ? (
          <MoonieCommunityBlock
            community={resolvedCommunity}
            novelId={recommendation.novelId}
            compact
          />
        ) : null}

        {isWidget ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-9 min-w-0 flex-1 rounded-xl font-bold"
                render={<Link href={novelHref} />}
              >
                View novel
              </Button>

              {(isReadingLink || recommendation.sourceStatus === "verified") &&
              recommendation.primaryReadUrl ? (
                <Button
                  size="icon-sm"
                  variant="outline"
                  className="size-9 shrink-0 rounded-xl border-violet-200"
                  aria-label={isReadingLink ? "Open reading link" : "Open source"}
                  render={
                    <a
                      href={recommendation.primaryReadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        isLoggedIn
                          ? void recordRecommendationFeedbackAction({
                              novelId: recommendation.novelId,
                              kind: "SOURCE_OPENED",
                            })
                          : undefined
                      }
                    />
                  }
                >
                  <ExternalLink className="size-4" aria-hidden />
                </Button>
              ) : null}

              {isLoggedIn && !isReadingLink ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  disabled={pending}
                  onClick={moreLikeThis}
                  className="size-9 shrink-0 rounded-xl border-violet-200"
                  aria-label="More like this"
                >
                  <Sparkles className="size-4" aria-hidden />
                </Button>
              ) : null}

              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="size-9 shrink-0 rounded-xl"
                aria-expanded={actionsOpen}
                aria-label="More actions"
                onClick={() => setActionsOpen((value) => !value)}
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </Button>
            </div>

            {actionsOpen && isLoggedIn ? (
              <div className="flex flex-col gap-1 rounded-xl bg-violet-50/70 p-2">
                {recommendation.reviewId ? (
                  <Button
                    type="button"
                    size="xs"
                    variant={saved ? "outline" : "ghost"}
                    disabled={pending}
                    aria-pressed={saved}
                    onClick={saved ? undefined : save}
                    className={cn(menuActionClass, saved && savedActionClass)}
                    title="Save this MoonVerse review to your Library folder"
                  >
                    {saved ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <BookmarkPlus className="size-3.5" aria-hidden />
                    )}
                    {saved ? "Saved to library" : "Save to library"}
                  </Button>
                ) : null}

                {!isReadingLink ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    disabled={pending}
                    onClick={lessLikeThis}
                    className={menuActionClass}
                    title="Show fewer recommendations with a similar vibe"
                  >
                    Less like this
                  </Button>
                ) : null}

                <Button
                  type="button"
                  size="xs"
                  variant={liked ? "default" : "ghost"}
                  disabled={pending}
                  aria-pressed={liked}
                  onClick={liked ? undefined : goodMatch}
                  className={cn(menuActionClass, liked && likedActionClass)}
                  title="Tell Moonie this was a helpful pick"
                >
                  <ThumbsUp className="size-3.5" aria-hidden />
                  {liked ? "Marked good match" : "Good match"}
                </Button>

                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => setShowReasons((value) => !value)}
                  className={menuActionClass}
                  title="Say why this recommendation missed"
                >
                  <ThumbsDown className="size-3.5" aria-hidden />
                  Not helpful
                </Button>

                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={pending}
                  onClick={notForMe}
                  className={menuActionClass}
                  title="Hide this title from future Moonie picks"
                >
                  Not for me
                </Button>

                {liveMessage ? (
                  <p className="px-2 py-1 text-xs font-medium text-emerald-800">
                    {liveMessage}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="h-10 rounded-xl font-bold"
            render={<Link href={novelHref} />}
          >
            View novel
          </Button>

          {(isReadingLink || recommendation.sourceStatus === "verified") &&
          recommendation.primaryReadUrl ? (
            <Button
              size="sm"
              variant="outline"
              className="h-10 rounded-xl border-violet-200"
              render={
                <a
                  href={recommendation.primaryReadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    isLoggedIn
                      ? void recordRecommendationFeedbackAction({
                          novelId: recommendation.novelId,
                          kind: "SOURCE_OPENED",
                        })
                      : undefined
                  }
                />
              }
            >
              {isReadingLink ? "Open link" : "Open source"}
              <ExternalLink className="size-3.5" aria-hidden />
            </Button>
          ) : null}

          {isLoggedIn ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={moreLikeThis}
              className="h-10 rounded-xl"
            >
              <Sparkles className="size-4" aria-hidden />
              More like this
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-10 rounded-xl"
            aria-expanded={actionsOpen}
            onClick={() => setActionsOpen((value) => !value)}
          >
            <MoreHorizontal className="size-4" aria-hidden />
            More
          </Button>
        </div>
        )}

        {!isWidget && actionsOpen ? (
          <div className="flex min-w-0 flex-wrap gap-2 border-t border-violet-50 pt-2">
            {isLoggedIn && recommendation.reviewId ? (
              <Button
                type="button"
                size="sm"
                variant={saved ? "outline" : "ghost"}
                disabled={pending}
                aria-pressed={saved}
                onClick={saved ? undefined : save}
                className={cn(
                  "h-9 rounded-xl text-[#4C2A67]",
                  saved && savedActionClass
                )}
                title="Save this MoonVerse review to your Library folder"
              >
                {saved ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <BookmarkPlus className="size-4" aria-hidden />
                )}
                {saved ? "Saved to library" : "Save to library"}
              </Button>
            ) : null}

            {isLoggedIn ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={moreLikeThis}
                className="h-9 rounded-xl"
              >
                <Sparkles className="size-4" aria-hidden />
                More like this
              </Button>
            ) : null}

            {isLoggedIn && !isReadingLink ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={lessLikeThis}
                className="h-9 rounded-xl text-[#4C2A67]"
                title="Show fewer recommendations with a similar vibe"
              >
                Less like this
              </Button>
            ) : null}

            {isLoggedIn ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant={liked ? "default" : "outline"}
                  disabled={pending}
                  aria-pressed={liked}
                  onClick={liked ? undefined : goodMatch}
                  className={cn("h-9 rounded-xl", liked && likedActionClass)}
                  title="Tell Moonie this was a helpful pick"
                >
                  <ThumbsUp className="size-4" aria-hidden />
                  {liked ? "Marked good match" : "Good match"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => setShowReasons((value) => !value)}
                  className="h-9 rounded-xl text-[#4C2A67]"
                  title="Say why this recommendation missed"
                >
                  <ThumbsDown className="size-4" aria-hidden />
                  Not helpful
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={notForMe}
                  className="h-9 rounded-xl text-[#4C2A67]"
                  title="Hide this title from future Moonie picks"
                >
                  Not for me
                </Button>
              </>
            ) : null}

            {liveMessage ? (
              <p className="w-full px-1 text-xs font-medium text-emerald-800">
                {liveMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        {showReasons && isLoggedIn ? (
          <div className="flex min-w-0 flex-wrap gap-2">
            {NEGATIVE_FEEDBACK_REASONS.map((reasonOption) => (
              <button
                key={reasonOption}
                type="button"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await recordRecommendationFeedbackAction({
                      novelId: recommendation.novelId,
                      kind: "NOT_HELPFUL",
                      note: reasonOption,
                    });
                    setShowReasons(false);
                    setLiveMessage("Thanks — Moonie will weigh that lightly.");
                  });
                }}
                className="rounded-full border border-violet-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-violet-50"
              >
                {reasonOption}
              </button>
            ))}
          </div>
        ) : null}

        <p className="sr-only" role="status" aria-live="polite">
          {liveMessage}
        </p>
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>
    </article>
  );
}
