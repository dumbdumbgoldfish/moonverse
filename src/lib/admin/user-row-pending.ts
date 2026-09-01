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
  state: UserRowPendingState,
  userId?: string
): UserRowPendingState {
  if (userId) {
    return clearUserRowPendingIfMatch(state, userId);
  }
  return INITIAL_USER_ROW_PENDING_STATE;
}

export function clearUserRowPendingIfMatch(
  state: UserRowPendingState,
  userId: string,
  action?: UserRowPendingActionId
): UserRowPendingState {
  if (state.pendingAction?.userId !== userId) {
    return state;
  }
  if (action && state.pendingAction.action !== action) {
    return state;
  }
  return INITIAL_USER_ROW_PENDING_STATE;
}

export type UserRowActionOutcome = { success: boolean; error?: string };

export async function runUserRowActionLifecycle(
  state: UserRowPendingState,
  userId: string,
  action: UserRowPendingActionId,
  actionFn: () => Promise<UserRowActionOutcome>
): Promise<UserRowPendingState> {
  if (!canBeginUserRowAction(state, userId)) {
    return state;
  }

  let current = beginUserRowAction(state, userId, action);
  try {
    await actionFn();
    current = completeUserRowAction(current, userId);
    return current;
  } catch {
    current = completeUserRowAction(current, userId);
    return current;
  } finally {
    current = clearUserRowPendingIfMatch(current, userId, action);
  }
}

export function userSuspendActionId(isSuspended: boolean): UserRowPendingActionId {
  return isSuspended ? "unsuspend" : "suspend";
}
