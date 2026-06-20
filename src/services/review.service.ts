import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
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

const reviewListInclude = {
  user: {
    select: {
      id: true,
      displayName: true,
      username: true,
    },
  },
  novel: {
    include: {
      genres: true,
      tags: true,
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
  sort?: ReviewSort;
  limit?: number;
  novelId?: string;
  userId?: string;
}

function buildWhereClause(options: GetAllReviewsOptions): Prisma.ReviewWhereInput {
  const novelFilter: Prisma.NovelWhereInput = {};

  if (options.genreSlug) {
    novelFilter.genres = { some: { slug: options.genreSlug } };
  }

  if (options.tagSlug) {
    novelFilter.tags = { some: { slug: options.tagSlug } };
  }

  const where: Prisma.ReviewWhereInput = {};

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
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
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
    ];
  }

  return where;
}

function buildOrderBy(sort: ReviewSort = "latest"): Prisma.ReviewOrderByWithRelationInput[] {
  switch (sort) {
    case "trending":
      return [{ likeCount: "desc" }, { createdAt: "desc" }];
    case "highest-rated":
      return [{ rating: "desc" }, { likeCount: "desc" }];
    case "latest":
    default:
      return [{ createdAt: "desc" }];
  }
}

function mapToListItem(review: ReviewWithRelations): ReviewListItem {
  return {
    id: review.id,
    title: review.title,
    excerpt: excerpt(review.body),
    rating: review.rating,
    likeCount: review.likeCount,
    novelId: review.novel.id,
    novelTitle: review.novel.title,
    novelAuthor: review.novel.author ?? "Unknown",
    coverUrl: resolveCoverUrl(review.novel.coverUrl),
    reviewerName: review.user.displayName,
    reviewerUsername: review.user.username,
    reviewerAvatar: getInitials(review.user.displayName),
    genres: review.novel.genres.map((g) => g.name),
    createdAt: review.createdAt.toISOString(),
  };
}

function mapToDetail(review: ReviewWithRelations): ReviewDetail {
  return {
    ...mapToListItem(review),
    userId: review.user.id,
    body: review.body,
    tags: review.novel.tags.map((t) => t.name),
    externalLink: review.novel.externalLink ?? undefined,
    commentCount: review.commentCount,
    shareCount: review.shareCount,
    saveCount: review.saveCount,
  };
}

export async function getAllReviews(
  options: GetAllReviewsOptions = {}
): Promise<ReviewListItem[]> {
  const reviews = await db.review.findMany({
    where: buildWhereClause(options),
    include: reviewListInclude,
    orderBy: buildOrderBy(options.sort),
    ...(options.limit ? { take: options.limit } : {}),
  });

  return reviews.map(mapToListItem);
}

export async function getTrendingReviews(limit = 6): Promise<ReviewListItem[]> {
  return getAllReviews({ sort: "trending", limit });
}

export async function getReviewsByUserId(
  userId: string
): Promise<ReviewListItem[]> {
  return getAllReviews({ userId, sort: "latest" });
}

export async function getReviewById(id: string): Promise<ReviewDetail | null> {
  const review = await db.review.findUnique({
    where: { id },
    include: reviewListInclude,
  });

  if (!review) return null;
  return mapToDetail(review);
}

export interface CreateReviewInput {
  userId: string;
  novelId: string;
  title: string;
  body: string;
  rating: number;
}

export async function createReview(input: CreateReviewInput): Promise<ReviewDetail> {
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const review = await db.review.create({
    data: {
      userId: input.userId,
      novelId: input.novelId,
      title: input.title,
      body: input.body,
      rating: input.rating,
    },
    include: reviewListInclude,
  });

  return mapToDetail(review);
}

export interface UpdateReviewInput {
  title?: string;
  body?: string;
  rating?: number;
}

export async function updateReview(
  id: string,
  input: UpdateReviewInput
): Promise<ReviewDetail> {
  if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
    throw new Error("Rating must be between 1 and 5");
  }

  const review = await db.review.update({
    where: { id },
    data: input,
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

export async function getGenresWithReviewCounts(): Promise<GenreOption[]> {
  const genres = await db.genre.findMany({ orderBy: { name: "asc" } });

  return Promise.all(
    genres.map(async (genre) => ({
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
      reviewCount: await db.review.count({
        where: { novel: { genres: { some: { id: genre.id } } } },
      }),
    }))
  );
}
