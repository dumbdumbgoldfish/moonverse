"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  readMoonieDeskScrollTop,
  writeMoonieDeskScrollTop,
} from "@/lib/moonie/conversation-url";

const NEAR_BOTTOM_THRESHOLD_PX = 80;
const SCROLL_SAVE_DEBOUNCE_MS = 120;

interface MoonieScrollMessage {
  id: string;
  role: string;
}

interface UseMoonieChatScrollOptions {
  conversationId?: string;
  restoreScroll?: boolean;
}

export function resolveMoonieFollowState(options: {
  wasFollowing: boolean;
  isNearBottom: boolean;
  hasUserScrollIntent: boolean;
}): boolean {
  if (options.isNearBottom) return true;
  if (options.hasUserScrollIntent) return false;
  return options.wasFollowing;
}

export function resolveMoonieRestoreScrollTop(options: {
  messageCount: number;
  savedScrollTop: number | null;
  scrollHeight: number;
  clientHeight: number;
}): number | null {
  if (options.messageCount === 0) return null;
  const maxScrollTop = Math.max(
    0,
    options.scrollHeight - options.clientHeight
  );
  return options.savedScrollTop == null
    ? maxScrollTop
    : Math.min(Math.max(0, options.savedScrollTop), maxScrollTop);
}

export function shouldDeferMoonieFollow(options: {
  restoreScroll: boolean;
  conversationId?: string;
  restoredConversationId: string | null;
  isFollowing: boolean;
}): boolean {
  return Boolean(
    options.restoreScroll &&
      options.conversationId &&
      options.restoredConversationId !== options.conversationId &&
      !options.isFollowing
  );
}

