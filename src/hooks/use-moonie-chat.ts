"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  loadLatestMoonieConversationAction,
  loadMoonieConversationAction,
} from "@/actions/moonie.actions";
import { createMessageId } from "@/lib/moonie/constants";
import { buildMoonieDeskHref } from "@/lib/moonie/conversation-url";
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
  resolveInitialGuestMoonieState,
  setActiveGuestMoonieConversation,
  upsertGuestMoonieConversation,
  clearAllGuestMoonieConversations,
  createGuestConversationId,
  type GuestMoonieConversationSummary,
} from "@/lib/moonie/guest-chat-storage";
import { getSearchRecentScope, readRecentSearchEntries } from "@/lib/search";
import { loadingPhaseForMessage } from "@/lib/moonie/chat-phases";
import { buildMoonieRecommendRequestBody, buildGuestPriorMessages } from "@/lib/moonie/recommend-request";
import { isUseSavedPreferencesRequest } from "@/lib/moonie/intent";
import {
  buildUserAttachmentDisplay,
  toPersistedUserAttachment,
} from "@/lib/moonie/user-message-attachment";
import {
  readStoredSpoilerMode,
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
  /** Guest demo on `/ask-moonie` — allows unauthenticated turns with `guestDemo: true`. */
  guestDemoCap?: number;
}

interface SubmitOptions {
  similarToNovelId?: string;
  excludeNovelIds?: string[];
  useTaste?: boolean;
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

function buildAssistantMessage(
  success: MoonieRecommendResponse
): MoonieChatMessage {
  const showCards =
    success.responseKind === "recommendations" ||
    success.responseKind === "novel_bundle" ||
    success.responseKind === "compare";

  return {
    id: createMessageId(),
    role: "assistant",
    content: success.reply,
    recommendations: showCards ? success.recommendations : undefined,
    novelOverview: success.novelOverview,
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
  guestDemoCap,
}: UseMoonieChatOptions) {
  const isGuestDemo = Boolean(guestDemoCap) && !isLoggedIn;

  const router = useRouter();
  const { data: session } = useSession();
  const searchRecentScope = getSearchRecentScope(session?.user?.id);
  const deskRouteEnabled = persistDeskConversation && isLoggedIn;
  const [messages, setMessages] = useState<MoonieChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] =
    useState<MoonieLoadingPhase>("thinking");
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [excludedNovelIds, setExcludedNovelIds] = useState<string[]>([]);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [guestTurnsRemaining, setGuestTurnsRemaining] = useState<number | null>(
    guestDemoCap ?? null
  );
  const [spoilerMode, setSpoilerMode] = useState<MoonieSpoilerMode>("none");
  const [rememberPreferenceOffer, setRememberPreferenceOffer] =
    useState<Partial<MoonieInterpretedPreferences> | null>(null);
  const [guestConversations, setGuestConversations] = useState<
    GuestMoonieConversationSummary[]
  >([]);
  const [isRestoring, setIsRestoring] = useState(
    () => isGuestDemo || Boolean(deskRouteEnabled && initialConversationId)
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
  const skipLatestRestoreRef = useRef(false);
  const hydratingLatestRef = useRef(false);
  const guestStorageReadyRef = useRef(!isGuestDemo);

  const refreshGuestConversations = useCallback(() => {
    if (!isGuestDemo) return;
    setGuestConversations(listGuestMoonieConversations());
  }, [isGuestDemo]);

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
    (nextConversationId?: string) => {
      if (!deskRouteEnabled) return;

      const nextHref = buildMoonieDeskHref({ conversationId: nextConversationId });
      const currentHref =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "";

      if (currentHref === nextHref) {
        return;
      }

      router.replace(nextHref, { scroll: false });
    },
    [deskRouteEnabled, router]
  );

  useEffect(() => {
    setSpoilerMode(readStoredSpoilerMode());
  }, []);

  useEffect(() => {
    if (!isGuestDemo) return;

    const stored = resolveInitialGuestMoonieState();
    if (stored.messages.length > 0) {
      setMessages(stored.messages);
    }
    if (stored.conversationId) {
      setConversationId(stored.conversationId);
      hydratedConversationRef.current = stored.conversationId;
    }
    setGuestConversations(listGuestMoonieConversations());
    guestStorageReadyRef.current = true;
    setIsRestoring(false);

    void fetch("/api/moonie/guest-quota")
      .then((response) => response.json())
      .then((data: { guestTurnsRemaining?: number | null }) => {
        if (typeof data.guestTurnsRemaining === "number") {
          setGuestTurnsRemaining(data.guestTurnsRemaining);
        }
      })
      .catch(() => {
        // Keep the cap-based fallback until the next successful recommend response.
      });
  }, [isGuestDemo]);

