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

/** Apply a server mutation to exactly one reading-link row by stable id. */
export function patchReadingLinkRowById<T extends { id: string }>(
  rows: T[],
  linkId: string,
  patch: Partial<T>
): T[] {
  return rows.map((row) => (row.id === linkId ? { ...row, ...patch } : row));
}

export interface ReadingLinkHealthCheckRowPatch {
  healthStatus: string;
  lastCheckedAt: string | null;
}

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
  errorsByLinkId: Record<string, string>;
  patchedById: Record<string, ReadingLinkHealthCheckRowPatch>;
}

export function beginReadingLinkHealthCheck(
  state: ReadingLinkHealthCheckUiState,
  linkId: string
): ReadingLinkHealthCheckUiState {
  const { [linkId]: _removed, ...errorsByLinkId } = state.errorsByLinkId;
  return {
    ...state,
    pendingLinkId: linkId,
    errorsByLinkId,
  };
}

export function completeReadingLinkHealthCheck(
  state: ReadingLinkHealthCheckUiState,
  linkId: string,
  outcome: ReadingLinkHealthCheckOutcome
): ReadingLinkHealthCheckUiState {
  const next: ReadingLinkHealthCheckUiState = {
    ...state,
    pendingLinkId: null,
  };

  if (outcome.success) {
    const { [linkId]: _removed, ...errorsByLinkId } = state.errorsByLinkId;
    return {
      ...next,
      errorsByLinkId,
      patchedById: {
        ...state.patchedById,
        [linkId]: {
          healthStatus: outcome.healthStatus,
          lastCheckedAt: outcome.lastCheckedAt,
        },
      },
    };
  }

  return {
    ...next,
    errorsByLinkId: {
      ...state.errorsByLinkId,
      [linkId]: outcome.error,
    },
  };
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
