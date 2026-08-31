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
