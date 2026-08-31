import {
  ContentModerationStatus,
  Prisma,
  ReadingLinkCategory,
  ReadingLinkModerationStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { attachDiscoverReasons } from "@/lib/discover-reasons";
import { checkContentModeration } from "@/lib/moderation";
import {
  type ReviewVerdictFilter,
  ratingForVerdictFilter,
} from "@/lib/review-verdict-filter";
import {
  excerpt,
  getInitials,
  resolveCoverUrl,
} from "@/lib/review-utils";
import type {
  GenreOption,
  ReviewDetail,
  ReviewListItem,
  ReviewSort,
} from "@/types/review";

const officialReadingLinkWhere: Prisma.ReadingLinkWhereInput = {
  active: true,
  moderationStatus: ReadingLinkModerationStatus.APPROVED,
  OR: [
    { isOfficial: true },
    { isVerified: true },
    { category: ReadingLinkCategory.OFFICIAL },
  ],
};

const reviewListInclude = {
  user: {
    select: {
      id: true,
      displayName: true,
      username: true,
      avatarUrl: true,
    },
  },
  novel: {
    include: {
      genres: true,
      tags: true,
      readingLinks: {
        where: officialReadingLinkWhere,
        orderBy: { sortOrder: "asc" as const },
        take: 1,
        select: {
          url: true,
          label: true,
          platform: true,
        },
      },
    },
  },
} satisfies Prisma.ReviewInclude;

type ReviewWithRelations = Prisma.ReviewGetPayload<{
  include: typeof reviewListInclude;
}>;

export interface GetAllReviewsOptions {
  query?: string;
  genreSlug?: string;
  tagSlug?: string;
  tagSlugs?: string[];
  sort?: ReviewSort;
  limit?: number;
  offset?: number;
  novelId?: string;
  userId?: string;
  /** Required for personalized sorts (for-you, following, from-saves, hidden-gems). */
  personalizedUserId?: string;
  /**
   * When false, For You returns [] if the user has no taste signals
   * instead of silently falling back to trending.
   */
  allowTrendingFallback?: boolean;
  /** Only reviews explicitly marked spoiler-free. */
  spoilerFree?: boolean;
  /** Only novels with an approved official or verified reading link. */
  hasOfficialLink?: boolean;
  /** Filter by reader verdict bucket (love, like, mixed, dislike, dnf). */
  verdictFilter?: ReviewVerdictFilter;
  /** Skip reviewer aggregate queries for carousel / shelf loads. */
  lightweight?: boolean;
}

const PERSONALIZED_SORTS = new Set<ReviewSort>([
  "for-you",
  "following",
  "from-saves",
  "hidden-gems",
]);

interface UserTasteProfile {
  genreWeights: Map<string, number>;
  tagWeights: Map<string, number>;
  knownNovelIds: Set<string>;
  engagedReviewIds: Set<string>;
  followedUserIds: Set<string>;
}

async function gatherUserTasteProfile(userId: string): Promise<UserTasteProfile> {
  const [saves, likes, ownReviews, comments, following, preferredGenres] =
    await Promise.all([
      db.folderReview.findMany({
        where: { folder: { userId } },
        select: {
          reviewId: true,
          review: {
            select: {
              novelId: true,
              novel: {
                select: {
                  genres: { select: { slug: true } },
                  tags: { select: { slug: true } },
                },
              },
            },
          },
        },
      }),
      db.like.findMany({
        where: { userId },
        select: {
          reviewId: true,
          review: {
            select: {
              novelId: true,
              novel: {
                select: {
                  genres: { select: { slug: true } },
                  tags: { select: { slug: true } },
                },
              },
            },
          },
        },
      }),
      db.review.findMany({
        where: { userId },
        select: {
          novelId: true,
          novel: {
            select: {
              genres: { select: { slug: true } },
              tags: { select: { slug: true } },
            },
          },
        },
      }),
      db.comment.findMany({
        where: { userId },
        select: {
          reviewId: true,
          review: {
            select: {
              novelId: true,
              novel: {
                select: {
                  genres: { select: { slug: true } },
                  tags: { select: { slug: true } },
                },
              },
            },
          },
        },
      }),
      db.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      }),
      db.userPreferredGenre.findMany({
        where: { userId },
        select: { genre: { select: { slug: true } } },
      }),
    ]);

  const genreWeights = new Map<string, number>();
  const tagWeights = new Map<string, number>();
  const knownNovelIds = new Set<string>();
  const engagedReviewIds = new Set<string>();

  const bumpGenre = (slug: string, weight: number) => {
    genreWeights.set(slug, (genreWeights.get(slug) ?? 0) + weight);
  };
  const bumpTag = (slug: string, weight: number) => {
    tagWeights.set(slug, (tagWeights.get(slug) ?? 0) + weight);
  };

  // Onboarding preferences bootstrap personalisation before likes/saves exist.
  for (const row of preferredGenres) {
    bumpGenre(row.genre.slug, 4);
  }

  for (const save of saves) {
    engagedReviewIds.add(save.reviewId);
    knownNovelIds.add(save.review.novelId);
    for (const genre of save.review.novel.genres) bumpGenre(genre.slug, 3);
    for (const tag of save.review.novel.tags) bumpTag(tag.slug, 3);
  }

  for (const like of likes) {
    engagedReviewIds.add(like.reviewId);
    knownNovelIds.add(like.review.novelId);
    for (const genre of like.review.novel.genres) bumpGenre(genre.slug, 2);
    for (const tag of like.review.novel.tags) bumpTag(tag.slug, 2);
  }

  for (const review of ownReviews) {
    knownNovelIds.add(review.novelId);
    for (const genre of review.novel.genres) bumpGenre(genre.slug, 2);
    for (const tag of review.novel.tags) bumpTag(tag.slug, 2);
  }

  for (const comment of comments) {
    engagedReviewIds.add(comment.reviewId);
    knownNovelIds.add(comment.review.novelId);
    for (const genre of comment.review.novel.genres) bumpGenre(genre.slug, 1.5);
    for (const tag of comment.review.novel.tags) bumpTag(tag.slug, 1.5);
  }

  return {
    genreWeights,
    tagWeights,
    knownNovelIds,
    engagedReviewIds,
    followedUserIds: new Set(following.map((row) => row.followingId)),
  };
}

