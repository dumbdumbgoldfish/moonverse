import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { MOONIE_DAILY_DISCOVERY_LIMIT } from "@/lib/moonie/constants";
import {
  isMoonieDevQuotaBypassActive,
  logMoonieDevQuotaBypassOnce,
} from "@/lib/moonie/dev-quota";

function startOfUtcDay(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/**
 * Atomically reserves one daily request. A serializable transaction prevents
 * concurrent requests from both passing the same count check.
 */
export async function peekMoonieQuota(userId: string): Promise<{
  remaining: number;
  used: number;
}> {
  if (isMoonieDevQuotaBypassActive()) {
    logMoonieDevQuotaBypassOnce();
    return { used: 0, remaining: MOONIE_DAILY_DISCOVERY_LIMIT };
  }

  const count = await db.moonieRecommendationEvent.count({
    where: {
      userId,
      event: "quota_reserved",
      createdAt: { gte: startOfUtcDay() },
    },
  });
  return {
    used: count,
    remaining: Math.max(0, MOONIE_DAILY_DISCOVERY_LIMIT - count),
  };
}

export async function consumeMoonieQuota(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  if (isMoonieDevQuotaBypassActive()) {
    logMoonieDevQuotaBypassOnce();
    return { allowed: true, remaining: MOONIE_DAILY_DISCOVERY_LIMIT };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.$transaction(
        async (tx) => {
          const count = await tx.moonieRecommendationEvent.count({
            where: {
              userId,
              event: "quota_reserved",
              createdAt: { gte: startOfUtcDay() },
            },
          });
          if (count >= MOONIE_DAILY_DISCOVERY_LIMIT) {
            return { allowed: false, remaining: 0 };
          }
          await tx.moonieRecommendationEvent.create({
            data: { userId, event: "quota_reserved" },
          });
          return {
            allowed: true,
            remaining: Math.max(0, MOONIE_DAILY_DISCOVERY_LIMIT - count - 1),
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 2
      ) {
        continue;
      }
      throw error;
    }
  }
  return { allowed: false, remaining: 0 };
}

export {
  MOONIE_DAILY_DISCOVERY_LIMIT,
  MOONIE_DAILY_LIMIT,
} from "@/lib/moonie/constants";
