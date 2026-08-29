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

export function useMoonieChatScroll(
  messages: MoonieScrollMessage[],
  isLoading: boolean,
  options: UseMoonieChatScrollOptions = {}
) {
  const { conversationId, restoreScroll = false } = options;
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef(new Map<string, HTMLElement>());
  const stickToBottomRef = useRef(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const prevCountRef = useRef(messages.length);
  const prevLoadingRef = useRef(isLoading);
  const scrollRafRef = useRef<number | null>(null);
  const restoredConversationRef = useRef<string | null>(null);
  const scrollSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNearBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return true;
    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distance <= NEAR_BOTTOM_THRESHOLD_PX;
  }, []);

  const stickToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    if (scrollRafRef.current != null) {
      cancelAnimationFrame(scrollRafRef.current);
    }

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const container = scrollRef.current;
      if (!container || !stickToBottomRef.current) return;
      container.scrollTo({ top: container.scrollHeight, behavior });
      setShowJumpToBottom(false);
    });
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      stickToBottomRef.current = true;
      stickToBottom(behavior);
    },
    [stickToBottom]
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

    const handleScroll = () => {
      const near = isNearBottom();
      stickToBottomRef.current = near;
      setShowJumpToBottom(!near);

      if (!conversationId) return;
      if (scrollSaveTimerRef.current) {
        clearTimeout(scrollSaveTimerRef.current);
      }
      scrollSaveTimerRef.current = setTimeout(() => {
        writeMoonieDeskScrollTop(conversationId, container.scrollTop);
      }, SCROLL_SAVE_DEBOUNCE_MS);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollSaveTimerRef.current) {
        clearTimeout(scrollSaveTimerRef.current);
      }
    };
  }, [conversationId, isNearBottom]);

  useEffect(() => {
    if (!restoreScroll || !conversationId || messages.length === 0) return;
    if (restoredConversationRef.current === conversationId) return;

    const container = scrollRef.current;
    if (!container) return;

    const savedScrollTop = readMoonieDeskScrollTop(conversationId);
    restoredConversationRef.current = conversationId;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target =
          savedScrollTop != null && savedScrollTop > 0
            ? savedScrollTop
            : container.scrollHeight;
        container.scrollTop = target;
        const near =
          container.scrollHeight - target - container.clientHeight <=
          NEAR_BOTTOM_THRESHOLD_PX;
        stickToBottomRef.current = near;
        setShowJumpToBottom(!near && messages.length > 0);
      });
    });
  }, [conversationId, messages.length, restoreScroll]);

  useEffect(() => {
    stickToBottomRef.current = true;
  }, [conversationId]);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    const added = messages.length > prevCount;
    prevCountRef.current = messages.length;

    if (!added || messages.length === 0) return;

    const last = messages[messages.length - 1];
    if (!last) return;

    if (
      restoreScroll &&
      conversationId &&
      restoredConversationRef.current !== conversationId
    ) {
      return;
    }

    if (last.role === "user") {
      stickToBottomRef.current = true;
      stickToBottom("smooth");
      return;
    }

    if (stickToBottomRef.current) {
      stickToBottom("auto");
    } else {
      setShowJumpToBottom(true);
    }
  }, [conversationId, messages, restoreScroll, stickToBottom]);

  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = isLoading;

    if (isLoading && stickToBottomRef.current) {
      stickToBottom("auto");
      return;
    }

    if (wasLoading && !isLoading && stickToBottomRef.current) {
      stickToBottom("auto");
    }
  }, [isLoading, stickToBottom]);

  const scheduleResizeFollow = useCallback(() => {
    if (scrollRafRef.current != null) {
      cancelAnimationFrame(scrollRafRef.current);
    }

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const container = scrollRef.current;
      if (!container) return;

      if (
        restoreScroll &&
        conversationId &&
        restoredConversationRef.current !== conversationId
      ) {
        return;
      }

      if (stickToBottomRef.current) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "auto",
        });
        setShowJumpToBottom(false);
        return;
      }

      const distance =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowJumpToBottom(distance > NEAR_BOTTOM_THRESHOLD_PX);
    });
  }, [conversationId, restoreScroll]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      const content = container.firstElementChild;
      if (content) {
        observer.observe(content);
      }
      scheduleResizeFollow();
    });

    observer.observe(container);
    const content = container.firstElementChild;
    if (content) {
      observer.observe(content);
    }

    return () => {
      observer.disconnect();
    };
  }, [scheduleResizeFollow]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
      if (scrollSaveTimerRef.current) {
        clearTimeout(scrollSaveTimerRef.current);
      }
    };
  }, []);

  return {
    scrollRef,
    registerMessageRef,
    showJumpToBottom,
    scrollToBottom,
    scrollToMessage,
  };
}