async function gatherSavesTasteProfile(userId: string): Promise<{
  genreWeights: Map<string, number>;
  tagWeights: Map<string, number>;
  savedReviewIds: Set<string>;
  knownNovelIds: Set<string>;
}> {
  const saves = await db.folderReview.findMany({
    where: { folder: { userId } },
    select: {
      reviewId: true,
      review: {
        select: {
          novelId: true,
          novel: {
            select: {
              genres: { select: { slug: true } },
              tags: { select: { slug: true } },
            },
          },
        },
      },
    },
  });

  const genreWeights = new Map<string, number>();
  const tagWeights = new Map<string, number>();
  const savedReviewIds = new Set<string>();
  const knownNovelIds = new Set<string>();

  for (const save of saves) {
    savedReviewIds.add(save.reviewId);
    knownNovelIds.add(save.review.novelId);
    for (const genre of save.review.novel.genres) {
      genreWeights.set(
        genre.slug,
        (genreWeights.get(genre.slug) ?? 0) + 3
      );
    }
    for (const tag of save.review.novel.tags) {
      tagWeights.set(tag.slug, (tagWeights.get(tag.slug) ?? 0) + 3);
    }
  }

  return { genreWeights, tagWeights, savedReviewIds, knownNovelIds };
}

function computePersonalizedScore(
  review: {
    id: string;
    userId: string;
    novelId: string;
    rating: number;
    likeCount: number;
    saveCount: number;
    shareCount: number;
    novel: {
      genres: { slug: string }[];
      tags: { slug: string }[];
    };
  },
  profile: UserTasteProfile
): number {
  if (profile.engagedReviewIds.has(review.id)) {
    return -100;
  }

  let score = 0;

  if (profile.knownNovelIds.has(review.novelId)) {
    score -= 20;
  }

  for (const genre of review.novel.genres) {
    score += profile.genreWeights.get(genre.slug) ?? 0;
  }

  for (const tag of review.novel.tags) {
    score += (profile.tagWeights.get(tag.slug) ?? 0) * 0.75;
  }

  if (profile.followedUserIds.has(review.userId)) {
    score += 6;
  }

  score += review.rating * 0.5;
  score += review.likeCount * 0.08;
  score += review.saveCount * 0.12;
  score += review.shareCount * 0.06;

  return score;
}

