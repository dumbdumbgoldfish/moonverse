export type AdminBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

const HEALTH_VARIANTS: Record<string, AdminBadgeVariant> = {
  HEALTHY: "default",
  REDIRECTED: "secondary",
  BROKEN: "destructive",
  UNKNOWN: "outline",
};

export function readingLinkHealthBadgeVariant(
  healthStatus: string
): AdminBadgeVariant {
  return HEALTH_VARIANTS[healthStatus] ?? "outline";
}

export function readingLinkHealthBadgeClassName(
  healthStatus: string
): string | undefined {
  if (healthStatus === "STALE") {
    return "border-amber-400/25 bg-amber-500/15 text-amber-200";
  }
  return undefined;
}

/** Apply a server mutation to exactly one reading-link row by stable id. */
export function patchReadingLinkRowById<T extends { id: string }>(
  rows: T[],
  linkId: string,
  patch: Partial<T>
): T[] {
  return rows.map((row) => (row.id === linkId ? { ...row, ...patch } : row));
}

export interface ReadingLinkHealthCheckRowPatch {
  healthStatus?: string;
  lastCheckedAt?: string | null;
  moderationStatus?: string;
}

export type ReadingLinkRowPatch = ReadingLinkHealthCheckRowPatch;

export type ReadingLinkRowPendingOperation =
  | "health_check"
  | "approve"
  | "reject";

export type ReadingLinkHealthCheckOutcome =
  | {
      success: true;
      linkId: string;
      healthStatus: string;
      lastCheckedAt: string | null;
    }
  | { success: false; error: string };

export interface ReadingLinkHealthCheckUiState {
  pendingLinkId: string | null;
  pendingOperation: ReadingLinkRowPendingOperation | null;
  errorsByLinkId: Record<string, string>;
  patchedById: Record<string, ReadingLinkRowPatch>;
}

export function isReadingLinkRowBusy(
  state: ReadingLinkHealthCheckUiState,
  linkId: string
): boolean {
  return state.pendingLinkId === linkId;
}

export function canBeginReadingLinkRowAction(
  state: ReadingLinkHealthCheckUiState,
  linkId: string
): boolean {
  return !isReadingLinkRowBusy(state, linkId);
}

export function beginReadingLinkRowAction(
  state: ReadingLinkHealthCheckUiState,
  linkId: string,
  operation: ReadingLinkRowPendingOperation
): ReadingLinkHealthCheckUiState {
  if (isReadingLinkRowBusy(state, linkId)) {
    return state;
  }

  const next: ReadingLinkHealthCheckUiState = {
    ...state,
    pendingLinkId: linkId,
    pendingOperation: operation,
  };

  if (operation === "health_check") {
    const { [linkId]: _removed, ...errorsByLinkId } = state.errorsByLinkId;
    return { ...next, errorsByLinkId };
  }

  return next;
}

/** Apply row patches/errors without clearing pending — caller owns pending cleanup. */
export function applyReadingLinkRowOutcome(
  state: ReadingLinkHealthCheckUiState,
  linkId: string,
  outcome: { success: boolean; error?: string },
  patch?: ReadingLinkRowPatch
): ReadingLinkHealthCheckUiState {
  if (!outcome.success) {
    if (!outcome.error) {
      return state;
    }
    return {
      ...state,
      errorsByLinkId: {
        ...state.errorsByLinkId,
        [linkId]: outcome.error,
      },
    };
  }

  const { [linkId]: _removed, ...errorsByLinkId } = state.errorsByLinkId;
  const rowPatch = patch ?? state.patchedById[linkId];
  return {
    ...state,
    errorsByLinkId,
    patchedById: rowPatch
      ? {
          ...state.patchedById,
          [linkId]: {
            ...state.patchedById[linkId],
            ...rowPatch,
          },
        }
      : state.patchedById,
  };
}

