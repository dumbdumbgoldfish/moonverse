import {
  buildNovelBundle,
  formatNovelBundleReply,
} from "@/services/moonie-novel-lookup.service";
import { buildNovelReviewsListResponse } from "@/services/moonie-novel-scoped-reviews.service";
import type {
  MoonieLookupSession,
  MoonieRecommendResponse,
  MoonieSpoilerMode,
} from "@/types/moonie";

export async function buildBatchNovelReviewsResponse(options: {
  novelIds: string[];
  userId?: string;
  spoilerMode: MoonieSpoilerMode;
}): Promise<MoonieRecommendResponse> {
  const groups = await Promise.all(
    options.novelIds.map(async (novelId) => {
      const bundle = await buildNovelBundle({
        novelId,
        userId: options.userId,
        spoilerMode: options.spoilerMode,
        reason: "Batch review lookup for recommendation set.",
      });
      return bundle.overview
        ? {
            novelId,
            title: bundle.overview.title,
            overview: bundle.overview,
          }
        : null;
    })
  );

  const valid = groups.filter(
    (group): group is NonNullable<typeof group> => group != null
  );

  if (valid.length === 0) {
    return {
      reply:
        "I could not load MoonVerse review summaries for those novels. Try naming one title at a time.",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: true,
      spoilerMode: options.spoilerMode,
      analyticsIntent: "novel_reviews",
    };
  }

  const lines = valid.map((group) => {
    const community = group.overview.community;
    if (!community || community.reviewCount === 0) {
      return `**${group.title}**: no MoonVerse reviews yet.`;
    }
    const rating =
      community.averageRating != null
        ? `${community.averageRating.toFixed(1)} average`
        : "no average yet";
    return `**${group.title}**: ${community.reviewCount} review${community.reviewCount === 1 ? "" : "s"} · ${rating}.`;
  });

  return {
    reply: `Review counts for the novels in this thread:\n\n${lines.join("\n")}`,
    recommendations: [],
    responseKind: "chat",
    novelReviewGroups: valid.map((group) => ({
      novelId: group.novelId,
      title: group.title,
      overview: group.overview,
    })),
    consumesQuota: true,
    spoilerMode: options.spoilerMode,
    analyticsIntent: "novel_reviews",
  };
}

export async function buildSingleNovelReviewsFromConfirmation(options: {
  novelId: string;
  userId?: string;
  spoilerMode: MoonieSpoilerMode;
  lookupSession: import("@/types/moonie").MoonieLookupSession;
  consumesQuota?: boolean;
}): Promise<MoonieRecommendResponse> {
  const bundle = await buildNovelBundle({
    novelId: options.novelId,
    userId: options.userId,
    spoilerMode: options.spoilerMode,
    reason: "Confirmed catalogue match for your review request.",
  });

  if (!bundle.overview) {
    return {
      reply: "I could not load that catalogue record. Try another match.",
      recommendations: [],
      lookupSession: options.lookupSession,
      responseKind: "chat",
      consumesQuota: true,
      spoilerMode: options.spoilerMode,
      analyticsIntent: "novel_reviews",
    };
  }

  const confirmedCandidate =
    options.lookupSession.candidates.find(
      (candidate) => candidate.novelId === options.novelId
    ) ?? null;

  const confirmedSession: import("@/types/moonie").MoonieLookupSession = {
    ...options.lookupSession,
    mode: "confirmed",
    confirmedNovelId: options.novelId,
    candidates: confirmedCandidate ? [confirmedCandidate] : [],
    pendingIntent: "NOVEL_REVIEWS",
  };

  const listResponse = await buildNovelReviewsListResponse({
    novelId: options.novelId,
    title: bundle.overview.title,
    overview: bundle.overview,
    spoilerMode: options.spoilerMode,
    lookupSession: confirmedSession,
  });

  return {
    ...listResponse,
    consumesQuota: options.consumesQuota ?? true,
  };
}