function computeSavesTasteScore(
  review: {
    id: string;
    novelId: string;
    rating: number;
    likeCount: number;
    saveCount: number;
    shareCount: number;
    novel: {
      genres: { slug: string }[];
      tags: { slug: string }[];
    };
  },
  profile: {
    genreWeights: Map<string, number>;
    tagWeights: Map<string, number>;
    savedReviewIds: Set<string>;
    knownNovelIds: Set<string>;
  }
): number {
  if (profile.savedReviewIds.has(review.id)) {
    return -100;
  }

  let score = 0;

  if (profile.knownNovelIds.has(review.novelId)) {
    score -= 15;
  }

  for (const genre of review.novel.genres) {
    score += profile.genreWeights.get(genre.slug) ?? 0;
  }

  for (const tag of review.novel.tags) {
    score += (profile.tagWeights.get(tag.slug) ?? 0) * 0.85;
  }

  score += review.rating * 0.4;
  score += review.likeCount * 0.06;
  score += review.saveCount * 0.1;

  return score;
}

function computeHiddenGemsScore(
  review: {
    id: string;
    userId: string;
    novelId: string;
    rating: number;
    likeCount: number;
    saveCount: number;
    shareCount: number;
    novel: {
      genres: { slug: string }[];
      tags: { slug: string }[];
    };
  },
  profile: UserTasteProfile
): number {
  let score = computePersonalizedScore(review, profile);
  if (score <= -50) return score;

  if (review.likeCount > 50) score -= 18;
  else if (review.likeCount > 25) score -= 8;
  else if (review.likeCount >= 3 && review.likeCount <= 20) score += 10;
  else if (review.likeCount >= 1 && review.likeCount <= 5) score += 5;

  if (review.saveCount >= 2 && review.saveCount <= 12) score += 4;

  return score;
}

async function fetchRankedReviewPage(
  ranked: { id: string }[],
  offset: number,
  limit: number,
  sort: ReviewSort
): Promise<ReviewListItem[]> {
  const pageIds = ranked.slice(offset, offset + limit).map((row) => row.id);
  if (pageIds.length === 0) return [];

  const reviews = await db.review.findMany({
    where: { id: { in: pageIds } },
    include: reviewListInclude,
  });

  const byId = new Map(reviews.map((review) => [review.id, review]));
  return enrichDiscoverList(
    pageIds
      .map((id) => byId.get(id))
      .filter((review): review is ReviewWithRelations => !!review)
      .map(mapToListItem),
    sort
  );
}

export async function getPersonalizedReviews(
  userId: string,
  options: Omit<GetAllReviewsOptions, "sort" | "personalizedUserId" | "userId"> = {}
): Promise<ReviewListItem[]> {
  const profile = await gatherUserTasteProfile(userId);

  const hasTaste =
    profile.genreWeights.size > 0 ||
    profile.tagWeights.size > 0 ||
    profile.followedUserIds.size > 0;

  if (!hasTaste) {
    if (options.allowTrendingFallback === false) return [];
    return getAllReviews({ ...options, sort: "trending" });
  }

  const where = buildWhereClause(options);
  where.userId = { not: userId };

  const candidates = await db.review.findMany({
    where,
    select: {
      id: true,
      userId: true,
      novelId: true,
      rating: true,
      likeCount: true,
      saveCount: true,
      shareCount: true,
      createdAt: true,
      novel: {
        select: {
          genres: { select: { slug: true } },
          tags: { select: { slug: true } },
        },
      },
    },
  });

  const ranked = candidates
    .map((review) => ({
      id: review.id,
      score: computePersonalizedScore(review, profile),
      likeCount: review.likeCount,
      createdAt: review.createdAt,
    }))
    // Require a genre, tag, or follow signal; rating-only activity is insufficient.
    .filter((row) => row.score >= 4)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.likeCount - a.likeCount ||
        b.createdAt.getTime() - a.createdAt.getTime()
    );

  return fetchRankedReviewPage(
    ranked,
    options.offset ?? 0,
    options.limit ?? 10,
    "for-you"
  );
}

