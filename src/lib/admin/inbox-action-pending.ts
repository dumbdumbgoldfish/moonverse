export type InboxPendingActionId = string;

export interface InboxPendingAction {
  itemId: string;
  action: InboxPendingActionId;
}

export interface InboxActionPendingState {
  pendingAction: InboxPendingAction | null;
}

export const INITIAL_INBOX_ACTION_PENDING_STATE: InboxActionPendingState = {
  pendingAction: null,
};

export function isInboxItemBusy(
  state: InboxActionPendingState,
  itemId: string
): boolean {
  return state.pendingAction?.itemId === itemId;
}

export function isInboxActionPending(
  state: InboxActionPendingState,
  itemId: string,
  action: InboxPendingActionId
): boolean {
  return (
    state.pendingAction?.itemId === itemId &&
    state.pendingAction.action === action
  );
}

export function canBeginInboxAction(
  state: InboxActionPendingState,
  itemId: string,
  _action: InboxPendingActionId
): boolean {
  if (!state.pendingAction) {
    return true;
  }
  return state.pendingAction.itemId !== itemId;
}

export function beginInboxAction(
  state: InboxActionPendingState,
  itemId: string,
  action: InboxPendingActionId
): InboxActionPendingState {
  if (!canBeginInboxAction(state, itemId, action)) {
    return state;
  }
  return {
    pendingAction: { itemId, action },
  };
}

export function completeInboxAction(
  state: InboxActionPendingState,
  itemId?: string
): InboxActionPendingState {
  if (itemId && state.pendingAction?.itemId !== itemId) {
    return state;
  }
  return INITIAL_INBOX_ACTION_PENDING_STATE;
}

export function clearInboxPendingIfMatch(
  state: InboxActionPendingState,
  itemId: string,
  action?: InboxPendingActionId
): InboxActionPendingState {
  if (state.pendingAction?.itemId !== itemId) {
    return state;
  }
  if (action && state.pendingAction.action !== action) {
    return state;
  }
  return INITIAL_INBOX_ACTION_PENDING_STATE;
}

export type InboxActionOutcome = { success: boolean; error?: string };

export async function runInboxActionLifecycle(
  state: InboxActionPendingState,
  itemId: string,
  action: InboxPendingActionId,
  actionFn: () => Promise<InboxActionOutcome>
): Promise<InboxActionPendingState> {
  if (!canBeginInboxAction(state, itemId, action)) {
    return state;
  }

  let current = beginInboxAction(state, itemId, action);
  try {
    await actionFn();
    current = completeInboxAction(current, itemId);
    return current;
  } catch {
    current = completeInboxAction(current, itemId);
    return current;
  } finally {
    current = clearInboxPendingIfMatch(current, itemId, action);
  }
}

export function inboxRemediationActionId(remediation: string): InboxPendingActionId {
  return `remediation:${remediation}`;
}
