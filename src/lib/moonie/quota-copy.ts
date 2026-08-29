import { MOONIE_DAILY_DISCOVERY_LIMIT } from "@/lib/moonie/constants";

export function formatDiscoveryQuotaRemaining(
  remaining: number,
  limit = MOONIE_DAILY_DISCOVERY_LIMIT
): string {
  return `${remaining} of ${limit} discovery requests left today`;
}

export function formatDiscoveryQuotaRemainingCompact(
  remaining: number,
  limit = MOONIE_DAILY_DISCOVERY_LIMIT
): string {
  return `${remaining}/${limit} left`;
}

export function formatDiscoveryQuotaUsed(
  used: number,
  limit = MOONIE_DAILY_DISCOVERY_LIMIT
): string {
  return `${used} / ${limit} discovery requests used today`;
}

export const MOONIE_RATE_LIMIT_TITLE = "Daily limit reached";

export function buildMoonieRateLimitBody(options?: {
  compact?: boolean;
  limit?: number;
}): string {
  const limit = options?.limit ?? MOONIE_DAILY_DISCOVERY_LIMIT;
  if (options?.compact) {
    return `You've reached today's limit of ${limit} novel discovery requests. Casual chat is still available. Discovery resets tomorrow.`;
  }
  return `You've reached today's limit of ${limit} novel discovery requests. Casual chat is still available. Recommendations, lookups, reading links, comparisons, and image discovery reset tomorrow.`;
}

export function buildMoonieRateLimitApiError(
  limit = MOONIE_DAILY_DISCOVERY_LIMIT
): string {
  return `You've used today's ${limit} Moonie discovery requests. Casual chat is still available. Discovery requests reset tomorrow.`;
}