export async function getFollowingReviews(
  userId: string,
  options: Omit<GetAllReviewsOptions, "sort" | "personalizedUserId" | "userId"> = {}
): Promise<ReviewListItem[]> {
  const following = await db.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followedIds = following.map((row) => row.followingId);
  if (followedIds.length === 0) return [];

  const where = buildWhereClause(options);
  where.userId = { in: followedIds };

  const reviews = await db.review.findMany({
    where,
    include: reviewListInclude,
    orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
    ...(options.limit ? { take: options.limit } : {}),
    ...(options.offset ? { skip: options.offset } : {}),
  });

  return enrichDiscoverList(reviews.map(mapToListItem), "following");
}

export async function getFromSavesReviews(
  userId: string,
  options: Omit<GetAllReviewsOptions, "sort" | "personalizedUserId" | "userId"> = {}
): Promise<ReviewListItem[]> {
  const profile = await gatherSavesTasteProfile(userId);
  const hasSaves =
    profile.genreWeights.size > 0 || profile.tagWeights.size > 0;
  if (!hasSaves) return [];

  const where = buildWhereClause(options);
  where.userId = { not: userId };

  const candidates = await db.review.findMany({
    where,
    select: {
      id: true,
      novelId: true,
      rating: true,
      likeCount: true,
      saveCount: true,
      shareCount: true,
      createdAt: true,
      novel: {
        select: {
          genres: { select: { slug: true } },
          tags: { select: { slug: true } },
        },
      },
    },
  });

  const ranked = candidates
    .map((review) => ({
      id: review.id,
      score: computeSavesTasteScore(review, profile),
      likeCount: review.likeCount,
      createdAt: review.createdAt,
    }))
    .filter((row) => row.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.likeCount - a.likeCount ||
        b.createdAt.getTime() - a.createdAt.getTime()
    );

  return fetchRankedReviewPage(
    ranked,
    options.offset ?? 0,
    options.limit ?? 10,
    "from-saves"
  );
}

export async function getHiddenGemsReviews(
  userId: string,
  options: Omit<GetAllReviewsOptions, "sort" | "personalizedUserId" | "userId"> = {}
): Promise<ReviewListItem[]> {
  const profile = await gatherUserTasteProfile(userId);

  const hasTaste =
    profile.genreWeights.size > 0 ||
    profile.tagWeights.size > 0 ||
    profile.followedUserIds.size > 0;

  if (!hasTaste) {
    return getAllReviews({ ...options, sort: "trending" });
  }

  const where = buildWhereClause(options);
  where.userId = { not: userId };

  const candidates = await db.review.findMany({
    where,
    select: {
      id: true,
      userId: true,
      novelId: true,
      rating: true,
      likeCount: true,
      saveCount: true,
      shareCount: true,
      createdAt: true,
      novel: {
        select: {
          genres: { select: { slug: true } },
          tags: { select: { slug: true } },
        },
      },
    },
  });

  const ranked = candidates
    .map((review) => ({
      id: review.id,
      score: computeHiddenGemsScore(review, profile),
      likeCount: review.likeCount,
      createdAt: review.createdAt,
    }))
    .filter((row) => row.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.likeCount - b.likeCount ||
        b.createdAt.getTime() - a.createdAt.getTime()
    );

  return fetchRankedReviewPage(
    ranked,
    options.offset ?? 0,
    options.limit ?? 10,
    "hidden-gems"
  );
}

