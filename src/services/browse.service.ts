import {
  Prisma,
  ReadingLinkCategory,
  ReadingLinkModerationStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { bayesianQuality } from "@/lib/moonie/ranking";
import { isMissingCoverUrl, resolveCoverUrl } from "@/lib/review-utils";
import { encodeBrowseCursor } from "@/lib/browse-cursor";
import type { GenreBrowseSort } from "@/lib/browse-sort";
import type {
  BrowseRankExplain,
  BrowseWorkItem,
  BrowseWorkPreview,
} from "@/types/browse";

const officialReadingLinkWhere: Prisma.ReadingLinkWhereInput = {
  active: true,
  moderationStatus: ReadingLinkModerationStatus.APPROVED,
  OR: [
    { isOfficial: true },
    { isVerified: true },
    { category: ReadingLinkCategory.OFFICIAL },
  ],
};

const CATALOGUE_MEAN = 3.6;
const BAYES_M = 8;

export interface BrowseWorksOptions {
  genreSlug: string;
  tagSlugs?: string[];
  sort?: GenreBrowseSort;
  limit?: number;
  offset?: number;
  /** Only novels with a verified / official reading link. */
  officialOnly?: boolean;
  /** Logged-in user for Moonie affinity sort. */
  userId?: string | null;
}

export interface BrowseAffinityProfile {
  favouriteGenres: string[];
  favouriteTags: string[];
  avoidedTags: string[];
  onboardingGenres: string[];
}

async function loadBrowseAffinityProfile(
  userId: string
): Promise<BrowseAffinityProfile> {
  const [taste, onboarding] = await Promise.all([
    db.moonieTasteProfile.findUnique({ where: { userId } }),
    db.userPreferredGenre.findMany({
      where: { userId },
      include: { genre: { select: { name: true } } },
    }),
  ]);

  return {
    favouriteGenres: taste?.favouriteGenres ?? [],
    favouriteTags: taste?.favouriteTags ?? [],
    avoidedTags: taste?.avoidedTags ?? [],
    onboardingGenres: onboarding.map((row) => row.genre.name),
  };
}

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function affinityOverlap(haystack: string[], needles: string[]): number {
  if (needles.length === 0 || haystack.length === 0) return 0;
  const set = new Set(haystack.map(normalizeLabel));
  let hits = 0;
  for (const needle of needles) {
    const n = normalizeLabel(needle);
    if (!n) continue;
    if (set.has(n) || [...set].some((h) => h.includes(n) || n.includes(h))) {
      hits += 1;
    }
  }
  return hits;
}

export interface BrowseWorksPage {
  works: BrowseWorkItem[];
  total: number;
  offset: number;
  limit: number;
  nextCursor: string | null;
}

function novelWhere(options: BrowseWorksOptions) {
  return {
    genres: {
      some: {
        OR: [
          { slug: options.genreSlug },
          { name: { equals: options.genreSlug, mode: "insensitive" as const } },
        ],
      },
    },
    ...(options.tagSlugs?.length
      ? {
          AND: options.tagSlugs.map((slug) => ({
            tags: { some: { slug } },
          })),
        }
      : {}),
    ...(options.officialOnly
      ? { readingLinks: { some: officialReadingLinkWhere } }
      : {}),
  };
}

function bayesianStars(averageRating: number, reviewCount: number): number {
  if (reviewCount <= 0) return 0;
  return bayesianQuality(averageRating, reviewCount, CATALOGUE_MEAN, BAYES_M) * 5;
}

function buildRankExplain(input: {
  sort: GenreBrowseSort;
  averageRating: number;
  reviewCount: number;
  bayesianRating: number;
  hasCover: boolean;
  hasOfficialLink: boolean;
  totalLikes: number;
  totalComments: number;
  affinityHits?: number;
  affinityAvoids?: number;
}): BrowseRankExplain {
  const reasons: string[] = [];
  const { sort, averageRating, reviewCount, bayesianRating, hasCover, hasOfficialLink } =
    input;

  switch (sort) {
    case "affinity":
      if ((input.affinityHits ?? 0) > 0) {
        reasons.push(
          `Matches ${input.affinityHits} signal${input.affinityHits === 1 ? "" : "s"} from your Moonie taste profile`
        );
      } else {
        reasons.push("Limited overlap with your saved taste profile");
      }
      if ((input.affinityAvoids ?? 0) > 0) {
        reasons.push("Includes tags you marked as avoided");
      }
      if (reviewCount > 0) {
        reasons.push(
          `Bayesian strength ${bayesianRating.toFixed(2)} from ${reviewCount} review${reviewCount === 1 ? "" : "s"}`
        );
      }
      break;
    case "community-strength":
      if (reviewCount === 0) {
        reasons.push("No community ratings yet");
      } else {
        reasons.push(
          `Bayesian rating ${bayesianRating.toFixed(2)} (mean ${averageRating.toFixed(1)} across ${reviewCount} review${reviewCount === 1 ? "" : "s"})`
        );
        if (reviewCount < BAYES_M) {
          reasons.push(
            `Fewer than ${BAYES_M} reviews, so the score pulls toward the catalogue mean`
          );
        }
      }
      break;
    case "catalogue-confidence":
      reasons.push(
        hasOfficialLink
          ? "Verified official reading link"
          : "No verified official link yet"
      );
      reasons.push(hasCover ? "Trusted cover on file" : "Using a branded cover fallback");
      if (reviewCount > 0) {
        reasons.push(
          `Community evidence: ${reviewCount} review${reviewCount === 1 ? "" : "s"}`
        );
      }
      break;
    case "highest-rated":
      reasons.push(
        reviewCount > 0
          ? `Raw average ${averageRating.toFixed(1)} from ${reviewCount} review${reviewCount === 1 ? "" : "s"}`
          : "No ratings yet"
      );
      break;
    case "new":
      reasons.push("Sorted by most recent community discussion");
      break;
    case "most-discussed":
      reasons.push(`${input.totalComments} comments across reviews`);
      break;
    case "most-saved":
      reasons.push("Sorted by how often reviews are saved");
      break;
    case "hot":
    default:
      reasons.push(
        reviewCount > 0
          ? `${reviewCount} reviews, ${input.totalLikes} likes in community activity`
          : "Limited community activity so far"
      );
      break;
  }

  if (hasCover && sort !== "catalogue-confidence") {
    reasons.push("Real cover preferred in close ties");
  }

  return { sort, reasons };
}

/**
 * Faceted novel list for Browse Works mode.
 * Prefer titles with real covers when ranking ties are close.
 */
export async function getBrowseWorks(
  options: BrowseWorksOptions
): Promise<BrowseWorksPage> {
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 48);
  const offset = Math.max(options.offset ?? 0, 0);
  let sort = options.sort ?? "hot";
  const where = novelWhere(options);

  let affinity: BrowseAffinityProfile | null = null;
  if (sort === "affinity") {
    if (options.userId) {
      affinity = await loadBrowseAffinityProfile(options.userId);
    } else {
      // Guests cannot use personalised affinity; fall back honestly.
      sort = "community-strength";
    }
  }

  const [total, novels] = await Promise.all([
    db.novel.count({ where }),
    db.novel.findMany({
      where,
      // Stable pool so offset/cursor pages share the same ranked order.
      take: 200,
      select: {
        id: true,
        title: true,
        author: true,
        coverUrl: true,
        synopsis: true,
        publicationStatus: true,
        genres: { select: { name: true }, take: 3 },
        tags: { select: { name: true, slug: true }, take: 6 },
        readingLinks: {
          where: officialReadingLinkWhere,
          select: { id: true },
          take: 1,
        },
        reviews: {
          select: {
            rating: true,
            likeCount: true,
            commentCount: true,
            saveCount: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  const likedGenres = [
    ...(affinity?.favouriteGenres ?? []),
    ...(affinity?.onboardingGenres ?? []),
  ];
  const likedTags = affinity?.favouriteTags ?? [];
  const avoidedTags = affinity?.avoidedTags ?? [];

  const scored = novels.map((novel) => {
    const reviewCount = novel.reviews.length;
    const totalRating = novel.reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
    const bayesianRating = bayesianStars(averageRating, reviewCount);
    const totalLikes = novel.reviews.reduce((sum, r) => sum + r.likeCount, 0);
    const totalComments = novel.reviews.reduce(
      (sum, r) => sum + r.commentCount,
      0
    );
    const totalSaves = novel.reviews.reduce((sum, r) => sum + r.saveCount, 0);
    const mostRecent = novel.reviews.reduce(
      (latest, r) => (r.createdAt > latest ? r.createdAt : latest),
      new Date(0)
    );
    const hasCover = !isMissingCoverUrl(novel.coverUrl);
    const hasOfficialLink = novel.readingLinks.length > 0;
    const coverBoost = hasCover ? 8 : 0;
    const genreNames = novel.genres.map((g) => g.name);
    const tagNames = novel.tags.map((t) => t.name);
    const genreHits = affinityOverlap(genreNames, likedGenres);
    const tagHits = affinityOverlap(tagNames, likedTags);
    const avoidHits = affinityOverlap(tagNames, avoidedTags);
    const affinityHits = genreHits + tagHits;

    let rankScore = coverBoost;
    switch (sort) {
      case "new":
        rankScore += mostRecent.getTime() / 1_000_000;
        break;
      case "highest-rated":
        rankScore +=
          averageRating * 20 + Math.min(reviewCount, 40) + coverBoost;
        break;
      case "community-strength":
        rankScore += bayesianRating * 40 + Math.min(reviewCount, 20) + coverBoost;
        break;
      case "affinity":
        rankScore +=
          affinityHits * 28 +
          bayesianRating * 18 +
          Math.min(reviewCount, 15) -
          avoidHits * 35 +
          coverBoost;
        break;
      case "catalogue-confidence":
        rankScore +=
          (hasOfficialLink ? 50 : 0) +
          (hasCover ? 30 : 0) +
          Math.min(reviewCount, 25) +
          bayesianRating * 8;
        break;
      case "most-discussed":
        rankScore += totalComments * 4 + reviewCount + coverBoost;
        break;
      case "most-saved":
        rankScore += totalSaves * 4 + reviewCount + coverBoost;
        break;
      case "hot":
      default:
        rankScore +=
          reviewCount * 4 +
          totalLikes * 2 +
          totalComments * 3 +
          totalSaves * 2 +
          averageRating * 3 +
          coverBoost;
        break;
    }

    const work: BrowseWorkItem = {
      novelId: novel.id,
      title: novel.title,
      author: novel.author ?? "Unknown author",
      coverUrl: resolveCoverUrl(novel.coverUrl),
      genres: genreNames,
      tags: tagNames,
      averageRating,
      reviewCount,
      bayesianRating,
      hasOfficialLink,
      publicationStatus: novel.publicationStatus,
      synopsis: novel.synopsis,
      href: `/novels/${novel.id}`,
      rankExplain: buildRankExplain({
        sort,
        averageRating,
        reviewCount,
        bayesianRating,
        hasCover,
        hasOfficialLink,
        totalLikes,
        totalComments,
        affinityHits,
        affinityAvoids: avoidHits,
      }),
    };

    return { work, rankScore, title: novel.title };
  });

  scored.sort(
    (a, b) => b.rankScore - a.rankScore || a.title.localeCompare(b.title)
  );

  const page = scored.slice(offset, offset + limit).map((row) => row.work);
  const nextOffset = offset + page.length;
  const nextCursor =
    nextOffset < total && page.length > 0
      ? encodeBrowseCursor(nextOffset)
      : null;

  return { works: page, total, offset, limit, nextCursor };
}

export async function countBrowseWorks(
  options: Omit<BrowseWorksOptions, "limit" | "offset" | "sort">
): Promise<number> {
  return db.novel.count({ where: novelWhere(options) });
}

/** Lightweight preview payload for the Browse work drawer. */
export async function getBrowseWorkPreview(
  novelId: string
): Promise<BrowseWorkPreview | null> {
  const novel = await db.novel.findUnique({
    where: { id: novelId },
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      synopsis: true,
      publicationStatus: true,
      genres: { select: { name: true }, take: 4 },
      tags: { select: { name: true }, take: 8 },
      readingLinks: {
        where: officialReadingLinkWhere,
        select: { url: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        take: 1,
      },
      reviews: {
        where: { moderationStatus: "OK" },
        orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          id: true,
          title: true,
          body: true,
          rating: true,
          user: { select: { username: true } },
        },
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!novel) return null;

  const ratingAgg = await db.review.aggregate({
    where: { novelId, moderationStatus: "OK" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const reviewCount = ratingAgg._count._all;
  const averageRating = ratingAgg._avg.rating ?? 0;
  const bayesianRating = bayesianStars(averageRating, reviewCount);
  const sample = novel.reviews[0];
  const excerpt =
    sample && sample.body.length > 220
      ? `${sample.body.slice(0, 217).trimEnd()}…`
      : (sample?.body ?? null);

  return {
    novelId: novel.id,
    title: novel.title,
    author: novel.author ?? "Unknown author",
    coverUrl: resolveCoverUrl(novel.coverUrl),
    genres: novel.genres.map((g) => g.name),
    tags: novel.tags.map((t) => t.name),
    averageRating,
    reviewCount,
    bayesianRating,
    hasOfficialLink: novel.readingLinks.length > 0,
    officialLinkUrl: novel.readingLinks[0]?.url ?? null,
    publicationStatus: novel.publicationStatus,
    synopsis: novel.synopsis,
    href: `/novels/${novel.id}`,
    sampleReview: sample
      ? {
          id: sample.id,
          title: sample.title,
          excerpt: excerpt ?? "",
          rating: sample.rating,
          username: sample.user.username,
          href: `/reviews/${sample.id}`,
        }
      : null,
  };
}