export function useMoonieChatScroll(
  messages: MoonieScrollMessage[],
  isLoading: boolean,
  options: UseMoonieChatScrollOptions = {}
) {
  const { conversationId, restoreScroll = false } = options;
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef(new Map<string, HTMLElement>());
  const stickToBottomRef = useRef(true);
  const [jumpState, setJumpState] = useState<{
    conversationId: string | null;
    visible: boolean;
  }>({
    conversationId: conversationId ?? null,
    visible: false,
  });
  const showJumpToBottom =
    jumpState.conversationId === (conversationId ?? null) && jumpState.visible;
  const prevCountRef = useRef(messages.length);
  const prevLoadingRef = useRef(isLoading);
  const scrollRafRef = useRef<number | null>(null);
  const scrollInnerRafRef = useRef<number | null>(null);
  const restoreRafRef = useRef<number | null>(null);
  const restoreInnerRafRef = useRef<number | null>(null);
  const userIntentRafRef = useRef<number | null>(null);
  const userScrollIntentRef = useRef(false);
  const restoreGenerationRef = useRef(0);
  const activeConversationRef = useRef(conversationId);
  const restoredConversationRef = useRef<string | null>(null);
  const scrollSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNearBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return true;
    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distance <= NEAR_BOTTOM_THRESHOLD_PX;
  }, []);

  const updateJumpVisibility = useCallback(
    (visible: boolean) => {
      const nextConversationId = conversationId ?? null;
      setJumpState((current) =>
        current.conversationId === nextConversationId &&
        current.visible === visible
          ? current
          : { conversationId: nextConversationId, visible }
      );
    },
    [conversationId]
  );

  const cancelPendingRestore = useCallback(() => {
    restoreGenerationRef.current += 1;
    if (restoreRafRef.current != null) {
      cancelAnimationFrame(restoreRafRef.current);
      restoreRafRef.current = null;
    }
    if (restoreInnerRafRef.current != null) {
      cancelAnimationFrame(restoreInnerRafRef.current);
      restoreInnerRafRef.current = null;
    }
  }, []);

  const stickToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    if (scrollRafRef.current != null) {
      cancelAnimationFrame(scrollRafRef.current);
    }
    if (scrollInnerRafRef.current != null) {
      cancelAnimationFrame(scrollInnerRafRef.current);
    }

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      scrollInnerRafRef.current = requestAnimationFrame(() => {
        scrollInnerRafRef.current = null;
        const container = scrollRef.current;
        if (!container || !stickToBottomRef.current) return;
        container.scrollTo({ top: container.scrollHeight, behavior });
        updateJumpVisibility(false);
      });
    });
  }, [updateJumpVisibility]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      cancelPendingRestore();
      if (conversationId) {
        restoredConversationRef.current = conversationId;
      }
      stickToBottomRef.current = true;
      stickToBottom(behavior);
    },
    [cancelPendingRestore, conversationId, stickToBottom]
  );

  const scrollToMessage = useCallback(
    (messageId: string, block: ScrollLogicalPosition = "start") => {
      const container = scrollRef.current;
      const node = messageRefs.current.get(messageId);
      if (!container || !node) return;

      const containerRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const nodeTop = nodeRect.top - containerRect.top + container.scrollTop;

      let targetTop = nodeTop;
      if (block === "end") {
        targetTop = nodeTop + nodeRect.height - container.clientHeight;
      } else if (block === "center") {
        targetTop =
          nodeTop + nodeRect.height / 2 - container.clientHeight / 2;
      }

      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    },
    []
  );

  const registerMessageRef = useCallback(
    (messageId: string, node: HTMLElement | null) => {
      if (node) {
        messageRefs.current.set(messageId, node);
      } else {
        messageRefs.current.delete(messageId);
      }
    },
    []
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleUserScrollIntent = () => {
      cancelPendingRestore();
      if (conversationId) {
        restoredConversationRef.current = conversationId;
      }
      userScrollIntentRef.current = true;
      if (userIntentRafRef.current != null) {
        cancelAnimationFrame(userIntentRafRef.current);
      }
      userIntentRafRef.current = requestAnimationFrame(() => {
        userIntentRafRef.current = null;
        userScrollIntentRef.current = false;
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.buttons > 0) handleUserScrollIntent();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "PageUp" ||
        event.key === "PageDown" ||
        event.key === "Home" ||
        event.key === "End" ||
        event.key === " "
      ) {
        handleUserScrollIntent();
      }
    };

    const handleScroll = () => {
      const near = isNearBottom();
      const hasUserScrollIntent = userScrollIntentRef.current;
      userScrollIntentRef.current = false;
      if (userIntentRafRef.current != null) {
        cancelAnimationFrame(userIntentRafRef.current);
        userIntentRafRef.current = null;
      }
      stickToBottomRef.current = resolveMoonieFollowState({
        wasFollowing: stickToBottomRef.current,
        isNearBottom: near,
        hasUserScrollIntent,
      });
      updateJumpVisibility(!near);

      if (!conversationId) return;
      if (scrollSaveTimerRef.current) {
        clearTimeout(scrollSaveTimerRef.current);
      }
      scrollSaveTimerRef.current = setTimeout(() => {
        writeMoonieDeskScrollTop(conversationId, container.scrollTop);
      }, SCROLL_SAVE_DEBOUNCE_MS);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("wheel", handleUserScrollIntent, {
      passive: true,
    });
    container.addEventListener("touchstart", handleUserScrollIntent, {
      passive: true,
    });
    container.addEventListener("touchmove", handleUserScrollIntent, {
      passive: true,
    });
    container.addEventListener("pointerdown", handleUserScrollIntent, {
      passive: true,
    });
    container.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("wheel", handleUserScrollIntent);
      container.removeEventListener("touchstart", handleUserScrollIntent);
      container.removeEventListener("touchmove", handleUserScrollIntent);
      container.removeEventListener("pointerdown", handleUserScrollIntent);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("keydown", handleKeyDown);
      if (userIntentRafRef.current != null) {
        cancelAnimationFrame(userIntentRafRef.current);
        userIntentRafRef.current = null;
      }
      if (scrollSaveTimerRef.current) {
        clearTimeout(scrollSaveTimerRef.current);
      }
    };
  }, [
    cancelPendingRestore,
    conversationId,
    isNearBottom,
    updateJumpVisibility,
  ]);

  useEffect(() => {
    activeConversationRef.current = conversationId;
    cancelPendingRestore();
    if (scrollRafRef.current != null) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
    if (scrollInnerRafRef.current != null) {
      cancelAnimationFrame(scrollInnerRafRef.current);
      scrollInnerRafRef.current = null;
    }
    restoredConversationRef.current = null;
    prevCountRef.current = 0;
    stickToBottomRef.current = true;
  }, [cancelPendingRestore, conversationId]);

  useEffect(() => {
    if (!restoreScroll || !conversationId) return;
    if (restoredConversationRef.current === conversationId) return;

    if (messages.length === 0) return;

    const container = scrollRef.current;
    if (!container) return;

    cancelPendingRestore();
    const generation = restoreGenerationRef.current;
    const scheduledConversationId = conversationId;
    const savedScrollTop = readMoonieDeskScrollTop(conversationId);

    const restore = () => {
      if (
        restoreGenerationRef.current !== generation ||
        activeConversationRef.current !== scheduledConversationId ||
        scrollRef.current !== container
      ) {
        return;
      }
      const target = resolveMoonieRestoreScrollTop({
        messageCount: messages.length,
        savedScrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
      });
      if (target == null) return;
      const maxScrollTop = Math.max(
        0,
        container.scrollHeight - container.clientHeight
      );
      container.scrollTop = target;
      const near = maxScrollTop - container.scrollTop <= NEAR_BOTTOM_THRESHOLD_PX;
      restoredConversationRef.current = scheduledConversationId;
      stickToBottomRef.current = near;
      updateJumpVisibility(!near);
    };

    restoreRafRef.current = requestAnimationFrame(() => {
      restoreRafRef.current = null;
      restoreInnerRafRef.current = requestAnimationFrame(() => {
        restoreInnerRafRef.current = null;
        restore();
      });
    });

    return cancelPendingRestore;
  }, [
    cancelPendingRestore,
    conversationId,
    messages.length,
    restoreScroll,
    updateJumpVisibility,
  ]);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    const added = messages.length > prevCount;
    prevCountRef.current = messages.length;

    if (!added || messages.length === 0) return;

    const last = messages[messages.length - 1];
    if (!last) return;

    if (last.role === "user") {
      cancelPendingRestore();
      if (conversationId) {
        restoredConversationRef.current = conversationId;
      }
      stickToBottomRef.current = true;
      stickToBottom("auto");
      return;
    }

    if (shouldDeferMoonieFollow({
      restoreScroll,
      conversationId,
      restoredConversationId: restoredConversationRef.current,
      isFollowing: stickToBottomRef.current,
    })) {
      return;
    }

    if (stickToBottomRef.current) {
      stickToBottom("auto");
    } else {
      updateJumpVisibility(true);
    }
  }, [
    cancelPendingRestore,
    conversationId,
    messages,
    restoreScroll,
    stickToBottom,
    updateJumpVisibility,
  ]);

  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = isLoading;

    if (shouldDeferMoonieFollow({
      restoreScroll,
      conversationId,
      restoredConversationId: restoredConversationRef.current,
      isFollowing: stickToBottomRef.current,
    })) {
      return;
    }

    if (isLoading && stickToBottomRef.current) {
      stickToBottom("auto");
      return;
    }

    if (wasLoading && !isLoading && stickToBottomRef.current) {
      stickToBottom("auto");
    }
  }, [conversationId, isLoading, restoreScroll, stickToBottom]);

  const scheduleResizeFollow = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (shouldDeferMoonieFollow({
      restoreScroll,
      conversationId,
      restoredConversationId: restoredConversationRef.current,
      isFollowing: stickToBottomRef.current,
    })) {
      return;
    }

    if (stickToBottomRef.current) {
      stickToBottom("auto");
      return;
    }

    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    updateJumpVisibility(distance > NEAR_BOTTOM_THRESHOLD_PX);
  }, [
    conversationId,
    restoreScroll,
    stickToBottom,
    updateJumpVisibility,
  ]);

  useEffect(() => {
    const container = scrollRef.current;
    const content = contentRef.current;
    if (!container || !content || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      scheduleResizeFollow();
    });

    observer.observe(container);
    observer.observe(content);

    return () => {
      observer.disconnect();
    };
  }, [scheduleResizeFollow]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
      if (scrollInnerRafRef.current != null) {
        cancelAnimationFrame(scrollInnerRafRef.current);
      }
      if (userIntentRafRef.current != null) {
        cancelAnimationFrame(userIntentRafRef.current);
      }
      cancelPendingRestore();
      if (scrollSaveTimerRef.current) {
        clearTimeout(scrollSaveTimerRef.current);
      }
    };
  }, [cancelPendingRestore]);

  return {
    scrollRef,
    contentRef,
    registerMessageRef,
    showJumpToBottom,
    scrollToBottom,
    scrollToMessage,
  };
}