function buildWhereClause(options: GetAllReviewsOptions): Prisma.ReviewWhereInput {
  const novelFilter: Prisma.NovelWhereInput = {};

  if (options.genreSlug) {
    novelFilter.genres = {
      some: {
        OR: [
          { slug: options.genreSlug },
          { name: { equals: options.genreSlug, mode: "insensitive" } },
          { slug: { contains: options.genreSlug, mode: "insensitive" } },
        ],
      },
    };
  }

  const tagFilters = [
    ...(options.tagSlug ? [options.tagSlug] : []),
    ...(options.tagSlugs ?? []),
  ];

  if (tagFilters.length > 0) {
    novelFilter.AND = tagFilters.map((slug) => ({
      tags: { some: { slug } },
    }));
  }

  if (options.hasOfficialLink) {
    novelFilter.readingLinks = { some: officialReadingLinkWhere };
  }

  const where: Prisma.ReviewWhereInput = {
    moderationStatus: { not: ContentModerationStatus.HIDDEN },
  };

  if (options.spoilerFree) {
    where.containsSpoilers = false;
  }

  if (options.verdictFilter) {
    where.rating = ratingForVerdictFilter(options.verdictFilter);
  }

  if (options.novelId) {
    where.novelId = options.novelId;
  }

  if (options.userId) {
    where.userId = options.userId;
  }

  if (Object.keys(novelFilter).length > 0) {
    where.novel = novelFilter;
  }

  if (options.query?.trim()) {
    const q = options.query.trim();
    // Prefer title and metadata matches. Search review text only for multi-word
    // or longer queries because short terms can overmatch prose.
    const titleAndMeta: Prisma.ReviewWhereInput[] = [
      { title: { contains: q, mode: "insensitive" } },
      { novel: { title: { contains: q, mode: "insensitive" } } },
      { novel: { author: { contains: q, mode: "insensitive" } } },
      {
        novel: {
          genres: { some: { name: { contains: q, mode: "insensitive" } } },
        },
      },
      {
        novel: {
          tags: { some: { name: { contains: q, mode: "insensitive" } } },
        },
      },
      { user: { username: { contains: q, mode: "insensitive" } } },
      { user: { displayName: { contains: q, mode: "insensitive" } } },
    ];
    const wordCount = q.split(/\s+/).filter(Boolean).length;
    if (wordCount > 1 || q.length >= 6) {
      titleAndMeta.push({ body: { contains: q, mode: "insensitive" } });
    }
    where.OR = titleAndMeta;
  }

  return where;
}

function buildOrderBy(sort: ReviewSort = "latest"): Prisma.ReviewOrderByWithRelationInput[] {
  switch (sort) {
    case "trending":
      return [{ likeCount: "desc" }, { createdAt: "desc" }];
    case "highest-rated":
      return [{ rating: "desc" }, { likeCount: "desc" }];
    case "most-discussed":
      return [{ commentCount: "desc" }, { createdAt: "desc" }];
    case "most-saved":
      return [{ saveCount: "desc" }, { createdAt: "desc" }];
    case "most-shared":
      return [{ shareCount: "desc" }, { createdAt: "desc" }];
    case "latest":
    default:
      return [{ createdAt: "desc" }];
  }
}

function mapToListItem(review: ReviewWithRelations): ReviewListItem {
  const novelTags = review.novel.tags
    .map((t) => t.name)
    .filter((name) => !/spoiler/i.test(name));
  const tags = review.containsSpoilers
    ? ["Spoilers", ...novelTags]
    : novelTags;
  const officialLink = review.novel.readingLinks[0];

  return {
    id: review.id,
    title: review.title,
    excerpt: excerpt(review.body, 280),
    body: "",
    rating: review.rating,
    containsSpoilers: review.containsSpoilers,
    likeCount: review.likeCount,
    commentCount: review.commentCount,
    saveCount: review.saveCount,
    shareCount: review.shareCount,
    novelId: review.novel.id,
    novelTitle: review.novel.title,
    novelAuthor: review.novel.author ?? "Unknown",
    coverUrl: resolveCoverUrl(review.novel.coverUrl, { title: review.novel.title }),
    reviewerId: review.user.id,
    reviewerName: review.user.displayName,
    reviewerUsername: review.user.username,
    reviewerAvatar: getInitials(review.user.displayName),
    reviewerAvatarUrl: review.user.avatarUrl ?? undefined,
    genres: review.novel.genres.map((g) => g.name),
    tags,
    createdAt: review.createdAt.toISOString(),
    hasOfficialLink: Boolean(officialLink),
    officialLinkUrl: officialLink?.url,
    officialLinkLabel: officialLink?.label || officialLink?.platform,
    originalLanguage: review.novel.originalLanguage,
    publicationStatus: review.novel.publicationStatus,
  };
}

