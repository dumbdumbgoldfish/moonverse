import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { MoonieConfidence } from "@/types/moonie";
import type { MoonieRecommendResponse } from "@/types/moonie";

export interface MoonieAnalyticsMeta {
  responseKind?: string;
  intent?: string;
  resultCount?: number;
  success?: boolean;
  confidenceTier?: string;
  clarification?: boolean;
  consumesQuota?: boolean;
  attachmentType?: string | null;
  spoilerMode?: string;
  /** Never store raw user message text here. */
}

export async function trackMoonieEvent(options: {
  event: string;
  userId?: string | null;
  novelId?: string | null;
  meta?: MoonieAnalyticsMeta;
}): Promise<void> {
  try {
    await db.moonieRecommendationEvent.create({
      data: {
        event: options.event,
        userId: options.userId ?? undefined,
        novelId: options.novelId ?? undefined,
        meta: (options.meta ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // analytics must not break recommendations
  }
}

/**
 * Moonie analytics persistence policy (Phase 4H):
 * - Stored: event type, timestamp, optional userId/novelId, structured meta JSON
 * - Meta may include: responseKind, intent, resultCount, success, confidenceTier, clarification flag
 * - NOT stored in moonieRecommendationEvent: raw chat text, image payloads, full preference blobs
 * - Chat text remains only in moonie_messages when users use conversational features (existing behaviour)
 */
export function resolveResponseConfidenceTier(
  result: Pick<
    MoonieRecommendResponse,
    | "responseKind"
    | "recommendations"
    | "novelOverview"
    | "lookupSession"
    | "state"
    | "analyticsConfidenceTier"
  >
): MoonieConfidence | undefined {
  if (result.analyticsConfidenceTier) {
    return result.analyticsConfidenceTier;
  }
  if (result.responseKind === "chat") return undefined;

  const recommendation = result.recommendations[0];
  if (recommendation?.confidence) return recommendation.confidence;
  if (result.novelOverview?.confidence) return result.novelOverview.confidence;

  const candidate = result.lookupSession?.candidates[0];
  if (candidate?.confidence) return candidate.confidence;
  if (result.lookupSession?.mode === "clarification") return "medium";
  if (result.state === "no_results") return "low";
  return undefined;
}
