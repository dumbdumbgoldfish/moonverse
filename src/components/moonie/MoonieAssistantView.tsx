"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookMarked,
  ChevronDown,
  History,
  Plus,
  Settings2,
} from "lucide-react";
import {
  MoonieAssistantTitle,
  MoonieDeskComposer,
  MoonieDeskEmpty,
  MoonieDiscoveryQuotaBadge,
  MoonieGuestDemoBadge,
  MoonieGuestGate,
  MOONIE_COMPOSER_TOOLBAR_BUTTON,
  MOONIE_COMPOSER_TOOLBAR_BUTTON_ACTIVE,
  MoonieGoldSeal,
  MoonieGreeting,
  MoonieNoMatch,
  MoonieRateLimit,
  MoonieChatError,
} from "@/components/moonie/MoonieDesk";
import { MoonieComposerTooltip } from "@/components/moonie/MoonieComposerTooltip";
import { MoonieLuxuryCard } from "@/components/moonie/MoonieLuxuryCard";
import { MoonieReviewResults } from "@/components/moonie/MoonieReviewResults";
import { MoonieReviewerResults } from "@/components/moonie/MoonieReviewerResults";
import { MoonieReviewerDetail } from "@/components/moonie/MoonieReviewerDetail";
import { MoonieReviewerGroupDetail } from "@/components/moonie/MoonieReviewerGroupDetail";
import { MoonieSeriesPanel } from "@/components/moonie/MoonieSeriesPanel";
import { MoonieLookupCandidates } from "@/components/moonie/MoonieLookupCandidates";
import { MoonieComparePanel } from "@/components/moonie/MoonieComparePanel";
import { MoonieConversationHistory } from "@/components/moonie/MoonieConversationHistory";
import { GuestMoonieChatHistory } from "@/components/moonie/GuestMoonieChatHistory";
import { MoonieResultDetails } from "@/components/moonie/MoonieResultDetails";
import { MoonieAssistantBubble } from "@/components/moonie/MoonieAssistantBubble";
import {
  MoonieMessageAvatar,
  moonieAvatarVariantForMessage,
} from "@/components/moonie/MoonieChatAvatar";
import { MoonieUserMessageBubble } from "@/components/moonie/MoonieUserMessageBubble";
import {
  MoonieThinkingBubble,
} from "@/components/moonie/MoonieThinkingBubble";
import { MoonieSpoilerToggle } from "@/components/moonie/MoonieSpoilerToggle";
import { MoonieTastePanel } from "@/components/moonie/MoonieTastePanel";
import { MoonieSessionPrefsStrip } from "@/components/moonie/MoonieSessionPrefsStrip";
import { MoonieRememberPreferencePrompt } from "@/components/moonie/MoonieRememberPreferencePrompt";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { MoonieQuickStartChips } from "@/components/moonie/MoonieQuickStartChips";
import { Button } from "@/components/ui/button";
import { useMoonieChat } from "@/hooks/use-moonie-chat";
import { useMoonieChatScroll } from "@/hooks/use-moonie-chat-scroll";
import { previousUserContent } from "@/lib/moonie/desk";
import {
  hasResultDiagnostics,
  moonieDisplayContent,
  resolveMoonieCardMode,
  resolveMoonieQuickPrompts,
  resolveMoonieReplyIntent,
} from "@/lib/moonie/presentation";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { readMoonieDeskConversationId } from "@/lib/moonie/conversation-url";
import { SPOILER_MODE_LABELS } from "@/lib/moonie/spoiler-mode";
import {
  MOONIE_CHAT_ATTACHMENT_INDENT,
  MOONIE_CHAT_CARD_STACK,
} from "@/components/moonie/moonie-chat-bubble-styles";
import { cn } from "@/lib/utils";

interface MoonieAssistantViewProps {
  isLoggedIn: boolean;
  displayName?: string;
  variant?: "page" | "panel";
  onClose?: () => void;
  initialPrompt?: string;
  initialConversationId?: string;
  /** Guest demo cap for `/ask-moonie` (logged-out users). */
  guestDemoCap?: number;
  /** Compact embedded layout for the guest Ask Moonie two-column page. */
  guestPageLayout?: boolean;
}

