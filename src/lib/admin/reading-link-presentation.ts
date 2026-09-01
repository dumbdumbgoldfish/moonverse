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
