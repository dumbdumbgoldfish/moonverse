import { db } from "@/lib/db";
import { genreLabel } from "@/lib/genres";
import {
  discoverShelfQuote,
  isLandingDiscoverCandidate,
  pickLandingDiscoverNovels,
} from "@/lib/landing-discover";
import {
  pickLandingDoorCovers,
} from "@/lib/landing-door-covers";
import {
  LANDING_GENRE_DOOR_SLUGS,
  LANDING_SLOW_BURN_SLUG,
  isCloseNightShelfCandidate,
  landingGenreBlurb,
  landingGenreHref,
  normalizeNovelTitle,
} from "@/lib/landing-genres";
import { isTemplateReviewTitle } from "@/lib/landing-reviews";
import { ENGLISH_WEB_NOVELS } from "../../prisma/lib/english-web-novels";
import { TRANSLATED_CN_NOVELS } from "../../prisma/lib/translated-cn-novels";
import {
  getInitials,
  isMissingCoverUrl,
  resolveCoverUrl,
} from "@/lib/review-utils";
import { getAllReviews } from "@/services/review.service";
import {
  dedupeFolderEntriesToShelfNovels,
  shelfNovelInclude,
} from "@/services/folder.service";
import { READING_LIST_SHELF_INITIAL_BATCH } from "@/lib/reading-list-shelf";
import type {
  ActivityPreview,
  DiscoverTagPreview,
  LandingGenreCover,
  LandingGenreDoor,
  ReadingListPreview,
  TopReviewerPreview,
  TrendingNovelPreview,
} from "@/types/discovery";
import type { ReviewListItem } from "@/types/review";

export async function getContinueReadingReviews(
  userId?: string
): Promise<ReviewListItem[]> {
  if (!userId) return [];

  const saved = await db.folderReview.findMany({
    where: { folder: { userId } },
    orderBy: { addedAt: "desc" },
    take: 48,
    include: {
      review: {
        include: {
          user: { select: { displayName: true, username: true } },
          novel: { include: { genres: true, tags: true } },
        },
      },
    },
  });

  const seenReviewIds = new Set<string>();
  const seenNovelIds = new Set<string>();
  const items: ReviewListItem[] = [];

  for (const entry of saved) {
    if (seenReviewIds.has(entry.review.id)) continue;
    if (seenNovelIds.has(entry.review.novelId)) continue;
    seenReviewIds.add(entry.review.id);
    seenNovelIds.add(entry.review.novelId);
    const r = entry.review;
    const novelTags = r.novel.tags
      .map((t) => t.name)
      .filter((name) => !/spoiler/i.test(name));
    items.push({
      id: r.id,
      title: r.title,
      excerpt: r.body.slice(0, 280),
      body: r.body,
      rating: r.rating,
      containsSpoilers: r.containsSpoilers,
      likeCount: r.likeCount,
      commentCount: r.commentCount,
      saveCount: r.saveCount,
      shareCount: r.shareCount,
      novelId: r.novelId,
      novelTitle: r.novel.title,
      novelAuthor: r.novel.author ?? "Unknown",
      coverUrl: resolveCoverUrl(r.novel.coverUrl, { title: r.novel.title }),
      reviewerName: r.user.displayName,
      reviewerUsername: r.user.username,
      reviewerAvatar: getInitials(r.user.displayName),
      genres: r.novel.genres.map((g) => g.name),
      tags: r.containsSpoilers ? ["Spoilers", ...novelTags] : novelTags,
      createdAt: r.createdAt.toISOString(),
    });
  }

  return uniqueContinueReadingByNovelId(items).slice(0, 10);
}

/** Novel-cover rails show one card per catalogue work, not one per saved review. */
export function uniqueContinueReadingByNovelId(
  items: ReviewListItem[]
): ReviewListItem[] {
  const seen = new Set<string>();
  const unique: ReviewListItem[] = [];
  for (const item of items) {
    if (seen.has(item.novelId)) continue;
    seen.add(item.novelId);
    unique.push(item);
  }
  return unique;
}

export async function getRecommendedReviews(
  limit = 10
): Promise<ReviewListItem[]> {
  return getAllReviews({ sort: "highest-rated", limit });
}

