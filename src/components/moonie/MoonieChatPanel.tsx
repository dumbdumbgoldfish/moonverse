"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  MoonieDeskComposer,
  MoonieDeskHeader,
} from "@/components/moonie/MoonieDesk";
import { MoonieMessageList } from "@/components/moonie/MoonieMessageList";
import { useMoonieChatHeaderState } from "@/components/moonie/MoonieChatAvatar";
import { useMoonieChatScroll } from "@/hooks/use-moonie-chat-scroll";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { buildMoonieDeskHref } from "@/lib/moonie/conversation-url";
import { moonieLoggedInEntryHref } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";
import type { MoonieChatMessage } from "@/types/moonie";

interface MoonieChatPanelProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  messages: MoonieChatMessage[];
  isLoading: boolean;
  loadingPhase?: import("@/types/moonie").MoonieLoadingPhase;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (
    message: string,
    options?: { confirmLookupNovelId?: string }
  ) => void;
  onNotForMe?: (novelId: string) => void;
  onMoreLikeThis?: (novelId: string) => void;
  loginCallbackUrl?: string;
  quotaRemaining?: number | null;
  conversationId?: string;
}

export function MoonieChatPanel({
  open,
  onClose,
  isLoggedIn,
  messages,
  isLoading,
  loadingPhase,
  input,
  onInputChange,
  onSubmit,
  onNotForMe,
  onMoreLikeThis,
  loginCallbackUrl = "/",
  quotaRemaining,
  conversationId,
}: MoonieChatPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });
  const { hasError, hasRecommendations, isRateLimited, status } =
    useMoonieChatHeaderState(messages, isLoading, false);
  const {
    scrollRef,
    contentRef,
    registerMessageRef,
    showJumpToBottom,
    scrollToBottom,
  } =
    useMoonieChatScroll(messages, isLoading);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      scrollToBottom("auto");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, scrollToBottom]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const frame = window.requestAnimationFrame(() => {
      const composer = document.getElementById(
        "moonie-input"
      ) as HTMLTextAreaElement | null;
      composer?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const widgetWelcomeOnly = messages.length === 0 && !isLoading;

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Moonie catalogue desk"
      aria-modal="false"
      aria-busy={isLoading}
      tabIndex={-1}
      className="fixed z-50 flex flex-col overflow-hidden border border-[#C89B4A]/25 bg-[#1A1224] shadow-2xl max-md:inset-x-3 max-md:bottom-[calc(var(--mv-mobile-nav-h)+0.75rem+env(safe-area-inset-bottom,0px))] max-md:max-h-[min(76vh,calc(100dvh-var(--mv-mobile-nav-h)-5rem))] max-md:w-[calc(100%-1.5rem)] max-md:rounded-2xl md:bottom-6 md:right-6 md:h-[min(600px,calc(100vh-5rem))] md:w-[min(400px,calc(100vw-2rem))] md:rounded-3xl"
    >
      <MoonieDeskHeader
        title="Moonie AI Assistant"
        status={status}
        sealSize="xs"
        context={isLoading ? "chatLoading" : "chatEmpty"}
        variant={
          hasError
            ? "confused"
            : isRateLimited
              ? "waving"
              : isLoading
                ? "thinking"
                : hasRecommendations
                  ? "happy"
                  : "waving"
        }
        widget
        onClose={onClose}
      />

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="flex h-full min-h-0 flex-col overflow-y-auto bg-[#FFFBFF] text-[#1A1224]"
        >
          <div
            ref={contentRef}
            className={cn(
              "min-h-0 w-full shrink-0",
              !widgetWelcomeOnly && "mt-auto"
            )}
          >
            <MoonieMessageList
              messages={messages}
              isLoading={isLoading}
              loadingPhase={loadingPhase}
              isLoggedIn={isLoggedIn}
              onNotForMe={onNotForMe}
              onMoreLikeThis={onMoreLikeThis}
              onSelectPrompt={(prompt, novelId) =>
                onSubmit(prompt, novelId ? { confirmLookupNovelId: novelId } : undefined)
              }
              widgetEmpty
              quotaRemaining={quotaRemaining}
              registerMessageRef={registerMessageRef}
            />
          </div>
        </div>
        {showJumpToBottom ? (
          <button
            type="button"
            aria-label="Scroll to latest message"
            onClick={() => scrollToBottom()}
            className="absolute bottom-3 left-1/2 z-10 flex size-11 -translate-x-1/2 items-center justify-center rounded-full border border-violet-200 bg-white text-[#4C2A67] shadow-md transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
          >
            <ChevronDown className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-violet-100 bg-[#FFFBFF] px-2.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        {isLoggedIn ? (
          <>
            <MoonieDeskComposer
              id="moonie-input"
              variant="widget"
              value={input}
              onChange={onInputChange}
              onSubmit={(messageOverride) => {
                const trimmed = (messageOverride ?? input).trim();
                if (!trimmed || isLoading) {
                  return;
                }
                onSubmit(trimmed);
              }}
              sendDisabled={!input.trim() || isLoading}
              placeholder="Ask Moonie"
            />
            <div className="mt-1.5 flex justify-center">
              <Link
                href={
                  conversationId
                    ? buildMoonieDeskHref({ conversationId })
                    : moonieLoggedInEntryHref()
                }
                className="text-[11px] font-medium text-[#6E46C7]/70 underline-offset-2 transition hover:text-[#4C2A67] hover:underline"
              >
                Open full desk
              </Link>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <CatalogLink href="/ask-moonie" size="compact" className="w-full">
              Try 3 free turns
            </CatalogLink>
            <CatalogLink
              href={`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`}
              size="compact"
              className="w-full"
            >
              Log in for a personal desk
            </CatalogLink>
          </div>
        )}
      </div>
    </div>
  );
}