  useEffect(() => {
    if (!isGuestDemo || !guestStorageReadyRef.current) return;
    if (!conversationId) return;
    persistActiveGuestConversation(messages, conversationId);
  }, [conversationId, isGuestDemo, messages, persistActiveGuestConversation]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
    excludedRef.current = excludedNovelIds;
    messagesRef.current = messages;
    contextNovelIdRef.current = contextNovelId;
    contextNovelTitleRef.current = contextNovelTitle;
    spoilerModeRef.current = spoilerMode;
  }, [
    conversationId,
    excludedNovelIds,
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
  }, []);

  const resumeConversation = useCallback(
    (options: { conversationId: string; messages: MoonieChatMessage[] }) => {
      setConversationId(options.conversationId);
      setMessages(options.messages);
      setExcludedNovelIds([]);
      setInput("");
      setRememberPreferenceOffer(null);
      hydratedConversationRef.current = options.conversationId;
    },
    []
  );

  const startNewConversation = useCallback(() => {
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

    skipLatestRestoreRef.current = true;
    dismissedConversationRef.current =
      conversationId ?? initialConversationId ?? null;
    hydratedConversationRef.current = null;
    hydratingConversationRef.current = null;
    userSelectedConversationRef.current = null;
    syncedConversationRef.current = undefined;
    setIsRestoring(false);
    syncMoonieDeskUrl();
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
    [conversationId, isGuestDemo, refreshGuestConversations, resumeGuestConversation]
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
  }, [guestDemoCap, isGuestDemo, refreshGuestConversations]);

  const resumeConversationFromSidebar = useCallback(
    (options: { conversationId: string; messages: MoonieChatMessage[] }) => {
      skipLatestRestoreRef.current = false;
      dismissedConversationRef.current = null;
      hydratedConversationRef.current = options.conversationId;
      hydratingConversationRef.current = null;
      userSelectedConversationRef.current = options.conversationId;
      syncedConversationRef.current = options.conversationId;
      setIsRestoring(false);
      resumeConversation(options);
      if (deskRouteEnabled) {
        syncMoonieDeskUrl(options.conversationId);
      }
    },
    [deskRouteEnabled, resumeConversation, syncMoonieDeskUrl]
  );

  useEffect(() => {
    if (!deskRouteEnabled) return;

    function handlePopState() {
      userSelectedConversationRef.current = null;
      hydratedConversationRef.current = null;
      hydratingConversationRef.current = null;
      syncedConversationRef.current = undefined;
      dismissedConversationRef.current = null;
      skipLatestRestoreRef.current = false;
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [deskRouteEnabled]);

  useEffect(() => {
    if (!deskRouteEnabled || initialConversationId) {
      return;
    }
    if (skipLatestRestoreRef.current) return;
    if (messages.length > 0 || conversationId) return;
    if (hydratingLatestRef.current) return;

    hydratingLatestRef.current = true;
    let cancelled = false;
    setIsRestoring(true);

    void loadLatestMoonieConversationAction().then((loaded) => {
      if (cancelled) return;
      hydratingLatestRef.current = false;

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
    syncMoonieDeskUrl,
  ]);

  useEffect(() => {
    if (!deskRouteEnabled || !initialConversationId) {
      return;
    }

    const targetId = initialConversationId;

    if (dismissedConversationRef.current === targetId) {
      setIsRestoring(false);
      return;
    }

    if (
      userSelectedConversationRef.current &&
      userSelectedConversationRef.current !== targetId &&
      conversationId === userSelectedConversationRef.current &&
      messages.length > 0
    ) {
      setIsRestoring(false);
      return;
    }

    if (conversationId === targetId && messages.length > 0) {
      hydratedConversationRef.current = targetId;
      hydratingConversationRef.current = null;
      setIsRestoring(false);
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

      if (loaded.success) {
        resumeConversation({
          conversationId: loaded.conversationId,
          messages: loaded.messages,
        });
        setIsRestoring(false);
        return;
      }

      hydratedConversationRef.current = null;
      dismissedConversationRef.current = targetId;
      setIsRestoring(false);
      syncMoonieDeskUrl();
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
    syncMoonieDeskUrl,
  ]);

  useEffect(() => {
    if (!deskRouteEnabled) return;

    const nextConversationId = conversationId ?? undefined;
    if (syncedConversationRef.current === nextConversationId) return;

    if (!nextConversationId) {
      if (syncedConversationRef.current === undefined) return;
      syncedConversationRef.current = undefined;
      syncMoonieDeskUrl();
      return;
    }

    syncedConversationRef.current = nextConversationId;
    syncMoonieDeskUrl(nextConversationId);
  }, [conversationId, deskRouteEnabled, syncMoonieDeskUrl]);

  const handleSubmit = useCallback(
    async (message?: string, options: SubmitOptions = {}) => {
      if ((!isLoggedIn && !isGuestDemo) || loadingRef.current) return;

      const trimmed = (message ?? "").trim();
      if (!trimmed) return;

      if (
        isGuestDemo &&
        guestTurnsRemaining != null &&
        guestTurnsRemaining <= 0
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
      const exclude = [
        ...new Set([
          ...excludedRef.current,
          ...priorRecommendedIds(messagesRef.current),
          ...(options.excludeNovelIds ?? []),
        ]),
      ];

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
      setMessages((current) => [...current, userMessage]);
      setInput("");
      setLoadingPhase(loadingPhaseForMessage(trimmed));
      setIsLoading(true);
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
              conversationId: activeGuestConversationId,
              priorMessages: isGuestDemo ? priorMessages : undefined,
              similarToNovelId: options.similarToNovelId,
              excludeNovelIds: exclude,
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

        if (!response.ok || "error" in data) {
          const errorData = data as MoonieRecommendErrorResponse;
          if (errorData.rateLimited) {
            if (isGuestDemo) {
              setGuestTurnsRemaining(0);
            } else {
              setQuotaRemaining(
                typeof errorData.quotaRemaining === "number"
                  ? errorData.quotaRemaining
                  : 0
              );
            }
          }
          setMessages((current) => [
            ...current,
            {
              id: createMessageId(),
              role: "assistant",
              content: errorData.error ?? "Something went wrong. Please try again.",
              isError: true,
              state: errorData.rateLimited ? "rate_limit" : "error",
            },
          ]);
          if (!errorData.rateLimited) {
            revertGuestTurn();
          }
          return;
        }

        const success = data as MoonieRecommendResponse;
        if (success.conversationId) {
          setConversationId(success.conversationId);
          conversationIdRef.current = success.conversationId;
        }
        if (typeof success.quotaRemaining === "number") {
          setQuotaRemaining(success.quotaRemaining);
        }
        if (typeof success.guestTurnsRemaining === "number") {
          setGuestTurnsRemaining(success.guestTurnsRemaining);
        }

        const assistantMessage = buildAssistantMessage(success);
        setMessages((current) => [...current, assistantMessage]);
        if (isGuestDemo && activeGuestConversationId) {
          persistActiveGuestConversation(
            [...messagesRef.current, userMessage, assistantMessage],
            activeGuestConversationId
          );
        }
        if (success.rememberPreferenceOffer && !isRememberPromptDismissed()) {
          setRememberPreferenceOffer(success.rememberPreferenceOffer);
        }
      } catch {
        revertGuestTurn();
        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            role: "assistant",
            content:
              "Moonie is having trouble reaching the reading archive. Please try again shortly.",
            isError: true,
            state: "error",
          },
        ]);
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [guestDemoCap, guestTurnsRemaining, isGuestDemo, isLoggedIn, persistActiveGuestConversation, searchRecentScope]
  );

  const hideNovel = useCallback((novelId: string) => {
    setExcludedNovelIds((ids) =>
      ids.includes(novelId) ? ids : [...ids, novelId]
    );
  }, []);

  const updateSpoilerMode = useCallback((mode: MoonieSpoilerMode) => {
    writeStoredSpoilerMode(mode);
    setSpoilerMode(mode);
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    loadingPhase,
    handleSubmit,
    conversationId,
    clearChat,
    resumeConversation,
    startNewConversation,
    resumeConversationFromSidebar,
    isRestoring,
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