export function MoonieAssistantView({
  isLoggedIn,
  displayName,
  variant = "page",
  onClose,
  initialPrompt,
  initialConversationId,
  guestDemoCap,
  guestPageLayout = false,
}: MoonieAssistantViewProps) {
  const isGuestDemo = Boolean(guestDemoCap) && !isLoggedIn;
  const isGuestEmbed = isGuestDemo && guestPageLayout;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const novelMatch = pathname.match(/^\/novels\/([^/]+)/);
  const contextNovelId = novelMatch?.[1];
  const isPage = variant === "page";
  const urlConversationId = isPage
    ? readMoonieDeskConversationId(searchParams)
    : undefined;
  const routeConversationId = urlConversationId ?? initialConversationId;

  const {
    messages,
    input,
    setInput,
    isLoading,
    loadingPhase,
    handleSubmit,
    hideNovel,
    excludedNovelIds,
    quotaRemaining,
    spoilerMode,
    setSpoilerMode,
    rememberPreferenceOffer,
    dismissRememberPreferenceOffer,
    conversationId,
    resumeConversationFromSidebar,
    startNewConversation,
    isRestoring,
    guestTurnsRemaining,
    guestConversations,
    resumeGuestConversation,
    deleteGuestConversation,
    renameGuestConversation,
    clearGuestConversationHistory,
  } = useMoonieChat({
    isLoggedIn,
    contextNovelId,
    initialConversationId: routeConversationId,
    persistDeskConversation: isPage && isLoggedIn,
    guestDemoCap,
  });
  const [tasteOpen, setTasteOpen] = useState(false);
  const [completedOnly, setCompletedOnly] = useState(false);
  const [useTaste, setUseTaste] = useState(true);
  const autoSent = useRef<string | null>(null);
  const [, startTransition] = useTransition();
  const { scrollRef, registerMessageRef, showJumpToBottom, scrollToBottom } =
    useMoonieChatScroll(messages, isLoading, {
      conversationId: isPage ? conversationId : undefined,
      restoreScroll: isPage && Boolean(conversationId),
    });
  const firstName = displayName?.trim().split(/\s+/)[0];

  useEffect(() => {
    const prompt = initialPrompt?.trim();
    if (!prompt || autoSent.current === prompt) return;
    if (isRestoring) return;
    if (routeConversationId) return;
    if (!isLoggedIn && !isGuestDemo) return;
    autoSent.current = prompt;
    void handleSubmit(prompt, isGuestDemo ? {} : { useTaste });
  }, [
    handleSubmit,
    initialPrompt,
    isGuestDemo,
    isLoggedIn,
    isRestoring,
    routeConversationId,
    useTaste,
  ]);

  function handleStartNew() {
    startNewConversation();
  }

  function applySendModifiers(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return trimmed;
    if (
      completedOnly &&
      !trimmed.toLowerCase().includes("completed")
    ) {
      return `${trimmed} Completed only.`;
    }
    return trimmed;
  }

  function send(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || isLoading) return;
    if (!isLoggedIn && !isGuestDemo) return;
    if (isGuestDemo && (guestTurnsRemaining ?? 0) <= 0) return;
    void handleSubmit(applySendModifiers(trimmed), isGuestDemo ? {} : { useTaste });
  }

  function sendFromComposer(messageOverride?: string) {
    const text = messageOverride ?? input;
    if (isGuestDemo && (guestTurnsRemaining ?? 0) <= 0) return;
    void handleSubmit(applySendModifiers(text), isGuestDemo ? {} : { useTaste });
  }

  const guestTurnsExhausted =
    isGuestDemo && (guestTurnsRemaining ?? 0) <= 0;

  const empty = messages.length === 0 && !isLoading && !isRestoring;
  const guestCardCompact = isGuestEmbed && empty && !guestTurnsExhausted;
  const guestShowGateOnly = isGuestEmbed && guestTurnsExhausted && empty;

  return (
    <div
      className={cn(
        "relative overflow-hidden text-[#FFFBFF]",
        isGuestEmbed
          ? "flex h-full min-h-0 w-full flex-col"
          : isPage
            ? "flex h-full max-h-full min-h-0 flex-col overflow-hidden bg-[#1A1224]"
            : "min-h-[calc(100dvh-var(--mv-nav-h))] bg-[#1A1224]",
      )}
    >
      {!isGuestEmbed ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(110,70,199,0.28),_transparent_62%)]"
        />
      ) : null}

      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-col overflow-hidden",
          isGuestEmbed
            ? "flex h-full min-h-0 w-full flex-col"
            : isPage
              ? cn(SITE_SHELL_CLASS, "h-full min-h-0 flex-1 basis-0 py-4 lg:py-6")
              : "mx-auto w-full max-w-xl gap-5 px-3 py-4 sm:px-6",
          variant === "panel" && "max-w-xl",
        )}
      >
        <section
          className={cn(
            "flex min-h-0 flex-col",
            isGuestEmbed
              ? "flex h-full min-h-0 w-full flex-col"
              : isPage
                ? "h-full min-h-0 flex-1 basis-0"
                : "min-h-[72dvh] flex-1",
          )}
        >
          {isPage && isLoggedIn ? (
            <div className="mb-3 flex max-h-[40dvh] min-h-0 shrink-0 flex-col overflow-hidden lg:hidden">
              <MoonieConversationHistory
                activeConversationId={conversationId}
                onResume={resumeConversationFromSidebar}
                onStartNew={handleStartNew}
                className="min-h-0 flex-1"
              />
            </div>
          ) : null}

          <div
            className={cn(
              "flex min-h-0 overflow-hidden",
              isGuestEmbed ? "h-full w-full flex-1" : "min-w-0 flex-1 basis-0",
              isPage ? "gap-4" : "flex-col",
            )}
          >
            {isPage && isLoggedIn ? (
              <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden lg:flex xl:w-72">
                <MoonieConversationHistory
                  layout="sidebar"
                  activeConversationId={conversationId}
                  onResume={resumeConversationFromSidebar}
                  onStartNew={handleStartNew}
                />
              </aside>
            ) : null}

            <div
              className={cn(
                "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-[#C89B4A]/20 bg-[#FFFBFF] text-[#1A1224]",
                "shadow-[0_28px_70px_-36px_rgba(0,0,0,0.55)]",
                isGuestEmbed
                  ? "flex h-full max-h-full min-h-0 w-full flex-col"
                  : "flex-1 basis-0",
              )}
            >
            <div className="relative shrink-0 overflow-hidden border-b border-[#C89B4A]/20 bg-gradient-to-br from-[#3D2154] via-[#1A1224] to-[#2A1840] px-3 py-2.5 sm:px-4">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(155,111,214,0.22),_transparent_55%)]"
              />
              <div className="relative flex items-center gap-2 sm:gap-2.5">
                {variant === "panel" && onClose ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close Moonie"
                    className="size-8 shrink-0 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    ×
                  </Button>
                ) : null}
                <MoonieGoldSeal
                  size="xs"
                  context={isLoading ? "chatLoading" : "chatEmpty"}
                  variant={
                    isLoading || isRestoring
                      ? "thinking"
                      : empty
                        ? "waving"
                        : "happy"
                  }
                  priority
                  className="shrink-0 scale-[0.88]"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="min-w-0 truncate">
                    <MoonieAssistantTitle variant="night" />
                  </h2>
                </div>
                {isGuestDemo && guestTurnsRemaining != null && guestDemoCap ? (
                  <MoonieGuestDemoBadge
                    remaining={guestTurnsRemaining}
                    cap={guestDemoCap}
                    compact
                    variant="night"
                    className="shrink-0"
                  />
                ) : typeof quotaRemaining === "number" ? (
                  <MoonieDiscoveryQuotaBadge
                    remaining={quotaRemaining}
                    compact
                    variant="night"
                    className="shrink-0"
                  />
                ) : null}
                {isGuestDemo ? (
                  <GuestMoonieChatHistory
                    conversations={guestConversations}
                    activeConversationId={conversationId}
                    onResume={resumeGuestConversation}
                    onRename={renameGuestConversation}
                    onDelete={deleteGuestConversation}
                    onClearAll={clearGuestConversationHistory}
                  />
                ) : null}
                {isGuestDemo ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleStartNew}
                    className="h-8 shrink-0 rounded-full px-2.5 text-xs text-white/75 hover:bg-white/10 hover:text-white"
                  >
                    <Plus className="mr-1 size-3.5" aria-hidden />
                    New chat
                  </Button>
                ) : null}
                {isLoggedIn ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Taste preferences"
                  onClick={() => setTasteOpen(true)}
                  className="size-8 shrink-0 rounded-full text-white/70 hover:bg-white/10 hover:text-white sm:flex"
                >
                  <Settings2 className="size-4" />
                </Button>
                ) : null}
              </div>
            </div>
            {guestShowGateOnly ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-3 py-4 sm:px-5">
                <MoonieGuestGate remaining={0} className="w-full" />
              </div>
            ) : (
              <>
            <div
              ref={scrollRef}
              className={cn(
                "relative min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4 sm:px-5",
                "flex-1 basis-0",
                guestCardCompact && "flex flex-col justify-center",
              )}
            >
              <div className="min-w-0 space-y-4">
              <div
                className={cn(
                  "flex w-full flex-col items-center text-center",
                  empty ? "pt-1" : "pb-1"
                )}
              >
                {empty && !guestTurnsExhausted ? (
                  <p className="mb-4">
                    <MoonieGreeting
                      firstName={firstName}
                      className="text-2xl sm:text-3xl"
                    />
                  </p>
                ) : null}
                {empty && !guestTurnsExhausted ? (
                  <MoonieDeskEmpty
                    disabled={isLoading || guestTurnsExhausted}
                    onSelect={send}
                    showConstraint={false}
                    centered
                  />
                ) : null}
              </div>

              {messages.map((message, index) => {
                const userQuery = previousUserContent(messages, index);
                const cardMode = resolveMoonieCardMode(message, userQuery);
                const replyIntent = resolveMoonieReplyIntent(message, userQuery);
                const showDiagnostics =
                  message.role === "assistant" &&
                  !message.isError &&
                  replyIntent === "recommend" &&
                  cardMode !== "reviews" &&
                  cardMode !== "reviewers" &&
                  cardMode !== "reviewer_detail" &&
                  cardMode !== "reviewer_group_detail" &&
                  cardMode !== "series" &&
                  hasResultDiagnostics(message, {
                    hiddenCount: excludedNovelIds.length,
                  });

                const showLookupCandidates =
                  Boolean(message.lookupSession?.candidates.length) &&
                  (message.recommendations?.length ?? 0) === 0;
                const showCompare = (message.compare?.rows.length ?? 0) > 0;
                const showRecommendations =
                  (message.recommendations?.length ?? 0) > 0 &&
                  message.responseKind !== "chat" &&
                  cardMode !== "reviews" &&
                  cardMode !== "reviewers" &&
                  cardMode !== "reviewer_detail" &&
                  cardMode !== "reviewer_group_detail" &&
                  cardMode !== "series";
                const quickPrompts = resolveMoonieQuickPrompts(message);
                const showQuickPrompts =
                  quickPrompts.length > 0 && !message.isError;
                const showFollowUpQuestion =
                  Boolean(message.followUpQuestion && !message.isError) &&
                  quickPrompts.length === 0;
                const showAttachments =
                  showLookupCandidates ||
                  showCompare ||
                  (cardMode === "reviews" && Boolean(message.novelOverview)) ||
                  (cardMode === "reviewers" &&
                    Boolean(message.reviewerResults?.length)) ||
                  (cardMode === "reviewer_detail" &&
                    Boolean(message.reviewerOverview)) ||
                  (cardMode === "reviewer_group_detail" &&
                    Boolean(message.reviewerGroupOverview)) ||
                  (cardMode === "series" && Boolean(message.seriesInfo)) ||
                  showRecommendations ||
                  showDiagnostics ||
                  showFollowUpQuestion ||
                  showQuickPrompts ||
                  (message.state === "no_results" && !message.isError);

                const followUpConsumed =
                  Boolean(message.followUpQuestion) &&
                  messages
                    .slice(index + 1)
                    .some(
                      (later) =>
                        later.role === "user" &&
                        later.content.trim() === message.followUpQuestion?.trim()
                    );

                return (
                <div
                  key={message.id}
                  ref={(node) => registerMessageRef(message.id, node)}
                  className="min-w-0 max-w-full space-y-3"
                >
                  <div
                    className={cn(
                      "flex w-full min-w-0 gap-2",
                      message.role === "user"
                        ? "items-start justify-end"
                        : "items-end justify-start"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <MoonieMessageAvatar
                        variant={moonieAvatarVariantForMessage(message)}
                      />
                    ) : null}
                    {message.isError ? (
                      <div className="min-w-0 flex-1">
                        {message.state === "rate_limit" ? (
                          <MoonieRateLimit quotaRemaining={quotaRemaining} />
                        ) : (
                          <MoonieChatError message={message.content} />
                        )}
                      </div>
                    ) : message.role === "assistant" ? (
                      <MoonieAssistantBubble
                        text={moonieDisplayContent(message, userQuery)}
                      />
                    ) : (
                      <MoonieUserMessageBubble message={message} />
                    )}
                  </div>

                  {showAttachments ? (
                  <div
                    className={cn(
                      message.role === "assistant" && MOONIE_CHAT_ATTACHMENT_INDENT
                    )}
                  >
                  {showCompare ? (
                    <MoonieComparePanel
                      rows={message.compare!.rows}
                      conclusion={message.compare!.conclusion}
                    />
                  ) : null}

                  {showLookupCandidates ? (
                    <MoonieLookupCandidates
                      candidates={message.lookupSession!.candidates}
                      isLoggedIn={isLoggedIn}
                      onSelect={(prompt) => send(prompt)}
                      density="desk"
                    />
                  ) : null}

                  {cardMode === "reviews" && message.novelOverview ? (
                    <MoonieReviewResults
                      overview={message.novelOverview}
                      density="desk"
                    />
                  ) : null}

                  {cardMode === "reviewers" && message.reviewerResults?.length ? (
                    <MoonieReviewerResults
                      reviewers={message.reviewerResults}
                      density="desk"
                      isLoggedIn={isLoggedIn}
                    />
                  ) : null}

                  {cardMode === "reviewer_detail" && message.reviewerOverview ? (
                    <MoonieReviewerDetail
                      overview={message.reviewerOverview}
                      density="desk"
                      isLoggedIn={isLoggedIn}
                    />
                  ) : null}

                  {cardMode === "reviewer_group_detail" && message.reviewerGroupOverview ? (
                    <MoonieReviewerGroupDetail
                      overview={message.reviewerGroupOverview}
                      density="desk"
                      isLoggedIn={isLoggedIn}
                    />
                  ) : null}

                  {cardMode === "series" && message.seriesInfo ? (
                    <MoonieSeriesPanel series={message.seriesInfo} density="desk" />
                  ) : null}

                  {showRecommendations ? (
                    <div className={MOONIE_CHAT_CARD_STACK}>
                      {message.recommendations!.map((rec) => (
                        <MoonieLuxuryCard
                          key={`${message.id}-${rec.novelId}`}
                          recommendation={rec}
                          community={message.novelOverview?.community}
                          isLoggedIn={isLoggedIn}
                          onNotForMe={hideNovel}
                          density="widget"
                          mode={cardMode}
                          onMoreLikeThis={(novelId) => {
                            startTransition(() => {
                              void handleSubmit(
                                "More like this novel, refined to my taste.",
                                { similarToNovelId: novelId, useTaste }
                              );
                            });
                          }}
                        />
                      ))}
                    </div>
                  ) : null}

                  {showDiagnostics ? (
                    <MoonieResultDetails
                      message={message}
                      userQuery={userQuery}
                      hiddenCount={excludedNovelIds.length}
                      density="desk"
                    />
                  ) : null}

                  {showQuickPrompts ? (
                    <MoonieQuickStartChips
                      prompts={quickPrompts}
                      onSelect={send}
                      disabled={guestTurnsExhausted}
                    />
                  ) : null}

                  {message.followUpQuestion && !message.isError && !followUpConsumed && showFollowUpQuestion ? (
                    <CatalogLink
                      onClick={() => send(message.followUpQuestion!)}
                      size="compact"
                    >
                      {message.followUpQuestion}
                    </CatalogLink>
                  ) : null}

                  {message.state === "no_results" && !message.isError ? (
                    <MoonieNoMatch
                      onBroaden={() =>
                        send("Same request, but drop the strictest constraint.")
                      }
                    />
                  ) : null}
                  </div>
                  ) : null}
                </div>
              );
              })}

              {isLoading ? (
                <MoonieThinkingBubble phase={loadingPhase} />
              ) : null}
              </div>
              {showJumpToBottom ? (
                <button
                  type="button"
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#4C2A67] shadow-md transition hover:bg-violet-50"
                >
                  <ChevronDown className="size-3.5" aria-hidden />
                  New message
                </button>
              ) : null}
            </div>

            <footer className="relative z-10 min-w-0 shrink-0 overflow-hidden rounded-b-[28px] border-t border-violet-100 bg-[#FFFBFF] px-3 py-2 max-lg:pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] sm:px-4">
              {rememberPreferenceOffer && isLoggedIn ? (
                <div className="mb-2">
                  <MoonieRememberPreferencePrompt
                    offer={rememberPreferenceOffer}
                    onDismiss={dismissRememberPreferenceOffer}
                  />
                </div>
              ) : null}
              {guestTurnsExhausted ? (
                <MoonieGuestGate remaining={0} />
              ) : (
                <>
                  <MoonieDeskComposer
                    id="moonie-composer"
                    value={input}
                    onChange={setInput}
                    onSubmit={sendFromComposer}
                    disabled={isLoading || guestTurnsExhausted}
                    sendDisabled={!input.trim()}
                    placeholder="Ask Moonie"
                    leading={
                      isLoggedIn ? (
                        <>
                          <FilterChip
                            active={useTaste}
                            onClick={() => setUseTaste((value) => !value)}
                            icon={BookMarked}
                            label="Use my taste profile for recommendations"
                            tipId="moonie-composer-taste"
                            tipLabel="My taste"
                            tipAlign="start"
                            tipHint={
                              useTaste
                                ? "On · uses your saved profile"
                                : "Off · generic picks this turn"
                            }
                            iconOnly
                          />
                          <FilterChip
                            active={completedOnly}
                            onClick={() => setCompletedOnly((value) => !value)}
                            icon={History}
                            label="Only recommend completed novels"
                            tipId="moonie-composer-completed"
                            tipLabel="Completed only"
                            tipAlign="center"
                            tipHint={
                              completedOnly
                                ? "On · finished novels only"
                                : "Off · any completion status"
                            }
                            iconOnly
                          />
                          <MoonieComposerTooltip
                            id="moonie-composer-spoiler"
                            label="Spoiler shield"
                            align="center"
                            hint={`${SPOILER_MODE_LABELS[spoilerMode]} · tap to cycle`}
                          >
                            <MoonieSpoilerToggle
                              mode={spoilerMode}
                              onChange={setSpoilerMode}
                              iconOnly
                            />
                          </MoonieComposerTooltip>
                        </>
                      ) : undefined
                    }
                  />
                  {isLoggedIn ? (
                    <MoonieSessionPrefsStrip className="mt-1.5" />
                  ) : null}
                </>
              )}
            </footer>
              </>
            )}
            </div>
          </div>
        </section>
      </div>

      {tasteOpen && isLoggedIn ? (
        <MoonieTastePanel open={tasteOpen} onOpenChange={setTasteOpen} />
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  icon: Icon,
  label,
  tipLabel,
  tipHint,
  tipId,
  tipAlign = "center",
  iconOnly = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof BookMarked;
  label: string;
  tipLabel?: string;
  tipHint?: string;
  tipId?: string;
  tipAlign?: "start" | "center" | "end";
  iconOnly?: boolean;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={tipLabel ?? label}
      className={cn(
        MOONIE_COMPOSER_TOOLBAR_BUTTON,
        iconOnly ? "size-10" : "h-7 gap-1 px-2.5 text-[11px] font-semibold",
        active && MOONIE_COMPOSER_TOOLBAR_BUTTON_ACTIVE
      )}
    >
      <Icon className={cn("shrink-0", iconOnly ? "size-4" : "size-3")} aria-hidden />
      {iconOnly ? null : label}
    </button>
  );

  if (iconOnly && tipLabel) {
    return (
      <MoonieComposerTooltip
        id={tipId}
        label={tipLabel}
        hint={tipHint}
        align={tipAlign}
      >
        {button}
      </MoonieComposerTooltip>
    );
  }

  return button;
}
