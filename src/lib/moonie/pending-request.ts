export type MooniePendingRequest = {
  requestId: string;
  conversationId: string | undefined;
};

export function mooniePendingLoadingVisible(
  pending: MooniePendingRequest | null,
  activeConversationId: string | undefined
): boolean {
  if (!pending) return false;
  if (pending.conversationId == null) {
    return activeConversationId == null;
  }
  return pending.conversationId === activeConversationId;
}

export function shouldApplyMooniePendingResponse(options: {
  pending: MooniePendingRequest | null;
  requestId: string;
  activeConversationId: string | undefined;
  responseConversationId?: string;
  requestAbandoned: boolean;
}): boolean {
  if (options.requestAbandoned) return false;
  const pending = options.pending;
  if (!pending || pending.requestId !== options.requestId) return false;

  if (pending.conversationId == null) {
    return (
      options.activeConversationId == null ||
      options.activeConversationId === options.responseConversationId
    );
  }

  return options.activeConversationId === pending.conversationId;
}
