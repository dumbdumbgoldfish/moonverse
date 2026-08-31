import { ContentModerationStatus, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  sanitizeReviewExcerpt,
  sanitizeReviewTitleForMode,
} from "@/lib/moonie/spoiler-mode";
import type {
  MoonieInterpretedPreferences,
  MooniePendingClarification,
  MoonieRankedReview,
  MoonieRecommendResponse,
  MoonieSpoilerMode,
} from "@/types/moonie";

const PUBLIC_REVIEW_WHERE = {
  moderationStatus: { not: ContentModerationStatus.HIDDEN },
} as const;

const DEFAULT_COUNT = 5;

/** Catalogue genres commonly associated with salon mood chips (not invented slugs). */
const MOOD_CATALOGUE_GENRES: Record<string, string[]> = {
  cosy: ["slice-of-life", "comedy"],
  dark: ["horror"],
};

/** Catalogue tags commonly associated with salon mood chips (not invented slugs). */
const MOOD_CATALOGUE_TAGS: Record<string, string[]> = {
  cosy: ["found-family", "slow-burn", "fluff"],
  dark: ["tragedy", "angst"],
  hopeful: ["slow-burn"],
  emotional: ["tragedy", "angst"],
};

export function moodCatalogueSlugs(moods: string[]): {
  genres: string[];
  tags: string[];
} {
  const genres = new Set<string>();
  const tags = new Set<string>();
  for (const mood of moods) {
    for (const genre of MOOD_CATALOGUE_GENRES[mood] ?? []) {
      genres.add(genre);
    }
    for (const tag of MOOD_CATALOGUE_TAGS[mood] ?? []) {
      tags.add(tag);
    }
  }
  return { genres: [...genres], tags: [...tags] };
}

export function hasUsableSalonReviewPreference(
  prefs: Pick<MoonieInterpretedPreferences, "genres" | "tags">
): boolean {
  return prefs.genres.length > 0 || prefs.tags.length > 0;
}

export function catalogueTagSlugs(tags: string[]): string[] {
  const slugs = new Set<string>();
  for (const tag of tags) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) continue;
    slugs.add(trimmed);
    slugs.add(trimmed.replace(/\s+/g, "-"));
  }
  return [...slugs];
}

export function buildForYouShelfReviewClarification(options?: {
  count?: number;
}): MoonieRecommendResponse {
  const count = Math.min(20, Math.max(1, options?.count ?? DEFAULT_COUNT));
  const pending: MooniePendingClarification = {
    kind: "review_preference",
    count,
  };
  return {
    reply:
      "Which For You shelf should I lean on—romance, fantasy, or a trope you save often? I can show spoiler-protected reviews that match.",
    recommendations: [],
    responseKind: "chat",
    pendingClarification: pending,
    requestedCount: count,
    rankingMetric: null,
    quickPrompts: ["Romance shelf", "Fantasy shelf", "Found-family vibes"],
    consumesQuota: false,
    analyticsIntent: "for_you_shelf_reviews",
  };
}

export function buildSalonReviewPreferenceClarification(options?: {
  count?: number;
}): MoonieRecommendResponse {
  const count = Math.min(20, Math.max(1, options?.count ?? DEFAULT_COUNT));
  const pending: MooniePendingClarification = {
    kind: "review_preference",
    count,
  };
  return {
    reply:
      "What are you in the mood to read—cozy fantasy, romance, or something darker? I can show spoiler-aware salon reviews.",
    recommendations: [],
    responseKind: "chat",
    pendingClarification: pending,
    requestedCount: count,
    rankingMetric: null,
    quickPrompts: ["Cozy fantasy", "Romance", "Something darker"],
    consumesQuota: false,
    analyticsIntent: "salon_reviews",
  };
}

function preferenceScopeLabel(prefs: MoonieInterpretedPreferences): string {
  const parts = [
    ...prefs.genres,
    ...prefs.tags,
    ...prefs.mood,
  ].filter(Boolean);
  if (parts.length === 0) return "your reading preferences";
  return parts.slice(0, 3).join(", ");
}

