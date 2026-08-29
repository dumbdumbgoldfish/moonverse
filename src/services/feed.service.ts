import { db } from "@/lib/db";
import { getInitials } from "@/lib/review-utils";
import type { CommentItem } from "@/types/review";
import type { TopReviewerPreview } from "@/types/discovery";

export async function getLikedReviewIds(
  userId: string,
  reviewIds: string[]
): Promise<Set<string>> {
  if (reviewIds.length === 0) return new Set();
  const likes = await db.like.findMany({
    where: { userId, reviewId: { in: reviewIds } },
    select: { reviewId: true },
  });
  return new Set(likes.map((like) => like.reviewId));
}

/** Latest top-level comments per review, with a short reply preview when present. */
export async function getCommentPreviewsByReviewIds(
  reviewIds: string[],
  perReview = 2
): Promise<Map<string, CommentItem[]>> {
  const result = new Map<string, CommentItem[]>();
  if (reviewIds.length === 0) return result;

  const comments = await db.comment.findMany({
    where: { reviewId: { in: reviewIds } },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const byReview = new Map<string, typeof comments>();
  for (const comment of comments) {
    const list = byReview.get(comment.reviewId) ?? [];
    list.push(comment);
    byReview.set(comment.reviewId, list);
  }

  function toItem(
    comment: (typeof comments)[number]
  ): CommentItem {
    return {
      id: comment.id,
      reviewId: comment.reviewId,
      userId: comment.userId,
      authorName: comment.user.displayName,
      authorUsername: comment.user.username,
      authorAvatar: getInitials(comment.user.displayName),
      authorAvatarUrl: comment.user.avatarUrl ?? undefined,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      parentCommentId: comment.parentCommentId ?? undefined,
      likeCount: comment.likeCount ?? 0,
      replies: [],
    };
  }

  for (const reviewId of reviewIds) {
    const reviewComments = byReview.get(reviewId) ?? [];
    const topLevel = reviewComments.filter((comment) => !comment.parentCommentId);
    const preview = topLevel.slice(-perReview).map((parent) => {
      const item = toItem(parent);
      item.replies = reviewComments
        .filter((reply) => reply.parentCommentId === parent.id)
        .slice(-2)
        .map(toItem);
      return item;
    });
    result.set(reviewId, preview);
  }

  return result;
}

export interface ReadingTasteSnapshot {
  reviewCount: number;
  savedNovelCount: number;
  followingCount: number;
  topGenres: { name: string; slug: string; count: number }[];
  topTag: { name: string; slug: string } | null;
  hasSignals: boolean;
}

export const EMPTY_READING_TASTE_SNAPSHOT: ReadingTasteSnapshot = {
  reviewCount: 0,
  savedNovelCount: 0,
  followingCount: 0,
  topGenres: [],
  topTag: null,
  hasSignals: false,
};

export async function getReadingTasteSnapshot(
  userId: string
): Promise<ReadingTasteSnapshot> {
  const [reviewCount, followingCount, saves, ownReviews, preferred] =
    await Promise.all([
      db.review.count({ where: { userId } }),
      db.follow.count({ where: { followerId: userId } }),
      db.folderReview.findMany({
        where: { folder: { userId } },
        select: {
          review: {
            select: {
              novelId: true,
              novel: {
                select: {
                  genres: { select: { name: true, slug: true } },
                  tags: { select: { name: true, slug: true } },
                },
              },
            },
          },
        },
        take: 80,
      }),
      db.review.findMany({
        where: { userId },
        select: {
          novel: {
            select: {
              genres: { select: { name: true, slug: true } },
              tags: { select: { name: true, slug: true } },
            },
          },
        },
        take: 40,
      }),
      db.userPreferredGenre.findMany({
        where: { userId },
        select: { genre: { select: { name: true, slug: true } } },
        take: 12,
      }),
    ]);

  const novelIds = new Set<string>();
  const genreCounts = new Map<string, { name: string; slug: string; count: number }>();
  const tagCounts = new Map<string, { name: string; slug: string; count: number }>();

  const bump = (
    map: Map<string, { name: string; slug: string; count: number }>,
    name: string,
    slug: string,
    amount = 1
  ) => {
    const current = map.get(slug);
    if (current) current.count += amount;
    else map.set(slug, { name, slug, count: amount });
  };

  for (const row of preferred) {
    bump(genreCounts, row.genre.name, row.genre.slug, 4);
  }

  for (const save of saves) {
    novelIds.add(save.review.novelId);
    for (const genre of save.review.novel.genres) {
      bump(genreCounts, genre.name, genre.slug);
    }
    for (const tag of save.review.novel.tags) {
      if (/spoiler/i.test(tag.name)) continue;
      bump(tagCounts, tag.name, tag.slug);
    }
  }

  for (const review of ownReviews) {
    for (const genre of review.novel.genres) {
      bump(genreCounts, genre.name, genre.slug);
    }
    for (const tag of review.novel.tags) {
      if (/spoiler/i.test(tag.name)) continue;
      bump(tagCounts, tag.name, tag.slug);
    }
  }

  const topGenres = [...genreCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(({ name, slug, count }) => ({ name, slug, count }));

  const topTagEntry = [...tagCounts.values()].sort((a, b) => b.count - a.count)[0];

  return {
    reviewCount,
    savedNovelCount: novelIds.size,
    followingCount,
    topGenres,
    topTag: topTagEntry
      ? { name: topTagEntry.name, slug: topTagEntry.slug }
      : null,
    hasSignals:
      preferred.length > 0 ||
      topGenres.length > 0 ||
      reviewCount > 0 ||
      novelIds.size > 0,
  };
}

export async function getSuggestedReviewers(
  userId: string,
  limit = 4,
  viewerGenreNames: string[] = []
): Promise<TopReviewerPreview[]> {
  const following = await db.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const exclude = new Set(following.map((row) => row.followingId));
  exclude.add(userId);

  const users = await db.user.findMany({
    where: {
      id: { notIn: [...exclude] },
      reviews: { some: {} },
    },
    orderBy: { reviews: { _count: "desc" } },
    take: limit + 4,
    select: {
      id: true,
      displayName: true,
      username: true,
      _count: { select: { reviews: true, followers: true } },
      reviews: {
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          novel: {
            select: { genres: { select: { name: true }, take: 3 } },
          },
        },
      },
    },
  });

  let names = viewerGenreNames;
  if (names.length === 0) {
    const preferred = await db.userPreferredGenre.findMany({
      where: { userId },
      select: { genre: { select: { name: true } } },
      take: 12,
    });
    names = preferred.map((row) => row.genre.name);
  }

  const viewerSet = new Set(
    names.map((name) => name.trim().toLowerCase()).filter(Boolean)
  );

  return users.slice(0, limit).map((user) => {
    const genreCounts = new Map<string, number>();
    for (const review of user.reviews) {
      for (const genre of review.novel.genres) {
        genreCounts.set(genre.name, (genreCounts.get(genre.name) ?? 0) + 1);
      }
    }
    const highlightGenre = [...genreCounts.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    const reviewerGenres = [...genreCounts.keys()].map((name) =>
      name.toLowerCase()
    );
    let tasteMatch: number | undefined;
    let sharedGenreCount: number | undefined;
    if (viewerSet.size > 0 && reviewerGenres.length > 0) {
      const shared = reviewerGenres.filter((name) => viewerSet.has(name));
      sharedGenreCount = shared.length;
      const union = new Set([...viewerSet, ...reviewerGenres]).size;
      tasteMatch = Math.round((shared.length / union) * 100);
    }

    return {
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      avatarInitials: getInitials(user.displayName),
      reviewCount: user._count.reviews,
      followerCount: user._count.followers,
      highlightGenre,
      tasteMatch,
      sharedGenreCount,
    };
  });
}
