import type { MoonieChatMessage } from "@/types/moonie";
import { buildAssistantMessage } from "@/hooks/use-moonie-chat";
import {
  mooniePendingLoadingVisible,
  shouldApplyMooniePendingResponse,
  type MooniePendingRequest,
} from "@/lib/moonie/pending-request";
import type {
  MoonieRecommendErrorResponse,
  MoonieRecommendResponse,
} from "@/types/moonie";

export type ProcessMoonieRecommendResponseInput = {
  responseOk: boolean;
  data: MoonieRecommendResponse | MoonieRecommendErrorResponse;
  requestId: string;
  requestEpoch: number;
  requestEpochRef: number;
  pending: MooniePendingRequest | null;
  activeConversationId: string | undefined;
  activeGuestConversationId: string | undefined;
  isGuestDemo: boolean;
  deskRouteEnabled: boolean;
};

export type ProcessMoonieRecommendResponseResult = {
  canApply: boolean;
  kind: "ignored" | "error" | "success";
  conversationId?: string;
  clearNewChatIntent?: boolean;
  assistantMessage?: MoonieChatMessage;
  errorMessage?: MoonieChatMessage;
  revertGuestTurn: boolean;
  rateLimited?: boolean;
  quotaRemaining?: number | null;
  guestTurnsRemaining?: number | null;
};

function createMessageId(): string {
  return `msg-${Math.random().toString(36).slice(2)}`;
}

export function processMoonieRecommendResponse(
  input: ProcessMoonieRecommendResponseInput
): ProcessMoonieRecommendResponseResult {
  const requestAbandoned = input.requestEpoch !== input.requestEpochRef;
  const responseConversationId =
    "conversationId" in input.data && typeof input.data.conversationId === "string"
      ? input.data.conversationId
      : input.activeGuestConversationId;
  const canApply = shouldApplyMooniePendingResponse({
    pending: input.pending,
    requestId: input.requestId,
    activeConversationId: input.activeConversationId,
    responseConversationId,
    requestAbandoned,
  });

  if (!input.responseOk || "error" in input.data) {
    const errorData = input.data as MoonieRecommendErrorResponse;
    const rateLimited = Boolean(errorData.rateLimited);
    if (!canApply) {
      return {
        canApply: false,
        kind: "ignored",
        revertGuestTurn: !rateLimited,
        rateLimited,
        quotaRemaining:
          rateLimited && !input.isGuestDemo
            ? typeof errorData.quotaRemaining === "number"
              ? errorData.quotaRemaining
              : 0
            : undefined,
        guestTurnsRemaining:
          rateLimited && input.isGuestDemo ? 0 : undefined,
      };
    }
    return {
      canApply: true,
      kind: "error",
      revertGuestTurn: !rateLimited,
      rateLimited,
      quotaRemaining:
        rateLimited && !input.isGuestDemo
          ? typeof errorData.quotaRemaining === "number"
            ? errorData.quotaRemaining
            : 0
          : undefined,
      guestTurnsRemaining:
        rateLimited && input.isGuestDemo ? 0 : undefined,
      errorMessage: {
        id: createMessageId(),
        role: "assistant",
        content: errorData.error ?? "Something went wrong. Please try again.",
        animateEntrance: true,
        isError: true,
        state: rateLimited ? "rate_limit" : "error",
        quotaAudience: rateLimited
          ? input.isGuestDemo
            ? "guest"
            : "member"
          : undefined,
      },
    };
  }

  const success = input.data as MoonieRecommendResponse;
  if (!canApply) {
    return {
      canApply: false,
      kind: "ignored",
      revertGuestTurn: false,
      quotaRemaining:
        typeof success.quotaRemaining === "number"
          ? success.quotaRemaining
          : undefined,
      guestTurnsRemaining:
        typeof success.guestTurnsRemaining === "number"
          ? success.guestTurnsRemaining
          : undefined,
    };
  }

  return {
    canApply: true,
    kind: "success",
    revertGuestTurn: false,
    conversationId: success.conversationId,
    clearNewChatIntent:
      Boolean(success.conversationId) && input.deskRouteEnabled,
    assistantMessage: buildAssistantMessage(success),
    quotaRemaining:
      typeof success.quotaRemaining === "number"
        ? success.quotaRemaining
        : undefined,
    guestTurnsRemaining:
      typeof success.guestTurnsRemaining === "number"
        ? success.guestTurnsRemaining
        : undefined,
  };
}

export function moonieSubmitBlocked(
  pending: MooniePendingRequest | null,
  activeConversationId: string | undefined
): boolean {
  return mooniePendingLoadingVisible(pending, activeConversationId);
}
