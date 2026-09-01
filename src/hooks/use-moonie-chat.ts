"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type SetStateAction,
} from "react";
import { useSession } from "next-auth/react";
import {
  loadLatestMoonieConversationAction,
  loadMoonieConversationAction,
} from "@/actions/moonie.actions";
import { createMessageId } from "@/lib/moonie/constants";
import {
  buildMoonieDeskHref,
  clearMoonieNewChatIntent,
  deskHrefIsExplicitNewChat,
  hasActiveMoonieNewChatIntent,
  markMoonieNewChatIntent,
  readMoonieDeskConversationId,
  readMoonieDeskConversationIdFromWindow,
  readMoonieDeskRouteFromWindow,
  writeMoonieDeskUrl,
  shouldRestoreLatestMoonieConversation,
} from "@/lib/moonie/conversation-url";
import {
  readSessionPreferences,
  clearSessionPreferences,
  extractSessionPreferencesFromMessage,
  mergeSessionPreferencePatch,
  writeSessionPreferences,
  isRememberPromptDismissed,
} from "@/lib/moonie/personalization";
import {
  createGuestMoonieConversation,
  deleteGuestMoonieConversation,
  getGuestMoonieConversation,
  listGuestMoonieConversations,
  renameGuestMoonieConversation,
  readGuestMoonieStore,
  resolveInitialGuestMoonieState,
  setActiveGuestMoonieConversation,
  upsertGuestMoonieConversation,
  clearAllGuestMoonieConversations,
  createGuestConversationId,
  type GuestMoonieConversationSummary,
} from "@/lib/moonie/guest-chat-storage";
import { getSearchRecentScope, readRecentSearchEntries } from "@/lib/search";
import { loadingPhaseForMessage } from "@/lib/moonie/chat-phases";
import {
  mooniePendingLoadingVisible,
  shouldApplyMooniePendingResponse,
  type MooniePendingRequest,
} from "@/lib/moonie/pending-request";
import {
  processMoonieRecommendResponse,
} from "@/lib/moonie/recommend-response-handler";
import {
  buildGuestPriorMessages,
  buildMoonieExcludeNovelIds,
  buildMoonieRecommendRequestBody,
} from "@/lib/moonie/recommend-request";
import {
  isUnseenRecommendationRequest,
  isUseSavedPreferencesRequest,
} from "@/lib/moonie/intent";
import {
  buildUserAttachmentDisplay,
  toPersistedUserAttachment,
} from "@/lib/moonie/user-message-attachment";
import {
  DEFAULT_SPOILER_MODE,
  getStoredSpoilerModeServerSnapshot,
  readStoredSpoilerMode,
  sanitizeStoredRankedReviewsForMode,
  shouldSyncClientSpoilerModeFromResponse,
  subscribeStoredSpoilerMode,
  writeStoredSpoilerMode,
} from "@/lib/moonie/spoiler-mode";
import type {
  MoonieChatMessage,
  MoonieInterpretedPreferences,
  MoonieLoadingPhase,
  MoonieRecommendErrorResponse,
  MoonieRecommendResponse,
  MoonieSpoilerMode,
} from "@/types/moonie";

interface UseMoonieChatOptions {
  isLoggedIn: boolean;
  initialConversationId?: string;
  contextNovelId?: string;
  contextNovelTitle?: string;
  /** Sync `/moonie?conversation=` and hydrate chats on the full desk. */
  persistDeskConversation?: boolean;
  /** `/moonie?new=1` from the address bar — explicit blank desk. */
  deskNewChat?: boolean;
  /** Guest demo on `/ask-moonie` — allows unauthenticated turns with `guestDemo: true`. */
  guestDemoCap?: number;
  /** Server-loaded desk transcript so returning to Moonie is not blank. */
  initialMessages?: MoonieChatMessage[];
}

interface SubmitOptions {
  similarToNovelId?: string;
  excludeNovelIds?: string[];
  useTaste?: boolean;
  confirmLookupNovelId?: string;
}

interface GuestChatBox {
  guestHydrated: boolean;
  messages: MoonieChatMessage[];
  conversationId: string | undefined;
  guestConversations: GuestMoonieConversationSummary[];
}

let guestClientPrepared = false;

function subscribeGuestClientReady(onStoreChange: () => void) {
  if (typeof window !== "undefined") {
    readGuestMoonieStore();
    guestClientPrepared = true;
  }
  onStoreChange();
  return () => {};
}

function subscribeGuestClientIdle() {
  return () => {};
}

function getGuestClientReadySnapshot() {
  return guestClientPrepared;
}

function getGuestClientReadyServerSnapshot() {
  return false;
}

function applyStateUpdate<T>(current: T, update: SetStateAction<T>): T {
  return typeof update === "function"
    ? (update as (previous: T) => T)(current)
    : update;
}

function priorRecommendedIds(messages: MoonieChatMessage[]): string[] {
  const ids = new Set<string>();
  for (const message of messages) {
    for (const rec of message.recommendations ?? []) {
      ids.add(rec.novelId);
    }
  }
  return [...ids];
}

