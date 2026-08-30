"use client";

import {
  MoonieMessageAvatar,
  moonieAvatarVariantForMessage,
} from "@/components/moonie/MoonieChatAvatar";
import {
  MoonieDeskEmpty,
  MoonieNoMatch,
  MoonieRateLimit,
  MoonieChatError,
} from "@/components/moonie/MoonieDesk";
import { MoonieWidgetEmptyState } from "@/components/moonie/MoonieWidgetEmptyState";
import { MoonieLuxuryCard } from "@/components/moonie/MoonieLuxuryCard";
import { MoonieReviewResults } from "@/components/moonie/MoonieReviewResults";
import { MoonieReviewerResults } from "@/components/moonie/MoonieReviewerResults";
import { MoonieReviewerDetail } from "@/components/moonie/MoonieReviewerDetail";
import { MoonieReviewerGroupDetail } from "@/components/moonie/MoonieReviewerGroupDetail";
import { MoonieSeriesPanel } from "@/components/moonie/MoonieSeriesPanel";
import { MoonieLookupCandidates } from "@/components/moonie/MoonieLookupCandidates";
import { MoonieAssistantBubble } from "@/components/moonie/MoonieAssistantBubble";
import { MoonieUserMessageBubble } from "@/components/moonie/MoonieUserMessageBubble";
import { MoonieComparePanel } from "@/components/moonie/MoonieComparePanel";
import { MoonieCompareWidgetSummary } from "@/components/moonie/MoonieCompareWidgetSummary";
import { MoonieResultDetails } from "@/components/moonie/MoonieResultDetails";
import {
  MoonieThinkingBubble,
} from "@/components/moonie/MoonieThinkingBubble";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { MoonieQuickStartChips } from "@/components/moonie/MoonieQuickStartChips";
import { previousUserContent } from "@/lib/moonie/desk";
import {
  moonieDisplayContent,
  resolveMoonieCardMode,
  resolveMoonieReplyIntent,
  hasResultDiagnostics,
} from "@/lib/moonie/presentation";
import {
  MOONIE_CHAT_ATTACHMENT_INDENT,
  MOONIE_CHAT_CARD_STACK,
} from "@/components/moonie/moonie-chat-bubble-styles";
import { cn } from "@/lib/utils";
import type { MoonieChatMessage, MoonieLoadingPhase } from "@/types/moonie";

interface MoonieMessageListProps {
  messages: MoonieChatMessage[];
  isLoading: boolean;
  loadingPhase?: MoonieLoadingPhase;
  isLoggedIn?: boolean;
  onNotForMe?: (novelId: string) => void;
  onMoreLikeThis?: (novelId: string) => void;
  onSelectPrompt?: (prompt: string) => void;
  widgetEmpty?: boolean;
  quotaRemaining?: number | null;
  registerMessageRef?: (messageId: string, node: HTMLElement | null) => void;
}

