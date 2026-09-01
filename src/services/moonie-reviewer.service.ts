import { db } from "@/lib/db";
import { getInitials } from "@/lib/review-utils";
import {
  extractAtUsernameQuery,
  extractNamedReviewerQuery,
  extractReviewerLookupQuery,
  extractReviewerResultLimit,
  isReviewerAuthoredReviewsMessage,
  isReviewerFolderRequest,
  isReviewerListRequest,
  messageReferencesActiveReviewer,
  messageReferencesReviewerGroup,
  pickReviewerByOrdinal,
  resolveReviewerOrdinalFromMessage,
  resolveReviewerRankBy,
  resolveTargetReviewerFromSession,
} from "@/lib/moonie/reviewer-intent";
import { buildMoonieReviewerFolderReply } from "@/lib/moonie/reviewer-folder-reply";
import { isFollowing } from "@/services/follow-queries";
import { getFoldersByUser } from "@/services/folder.service";
import { getReviewsByUserId } from "@/services/review.service";
import { getUserById, getUserByUsername, searchUsers } from "@/services/user.service";
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
  authoredReviewsLimit?: number;
}): Promise<MoonieReviewerOverview | null> {
  const profile = await getUserById(options.reviewerId);
  if (!profile) return null;

  const reviews = await getReviewsByUserId(options.reviewerId);
  const authoredLimit = options.emphasizeAuthoredReviews
    ? options.authoredReviewsLimit ?? AUTHORED_REVIEWS_PAGE_SIZE
    : 3;
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

function synthesizeReviewerOverviewFromResult(
  reviewer: MoonieReviewerResult
): MoonieReviewerOverview {
  return {
    id: reviewer.id,
    displayName: reviewer.displayName,
    username: reviewer.username,
    avatarInitials: reviewer.avatarInitials,
    avatarUrl: reviewer.avatarUrl,
    bio: null,
    reviewCount: reviewer.reviewCount,
    followerCount: reviewer.followerCount,
    followingCount: 0,
    averageRatingGiven: null,
    topGenres: [],
    recentReviews: [],
    isFollowing: reviewer.isFollowing,
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
const AUTHORED_REVIEWS_PAGE_SIZE = 25;

function normalizeReviewerMessage(message: string): string {
  return message.trim().replace(/\breviwer(s?)\b/gi, "reviewer$1");
}

async function buildMoonieReviewerGroupItem(options: {
  reviewer: MoonieReviewerResult;
  viewerId?: string;
  includeRecentReview?: boolean;
}): Promise<MoonieReviewerGroupItem> {
  const profile = await getUserById(options.reviewer.id);
  const reviews = profile ? await getReviewsByUserId(options.reviewer.id) : [];
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
  message?: string;
}): Promise<MoonieRecommendResponse> {
  const totalInSession = options.session.reviewers.length;
  const requestedLimit = options.limit ?? GROUP_WIDGET_LIMIT;
  const limit = Math.min(totalInSession, requestedLimit);
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
    : limit < totalInSession
      ? `Here are ${items.length} of ${totalInSession} MoonVerse reviewers from your list. Ask for the rest or name a rank number.`
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
  activeReviewerUsername?: string | null;
  emphasizeAuthoredReviews?: boolean;
}): Promise<MoonieRecommendResponse> {
  const explicitAtUsername = extractAtUsernameQuery(options.message);
  const namedQuery =
    extractNamedReviewerQuery(options.message) ??
    extractReviewerLookupQuery(options.message);
  let targetId: string | null = null;
  let session = options.reviewerSession ?? null;

  if (explicitAtUsername) {
    const normalizedAt = explicitAtUsername.trim().replace(/^@/, "");
    const exactUser = await getUserByUsername(normalizedAt);
    if (!exactUser) {
      return {
        reply: `I couldn't find a MoonVerse reviewer matching @${normalizedAt}.`,
        recommendations: [],
        responseKind: "chat",
        consumesQuota: true,
      };
    }
    targetId = exactUser.id;
    session = {
      reviewers: [
        {
          id: exactUser.id,
          displayName: exactUser.displayName,
          username: exactUser.username,
          avatarInitials: getInitials(exactUser.displayName),
          avatarUrl: exactUser.avatarUrl,
          reviewCount: exactUser.reviewCount,
          followerCount: exactUser.followerCount,
        },
      ],
      rankBy: "reviews",
      queryType: "lookup",
      activeReviewerId: exactUser.id,
    };
  }

  const fromSession = targetId
    ? null
    : resolveTargetReviewerFromSession({
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
        isReviewerAuthoredReviewsMessage(options.message) &&
        !(session.activeReviewerId || options.activeReviewerId)));

  if (wantsGroupOverview && session) {
    return buildMoonieReviewerGroupOverviewResponse({
      session,
      userId: options.userId,
      emphasizeAuthoredReviews: options.emphasizeAuthoredReviews,
      limit: messageReferencesReviewerGroup(options.message)
        ? session.reviewers.length
        : undefined,
      message: options.message,
    });
  }

  if (fromSession) {
    targetId = fromSession.id;
  } else if (!targetId && namedQuery) {
    const normalizedQuery = namedQuery.trim().replace(/^@/, "");
    const users = await searchUsers(normalizedQuery, 5, 0, options.userId);
    const exactUsername = users.find(
      (user) => user.username.toLowerCase() === normalizedQuery.toLowerCase()
    );
    const exactDisplay = users.find(
      (user) => user.displayName.toLowerCase() === normalizedQuery.toLowerCase()
    );
    const pick = exactUsername ?? exactDisplay ?? (users.length === 1 ? users[0] : null);

    if (!pick && users.length > 1) {
      const sessionFromSearch: MoonieReviewerSession = {
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
        reply: `I found ${users.length} MoonVerse reviewers matching "${namedQuery}". Which one do you mean?`,
        recommendations: [],
        responseKind: "chat",
        consumesQuota: true,
        reviewerResults: sessionFromSearch.reviewers,
        reviewerSession: sessionFromSearch,
      };
    }

    targetId = pick?.id ?? null;
    if (pick && !session) {
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
        activeReviewerId: pick.id,
      };
    }
  }

  if (!targetId) {
    if (namedQuery) {
      return {
        reply: `I couldn't find a MoonVerse reviewer matching "${namedQuery}". Try Community search or check the username spelling.`,
        recommendations: [],
        responseKind: "chat",
        consumesQuota: true,
        reviewerSession: session ?? undefined,
      };
    }

    const contextUsername = options.activeReviewerUsername?.trim();
    if (
      contextUsername &&
      messageReferencesActiveReviewer(options.message)
    ) {
      const contextUser = await getUserByUsername(contextUsername);
      if (contextUser) {
        targetId = contextUser.id;
      }
    }

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

  if (isReviewerFolderRequest(options.message)) {
    const overviewForFolder = await buildMoonieReviewerOverview({
      reviewerId: targetId,
      viewerId: options.userId,
    });
    if (!overviewForFolder) {
      return {
        reply: "I couldn't load that reviewer profile on MoonVerse.",
        recommendations: [],
        responseKind: "chat",
        consumesQuota: true,
        reviewerSession: session ?? undefined,
      };
    }

    const folders = await getFoldersByUser(targetId);
    const folderReply = buildMoonieReviewerFolderReply({
      folders,
      overview: overviewForFolder,
      viewerId: options.userId,
    });

    return {
      reply: folderReply.reply,
      recommendations: [],
      responseKind: "chat",
      consumesQuota: true,
      reviewerOverview: overviewForFolder,
      reviewerSession: session
        ? withActiveReviewerSession(session, overviewForFolder.id)
        : undefined,
    };
  }

  const authoredReviewsLimit = options.emphasizeAuthoredReviews
    ? AUTHORED_REVIEWS_PAGE_SIZE
    : undefined;
  let overview = await buildMoonieReviewerOverview({
    reviewerId: targetId,
    viewerId: options.userId,
    emphasizeAuthoredReviews: options.emphasizeAuthoredReviews,
    authoredReviewsLimit,
  });

  if (!overview && fromSession && !options.emphasizeAuthoredReviews) {
    overview = synthesizeReviewerOverviewFromResult(fromSession);
  }

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

  const profileLink = overview.username
    ? `[View profile](/users/${overview.username})`
    : null;

  const reply = options.emphasizeAuthoredReviews
    ? overview.recentReviews.length > 0
      ? overview.reviewCount > overview.recentReviews.length
        ? `Here are ${overview.recentReviews.length} of ${overview.reviewCount} public reviews by ${overview.displayName} on MoonVerse.`
        : `Here are ${overview.recentReviews.length} public reviews by ${overview.displayName} on MoonVerse.`
      : `${overview.displayName} hasn't published any public reviews on MoonVerse yet.`
    : profileLink
      ? `Here's **${overview.displayName}** on MoonVerse. ${profileLink}`
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
  const wantsProfileDetails = /\b(?:information|info|details?|profiles?)\b/i.test(
    normalizeReviewerMessage(options.message)
  );

  if (isReviewerListRequest(options.message) && wantsProfileDetails) {
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

    return buildMoonieReviewerGroupOverviewResponse({
      session,
      userId: options.userId,
      limit: reviewers.length,
      message: options.message,
    });
  }

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
    activeReviewerId: reviewers[0]?.id,
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
