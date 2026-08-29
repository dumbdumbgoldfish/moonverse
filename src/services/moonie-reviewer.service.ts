import { db } from "@/lib/db";
import { getInitials } from "@/lib/review-utils";
import {
  extractNamedReviewerQuery,
  extractReviewerLookupQuery,
  extractReviewerResultLimit,
  isReviewerAuthoredReviewsMessage,
  messageReferencesReviewerGroup,
  pickReviewerByOrdinal,
  resolveReviewerOrdinalFromMessage,
  resolveReviewerRankBy,
  resolveTargetReviewerFromSession,
} from "@/lib/moonie/reviewer-intent";
import { isFollowing } from "@/services/follow-queries";
import { getReviewsByUserId } from "@/services/review.service";
import { getUserById, searchUsers } from "@/services/user.service";
import type {
  MoonieRecommendResponse,
  MoonieReviewerGroupItem,
  MoonieReviewerGroupOverview,
  MoonieReviewerOverview,
  MoonieReviewerResult,
  MoonieReviewerReviewSession,
  MoonieReviewerSession,
} from "@/types/moonie";

export type MoonieReviewerRankBy = "reviews" | "followers";

export async function getMoonieRankedReviewers(
  limit: number,
  rankBy: MoonieReviewerRankBy
): Promise<MoonieReviewerResult[]> {
  const users = await db.user.findMany({
    where: { isSuspended: false, reviews: { some: {} } },
    orderBy:
      rankBy === "followers"
        ? [{ followers: { _count: "desc" } }, { reviews: { _count: "desc" } }]
        : [{ reviews: { _count: "desc" } }, { followers: { _count: "desc" } }],
    take: limit,
    select: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
      _count: { select: { reviews: true, followers: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    avatarInitials: getInitials(user.displayName),
    avatarUrl: user.avatarUrl,
    reviewCount: user._count.reviews,
    followerCount: user._count.followers,
  }));
}

function rankLabel(rankBy: MoonieReviewerRankBy): string {
  return rankBy === "followers" ? "follower count" : "published review count";
}

function deriveTopGenres(
  reviews: Array<{ genres: string[] }>,
  limit = 3
): string[] {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    for (const genre of review.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre]) => genre);
}

export async function buildMoonieReviewerOverview(options: {
  reviewerId: string;
  viewerId?: string;
  emphasizeAuthoredReviews?: boolean;
}): Promise<MoonieReviewerOverview | null> {
  const profile = await getUserById(options.reviewerId);
  if (!profile) return null;

  const reviews = await getReviewsByUserId(options.reviewerId);
  const authoredLimit = options.emphasizeAuthoredReviews ? 5 : 3;
  const recentReviews = reviews.slice(0, authoredLimit);
  const averageRatingGiven =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;
  const following = options.viewerId
    ? await isFollowing(options.viewerId, options.reviewerId)
    : false;

  return {
    id: profile.id,
    displayName: profile.displayName,
    username: profile.username,
    avatarInitials: getInitials(profile.displayName),
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    reviewCount: profile.reviewCount,
    followerCount: profile.followerCount,
    followingCount: profile.followingCount,
    averageRatingGiven,
    topGenres: deriveTopGenres(reviews),
    recentReviews: recentReviews.map((review) => ({
      id: review.id,
      title: review.title,
      rating: review.rating,
      novelId: review.novelId,
      novelTitle: review.novelTitle,
    })),
    isFollowing: following,
    emphasizeAuthoredReviews: options.emphasizeAuthoredReviews,
  };
}

function withActiveReviewerSession(
  session: MoonieReviewerSession,
  reviewerId: string
): MoonieReviewerSession {
  return { ...session, activeReviewerId: reviewerId };
}

function buildReviewerReviewSession(
  overview: MoonieReviewerOverview,
  reviews: Array<{
    id: string;
    title: string;
    rating: number;
    novelId: string;
    novelTitle: string;
  }>
): MoonieReviewerReviewSession {
  return {
    reviewerId: overview.id,
    reviewerDisplayName: overview.displayName,
    reviews: reviews.map((review, order) => ({
      reviewId: review.id,
      reviewTitle: review.title,
      novelId: review.novelId,
      novelTitle: review.novelTitle,
      rating: review.rating,
      order,
    })),
    activeReviewIndex: null,
  };
}

const GROUP_WIDGET_LIMIT = 3;
const GROUP_DESK_LIMIT = 5;

