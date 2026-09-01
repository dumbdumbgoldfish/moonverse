export type UserRowPendingActionId = string;

export interface UserRowPendingAction {
  userId: string;
  action: UserRowPendingActionId;
}

export interface UserRowPendingState {
  pendingAction: UserRowPendingAction | null;
}

export const INITIAL_USER_ROW_PENDING_STATE: UserRowPendingState = {
  pendingAction: null,
};

export function isUserRowBusy(
  state: UserRowPendingState,
  userId: string
): boolean {
  return state.pendingAction?.userId === userId;
}

export function isUserRowActionPending(
  state: UserRowPendingState,
  userId: string,
  action: UserRowPendingActionId
): boolean {
  return (
    state.pendingAction?.userId === userId &&
    state.pendingAction.action === action
  );
}

export function canBeginUserRowAction(
  state: UserRowPendingState,
  userId: string
): boolean {
  if (!state.pendingAction) {
    return true;
  }
  return state.pendingAction.userId !== userId;
}

export function beginUserRowAction(
  state: UserRowPendingState,
  userId: string,
  action: UserRowPendingActionId
): UserRowPendingState {
  if (!canBeginUserRowAction(state, userId)) {
    return state;
  }
  return {
    pendingAction: { userId, action },
  };
}

export function completeUserRowAction(
  state: UserRowPendingState
): UserRowPendingState {
  return INITIAL_USER_ROW_PENDING_STATE;
}

export function userSuspendActionId(isSuspended: boolean): UserRowPendingActionId {
  return isSuspended ? "unsuspend" : "suspend";
}