export function MoonieMessageList({
  messages,
  isLoading,
  loadingPhase = "thinking",
  isLoggedIn = false,
  onNotForMe,
  onMoreLikeThis,
  onSelectPrompt,
  widgetEmpty,
  quotaRemaining,
  registerMessageRef,
}: MoonieMessageListProps) {
  const density = widgetEmpty ? "widget" : "desk";
  const hasMessages = messages.length > 0 || isLoading;
  const widgetPromptProps = {
    disabled: !isLoggedIn || isLoading,
    onSelect: isLoggedIn ? onSelectPrompt : undefined,
    hrefForPrompt: isLoggedIn
      ? undefined
      : (prompt: string) => `/ask-moonie?prompt=${encodeURIComponent(prompt)}`,
  } as const;

  if (!widgetEmpty && messages.length === 0 && !isLoading) {
    return (
      <div className="px-4 py-5">
        <MoonieDeskEmpty
          compact
          disabled={widgetPromptProps.disabled}
          onSelect={widgetPromptProps.onSelect}
          hrefForPrompt={widgetPromptProps.hrefForPrompt}
        />
      </div>
    );
  }

  if (widgetEmpty && !hasMessages) {
    return <MoonieWidgetEmptyState {...widgetPromptProps} />;
  }

  return (
    <div className={cn(widgetEmpty ? "overflow-x-hidden px-3 py-3" : "overflow-x-hidden px-4 py-4")}>
      {hasMessages ? (
      <ul
        className={cn(widgetEmpty ? "space-y-3" : "space-y-4")}
        aria-live="polite"
        aria-relevant="additions"
      >
      {messages.map((message, index) => {
        const userQuery = previousUserContent(messages, index);
        const cardMode = resolveMoonieCardMode(message, userQuery);
        const replyIntent = resolveMoonieReplyIntent(message, userQuery);
        const showDiagnostics =
          !widgetEmpty &&
          message.role === "assistant" &&
          !message.isError &&
          replyIntent === "recommend" &&
          cardMode !== "reviews" &&
          cardMode !== "reviewers" &&
          cardMode !== "reviewer_detail" &&
          cardMode !== "reviewer_group_detail" &&
          cardMode !== "series" &&
          hasResultDiagnostics(message);
        const showCommunityInMessage =
          !widgetEmpty &&
          Boolean(message.novelOverview?.community?.consensus) &&
          cardMode !== "reading_link" &&
          cardMode !== "reviews" &&
          cardMode !== "reviewers" &&
          cardMode !== "reviewer_detail" &&
          cardMode !== "reviewer_group_detail" &&
          cardMode !== "series" &&
          !(
            (message.recommendations?.length ?? 0) > 0 &&
            message.responseKind !== "chat"
          );

        const showLookupCandidates =
          Boolean(message.lookupSession?.candidates.length) &&
          (message.recommendations?.length ?? 0) === 0;
        const showCompare = (message.compare?.rows.length ?? 0) > 0;
        const showRecommendations =
          (message.recommendations?.length ?? 0) > 0 &&
          message.responseKind !== "chat";
        const showAttachments =
          showLookupCandidates ||
          showCompare ||
          (cardMode === "reviews" && Boolean(message.novelOverview)) ||
          (cardMode === "reviewers" && Boolean(message.reviewerResults?.length)) ||
          (cardMode === "reviewer_detail" && Boolean(message.reviewerOverview)) ||
          (cardMode === "reviewer_group_detail" &&
            Boolean(message.reviewerGroupOverview)) ||
          (cardMode === "series" && Boolean(message.seriesInfo)) ||
          (showRecommendations &&
            (message.responseKind === "compare" ? !widgetEmpty : true) &&
            cardMode !== "reviews" &&
            cardMode !== "reviewers" &&
            cardMode !== "reviewer_detail" &&
            cardMode !== "reviewer_group_detail" &&
            cardMode !== "series") ||
          showDiagnostics ||
          Boolean(message.followUpQuestion && onSelectPrompt) ||
          Boolean(message.quickPrompts?.length && onSelectPrompt) ||
          showCommunityInMessage ||
          message.state === "no_results";

        return (
        <li
          key={message.id}
          ref={(node) => registerMessageRef?.(message.id, node)}
          className={cn(widgetEmpty ? "min-w-0 max-w-full space-y-2" : "min-w-0 max-w-full space-y-3")}
        >
          <div
            className={cn(
              "flex w-full min-w-0 gap-2",
              message.role === "user"
                ? "items-start justify-end"
                : "items-end justify-start"
            )}
          >
            {message.role === "assistant" && (
              <MoonieMessageAvatar
                variant={moonieAvatarVariantForMessage(message)}
              />
            )}

            {message.isError ? (
              <div className="min-w-0 flex-1">
                {message.state === "rate_limit" ? (
                  <MoonieRateLimit
                    compact={widgetEmpty}
                    quotaRemaining={quotaRemaining}
                  />
                ) : (
                  <MoonieChatError message={message.content} />
                )}
              </div>
            ) : message.role === "assistant" ? (
              <MoonieAssistantBubble
                text={moonieDisplayContent(message, userQuery)}
                compact={widgetEmpty}
              />
            ) : (
              <MoonieUserMessageBubble message={message} compact={widgetEmpty} />
            )}
          </div>

          {showAttachments ? (
          <div
            className={cn(
              "flex min-w-0 flex-col gap-3",
              message.role === "assistant" && MOONIE_CHAT_ATTACHMENT_INDENT
            )}
          >
            {showLookupCandidates ? (
              <MoonieLookupCandidates
                candidates={message.lookupSession!.candidates}
                isLoggedIn={isLoggedIn}
                onSelect={onSelectPrompt}
                density={density}
              />
            ) : null}

            {showCompare ? (
              widgetEmpty ? (
                <MoonieCompareWidgetSummary rows={message.compare!.rows} />
              ) : (
                <MoonieComparePanel
                  rows={message.compare!.rows}
                  conclusion={message.compare!.conclusion}
                />
              )
            ) : null}

            {cardMode === "reviews" && message.novelOverview ? (
              <MoonieReviewResults
                overview={message.novelOverview}
                density={density}
              />
            ) : null}

            {cardMode === "reviewers" && message.reviewerResults?.length ? (
              <MoonieReviewerResults
                reviewers={message.reviewerResults}
                density={density}
                isLoggedIn={isLoggedIn}
              />
            ) : null}

            {cardMode === "reviewer_detail" && message.reviewerOverview ? (
              <MoonieReviewerDetail
                overview={message.reviewerOverview}
                density={density}
                isLoggedIn={isLoggedIn}
              />
            ) : null}

            {cardMode === "reviewer_group_detail" && message.reviewerGroupOverview ? (
              <MoonieReviewerGroupDetail
                overview={message.reviewerGroupOverview}
                density={density}
                isLoggedIn={isLoggedIn}
              />
            ) : null}

            {cardMode === "series" && message.seriesInfo ? (
              <MoonieSeriesPanel series={message.seriesInfo} density={density} />
            ) : null}

            {message.recommendations &&
              message.recommendations.length > 0 &&
              message.responseKind === "compare" &&
              !widgetEmpty && (
                <div className={MOONIE_CHAT_CARD_STACK}>
                  {message.recommendations.map((rec) => (
                    <MoonieLuxuryCard
                      key={`${message.id}-${rec.novelId}`}
                      recommendation={{
                        ...rec,
                        sourceStatus: rec.sourceStatus ?? "none",
                      }}
                      isLoggedIn={isLoggedIn}
                      onNotForMe={onNotForMe}
                      onMoreLikeThis={onMoreLikeThis}
                      density={density}
                      mode="recommendation"
                    />
                  ))}
                </div>
              )}

            {message.recommendations &&
              message.recommendations.length > 0 &&
              message.responseKind !== "chat" &&
              message.responseKind !== "compare" &&
              cardMode !== "reviews" &&
              cardMode !== "reviewers" &&
          cardMode !== "reviewer_detail" &&
          cardMode !== "reviewer_group_detail" &&
          cardMode !== "series" && (
              <div className={MOONIE_CHAT_CARD_STACK}>
                {message.recommendations.slice(0, 2).map((rec) => (
                  <MoonieLuxuryCard
                    key={`${message.id}-${rec.novelId}`}
                    recommendation={{
                      ...rec,
                      sourceStatus: rec.sourceStatus ?? "none",
                    }}
                    community={message.novelOverview?.community}
                    isLoggedIn={isLoggedIn}
                    onNotForMe={onNotForMe}
                    onMoreLikeThis={onMoreLikeThis}
                    density={density}
                    mode={cardMode}
                  />
                ))}
                {message.recommendations.length > 2 ? (
                  <CatalogLink href="/moonie" size="compact">
                    Open full desk
                  </CatalogLink>
                ) : null}
              </div>
            )}

            {showDiagnostics ? (
              <MoonieResultDetails
                message={message}
                userQuery={userQuery}
                density="desk"
              />
            ) : null}

            {message.quickPrompts?.length && onSelectPrompt ? (
              <MoonieQuickStartChips
                prompts={message.quickPrompts}
                onSelect={onSelectPrompt}
              />
            ) : null}

            {message.followUpQuestion && onSelectPrompt ? (
              <CatalogLink
                onClick={() => onSelectPrompt(message.followUpQuestion!)}
                size="compact"
                className="!h-auto min-h-9 w-full min-w-0 max-w-full !whitespace-normal break-words !leading-snug"
              >
                {message.followUpQuestion}
              </CatalogLink>
            ) : null}

            {showCommunityInMessage ? (
              <p className="text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-[#4C2A67]">Readers say: </span>
                {message.novelOverview!.community!.consensus}
              </p>
            ) : null}

            {message.state === "no_results" ? <MoonieNoMatch /> : null}
          </div>
          ) : null}
        </li>
      );
      })}

      {isLoading ? (
        <li>
          <MoonieThinkingBubble phase={loadingPhase} />
        </li>
      ) : null}
      </ul>
      ) : null}
    </div>
  );
}