async function buildMoonieReviewerGroupItem(options: {
  reviewer: MoonieReviewerResult;
  viewerId?: string;
  includeRecentReview?: boolean;
}): Promise<MoonieReviewerGroupItem> {
  const profile = await getUserById(options.reviewer.id);
  const reviews = await getReviewsByUserId(options.reviewer.id);
  const following = options.viewerId
    ? await isFollowing(options.viewerId, options.reviewer.id)
    : false;
  const recent = reviews[0];

  return {
    id: options.reviewer.id,
    displayName: profile?.displayName ?? options.reviewer.displayName,
    username: profile?.username ?? options.reviewer.username,
    avatarInitials:
      profile?.displayName != null
        ? getInitials(profile.displayName)
        : options.reviewer.avatarInitials,
    avatarUrl: profile?.avatarUrl ?? options.reviewer.avatarUrl,
    reviewCount: profile?.reviewCount ?? options.reviewer.reviewCount,
    followerCount: profile?.followerCount ?? options.reviewer.followerCount,
    bio: profile?.bio ?? null,
    topGenres: deriveTopGenres(reviews, 2),
    isFollowing: following,
    recentReview:
      options.includeRecentReview && recent
        ? {
            id: recent.id,
            title: recent.title,
            novelTitle: recent.novelTitle,
            rating: recent.rating,
          }
        : null,
  };
}

export async function buildMoonieReviewerGroupOverviewResponse(options: {
  session: MoonieReviewerSession;
  userId?: string;
  emphasizeAuthoredReviews?: boolean;
  limit?: number;
}): Promise<MoonieRecommendResponse> {
  const limit = options.limit ?? GROUP_WIDGET_LIMIT;
  const reviewers = options.session.reviewers.slice(0, limit);
  const items = await Promise.all(
    reviewers.map((reviewer) =>
      buildMoonieReviewerGroupItem({
        reviewer,
        viewerId: options.userId,
        includeRecentReview: options.emphasizeAuthoredReviews,
      })
    )
  );

  const groupOverview: MoonieReviewerGroupOverview = {
    reviewers: items,
    emphasizeAuthoredReviews: options.emphasizeAuthoredReviews,
  };

  const reply = options.emphasizeAuthoredReviews
    ? `Here are recent reviews from these ${items.length} MoonVerse reviewers.`
    : `Here are ${items.length} MoonVerse reviewers from your list.`;

  return {
    reply,
    recommendations: [],
    responseKind: "chat",
    consumesQuota: true,
    reviewerGroupOverview: groupOverview,
    reviewerSession: options.session,
  };
}

export async function buildMoonieReviewerOverviewResponse(options: {
  message: string;
  userId?: string;
  reviewerSession?: MoonieReviewerSession | null;
  activeReviewerId?: string | null;
  emphasizeAuthoredReviews?: boolean;
}): Promise<MoonieRecommendResponse> {
  const namedQuery =
    extractNamedReviewerQuery(options.message) ??
    extractReviewerLookupQuery(options.message);
  let targetId: string | null = null;
  let session = options.reviewerSession ?? null;

  const fromSession = resolveTargetReviewerFromSession({
    message: options.message,
    session,
    activeReviewerId: options.activeReviewerId,
  });

  const wantsGroupOverview =
    session &&
    session.reviewers.length > 1 &&
    !fromSession &&
    !namedQuery &&
    resolveReviewerOrdinalFromMessage(options.message) == null &&
    (messageReferencesReviewerGroup(options.message) ||
      (options.emphasizeAuthoredReviews &&
        isReviewerAuthoredReviewsMessage(options.message)));

  if (wantsGroupOverview && session) {
    return buildMoonieReviewerGroupOverviewResponse({
      session,
      userId: options.userId,
      emphasizeAuthoredReviews: options.emphasizeAuthoredReviews,
    });
  }

  if (fromSession) {
    targetId = fromSession.id;
  } else if (namedQuery) {
    const users = await searchUsers(namedQuery, 1, 0, options.userId);
    targetId = users[0]?.id ?? null;
    if (users[0] && !session) {
      session = {
        reviewers: users.map((user) => ({
          id: user.id,
          displayName: user.displayName,
          username: user.username,
          avatarInitials: user.avatarInitials,
          avatarUrl: user.avatarUrl,
          reviewCount: user.reviewCount,
          followerCount: user.followerCount,
          isFollowing: user.isFollowing,
        })),
        rankBy: "reviews",
        queryType: "lookup",
        activeReviewerId: users[0].id,
      };
    }
  }

  if (!targetId) {
    const ordinal = resolveReviewerOrdinalFromMessage(options.message);
    if (ordinal != null) {
      const limit = Math.max(
        extractReviewerResultLimit(options.message),
        ordinal === -1 ? 1 : ordinal + 1
      );
      const rankBy = resolveReviewerRankBy(options.message);
      const ranked = await getMoonieRankedReviewers(limit, rankBy);
      if (ranked.length > 0) {
        session =
          session ??
          ({
            reviewers: ranked,
            rankBy,
            queryType: "ranking",
          } satisfies MoonieReviewerSession);
        const pick = pickReviewerByOrdinal(ranked, ordinal);
        if (pick) targetId = pick.id;
      }
    }
  }

  if (!targetId) {
    return {
      reply:
        "Which reviewer do you mean? Try the rank number from the list, or name a reviewer like @username.",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: true,
      reviewerSession: session ?? undefined,
    };
  }

  const overview = await buildMoonieReviewerOverview({
    reviewerId: targetId,
    viewerId: options.userId,
    emphasizeAuthoredReviews: options.emphasizeAuthoredReviews,
  });

  if (!overview) {
    return {
      reply: "I couldn't load that reviewer profile on MoonVerse.",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: true,
      reviewerSession: session ?? undefined,
    };
  }

  const updatedSession = session
    ? withActiveReviewerSession(session, overview.id)
    : {
        reviewers: [
          {
            id: overview.id,
            displayName: overview.displayName,
            username: overview.username,
            avatarInitials: overview.avatarInitials,
            avatarUrl: overview.avatarUrl,
            reviewCount: overview.reviewCount,
            followerCount: overview.followerCount,
            isFollowing: overview.isFollowing,
          },
        ],
        rankBy: "reviews" as const,
        queryType: "lookup" as const,
        activeReviewerId: overview.id,
      };

  const reply = options.emphasizeAuthoredReviews
    ? `Here are recent reviews by ${overview.displayName} on MoonVerse.`
    : `Here's ${overview.displayName} on MoonVerse.`;

  const reviewerReviewSession = options.emphasizeAuthoredReviews
    ? buildReviewerReviewSession(
        overview,
        overview.recentReviews.map((review) => ({
          id: review.id,
          title: review.title,
          rating: review.rating,
          novelId: review.novelId,
          novelTitle: review.novelTitle,
        }))
      )
    : undefined;

  return {
    reply,
    recommendations: [],
    responseKind: "chat",
    consumesQuota: true,
    reviewerOverview: overview,
    reviewerSession: updatedSession,
    reviewerReviewSession,
  };
}