export function buildAssistantMessage(
  success: MoonieRecommendResponse
): MoonieChatMessage {
  const spoilerMode = success.spoilerMode ?? DEFAULT_SPOILER_MODE;
  const showCards =
    success.responseKind === "recommendations" ||
    success.responseKind === "novel_bundle" ||
    success.responseKind === "compare";

  return {
    id: createMessageId(),
    role: "assistant",
    content: success.reply,
    animateEntrance: true,
    recommendations: showCards ? success.recommendations : undefined,
    novelOverview: success.novelOverview,
    novelReviewGroups: success.novelReviewGroups,
    compare: success.compare,
    lookupSession: success.lookupSession,
    followUpQuestion: success.followUpQuestion,
    quickPrompts: success.quickPrompts,
    interpretedPreferences: success.interpretedPreferences,
    responseKind: success.responseKind,
    analyticsIntent: success.analyticsIntent,
    reviewerResults: success.reviewerResults,
    reviewerSession: success.reviewerSession,
    reviewerOverview: success.reviewerOverview,
    reviewerGroupOverview: success.reviewerGroupOverview,
    reviewerReviewSession: success.reviewerReviewSession,
    seriesInfo: success.seriesInfo,
    emptyReason: success.emptyReason,
    pendingClarification: success.pendingClarification,
    rankedReviews: sanitizeStoredRankedReviewsForMode(
      success.rankedReviews,
      spoilerMode
    ),
    catalogueStat: success.catalogueStat,
    rankingMetric: success.rankingMetric,
    requestedCount: success.requestedCount,
    explicitCountedReviews: success.explicitCountedReviews,
    state:
      success.state ??
      (success.responseKind === "recommendations" &&
      success.recommendations.length === 0
        ? "no_results"
        : undefined),
  };
}