/** Personalized profile picks from reviews, saves, likes, lists, follows, and genre prefs. */
export async function getProfileRecommendationsForUser(
  userId: string,
  limit = 12
): Promise<ReviewListItem[]> {
  return getAllReviews({
    sort: "for-you",
    personalizedUserId: userId,
    limit,
  });
}

export async function getTrendingNovels(
  limit = 20
): Promise<TrendingNovelPreview[]> {
  const novels = await db.novel.findMany({
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      genres: {
        take: 1,
        select: { name: true },
      },
      reviews: {
        select: {
          title: true,
          rating: true,
          likeCount: true,
          commentCount: true,
          saveCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return novels
    .map((novel): TrendingNovelPreview => {
      const reviewCount = novel.reviews.length;
      const totalRating = novel.reviews.reduce(
        (total, review) => total + review.rating,
        0
      );
      const totalLikes = novel.reviews.reduce(
        (total, review) => total + review.likeCount,
        0
      );
      const totalComments = novel.reviews.reduce(
        (total, review) => total + review.commentCount,
        0
      );
      const totalSaves = novel.reviews.reduce(
        (total, review) => total + review.saveCount,
        0
      );
      const latestReview = novel.reviews[0];
      const ageInDays = latestReview
        ? Math.max(0, (now - latestReview.createdAt.getTime()) / dayMs)
        : Number.POSITIVE_INFINITY;
      const recentActivityWeight =
        ageInDays <= 7 ? 12 : ageInDays <= 30 ? 6 : ageInDays <= 90 ? 2 : 0;
      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

      // Popularity favours real discussion; catalog novels without reviews still appear.
      const score =
        reviewCount * 4 +
        totalLikes * 2 +
        totalComments * 3 +
        totalSaves * 2 +
        recentActivityWeight +
        averageRating;

      return {
        novelId: novel.id,
        title: novel.title,
        author: novel.author ?? "Unknown author",
        coverUrl: resolveCoverUrl(novel.coverUrl, { title: novel.title }),
        primaryGenre: novel.genres[0]?.name,
        averageRating,
        reviewCount,
        totalLikes,
        totalComments,
        totalSaves,
        mostRecentReviewAt:
          latestReview?.createdAt.toISOString() ?? new Date(0).toISOString(),
        communityQuote: latestReview?.title,
        score,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.mostRecentReviewAt.localeCompare(a.mostRecentReviewAt) ||
        a.title.localeCompare(b.title)
    )
    .slice(0, Math.min(limit, 20));
}

export type AuthShowcaseNovel = Pick<
  TrendingNovelPreview,
  "novelId" | "title" | "author" | "coverUrl"
>;

/** Popular novels with real covers for auth marketing panels. */
export async function getAuthShowcaseNovels(
  limit = 3
): Promise<AuthShowcaseNovel[]> {
  const trending = await getTrendingNovels(Math.max(limit * 6, 18));
  const picked: AuthShowcaseNovel[] = [];
  const seen = new Set<string>();

  for (const novel of trending) {
    if (isMissingCoverUrl(novel.coverUrl)) continue;
    if (seen.has(novel.novelId)) continue;
    seen.add(novel.novelId);
    picked.push({
      novelId: novel.novelId,
      title: novel.title,
      author: novel.author,
      coverUrl: novel.coverUrl,
    });
    if (picked.length >= limit) return picked;
  }

  const extras = await db.novel.findMany({
    where: {
      coverUrl: { not: null },
      NOT: { coverUrl: { contains: "picsum.photos" } },
      ...(seen.size > 0 ? { id: { notIn: [...seen] } } : {}),
    },
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit - picked.length,
  });

  for (const novel of extras) {
    const coverUrl = resolveCoverUrl(novel.coverUrl, { title: novel.title });
    if (isMissingCoverUrl(coverUrl)) continue;
    picked.push({
      novelId: novel.id,
      title: novel.title,
      author: novel.author ?? "Unknown author",
      coverUrl,
    });
    if (picked.length >= limit) break;
  }

  return picked;
}

export function uniqueShelfCovers(
  entries: Array<{
    novelId: string;
    coverUrl: string | null;
    title: string;
    excerpt?: string;
    reviewerName?: string;
    rating?: number;
  }>,
  max = 3
) {
  const seen = new Set<string>();
  const covers: string[] = [];
  const novelTitles: string[] = [];
  let highlightQuote: string | undefined;
  let highlightReviewer: string | undefined;
  let ratingSum = 0;
  let ratingCount = 0;

  for (const entry of entries) {
    if (seen.has(entry.novelId)) continue;
    seen.add(entry.novelId);

    const coverUrl = resolveCoverUrl(entry.coverUrl, { title: entry.title });
    if (coverUrl && covers.length < max) {
      covers.push(coverUrl);
    }
    if (novelTitles.length < max) {
      novelTitles.push(entry.title);

      if (!highlightQuote && entry.excerpt) {
        highlightQuote = entry.excerpt;
        highlightReviewer = entry.reviewerName;
      }
      if (typeof entry.rating === "number") {
        ratingSum += entry.rating;
        ratingCount += 1;
      }
    }

    if (covers.length >= max && novelTitles.length >= max) break;
  }

  return {
    coverUrls: covers,
    novelTitles,
    highlightQuote,
    highlightReviewer,
    averageRating: ratingCount > 0 ? ratingSum / ratingCount : undefined,
  };
}

export async function getPublicReadingLists(
  limit = 6
): Promise<ReadingListPreview[]> {
  const folders = await db.folder.findMany({
    where: { isPublic: true },
    orderBy: [{ reviews: { _count: "desc" } }, { updatedAt: "desc" }],
    take: Math.max(limit * 2, 12),
    include: {
      user: { select: { displayName: true, username: true } },
      _count: { select: { reviews: true } },
      reviews: {
        take: 12,
        orderBy: { addedAt: "desc" },
        include: {
          review: {
            select: {
              title: true,
              body: true,
              rating: true,
              novelId: true,
              user: { select: { displayName: true } },
              novel: { select: { title: true, coverUrl: true } },
            },
          },
        },
      },
    },
  });

  return folders
    .filter((folder) => folder._count.reviews > 0)
    .map((folder) => {
      const shelf = uniqueShelfCovers(
        folder.reviews.map((item) => ({
          novelId: item.review.novelId,
          coverUrl: item.review.novel.coverUrl,
          title: item.review.novel.title,
          excerpt: item.review.body.slice(0, 140).trim(),
          reviewerName: item.review.user.displayName,
          rating: item.review.rating,
        }))
      );

      return {
        id: folder.id,
        name: folder.name,
        description: folder.description ?? undefined,
        ownerName: folder.user.displayName,
        ownerUsername: folder.user.username,
        reviewCount: folder._count.reviews,
        isPublic: folder.isPublic,
        coverUrls: shelf.coverUrls,
        novelTitles: shelf.novelTitles,
        highlightQuote: shelf.highlightQuote,
        highlightReviewer: shelf.highlightReviewer,
        averageRating: shelf.averageRating,
        href: `/folders/${folder.id}`,
        curatorLabel: `by @${folder.user.username}`,
      };
    })
    .filter((folder) => folder.coverUrls.length > 0)
    .slice(0, limit);
}

/**
 * Landing-page shelves: only real public folders created by users.
 */
export async function getLandingReadingShelves(
  limit = 6
): Promise<ReadingListPreview[]> {
  return getPublicReadingLists(limit);
}

const landingDoorNovelSelect = {
  id: true,
  title: true,
  author: true,
  coverUrl: true,
  _count: { select: { reviews: true, readingLinks: true } },
} as const;

const CURATED_WEB_NOVEL_TITLES = new Set(
  [...TRANSLATED_CN_NOVELS, ...ENGLISH_WEB_NOVELS].map((novel) =>
    normalizeNovelTitle(novel.title)
  )
);

const CURATED_WEB_NOVEL_EXACT_TITLES = [
  ...new Set(
    [...TRANSLATED_CN_NOVELS, ...ENGLISH_WEB_NOVELS].map((novel) => novel.title)
  ),
];

type LandingDoorNovel = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  _count: { reviews: number; readingLinks: number };
};

async function loadLandingDoorNovels(
  where: { genres?: { some: { slug: string } }; tags?: { some: { slug: string } } }
): Promise<LandingDoorNovel[]> {
  return db.novel.findMany({
    where: {
      ...where,
      OR: [
        { title: { in: CURATED_WEB_NOVEL_EXACT_TITLES } },
        { readingLinks: { some: {} } },
      ],
    },
    orderBy: [{ reviews: { _count: "desc" } }, { title: "asc" }],
    take: 48,
    select: landingDoorNovelSelect,
  });
}

function toLandingGenreDoor(input: {
  kind: LandingGenreDoor["kind"];
  slug: string;
  name: string;
  titleCount: number;
  reviewCount: number;
  novels: LandingDoorNovel[];
}): LandingGenreDoor {
  const covers = pickLandingDoorCovers(
    input.novels,
    4,
    CURATED_WEB_NOVEL_TITLES
  );
  return {
    kind: input.kind,
    slug: input.slug,
    name: input.name,
    href: landingGenreHref(input.slug),
    blurb: landingGenreBlurb(input.slug),
    titleCount: input.titleCount,
    reviewCount: input.reviewCount,
    featuredTitle: covers[0]?.title,
    covers,
  };
}

/**
 * Editorial landing doors with live catalogue covers and counts.
 * Never invents titles or statistics.
 */
export async function getLandingGenreDoors(): Promise<LandingGenreDoor[]> {
  const [genreRows, tagRow, genreReviewCounts, tagReviewCount, genreNovels, tagNovels] =
    await Promise.all([
      db.genre.findMany({
        where: { slug: { in: [...LANDING_GENRE_DOOR_SLUGS] } },
        select: {
          slug: true,
          name: true,
          _count: { select: { novels: true } },
        },
      }),
      db.tag.findUnique({
        where: { slug: LANDING_SLOW_BURN_SLUG },
        select: {
          slug: true,
          name: true,
          _count: { select: { novels: true } },
        },
      }),
      Promise.all(
        LANDING_GENRE_DOOR_SLUGS.map((slug) =>
          db.review.count({
            where: { novel: { genres: { some: { slug } } } },
          })
        )
      ),
      db.review.count({
        where: { novel: { tags: { some: { slug: LANDING_SLOW_BURN_SLUG } } } },
      }),
      Promise.all(
        LANDING_GENRE_DOOR_SLUGS.map((slug) =>
          loadLandingDoorNovels({ genres: { some: { slug } } })
        )
      ),
      loadLandingDoorNovels({ tags: { some: { slug: LANDING_SLOW_BURN_SLUG } } }),
    ]);

  const genresBySlug = new Map(genreRows.map((row) => [row.slug, row]));

  const genreDoors = LANDING_GENRE_DOOR_SLUGS.map((slug, index) => {
    const row = genresBySlug.get(slug);
    return toLandingGenreDoor({
      kind: "genre",
      slug,
      name: row?.name ?? genreLabel(slug),
      titleCount: row?._count.novels ?? 0,
      reviewCount: genreReviewCounts[index] ?? 0,
      novels: genreNovels[index] ?? [],
    });
  });

  const slowBurn = toLandingGenreDoor({
    kind: "tag",
    slug: LANDING_SLOW_BURN_SLUG,
    name: "Slow-burn",
    titleCount: tagRow?._count.novels ?? 0,
    reviewCount: tagReviewCount,
    novels: tagNovels,
  });

  return [...genreDoors, slowBurn];
}

/**
 * Three live catalogue faces for the landing Moonie desk.
 * Curated web novels and titles with a verified reading link only.
 */
export async function getCloseNightShelf(
  limit = 3
): Promise<LandingGenreCover[]> {
  const [curated, linked] = await Promise.all([
    db.novel.findMany({
      where: { title: { in: CURATED_WEB_NOVEL_EXACT_TITLES } },
      take: 24,
      select: landingDoorNovelSelect,
    }),
    db.novel.findMany({
      where: { readingLinks: { some: {} } },
      take: 24,
      orderBy: { reviews: { _count: "desc" } },
      select: landingDoorNovelSelect,
    }),
  ]);

  const seen = new Set<string>();
  const eligible: LandingDoorNovel[] = [];
  for (const novel of [...curated, ...linked]) {
    if (seen.has(novel.id)) continue;
    if (
      !isCloseNightShelfCandidate({
        curated: CURATED_WEB_NOVEL_TITLES.has(normalizeNovelTitle(novel.title)),
        readingLinkCount: novel._count.readingLinks,
      })
    ) {
      continue;
    }
    seen.add(novel.id);
    eligible.push(novel);
  }

  return pickLandingDoorCovers(eligible, limit, CURATED_WEB_NOVEL_TITLES);
}

function landingDiscoverQuote(
  reviews: { title: string; body?: string | null }[]
): string | undefined {
  for (const review of reviews) {
    if (isTemplateReviewTitle(review.title)) continue;
    const quote = discoverShelfQuote(review.body || review.title);
    if (quote) return quote;
  }
  return undefined;
}

/**
 * Landing discover shelf: curated web novels and titles with a verified
 * reading link only. Never invents ratings or quotes.
 */
export async function getLandingDiscoverShelf(
  sort: "trending" | "highest",
  limit = 12
): Promise<TrendingNovelPreview[]> {
  const novels = await db.novel.findMany({
    where: {
      reviews: { some: {} },
      OR: [
        { title: { in: CURATED_WEB_NOVEL_EXACT_TITLES } },
        { readingLinks: { some: {} } },
      ],
    },
    take: 80,
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      genres: { take: 1, select: { name: true } },
      readingLinks: { take: 1, select: { id: true } },
      reviews: {
        select: {
          title: true,
          body: true,
          rating: true,
          likeCount: true,
          commentCount: true,
          saveCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const mapped = novels
    .filter((novel) =>
      isLandingDiscoverCandidate({
        title: novel.title,
        hasOfficialLink: novel.readingLinks.length > 0,
      })
    )
    .map((novel): TrendingNovelPreview => {
      const reviewCount = novel.reviews.length;
      const totalRating = novel.reviews.reduce(
        (total, review) => total + review.rating,
        0
      );
      const totalLikes = novel.reviews.reduce(
        (total, review) => total + review.likeCount,
        0
      );
      const totalComments = novel.reviews.reduce(
        (total, review) => total + review.commentCount,
        0
      );
      const totalSaves = novel.reviews.reduce(
        (total, review) => total + review.saveCount,
        0
      );
      const latestReview = novel.reviews[0];
      const ageInDays = latestReview
        ? Math.max(0, (now - latestReview.createdAt.getTime()) / dayMs)
        : Number.POSITIVE_INFINITY;
      const recentActivityWeight =
        ageInDays <= 7 ? 12 : ageInDays <= 30 ? 6 : ageInDays <= 90 ? 2 : 0;
      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

      return {
        novelId: novel.id,
        title: novel.title,
        author: novel.author ?? "Unknown author",
        coverUrl: resolveCoverUrl(novel.coverUrl, { title: novel.title }),
        primaryGenre: novel.genres[0]?.name,
        averageRating,
        reviewCount,
        totalLikes,
        totalComments,
        totalSaves,
        mostRecentReviewAt:
          latestReview?.createdAt.toISOString() ?? new Date(0).toISOString(),
        communityQuote: landingDiscoverQuote(novel.reviews),
        score:
          reviewCount * 4 +
          totalLikes * 2 +
          totalComments * 3 +
          totalSaves * 2 +
          recentActivityWeight +
          averageRating,
        hasOfficialLink: novel.readingLinks.length > 0,
      };
    });

  return pickLandingDiscoverNovels(mapped, limit, sort);
}

export async function getTopReviewers(
  limit = 8
): Promise<TopReviewerPreview[]> {
  const users = await db.user.findMany({
    where: { reviews: { some: {} } },
    orderBy: { reviews: { _count: "desc" } },
    take: limit,
    select: {
      id: true,
      displayName: true,
      username: true,
      _count: { select: { reviews: true, followers: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    avatarInitials: getInitials(user.displayName),
    reviewCount: user._count.reviews,
    followerCount: user._count.followers,
  }));
}

/** Tags on novels that have at least one review, ordered by novel count. */
export async function getDiscoverPopularTags(
  limit = 12
): Promise<DiscoverTagPreview[]> {
  const tags = await db.tag.findMany({
    where: { novels: { some: { reviews: { some: {} } } } },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { novels: true } },
    },
    orderBy: { novels: { _count: "desc" } },
    take: limit,
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    novelCount: tag._count.novels,
  }));
}

export async function getReadingListsForUser(
  userId: string,
  viewerId?: string
): Promise<ReadingListPreview[]> {
  const folders = await db.folder.findMany({
    where:
      viewerId === userId
        ? { userId }
        : { userId, isPublic: true },
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { displayName: true, username: true } },
      _count: { select: { reviews: true } },
      reviews: {
        take: 64,
        orderBy: { addedAt: "desc" },
        include: {
          review: {
            include: {
              novel: {
                include: shelfNovelInclude,
              },
            },
          },
        },
      },
    },
  });

  return folders.map((folder) => {
    const shelf = dedupeFolderEntriesToShelfNovels(
      folder.reviews,
      0,
      READING_LIST_SHELF_INITIAL_BATCH,
      folder._count.reviews
    );

    return {
      id: folder.id,
      name: folder.name,
      ownerName: folder.user.displayName,
      ownerUsername: folder.user.username,
      reviewCount: folder._count.reviews,
      isPublic: folder.isPublic,
      coverUrls: shelf.novels.map((novel) => novel.coverUrl),
      novelTitles: shelf.novels.map((novel) => novel.title),
      novels: shelf.novels,
      hasMoreNovels: shelf.hasMore,
      href: `/folders/${folder.id}`,
    };
  });
}

/**
 * Recent community activity for sidebars.
 * Built from public reviews (third person), never personal notification copy
 * like "Someone liked your review."
 */
export async function getRecentCommunityActivity(
  limit = 8
): Promise<ActivityPreview[]> {
  const take = Math.max(limit, 4);

  const [reviews, comments, follows] = await Promise.all([
    db.review.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        createdAt: true,
        user: { select: { displayName: true } },
        novel: { select: { title: true } },
      },
    }),
    db.comment.findMany({
      where: { parentCommentId: null },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        createdAt: true,
        reviewId: true,
        user: { select: { displayName: true } },
        review: { select: { title: true } },
      },
    }),
    db.follow.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        followerId: true,
        followingId: true,
        createdAt: true,
        follower: { select: { displayName: true } },
        following: { select: { displayName: true, username: true } },
      },
    }),
  ]);

  const items: ActivityPreview[] = [
    ...reviews.map((review) => {
      const actor = review.user.displayName?.trim() || "A reader";
      return {
        id: `review-${review.id}`,
        type: "REVIEW_PUBLISHED",
        message: `${actor} reviewed ${review.novel.title}`,
        link: `/reviews/${review.id}`,
        createdAt: review.createdAt.toISOString(),
        actorInitials: getInitials(actor),
      };
    }),
    ...comments.map((comment) => {
      const actor = comment.user.displayName?.trim() || "A reader";
      return {
        id: `comment-${comment.id}`,
        type: "COMMENT_ON_REVIEW",
        message: `${actor} commented on “${comment.review.title}”`,
        link: `/reviews/${comment.reviewId}`,
        createdAt: comment.createdAt.toISOString(),
        actorInitials: getInitials(actor),
      };
    }),
    ...follows.map((follow) => {
      const actor = follow.follower.displayName?.trim() || "A reader";
      const target =
        follow.following.displayName?.trim() ||
        follow.following.username ||
        "a reviewer";
      return {
        id: `follow-${follow.followerId}-${follow.followingId}`,
        type: "NEW_FOLLOWER",
        message: `${actor} followed ${target}`,
        link: `/users/${follow.following.username}`,
        createdAt: follow.createdAt.toISOString(),
        actorInitials: getInitials(actor),
      };
    }),
  ];

  return items
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);
}
