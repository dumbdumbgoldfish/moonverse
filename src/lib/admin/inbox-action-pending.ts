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
  state: InboxActionPendingState
): InboxActionPendingState {
  return INITIAL_INBOX_ACTION_PENDING_STATE;
}

export function inboxRemediationActionId(remediation: string): InboxPendingActionId {
  return `remediation:${remediation}`;
}