export function salonNovelPreferenceWhere(
  prefs: MoonieInterpretedPreferences
): Prisma.NovelWhereInput | null {
  const moodSlugs = moodCatalogueSlugs(prefs.mood);
  const userGenres = prefs.genres;
  const userTagSlugs = catalogueTagSlugs(prefs.tags);
  const moodGenreSlugs = moodSlugs.genres;
  const moodTagSlugs = catalogueTagSlugs(moodSlugs.tags);

  const hasUserSignal = userGenres.length > 0 || userTagSlugs.length > 0;
  const hasMoodSignal = moodGenreSlugs.length > 0 || moodTagSlugs.length > 0;

  if (!hasUserSignal && !hasMoodSignal) {
    return null;
  }

  function moodClause(): Prisma.NovelWhereInput | null {
    const moodClauses: Prisma.NovelWhereInput[] = [];
    if (moodGenreSlugs.length > 0) {
      moodClauses.push({
        genres: { some: { slug: { in: moodGenreSlugs } } },
      });
    }
    if (moodTagSlugs.length > 0) {
      moodClauses.push({
        tags: { some: { slug: { in: moodTagSlugs } } },
      });
    }
    if (moodClauses.length === 0) return null;
    return moodClauses.length === 1 ? moodClauses[0] : { OR: moodClauses };
  }

  if (prefs.mood.length > 0 && hasUserSignal) {
    const baseClauses: Prisma.NovelWhereInput[] = [];
    if (userGenres.length > 0) {
      baseClauses.push({
        genres: { some: { slug: { in: userGenres } } },
      });
    }
    if (userTagSlugs.length > 0) {
      baseClauses.push({
        tags: { some: { slug: { in: userTagSlugs } } },
      });
    }
    const base =
      baseClauses.length === 1 ? baseClauses[0] : { AND: baseClauses };
    const moodFilter = moodClause();
    if (!moodFilter) return base;
    return { AND: [base, moodFilter] };
  }

  if (prefs.mood.length > 0) {
    return moodClause();
  }

  const clauses: Prisma.NovelWhereInput[] = [];
  if (userGenres.length > 0) {
    clauses.push({ genres: { some: { slug: { in: userGenres } } } });
  }
  if (userTagSlugs.length > 0) {
    clauses.push({ tags: { some: { slug: { in: userTagSlugs } } } });
  }
  if (clauses.length === 0) return null;
  return clauses.length === 1 ? clauses[0] : { OR: clauses };
}

export async function buildSalonReviewRecommendResponse(options: {
  prefs: MoonieInterpretedPreferences;
  spoilerMode: MoonieSpoilerMode;
  count?: number;
}): Promise<MoonieRecommendResponse> {
  const count = Math.min(20, Math.max(1, options.count ?? DEFAULT_COUNT));
  const novelWhere = salonNovelPreferenceWhere(options.prefs);

  if (!novelWhere) {
    return {
      reply:
        "I could not match that mood to a catalogue genre or tag, so I cannot pick spoiler-aware reviews yet. Name a genre such as romance or fantasy.",
      recommendations: [],
      responseKind: "reviews",
      state: "no_results",
      emptyReason: "unknown_status",
      rankedReviews: [],
      requestedCount: count,
      consumesQuota: true,
      spoilerMode: options.spoilerMode,
      interpretedPreferences: options.prefs,
      analyticsIntent: "salon_reviews",
    };
  }

  const reviews = await db.review.findMany({
    where: {
      ...PUBLIC_REVIEW_WHERE,
      novel: novelWhere,
    },
    orderBy: [{ likeCount: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
    take: count,
    select: {
      id: true,
      title: true,
      body: true,
      rating: true,
      containsSpoilers: true,
      novel: { select: { id: true, title: true } },
      user: { select: { displayName: true, username: true } },
    },
  });

  if (reviews.length === 0) {
    return {
      reply: `I could not find public spoiler-aware reviews that match ${preferenceScopeLabel(options.prefs)} in the current catalogue.`,
      recommendations: [],
      responseKind: "reviews",
      state: "no_results",
      emptyReason: "no_matches",
      rankedReviews: [],
      requestedCount: count,
      consumesQuota: true,
      spoilerMode: options.spoilerMode,
      interpretedPreferences: options.prefs,
      analyticsIntent: "salon_reviews",
    };
  }

  const rankedReviews: MoonieRankedReview[] = reviews.map((review) => {
    const excerpt =
      sanitizeReviewExcerpt({
        title: review.title,
        body: review.body,
        containsSpoilers: review.containsSpoilers,
        mode: options.spoilerMode,
      }) ??
      (review.containsSpoilers
        ? "This review is marked as containing spoilers."
        : "");
    return {
      id: review.id,
      title: sanitizeReviewTitleForMode({
        title: review.title,
        containsSpoilers: review.containsSpoilers,
        mode: options.spoilerMode,
      }),
      excerpt,
      rating: review.rating,
      reviewerName: review.user.displayName,
      reviewerUsername: review.user.username,
      novelId: review.novel.id,
      novelTitle: review.novel.title,
      containsSpoilers: review.containsSpoilers,
    };
  });

  return {
    reply: `Here are spoiler-aware public salon reviews that match ${preferenceScopeLabel(options.prefs)}.`,
    recommendations: [],
    responseKind: "reviews",
    rankedReviews,
    requestedCount: count,
    consumesQuota: true,
    spoilerMode: options.spoilerMode,
    interpretedPreferences: options.prefs,
    analyticsIntent: "salon_reviews",
  };
}
