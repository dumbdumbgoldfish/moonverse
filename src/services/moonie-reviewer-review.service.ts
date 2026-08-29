import {
  messageReferencesReviewerReviewSession,
  pickReviewerReviewByOrdinal,
  resolveReviewerReviewFollowUpKind,
  resolveReviewerReviewFollowUpTarget,
  resolveReviewerReviewOrdinalFromMessage,
} from "@/lib/moonie/reviewer-review-intent";
import { getReviewById } from "@/services/review.service";
import {
  buildNovelBundle,
  formatNovelBundleReply,
} from "@/services/moonie-novel-lookup.service";
import type {
  MoonieLookupSession,
  MoonieRecommendResponse,
  MoonieReviewerReviewSession,
  MoonieSpoilerMode,
} from "@/types/moonie";

function withActiveReviewerReviewIndex(
  session: MoonieReviewerReviewSession,
  index: number
): MoonieReviewerReviewSession {
  return { ...session, activeReviewIndex: index };
}

function confirmedLookupSessionForNovel(options: {
  novelId: string;
  novelTitle: string;
}): MoonieLookupSession {
  return {
    mode: "confirmed",
    query: options.novelTitle,
    candidates: [
      {
        novelId: options.novelId,
        title: options.novelTitle,
        canonicalTitle: options.novelTitle,
        confidence: "high",
        confidenceScore: 1,
        evidence: [],
        genres: [],
        tags: [],
        reason: "Resolved from reviewer-authored review context.",
      },
    ],
    confirmedNovelId: options.novelId,
    rejectedNovelIds: [],
  };
}

export async function buildReviewerReviewFollowUpResponse(options: {
  message: string;
  session: MoonieReviewerReviewSession | null;
  userId?: string;
  spoilerMode: MoonieSpoilerMode;
}): Promise<MoonieRecommendResponse | null> {
  const { message, session, userId, spoilerMode } = options;
  if (!session?.reviews.length) return null;
  if (!messageReferencesReviewerReviewSession(message)) return null;

  const ordinal = resolveReviewerReviewOrdinalFromMessage(message);
  if (ordinal == null) return null;

  const entry = pickReviewerReviewByOrdinal(session.reviews, ordinal);
  if (!entry) return null;

  const followUpKind = resolveReviewerReviewFollowUpKind(message);
  const target = resolveReviewerReviewFollowUpTarget(message);
  const updatedReviewSession = withActiveReviewerReviewIndex(session, entry.order);

  if (target === "review" && followUpKind === "REVIEW_DETAIL") {
    const review = await getReviewById(entry.reviewId);
    if (!review) {
      return {
        reply: "I couldn't load that review on MoonVerse.",
        recommendations: [],
        responseKind: "chat",
        consumesQuota: true,
        reviewerReviewSession: updatedReviewSession,
      };
    }

    const excerpt = review.excerpt?.trim() || review.body.slice(0, 180).trim();
    return {
      reply: [
        `**${review.title}**`,
        `Review of **${review.novelTitle}** · ★${review.rating}`,
        excerpt ? excerpt : null,
        `[Read full review](/reviews/${review.id})`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      recommendations: [],
      responseKind: "chat",
      consumesQuota: true,
      reviewerReviewSession: updatedReviewSession,
    };
  }

  const bundle = await buildNovelBundle({
    novelId: entry.novelId,
    userId,
    spoilerMode,
    reason: `Resolved from ${session.reviewerDisplayName}'s review of "${entry.novelTitle}".`,
  });

  if (!bundle.overview) {
    return {
      reply: "I couldn't load that novel from the review list on MoonVerse.",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: true,
      reviewerReviewSession: updatedReviewSession,
    };
  }

  const emphasizeReadingLink = followUpKind === "FIND_READING_SOURCE";
  const emphasizeReviews = followUpKind === "NOVEL_REVIEWS";

  return {
    reply: formatNovelBundleReply({
      overview: bundle.overview,
      emphasizeReadingLink,
      emphasizeReviews,
    }),
    recommendations: bundle.recommendation ? [bundle.recommendation] : [],
    novelOverview: bundle.overview,
    lookupSession: confirmedLookupSessionForNovel({
      novelId: entry.novelId,
      novelTitle: entry.novelTitle,
    }),
    responseKind: "novel_bundle",
    consumesQuota: true,
    spoilerMode,
    reviewerReviewSession: updatedReviewSession,
  };
}