async function enrichDiscoverList(
  items: ReviewListItem[],
  sort: ReviewSort
): Promise<ReviewListItem[]> {
  if (items.length === 0) return items;

  const novelIds = [...new Set(items.map((item) => item.novelId))];
  const stats = await db.review.groupBy({
    by: ["novelId"],
    where: { novelId: { in: novelIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const byNovel = new Map(
    stats.map((row) => [
      row.novelId,
      {
        average: row._avg.rating,
        count: row._count._all,
      },
    ])
  );

  return attachDiscoverReasons(
    items.map((item) => {
      const stat = byNovel.get(item.novelId);
      return {
        ...item,
        novelAverageRating:
          stat?.average != null ? Number(stat.average) : item.rating,
        novelReviewCount: stat?.count ?? 1,
      };
    }),
    sort
  );
}

async function enrichReviewerStatsForList(
  items: ReviewListItem[]
): Promise<ReviewListItem[]> {
  const userIds = [
    ...new Set(
      items.map((item) => item.reviewerId).filter((id): id is string => !!id)
    ),
  ];
  if (userIds.length === 0) return items;

  const [aggregates] = await Promise.all([
    db.review.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const statsByUser = new Map(
    aggregates.map((row) => [
      row.userId,
      {
        reviewCount: row._count._all,
        averageRating:
          row._avg.rating != null ? Number(row._avg.rating) : null,
      },
    ])
  );

  return items.map((item) => {
    if (!item.reviewerId) return item;
    const stats = statsByUser.get(item.reviewerId);
    if (!stats) return item;
    return {
      ...item,
      reviewerReviewCount: stats.reviewCount,
      reviewerAverageRating: stats.averageRating,
    };
  });
}

function mapToDetail(review: ReviewWithRelations): ReviewDetail {
  return {
    ...mapToListItem(review),
    userId: review.user.id,
    body: review.body,
    externalLink: review.novel.externalLink ?? undefined,
  };
}

export async function countReviews(
  options: Omit<GetAllReviewsOptions, "limit" | "offset"> = {}
): Promise<number> {
  if (!options.sort || !PERSONALIZED_SORTS.has(options.sort)) {
    return db.review.count({ where: buildWhereClause(options) });
  }

  if (!options.personalizedUserId) return 0;

  const userId = options.personalizedUserId;

  if (options.sort === "following") {
    const following = await db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followedIds = following.map((row) => row.followingId);
    if (followedIds.length === 0) return 0;

    const where = buildWhereClause(options);
    where.userId = { in: followedIds };
    return db.review.count({ where });
  }

  if (options.sort === "from-saves") {
    const profile = await gatherSavesTasteProfile(userId);
    const hasSaves =
      profile.genreWeights.size > 0 || profile.tagWeights.size > 0;
    if (!hasSaves) return 0;

    const where = buildWhereClause(options);
    where.userId = { not: userId };
    where.id = { notIn: [...profile.savedReviewIds] };
    return db.review.count({ where });
  }

  if (options.sort === "for-you" || options.sort === "hidden-gems") {
    const profile = await gatherUserTasteProfile(userId);
    const hasTaste =
      profile.genreWeights.size > 0 ||
      profile.tagWeights.size > 0 ||
      profile.followedUserIds.size > 0;

    if (!hasTaste) {
      return db.review.count({ where: buildWhereClause(options) });
    }

    const where = buildWhereClause(options);
    where.userId = { not: userId };
    return db.review.count({ where });
  }

  return db.review.count({ where: buildWhereClause(options) });
}

export async function getAllReviews(
  options: GetAllReviewsOptions = {}
): Promise<ReviewListItem[]> {
  if (options.sort && PERSONALIZED_SORTS.has(options.sort)) {
    if (!options.personalizedUserId) return [];

    switch (options.sort) {
      case "for-you":
        return getPersonalizedReviews(options.personalizedUserId, options);
      case "following":
        return getFollowingReviews(options.personalizedUserId, options);
      case "from-saves":
        return getFromSavesReviews(options.personalizedUserId, options);
      case "hidden-gems":
        return getHiddenGemsReviews(options.personalizedUserId, options);
    }
  }

  const reviews = await db.review.findMany({
    where: buildWhereClause(options),
    include: reviewListInclude,
    orderBy: buildOrderBy(options.sort),
    ...(options.limit ? { take: options.limit } : {}),
    ...(options.offset ? { skip: options.offset } : {}),
  });

  const list = await enrichDiscoverList(
    reviews.map(mapToListItem),
    options.sort ?? "latest"
  );

  if (options.lightweight) return list;

  return enrichReviewerStatsForList(list);
}

export async function getTrendingReviews(limit = 6): Promise<ReviewListItem[]> {
  return getAllReviews({ sort: "trending", limit });
}

/** Highest-engagement reviews of novels marked Completed. */
export async function getCompletedStoryReviews(options: {
  genreSlugs?: string[];
  limit?: number;
}): Promise<ReviewListItem[]> {
  const limit = options.limit ?? 16;
  const genreSlugs = options.genreSlugs?.filter(Boolean) ?? [];

  const reviews = await db.review.findMany({
    where: {
      novel: {
        publicationStatus: "Completed",
        ...(genreSlugs.length > 0
          ? { genres: { some: { slug: { in: genreSlugs } } } }
          : {}),
      },
    },
    include: reviewListInclude,
    orderBy: [{ likeCount: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return enrichDiscoverList(reviews.map(mapToListItem), "trending");
}

/** Reviews whose novels avoid the given genre slugs (discovery / try something new). */
export async function getReviewsOutsideGenres(
  excludeSlugs: string[],
  limit = 16
): Promise<ReviewListItem[]> {
  if (excludeSlugs.length === 0) {
    return getAllReviews({ sort: "latest", limit });
  }

  const reviews = await db.review.findMany({
    where: {
      novel: {
        genres: { none: { slug: { in: excludeSlugs } } },
      },
    },
    include: reviewListInclude,
    orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return enrichDiscoverList(reviews.map(mapToListItem), "trending");
}

export async function getTranslatedCnReviews(limit = 12): Promise<ReviewListItem[]> {
  return getAllReviews({ tagSlug: "translated-cn", sort: "highest-rated", limit });
}

export async function getRoyalRoadReviews(limit = 12): Promise<ReviewListItem[]> {
  return getAllReviews({ tagSlug: "royal-road", sort: "highest-rated", limit });
}

export async function getReviewsByUserId(
  userId: string
): Promise<ReviewListItem[]> {
  return getAllReviews({ userId, sort: "latest" });
}

export interface NovelReviewStats {
  total: number;
  average: number;
  /** Count of reviews per star rating (1–5). */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

/** Community rating breakdown for a novel, aggregated in the database. */
export async function getNovelReviewStats(
  novelId: string
): Promise<NovelReviewStats> {
  const grouped = await db.review.groupBy({
    by: ["rating"],
    where: { novelId },
    _count: { _all: true },
  });

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let total = 0;
  let weighted = 0;

  for (const row of grouped) {
    const rating = row.rating as 1 | 2 | 3 | 4 | 5;
    const count = row._count._all;
    if (rating >= 1 && rating <= 5) {
      distribution[rating] = count;
    }
    total += count;
    weighted += rating * count;
  }

  return {
    total,
    average: total > 0 ? weighted / total : 0,
    distribution,
  };
}

export async function getReviewById(id: string): Promise<ReviewDetail | null> {
  const review = await db.review.findUnique({
    where: { id },
    include: reviewListInclude,
  });

  if (!review || review.moderationStatus === ContentModerationStatus.HIDDEN) {
    return null;
  }
  return mapToDetail(review);
}

export interface CreateReviewInput {
  userId: string;
  novelId: string;
  title: string;
  body: string;
  rating: number;
  containsSpoilers?: boolean;
}

export async function createReview(input: CreateReviewInput): Promise<ReviewDetail> {
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const { status: moderationStatus } = checkContentModeration(
    `${input.title} ${input.body}`
  );

  const review = await db.review.create({
    data: {
      userId: input.userId,
      novelId: input.novelId,
      title: input.title,
      body: input.body,
      rating: input.rating,
      containsSpoilers: input.containsSpoilers ?? false,
      moderationStatus,
    },
    include: reviewListInclude,
  });

  return mapToDetail(review);
}

export interface UpdateReviewInput {
  title?: string;
  body?: string;
  rating?: number;
  containsSpoilers?: boolean;
}

export async function updateReview(
  id: string,
  input: UpdateReviewInput
): Promise<ReviewDetail> {
  if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
    throw new Error("Rating must be between 1 and 5");
  }

  const moderation =
    input.title !== undefined || input.body !== undefined
      ? checkContentModeration(`${input.title ?? ""} ${input.body ?? ""}`)
      : null;

  const review = await db.review.update({
    where: { id },
    data: {
      ...input,
      ...(moderation && moderation.status === ContentModerationStatus.AUTO_FLAGGED
        ? { moderationStatus: moderation.status }
        : {}),
    },
    include: reviewListInclude,
  });

  return mapToDetail(review);
}

export async function deleteReview(id: string): Promise<void> {
  await db.review.delete({ where: { id } });
}

export async function userOwnsReview(
  reviewId: string,
  userId: string
): Promise<boolean> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { userId: true },
  });
  return review?.userId === userId;
}

export async function userHasReviewForNovel(
  userId: string,
  novelId: string
): Promise<boolean> {
  const review = await db.review.findUnique({
    where: { novelId_userId: { novelId, userId } },
    select: { id: true },
  });
  return !!review;
}

export async function getUserReviewIdForNovel(
  userId: string,
  novelId: string
): Promise<string | null> {
  const review = await db.review.findUnique({
    where: { novelId_userId: { novelId, userId } },
    select: { id: true },
  });
  return review?.id ?? null;
}

export async function getGenresWithReviewCounts(): Promise<GenreOption[]> {
  const rows = await db.$queryRaw<
    Array<{ id: string; name: string; slug: string; review_count: bigint }>
  >`
    SELECT
      g.id,
      g.name,
      g.slug,
      COUNT(r.id) AS review_count
    FROM genres g
    LEFT JOIN "_GenreToNovel" gn ON gn."A" = g.id
    LEFT JOIN reviews r ON r.novel_id = gn."B"
    GROUP BY g.id, g.name, g.slug
    ORDER BY g.name ASC
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    reviewCount: Number(row.review_count),
  }));
}

export interface ReviewerPublicStats {
  reviewCount: number;
  averageRating: number | null;
  topGenre: string | null;
}

/** Public reviewer credibility stats for review detail byline. */
export async function getReviewerPublicStats(
  userId: string,
): Promise<ReviewerPublicStats> {
  const reviews = await db.review.findMany({
    where: { userId },
    select: {
      rating: true,
      novel: { select: { genres: { select: { name: true } } } },
    },
  });

  if (reviews.length === 0) {
    return { reviewCount: 0, averageRating: null, topGenre: null };
  }

  const genreCounts = new Map<string, number>();
  let totalRating = 0;

  for (const review of reviews) {
    totalRating += review.rating;
    for (const genre of review.novel.genres) {
      genreCounts.set(genre.name, (genreCounts.get(genre.name) ?? 0) + 1);
    }
  }

  let topGenre: string | null = null;
  let topCount = 0;
  for (const [name, count] of genreCounts) {
    if (count > topCount) {
      topGenre = name;
      topCount = count;
    }
  }

  return {
    reviewCount: reviews.length,
    averageRating: totalRating / reviews.length,
    topGenre,
  };
}

export async function getRelatedTagReviews(
  tagSlug: string | undefined,
  excludeReviewId: string,
  limit = 6,
): Promise<ReviewListItem[]> {
  if (!tagSlug) return getTrendingReviews(limit);

  const reviews = await getAllReviews({
    tagSlug,
    sort: "trending",
    limit: limit + 4,
  });

  return reviews.filter((item) => item.id !== excludeReviewId).slice(0, limit);
}

