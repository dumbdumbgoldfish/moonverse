import { db } from "@/lib/db";
import { MOONIE_DAILY_DISCOVERY_LIMIT } from "@/lib/moonie/constants";

function startOfUtcDay(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/** True when dev quota tools are explicitly enabled. Never in production deploys. */
export function isMoonieDevQuotaToolsEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  if (process.env.VERCEL_ENV === "production") {
    return false;
  }
  return process.env.MOONIE_DEV_QUOTA_TOOLS === "true";
}

/** Optional unlimited discovery quota for local QA (requires dev tools + explicit bypass flag). */
export function isMoonieDevQuotaBypassActive(): boolean {
  return (
    isMoonieDevQuotaToolsEnabled() &&
    process.env.MOONIE_DEV_QUOTA_BYPASS === "true"
  );
}

let bypassLogged = false;

export function logMoonieDevQuotaBypassOnce(): void {
  if (!isMoonieDevQuotaBypassActive() || bypassLogged) {
    return;
  }
  bypassLogged = true;
  console.warn(
    "[moonie:dev] MOONIE_DEV_QUOTA_BYPASS is active — discovery quota is not enforced locally."
  );
}

export function logMoonieDevQuotaToolsStatus(): void {
  if (!isMoonieDevQuotaToolsEnabled()) {
    return;
  }
  console.info(
    "[moonie:dev] MOONIE_DEV_QUOTA_TOOLS is enabled — use `npm run moonie:reset-quota` to clear today's discovery quota."
  );
  if (isMoonieDevQuotaBypassActive()) {
    logMoonieDevQuotaBypassOnce();
  }
}

/**
 * Deletes today's quota_reserved events for a user. Development only.
 * Returns the number of rows removed.
 */
export async function resetMoonieDailyQuota(userId: string): Promise<number> {
  if (!isMoonieDevQuotaToolsEnabled()) {
    throw new Error(
      "Moonie dev quota tools are disabled. Set MOONIE_DEV_QUOTA_TOOLS=true in .env (local only), then retry."
    );
  }

  const result = await db.moonieRecommendationEvent.deleteMany({
    where: {
      userId,
      event: "quota_reserved",
      createdAt: { gte: startOfUtcDay() },
    },
  });

  console.info(
    `[moonie:dev] Reset Moonie discovery quota for user ${userId}: removed ${result.count} quota_reserved event(s). ${MOONIE_DAILY_DISCOVERY_LIMIT} requests available again today.`
  );

  return result.count;
}