export async function buildMoonieReviewerResponse(options: {
  message: string;
  userId?: string;
}): Promise<MoonieRecommendResponse> {
  const lookupQuery = extractReviewerLookupQuery(options.message);
  if (lookupQuery) {
    const users = await searchUsers(lookupQuery, 5, 0, options.userId);
    if (users.length === 0) {
      return {
        reply: `I couldn't find a MoonVerse reviewer matching "${lookupQuery}". Try Community search or check the username spelling.`,
        recommendations: [],
        responseKind: "chat",
        consumesQuota: true,
        reviewerResults: [],
      };
    }

    if (users.length === 1) {
      return buildMoonieReviewerOverviewResponse({
        message: options.message,
        userId: options.userId,
        reviewerSession: {
          reviewers: users.map((user) => ({
            id: user.id,
            displayName: user.displayName,
            username: user.username,
            avatarInitials: user.avatarInitials,
            avatarUrl: user.avatarUrl,
            reviewCount: user.reviewCount,
            followerCount: user.followerCount,
            isFollowing: user.isFollowing,
          })),
          rankBy: "reviews",
          queryType: "lookup",
          activeReviewerId: users[0]!.id,
        },
      });
    }

    const session: MoonieReviewerSession = {
      reviewers: users.map((user) => ({
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        avatarInitials: user.avatarInitials,
        avatarUrl: user.avatarUrl,
        reviewCount: user.reviewCount,
        followerCount: user.followerCount,
        isFollowing: user.isFollowing,
      })),
      rankBy: "reviews",
      queryType: "lookup",
    };

    return {
      reply: `Here are ${users.length} MoonVerse reviewers matching "${lookupQuery}".`,
      recommendations: [],
      responseKind: "chat",
      consumesQuota: true,
      reviewerResults: session.reviewers,
      reviewerSession: session,
    };
  }

  const limit = extractReviewerResultLimit(options.message);
  const rankBy = resolveReviewerRankBy(options.message);
  const reviewers = await getMoonieRankedReviewers(limit, rankBy);

  if (reviewers.length === 0) {
    return {
      reply:
        "Moonie can search novels, reviews, links, and recommendations, but there are no ranked reviewers in the catalogue yet.",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: true,
      reviewerResults: [],
    };
  }

  const session: MoonieReviewerSession = {
    reviewers,
    rankBy,
    queryType: "ranking",
  };

  return {
    reply: `Here are ${reviewers.length} active MoonVerse reviewers ranked by ${rankLabel(rankBy)}.`,
    recommendations: [],
    responseKind: "chat",
    consumesQuota: true,
    reviewerResults: reviewers,
    reviewerSession: session,
  };
}