export function completeReadingLinkRowAction(
  state: ReadingLinkHealthCheckUiState,
  linkId: string,
  outcome: { success: boolean; error?: string },
  patch?: ReadingLinkRowPatch
): ReadingLinkHealthCheckUiState {
  const applied = applyReadingLinkRowOutcome(state, linkId, outcome, patch);
  return clearReadingLinkRowPendingIfMatch(applied, linkId);
}

export function beginReadingLinkHealthCheck(
  state: ReadingLinkHealthCheckUiState,
  linkId: string
): ReadingLinkHealthCheckUiState {
  return beginReadingLinkRowAction(state, linkId, "health_check");
}

export function applyReadingLinkHealthCheckOutcome(
  state: ReadingLinkHealthCheckUiState,
  linkId: string,
  outcome: ReadingLinkHealthCheckOutcome
): ReadingLinkHealthCheckUiState {
  if (outcome.success) {
    return applyReadingLinkRowOutcome(state, linkId, outcome, {
      healthStatus: outcome.healthStatus,
      lastCheckedAt: outcome.lastCheckedAt,
    });
  }

  return applyReadingLinkRowOutcome(state, linkId, outcome);
}

export function completeReadingLinkHealthCheck(
  state: ReadingLinkHealthCheckUiState,
  linkId: string,
  outcome: ReadingLinkHealthCheckOutcome
): ReadingLinkHealthCheckUiState {
  const applied = applyReadingLinkHealthCheckOutcome(state, linkId, outcome);
  return clearReadingLinkRowPendingIfMatch(applied, linkId, "health_check");
}

export function clearReadingLinkRowPendingIfMatch(
  state: ReadingLinkHealthCheckUiState,
  linkId: string,
  _operation?: ReadingLinkRowPendingOperation
): ReadingLinkHealthCheckUiState {
  if (state.pendingLinkId !== linkId) {
    return state;
  }
  return {
    ...state,
    pendingLinkId: null,
    pendingOperation: null,
  };
}

export type ReadingLinkRowActionOutcome = { success: boolean; error?: string };

export async function runReadingLinkRowActionLifecycle(
  state: ReadingLinkHealthCheckUiState,
  linkId: string,
  operation: ReadingLinkRowPendingOperation,
  action: () => Promise<ReadingLinkRowActionOutcome>,
  patch?: ReadingLinkRowPatch
): Promise<ReadingLinkHealthCheckUiState> {
  if (!canBeginReadingLinkRowAction(state, linkId)) {
    return state;
  }

  let current = beginReadingLinkRowAction(state, linkId, operation);
  try {
    const result = await action();
    current = completeReadingLinkRowAction(current, linkId, result, patch);
  } catch (error) {
    current = completeReadingLinkRowAction(current, linkId, {
      success: false,
      error: error instanceof Error ? error.message : "Action failed.",
    }, patch);
  } finally {
    current = clearReadingLinkRowPendingIfMatch(current, linkId, operation);
  }
  return current;
}

export async function runReadingLinkHealthCheckLifecycle(
  state: ReadingLinkHealthCheckUiState,
  linkId: string,
  action: () => Promise<ReadingLinkHealthCheckOutcome>
): Promise<ReadingLinkHealthCheckUiState> {
  if (!canBeginReadingLinkRowAction(state, linkId)) {
    return state;
  }

  let current = beginReadingLinkHealthCheck(state, linkId);
  try {
    const result = await action();
    current = completeReadingLinkHealthCheck(current, linkId, result);
  } catch (error) {
    current = completeReadingLinkHealthCheck(current, linkId, {
      success: false,
      error: error instanceof Error ? error.message : "Action failed.",
    });
  } finally {
    current = clearReadingLinkRowPendingIfMatch(current, linkId, "health_check");
  }
  return current;
}

export function mergeReadingLinkRowPatches<T extends { id: string }>(
  rows: T[],
  patchedById: Record<string, Partial<T>>
): T[] {
  return rows.map((row) => ({
    ...row,
    ...patchedById[row.id],
  }));
}
