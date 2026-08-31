import { MOONIE_DAILY_DISCOVERY_LIMIT } from "@/lib/moonie/constants";

export const MOONIE_GUEST_RATE_LIMIT_TITLE = "Demo limit reached";

export function formatGuestQuotaUsed(used: number, cap: number): string {
  return `${used} / ${cap} free turns used`;
}

export function buildGuestRateLimitBody(options?: { compact?: boolean }): string {
  if (options?.compact) {
    return "Create an account to keep taste, shelves, and multi-turn refine on this desk.";
  }
  return "You have used your free Moonie demo turns. Create an account for personalised chats, saved recommendations, and your library desk.";
}

export function buildGuestRateLimitApiError(): string {
  return "You have used your free Moonie demo turns. Create an account for personalised chats and saved recommendations.";
}

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