export function useMoonieChat({
  isLoggedIn,
  initialConversationId,
  contextNovelId,
  contextNovelTitle,
  persistDeskConversation = false,
  deskNewChat = false,
  guestDemoCap,
  initialMessages,
}: UseMoonieChatOptions) {
  const isGuestDemo = Boolean(guestDemoCap) && !isLoggedIn;

  const { data: session, status: sessionStatus } = useSession();
  const sessionUserId = session?.user?.id ?? "";
  const sessionReady =
    !isLoggedIn || (sessionStatus !== "loading" && Boolean(sessionUserId));
  const searchRecentScope = getSearchRecentScope(session?.user?.id);
  const deskRouteEnabled = persistDeskConversation && isLoggedIn;
  const isGuestClientReady = useSyncExternalStore(
    isGuestDemo ? subscribeGuestClientReady : subscribeGuestClientIdle,
    getGuestClientReadySnapshot,
    getGuestClientReadyServerSnapshot
  );
  const [guestChat, setGuestChat] = useState<GuestChatBox>(() => ({
    guestHydrated: !isGuestDemo,
    messages: initialMessages ?? [],
    conversationId: initialConversationId,
    guestConversations: [],
  }));
  const [input, setInput] = useState("");
  const [pendingRequest, setPendingRequest] =
    useState<MooniePendingRequest | null>(null);
  const [loadingPhase, setLoadingPhase] =
    useState<MoonieLoadingPhase>("thinking");
  const [excludedNovelIds, setExcludedNovelIds] = useState<string[]>([]);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [guestTurnsRemaining, setGuestTurnsRemaining] = useState<number | null>(null);
  const spoilerMode = useSyncExternalStore(
    subscribeStoredSpoilerMode,
    readStoredSpoilerMode,
    getStoredSpoilerModeServerSnapshot
  );
  const [rememberPreferenceOffer, setRememberPreferenceOffer] =
    useState<Partial<MoonieInterpretedPreferences> | null>(null);
  const [isRestoring, setIsRestoring] = useState(() =>
    Boolean(
      deskRouteEnabled &&
        initialConversationId &&
        !(initialMessages && initialMessages.length > 0)
    )
  );

  let nextGuestChat = guestChat;
  if (isGuestDemo && isGuestClientReady && !guestChat.guestHydrated) {
    const stored = resolveInitialGuestMoonieState();
    nextGuestChat = {
      guestHydrated: true,
      messages: stored.messages,
      conversationId: stored.conversationId,
      guestConversations: listGuestMoonieConversations(),
    };
    setGuestChat(nextGuestChat);
  }

  const messages = nextGuestChat.messages;
  const conversationId = nextGuestChat.conversationId;
  const guestConversations = nextGuestChat.guestConversations;
  const guestHydrated = nextGuestChat.guestHydrated;
  const hasNewChatIntent = useCallback(() => {
    if (typeof window !== "undefined") {
      const urlId = readMoonieDeskConversationId(
        new URLSearchParams(window.location.search)
      );
      if (urlId) return false;
    }
    if (initialConversationId) return false;
    return hasActiveMoonieNewChatIntent({
      userId: sessionUserId,
      urlNewChat: deskNewChat && !conversationId,
    });
  }, [
    conversationId,
    deskNewChat,
    initialConversationId,
    sessionUserId,
  ]);

  const setMessages = useCallback((update: SetStateAction<MoonieChatMessage[]>) => {
    setGuestChat((current) => ({
      ...current,
      messages: applyStateUpdate(current.messages, update),
    }));
  }, []);

  const setConversationId = useCallback(
    (update: SetStateAction<string | undefined>) => {
      setGuestChat((current) => ({
        ...current,
        conversationId: applyStateUpdate(current.conversationId, update),
      }));
    },
    []
  );

  const setGuestConversations = useCallback(
    (update: SetStateAction<GuestMoonieConversationSummary[]>) => {
      setGuestChat((current) => ({
        ...current,
        guestConversations: applyStateUpdate(current.guestConversations, update),
      }));
    },
    []
  );

  const conversationIdRef = useRef(conversationId);
  const excludedRef = useRef(excludedNovelIds);
  const messagesRef = useRef(messages);
  const loadingRef = useRef(false);
  const contextNovelIdRef = useRef(contextNovelId);
  const contextNovelTitleRef = useRef(contextNovelTitle);
  const spoilerModeRef = useRef(spoilerMode);
  const hydratedConversationRef = useRef<string | null>(null);
  const hydratingConversationRef = useRef<string | null>(null);
  const dismissedConversationRef = useRef<string | null>(null);
  const syncedConversationRef = useRef<string | undefined>(undefined);
  const userSelectedConversationRef = useRef<string | null>(null);
  const skipLatestRestoreRef = useRef(
    deskNewChat && !initialConversationId
  );
  const hydratingLatestRef = useRef(false);
  const requestEpochRef = useRef(0);
  const pendingRequestRef = useRef<MooniePendingRequest | null>(null);

  const abandonInFlightRequest = useCallback(() => {
    requestEpochRef.current += 1;
    pendingRequestRef.current = null;
    loadingRef.current = false;
    setPendingRequest(null);
  }, []);

  const visibleLoading = mooniePendingLoadingVisible(
    pendingRequest,
    conversationId
  );

  const refreshGuestConversations = useCallback(() => {
    if (!isGuestDemo) return;
    setGuestConversations(listGuestMoonieConversations());
  }, [isGuestDemo, setGuestConversations]);

  const persistActiveGuestConversation = useCallback(
    (
      nextMessages: MoonieChatMessage[],
      nextConversationId?: string
    ) => {
      if (!isGuestDemo) return;
      const activeId = nextConversationId ?? conversationIdRef.current;
      if (!activeId) return;
      upsertGuestMoonieConversation({
        conversationId: activeId,
        messages: nextMessages,
        setActive: true,
      });
      refreshGuestConversations();
    },
    [isGuestDemo, refreshGuestConversations]
  );

  const syncMoonieDeskUrl = useCallback(
    (
      nextConversationId?: string,
      options?: { newChat?: boolean; history?: "replace" | "push" }
    ) => {
      if (!deskRouteEnabled) return;

      const nextHref = buildMoonieDeskHref({
        conversationId: options?.newChat ? undefined : nextConversationId,
        newChat: options?.newChat,
      });
      writeMoonieDeskUrl(nextHref, options?.history ?? "replace");
    },
    [deskRouteEnabled]
  );

  useEffect(() => {
    if (!isGuestDemo) return;

    void fetch("/api/moonie/guest-quota")
      .then((response) => response.json())
      .then((data: { guestTurnsRemaining?: number | null }) => {
        if (typeof data.guestTurnsRemaining === "number") {
          setGuestTurnsRemaining(data.guestTurnsRemaining);
        }
      })
      .catch(() => {
        // Keep unknown until the next successful recommend response.
      });
  }, [isGuestDemo]);

  useEffect(() => {
    if (!isGuestDemo || !guestHydrated) return;
    if (!conversationId) return;
    persistActiveGuestConversation(messages, conversationId);
  }, [
    conversationId,
    guestHydrated,
    isGuestDemo,
    messages,
    persistActiveGuestConversation,
  ]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
    excludedRef.current = excludedNovelIds;
    messagesRef.current = messages;
    contextNovelIdRef.current = contextNovelId;
    contextNovelTitleRef.current = contextNovelTitle;
    spoilerModeRef.current = spoilerMode;
    if (isGuestDemo && guestHydrated && conversationId) {
      hydratedConversationRef.current = conversationId;
    }
  }, [
    conversationId,
    excludedNovelIds,
    guestHydrated,
    isGuestDemo,
    messages,
    contextNovelId,
    contextNovelTitle,
    spoilerMode,
  ]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setExcludedNovelIds([]);
    setInput("");
    clearSessionPreferences();
    setRememberPreferenceOffer(null);
  }, [setConversationId, setMessages]);

  const sessionOwnerRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isLoggedIn) {
      sessionOwnerRef.current = null;
      return;
    }
    if (!sessionReady) return;
    if (sessionOwnerRef.current === null) {
      sessionOwnerRef.current = sessionUserId;
      return;
    }
    if (sessionOwnerRef.current === sessionUserId) return;
    sessionOwnerRef.current = sessionUserId;
    abandonInFlightRequest();
    hydratedConversationRef.current = null;
    hydratingConversationRef.current = null;
    userSelectedConversationRef.current = null;
    syncedConversationRef.current = undefined;
    dismissedConversationRef.current = null;
    skipLatestRestoreRef.current = true;
    setIsRestoring(false);
    clearChat();
  }, [
    abandonInFlightRequest,
    clearChat,
    isLoggedIn,
    sessionReady,
    sessionUserId,
  ]);

  const resumeConversation = useCallback(
    (options: { conversationId: string; messages: MoonieChatMessage[] }) => {
      setConversationId(options.conversationId);
      setMessages(options.messages);
      setExcludedNovelIds([]);
      setInput("");
      setRememberPreferenceOffer(null);
      hydratedConversationRef.current = options.conversationId;
    },
    [setConversationId, setMessages]
  );

  const startNewConversation = useCallback(() => {
    abandonInFlightRequest();
    if (isGuestDemo) {
      if (conversationId && messages.length > 0) {
        persistActiveGuestConversation(messages, conversationId);
      }
      const created = createGuestMoonieConversation();
      hydratedConversationRef.current = created.id;
      setConversationId(created.id);
      setMessages([]);
      setExcludedNovelIds([]);
      setInput("");
      setRememberPreferenceOffer(null);
      refreshGuestConversations();
      return;
    }

    if (!deskRouteEnabled) {
      clearChat();
      return;
    }

    markMoonieNewChatIntent(sessionUserId);
    skipLatestRestoreRef.current = true;
    dismissedConversationRef.current =
      conversationId ?? initialConversationId ?? null;
    hydratedConversationRef.current = null;
    hydratingConversationRef.current = null;
    userSelectedConversationRef.current = null;
    syncedConversationRef.current = undefined;
    setIsRestoring(false);
    syncMoonieDeskUrl(undefined, { newChat: true, history: "push" });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("moonverse:desk-fresh"));
    }
    clearChat();
  }, [
    clearChat,
    conversationId,
    deskRouteEnabled,
    initialConversationId,
    isGuestDemo,
    messages,
    persistActiveGuestConversation,
    refreshGuestConversations,
    abandonInFlightRequest,
    sessionUserId,
    setConversationId,
    setMessages,
    syncMoonieDeskUrl,
  ]);

  const resumeGuestConversation = useCallback(
    (nextConversationId: string) => {
      if (!isGuestDemo) return;
      if (
        nextConversationId === conversationId &&
        hydratedConversationRef.current === nextConversationId
      ) {
        return;
      }
      if (conversationId && messages.length > 0) {
        persistActiveGuestConversation(messages, conversationId);
      }
      const stored = getGuestMoonieConversation(nextConversationId);
      if (!stored) return;
      setActiveGuestMoonieConversation(nextConversationId);
      hydratedConversationRef.current = nextConversationId;
      setConversationId(nextConversationId);
      setMessages(stored.messages);
      setExcludedNovelIds([]);
      setInput("");
      setRememberPreferenceOffer(null);
      refreshGuestConversations();
    },
    [
      conversationId,
      isGuestDemo,
      messages,
      persistActiveGuestConversation,
      refreshGuestConversations,
      setConversationId,
      setMessages,
    ]
  );

  const deleteGuestConversation = useCallback(
    (nextConversationId: string) => {
      if (!isGuestDemo) return;
      const removed = deleteGuestMoonieConversation(nextConversationId);
      if (!removed) return;

      if (conversationId === nextConversationId) {
        const remaining = listGuestMoonieConversations()[0];
        if (remaining) {
          resumeGuestConversation(remaining.id);
        } else {
          const created = createGuestMoonieConversation();
          hydratedConversationRef.current = created.id;
          setConversationId(created.id);
          setMessages([]);
          setExcludedNovelIds([]);
          setInput("");
        }
      }
      refreshGuestConversations();
    },
    [
      conversationId,
      isGuestDemo,
      refreshGuestConversations,
      resumeGuestConversation,
      setConversationId,
      setMessages,
    ]
  );

  const renameGuestConversation = useCallback(
    (nextConversationId: string, title: string) => {
      if (!isGuestDemo) return;
      renameGuestMoonieConversation(nextConversationId, title);
      refreshGuestConversations();
    },
    [isGuestDemo, refreshGuestConversations]
  );

  const clearGuestConversationHistory = useCallback(() => {
    if (!isGuestDemo) return;
    clearAllGuestMoonieConversations();
    const created = createGuestMoonieConversation();
    hydratedConversationRef.current = created.id;
    setConversationId(created.id);
    setMessages([]);
    setExcludedNovelIds([]);
    setInput("");
    setRememberPreferenceOffer(null);
    if (guestDemoCap != null) {
      setGuestTurnsRemaining(guestDemoCap);
    }
    refreshGuestConversations();
  }, [
    guestDemoCap,
    isGuestDemo,
    refreshGuestConversations,
    setConversationId,
    setMessages,
  ]);

  const resumeConversationFromSidebar = useCallback(
    (options: { conversationId: string; messages: MoonieChatMessage[] }) => {
      clearMoonieNewChatIntent(sessionUserId);
      skipLatestRestoreRef.current = false;
      dismissedConversationRef.current = null;
      hydratedConversationRef.current = options.conversationId;
      hydratingConversationRef.current = null;
      userSelectedConversationRef.current = options.conversationId;
      syncedConversationRef.current = options.conversationId;
      conversationIdRef.current = options.conversationId;
      setIsRestoring(false);
      resumeConversation(options);
      if (deskRouteEnabled) {
        syncMoonieDeskUrl(options.conversationId, { history: "push" });
      }
    },
    [deskRouteEnabled, resumeConversation, sessionUserId, syncMoonieDeskUrl]
  );

  useEffect(() => {
    if (!deskRouteEnabled) return;
    if (!sessionReady) return;
    if (
      !shouldRestoreLatestMoonieConversation({
        hasDurableNewChatIntent: hasNewChatIntent(),
        initialConversationId,
        conversationId,
        messageCount: messages.length,
      })
    ) {
      return;
    }
    if (skipLatestRestoreRef.current) return;
    if (hydratingLatestRef.current) return;

    hydratingLatestRef.current = true;
    let cancelled = false;
    setIsRestoring(true);

    void loadLatestMoonieConversationAction().then((loaded) => {
      if (cancelled) return;
      hydratingLatestRef.current = false;

      if (
        skipLatestRestoreRef.current ||
        hasNewChatIntent()
      ) {
        setIsRestoring(false);
        return;
      }

      if (loaded.success) {
        resumeConversation({
          conversationId: loaded.conversationId,
          messages: loaded.messages,
        });
        syncedConversationRef.current = loaded.conversationId;
        syncMoonieDeskUrl(loaded.conversationId);
      }

      setIsRestoring(false);
    });

    return () => {
      cancelled = true;
      hydratingLatestRef.current = false;
    };
  }, [
    conversationId,
    deskRouteEnabled,
    initialConversationId,
    messages.length,
    resumeConversation,
    sessionReady,
    sessionUserId,
    hasNewChatIntent,
    syncMoonieDeskUrl,
  ]);

  useEffect(() => {
    if (!deskRouteEnabled) return;
    if (
      initialConversationId &&
      userSelectedConversationRef.current === initialConversationId
    ) {
      return;
    }
    if (
      initialConversationId &&
      userSelectedConversationRef.current &&
      userSelectedConversationRef.current !== initialConversationId
    ) {
      userSelectedConversationRef.current = null;
      hydratedConversationRef.current = null;
      hydratingConversationRef.current = null;
      syncedConversationRef.current = undefined;
      dismissedConversationRef.current = null;
      skipLatestRestoreRef.current = false;
    }
    if (
      initialConversationId &&
      dismissedConversationRef.current === initialConversationId
    ) {
      const urlId = readMoonieDeskConversationIdFromWindow();
      if (urlId === initialConversationId) {
        dismissedConversationRef.current = null;
        skipLatestRestoreRef.current = false;
      }
    }
  }, [deskRouteEnabled, initialConversationId]);

  useEffect(() => {
    if (!deskRouteEnabled || !sessionReady) return;
    if (!hasNewChatIntent()) return;
    const urlId =
      typeof window !== "undefined"
        ? readMoonieDeskConversationId(
            new URLSearchParams(window.location.search)
          )
        : undefined;
    if (urlId || initialConversationId) {
      clearMoonieNewChatIntent(sessionUserId);
      return;
    }
    if (pendingRequestRef.current || loadingRef.current) return;
    if (messagesRef.current.length > 0) return;

    skipLatestRestoreRef.current = true;
    dismissedConversationRef.current =
      conversationId ?? initialConversationId ?? null;
    userSelectedConversationRef.current = null;
    hydratedConversationRef.current = null;
    hydratingConversationRef.current = null;
    syncedConversationRef.current = undefined;
    queueMicrotask(() => {
      if (pendingRequestRef.current || messagesRef.current.length > 0) return;
      clearChat();
      setIsRestoring(false);
    });
  }, [
    clearChat,
    conversationId,
    deskRouteEnabled,
    deskNewChat,
    hasNewChatIntent,
    initialConversationId,
    sessionReady,
    sessionUserId,
  ]);

  useEffect(() => {
    if (!deskRouteEnabled || !initialConversationId || !sessionReady) {
      return;
    }

    if (deskNewChat && !initialConversationId) {
      return;
    }

    clearMoonieNewChatIntent(sessionUserId);
    const targetId = initialConversationId;

    if (pendingRequestRef.current) {
      const pendingConversationId = pendingRequestRef.current.conversationId;
      if (
        pendingConversationId != null &&
        pendingConversationId === targetId
      ) {
        return;
      }
    }

    if (dismissedConversationRef.current === targetId) {
      const urlId = readMoonieDeskConversationIdFromWindow();
      if (urlId === targetId) {
        dismissedConversationRef.current = null;
      } else {
        return;
      }
    }

    if (
      userSelectedConversationRef.current &&
      userSelectedConversationRef.current !== targetId &&
      conversationId === userSelectedConversationRef.current &&
      messages.length > 0
    ) {
      return;
    }

    if (conversationId === targetId && messages.length > 0) {
      hydratedConversationRef.current = targetId;
      hydratingConversationRef.current = null;
      return;
    }

    if (hydratingConversationRef.current === targetId) {
      return;
    }

    hydratingConversationRef.current = targetId;
    hydratedConversationRef.current = targetId;
    let cancelled = false;
    setIsRestoring(true);

    void loadMoonieConversationAction(targetId).then((loaded) => {
      if (cancelled) return;

      hydratingConversationRef.current = null;

      if (!targetId && (skipLatestRestoreRef.current || hasNewChatIntent())) {
        setIsRestoring(false);
        return;
      }

      if (loaded.success) {
        resumeConversation({
          conversationId: loaded.conversationId,
          messages: loaded.messages,
        });
        setIsRestoring(false);
        return;
      }

      hydratedConversationRef.current = null;
      if (loaded.error === "Conversation not found.") {
        dismissedConversationRef.current = targetId;
      }
      setIsRestoring(false);
      if (hasNewChatIntent()) {
        syncMoonieDeskUrl(undefined, { newChat: true });
      } else {
        syncMoonieDeskUrl();
      }
    });

    return () => {
      cancelled = true;
      if (hydratingConversationRef.current === targetId) {
        hydratingConversationRef.current = null;
      }
    };
  }, [
    conversationId,
    deskRouteEnabled,
    initialConversationId,
    messages.length,
    resumeConversation,
    hasNewChatIntent,
    sessionReady,
    sessionUserId,
    syncMoonieDeskUrl,
    deskNewChat,
  ]);

  useEffect(() => {
    if (!deskRouteEnabled) return;
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/moonie"
    ) {
      return;
    }
    if (readMoonieDeskConversationIdFromWindow()) return;
    if (deskNewChat && sessionUserId) {
      markMoonieNewChatIntent(sessionUserId);
    }
    if (hasNewChatIntent()) {
      skipLatestRestoreRef.current = true;
    }
  }, [deskNewChat, deskRouteEnabled, hasNewChatIntent, sessionUserId]);

  const applyExplicitFreshDesk = useCallback(() => {
    if (!deskRouteEnabled) return;
    if (typeof window === "undefined" || window.location.pathname !== "/moonie") {
      return;
    }
    if (readMoonieDeskConversationIdFromWindow()) return;
    const currentHref = `${window.location.pathname}${window.location.search}`;
    if (!deskHrefIsExplicitNewChat(currentHref)) return;

    const priorConversationId = conversationIdRef.current;
    markMoonieNewChatIntent(sessionUserId);
    skipLatestRestoreRef.current = true;
    syncedConversationRef.current = undefined;
    hydratedConversationRef.current = null;
    hydratingConversationRef.current = null;
    userSelectedConversationRef.current = null;
    if (priorConversationId) {
      dismissedConversationRef.current = priorConversationId;
    }

    if (pendingRequestRef.current) {
      abandonInFlightRequest();
    }
    clearChat();
    setIsRestoring(false);
  }, [
    abandonInFlightRequest,
    clearChat,
    deskRouteEnabled,
    sessionUserId,
  ]);

  useEffect(() => {
    if (!deskRouteEnabled) return;
    const onDeskFresh = () => {
      applyExplicitFreshDesk();
    };
    window.addEventListener("moonverse:desk-fresh", onDeskFresh);
    return () => window.removeEventListener("moonverse:desk-fresh", onDeskFresh);
  }, [applyExplicitFreshDesk, deskRouteEnabled]);

  const explicitNewChatRouteRef = useRef(false);
  useEffect(() => {
    if (!deskRouteEnabled || !sessionReady) return;
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/moonie"
    ) {
      return;
    }
    const urlRoute = readMoonieDeskRouteFromWindow();
    const isExplicitNewChat =
      !urlRoute.conversationId &&
      urlRoute.newChat &&
      deskNewChat &&
      !initialConversationId &&
      deskHrefIsExplicitNewChat(
        `${window.location.pathname}${window.location.search}`
      );
    const wasExplicitNewChat = explicitNewChatRouteRef.current;
    explicitNewChatRouteRef.current = isExplicitNewChat;
    if (isExplicitNewChat && !wasExplicitNewChat) {
      applyExplicitFreshDesk();
    }
  }, [
    applyExplicitFreshDesk,
    deskNewChat,
    deskRouteEnabled,
    initialConversationId,
    sessionReady,
  ]);

  useEffect(() => {
    if (!deskRouteEnabled) return;
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/moonie"
    ) {
      return;
    }

    const currentHref =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "";
    if (deskHrefIsExplicitNewChat(currentHref)) {
      syncedConversationRef.current = undefined;
      if (conversationId != null) {
        return;
      }
      if (hasNewChatIntent()) {
        syncMoonieDeskUrl(undefined, { newChat: true });
      }
      return;
    }

    const nextConversationId = conversationId ?? undefined;

    if (!nextConversationId) {
      const urlId =
        typeof window !== "undefined"
          ? readMoonieDeskConversationId(
              new URLSearchParams(window.location.search)
            )
          : undefined;
      if (urlId) return;
      if (hasNewChatIntent()) {
        syncedConversationRef.current = undefined;
        syncMoonieDeskUrl(undefined, { newChat: true });
        return;
      }
      if (syncedConversationRef.current === nextConversationId) return;
      if (syncedConversationRef.current === undefined) return;
      syncedConversationRef.current = undefined;
      syncMoonieDeskUrl();
      return;
    }

    if (syncedConversationRef.current === nextConversationId) return;
    syncedConversationRef.current = nextConversationId;
    syncMoonieDeskUrl(nextConversationId);
  }, [conversationId, deskRouteEnabled, hasNewChatIntent, syncMoonieDeskUrl]);

  const handleSubmit = useCallback(
    async (message?: string, options: SubmitOptions = {}) => {
      if (
        (!isLoggedIn && !isGuestDemo) ||
        mooniePendingLoadingVisible(
          pendingRequestRef.current,
          conversationIdRef.current
        )
      ) {
        return;
      }

      const trimmed = (message ?? "").trim();
      if (!trimmed) return;

      if (
        isGuestDemo &&
        (guestTurnsRemaining === null || guestTurnsRemaining <= 0)
      ) {
        return;
      }

      const extractedSession = extractSessionPreferencesFromMessage(trimmed);
      if (extractedSession) {
        writeSessionPreferences(
          mergeSessionPreferencePatch(readSessionPreferences(), extractedSession)
        );
      }

      const userAttachment = buildUserAttachmentDisplay({});
      const userMessage: MoonieChatMessage = {
        id: createMessageId(),
        role: "user",
        content: trimmed,
        userAttachment,
      };
      const snapUserAttachmentMeta = toPersistedUserAttachment(userAttachment);
      const exclude = buildMoonieExcludeNovelIds({
        explicitExcludedNovelIds: [
          ...excludedRef.current,
          ...(options.excludeNovelIds ?? []),
        ],
        priorRecommendedNovelIds: priorRecommendedIds(messagesRef.current),
        seekingUnseen: isUnseenRecommendationRequest(trimmed),
      });

      const priorMessages = isGuestDemo
        ? buildGuestPriorMessages(messagesRef.current)
        : messagesRef.current.map((entry) => ({
            role: entry.role,
            content: entry.content,
          }));

      let activeGuestConversationId = conversationIdRef.current;
      if (isGuestDemo && !activeGuestConversationId) {
        activeGuestConversationId = createGuestConversationId();
        conversationIdRef.current = activeGuestConversationId;
        setConversationId(activeGuestConversationId);
        hydratedConversationRef.current = activeGuestConversationId;
      }

      loadingRef.current = true;
      const requestEpoch = requestEpochRef.current;
      const requestId = userMessage.id;
      if (
        deskRouteEnabled &&
        !conversationIdRef.current &&
        hasNewChatIntent()
      ) {
        clearMoonieNewChatIntent(sessionUserId);
      }
      const pending: MooniePendingRequest = {
        requestId,
        conversationId: activeGuestConversationId,
      };
      pendingRequestRef.current = pending;
      setPendingRequest(pending);
      const modeAtSend = spoilerModeRef.current;
      if (isGuestDemo) {
        setQuotaRemaining(null);
      } else {
        setGuestTurnsRemaining(null);
      }
      setMessages((current) => [...current, userMessage]);
      setInput("");
      setLoadingPhase(loadingPhaseForMessage(trimmed));
      if (isGuestDemo) {
        setGuestTurnsRemaining((current) =>
          current == null ? current : Math.max(0, current - 1)
        );
      }

      const revertGuestTurn = () => {
        if (!isGuestDemo) return;
        void fetch("/api/moonie/guest-quota")
          .then((response) => response.json())
          .then((data: { guestTurnsRemaining?: number | null }) => {
            if (typeof data.guestTurnsRemaining === "number") {
              setGuestTurnsRemaining(data.guestTurnsRemaining);
            }
          })
          .catch(() => {
            // no-op
          });
      };

      const wantsSavedTaste = isUseSavedPreferencesRequest(trimmed);

      try {
        const response = await fetch("/api/moonie/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            buildMoonieRecommendRequestBody({
              message: trimmed,
              clientTurnId: isGuestDemo ? undefined : userMessage.id,
              conversationId: activeGuestConversationId,
              priorMessages: isGuestDemo ? priorMessages : undefined,
              similarToNovelId: options.similarToNovelId,
              excludeNovelIds: exclude,
              confirmLookupNovelId: options.confirmLookupNovelId,
              useTaste: options.useTaste ?? (wantsSavedTaste ? true : undefined),
              contextNovelId: contextNovelIdRef.current,
              contextNovelTitle: contextNovelTitleRef.current,
              spoilerMode: spoilerModeRef.current,
              sessionPreferences: readSessionPreferences(),
              recentSearches: readRecentSearchEntries(searchRecentScope).map(
                (entry) => ({
                  query: entry.query,
                  novelId: entry.novelId,
                })
              ),
              userAttachmentMeta: snapUserAttachmentMeta,
              guestDemo: isGuestDemo ? true : undefined,
            })
          ),
        });

        const data = (await response.json()) as
          | MoonieRecommendResponse
          | MoonieRecommendErrorResponse;
        const outcome = processMoonieRecommendResponse({
          responseOk: response.ok,
          data,
          requestId,
          requestEpoch,
          requestEpochRef: requestEpochRef.current,
          pending: pendingRequestRef.current,
          activeConversationId: conversationIdRef.current,
          activeGuestConversationId,
          isGuestDemo,
          deskRouteEnabled,
        });

        if (typeof outcome.quotaRemaining === "number") {
          setQuotaRemaining(outcome.quotaRemaining);
          setGuestTurnsRemaining(null);
        }
        if (typeof outcome.guestTurnsRemaining === "number") {
          setGuestTurnsRemaining(outcome.guestTurnsRemaining);
          setQuotaRemaining(null);
        }

        if (outcome.kind === "ignored") {
          if (outcome.revertGuestTurn) revertGuestTurn();
          return;
        }

        if (outcome.kind === "error") {
          setMessages((current) => [...current, outcome.errorMessage!]);
          if (outcome.revertGuestTurn) revertGuestTurn();
          return;
        }

        const success = data as MoonieRecommendResponse;
        if (outcome.conversationId) {
          if (outcome.clearNewChatIntent) {
            clearMoonieNewChatIntent(sessionUserId);
          }
          setConversationId(outcome.conversationId);
          conversationIdRef.current = outcome.conversationId;
        }
        if (
          success.spoilerMode &&
          shouldSyncClientSpoilerModeFromResponse({
            reply: success.reply,
            serverMode: success.spoilerMode,
            modeAtSend,
            modeNow: spoilerModeRef.current,
          })
        ) {
          spoilerModeRef.current = success.spoilerMode;
          writeStoredSpoilerMode(success.spoilerMode);
        }

        setMessages((current) => [...current, outcome.assistantMessage!]);
        if (isGuestDemo && activeGuestConversationId) {
          persistActiveGuestConversation(
            [...messagesRef.current, userMessage, outcome.assistantMessage!],
            activeGuestConversationId
          );
        }
        if (success.rememberPreferenceOffer && !isRememberPromptDismissed()) {
          setRememberPreferenceOffer(success.rememberPreferenceOffer);
        }
      } catch {
        const requestAbandoned = requestEpoch !== requestEpochRef.current;
        const canApply = shouldApplyMooniePendingResponse({
          pending: pendingRequestRef.current,
          requestId,
          activeConversationId: conversationIdRef.current,
          responseConversationId: activeGuestConversationId,
          requestAbandoned,
        });
        if (!canApply) {
          revertGuestTurn();
          return;
        }
        revertGuestTurn();
        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            role: "assistant",
            content:
              "Moonie is having trouble reaching the reading archive. Please try again shortly.",
              animateEntrance: true,
            isError: true,
            state: "error",
          },
        ]);
      } finally {
        if (pendingRequestRef.current?.requestId === requestId) {
          pendingRequestRef.current = null;
          loadingRef.current = false;
          setPendingRequest((current) =>
            current?.requestId === requestId ? null : current
          );
        }
      }
    },
    [
      guestTurnsRemaining,
      isGuestDemo,
      isLoggedIn,
      deskRouteEnabled,
      persistActiveGuestConversation,
      searchRecentScope,
      sessionUserId,
      setConversationId,
      setMessages,
    ]
  );

  const hideNovel = useCallback((novelId: string) => {
    setExcludedNovelIds((ids) =>
      ids.includes(novelId) ? ids : [...ids, novelId]
    );
  }, []);

  const updateSpoilerMode = useCallback((mode: MoonieSpoilerMode) => {
    spoilerModeRef.current = mode;
    writeStoredSpoilerMode(mode);
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading: visibleLoading,
    loadingPhase,
    handleSubmit,
    conversationId,
    clearChat,
    resumeConversation,
    startNewConversation,
    resumeConversationFromSidebar,
    isRestoring: isGuestDemo
      ? !isGuestClientReady || !guestHydrated
      : isRestoring &&
        !(
          deskRouteEnabled &&
          Boolean(initialConversationId) &&
          conversationId === initialConversationId &&
          messages.length > 0
        ),
    hideNovel,
    excludedNovelIds,
    quotaRemaining,
    guestTurnsRemaining,
    guestConversations,
    resumeGuestConversation,
    deleteGuestConversation,
    renameGuestConversation,
    clearGuestConversationHistory,
    spoilerMode,
    setSpoilerMode: updateSpoilerMode,
    rememberPreferenceOffer,
    dismissRememberPreferenceOffer: () => setRememberPreferenceOffer(null),
  };
}
