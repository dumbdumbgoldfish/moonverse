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

export function completeReadingLinkRowAction(
  state: ReadingLinkHealthCheckUiState,
  linkId: string,
  outcome: { success: boolean; error?: string },
  patch?: ReadingLinkRowPatch
): ReadingLinkHealthCheckUiState {
  const next: ReadingLinkHealthCheckUiState = {
    ...state,
    pendingLinkId: null,
    pendingOperation: null,
  };

  if (!outcome.success) {
    if (!outcome.error) {
      return next;
    }
    return {
      ...next,
      errorsByLinkId: {
        ...state.errorsByLinkId,
        [linkId]: outcome.error,
      },
    };
  }

  const { [linkId]: _removed, ...errorsByLinkId } = state.errorsByLinkId;
  const rowPatch = patch ?? state.patchedById[linkId];
  return {
    ...next,
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

export function beginReadingLinkHealthCheck(
  state: ReadingLinkHealthCheckUiState,
  linkId: string
): ReadingLinkHealthCheckUiState {
  return beginReadingLinkRowAction(state, linkId, "health_check");
}

export function completeReadingLinkHealthCheck(
  state: ReadingLinkHealthCheckUiState,
  linkId: string,
  outcome: ReadingLinkHealthCheckOutcome
): ReadingLinkHealthCheckUiState {
  const clearedPending: ReadingLinkHealthCheckUiState = {
    ...state,
    pendingLinkId: null,
    pendingOperation: null,
  };

  if (outcome.success) {
    return completeReadingLinkRowAction(clearedPending, linkId, outcome, {
      healthStatus: outcome.healthStatus,
      lastCheckedAt: outcome.lastCheckedAt,
    });
  }

  return completeReadingLinkRowAction(clearedPending, linkId, outcome);
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
