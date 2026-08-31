import { Prisma, ReadingLinkCategory, ReadingLinkModerationStatus } from "@prisma/client";
import { slugifyLabel } from "@/lib/moonie/label-match";
import { db } from "@/lib/db";
import {
  bayesianQuality,
  combineRankingScore,
  cosineSimilarity,
  lexicalHashEmbedding,
  overlapScore,
  parseEmbedding,
  type ScoreBreakdown,
} from "@/lib/moonie/ranking";
import type { MoonieInterpretedPreferences } from "@/types/moonie";
import type { MooniePersonalizationSettings } from "@/lib/moonie/personalization";
import { DEFAULT_PERSONALIZATION_SETTINGS } from "@/lib/moonie/personalization";
import type { MoonieHardInclusionConstraints } from "@/lib/moonie/hard-constraints";
import {
  filterNovelsByHardConstraints,
  hasHardInclusionConstraints,
} from "@/lib/moonie/hard-constraints";
import {
  prismaConstraintEligibleCompletedStatus,
  prismaConstraintEligibleOngoingStatus,
} from "@/lib/moonie/metadata-eligibility";

const officialReadingLinkWhere: Prisma.ReadingLinkWhereInput = {
  active: true,
  moderationStatus: ReadingLinkModerationStatus.APPROVED,
  OR: [
    { isOfficial: true },
    { isVerified: true },
    { category: ReadingLinkCategory.OFFICIAL },
  ],
};

export interface HybridCandidate {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  synopsis: string | null;
  originalLanguage: string | null;
  publicationStatus: string | null;
  lengthBand: string | null;
  chapterCount: number | null;
  metadataSource: string | null;
  createdAt: Date;
  genres: string[];
  tags: string[];
  moods: string[];
  reviewCount: number;
  averageRating: number | null;
  topReviewId: string | null;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  semantic: number;
  lexical: number;
  historySignals?: {
    onReadingList: boolean;
    savedNovel: boolean;
    moreLikeThis: boolean;
    helpful: boolean;
    tasteGenreAffinity: boolean;
  };
}

export interface MoonieRecentSearchEntry {
  query: string;
  novelId?: string;
}

export interface HybridRetrievalOptions {
  prefs: MoonieInterpretedPreferences;
  queryText?: string;
  queryEmbedding?: number[];
  userId?: string;
  excludeNovelIds?: string[];
  similarToNovelId?: string;
  limit?: number;
  disableSemantic?: boolean;
  /** When false, genre filters become ranking signals only (helps cold/sparse requests). */
  strictGenreFilter?: boolean;
  /** Current-turn inclusion constraints. When set, these replace prefs.genres for SQL filters. */
  hardConstraints?: MoonieHardInclusionConstraints | null;
  personalization?: MooniePersonalizationSettings;
  /** Client-provided recent searches (localStorage); only used when useSearchHistory is on. */
  recentSearches?: MoonieRecentSearchEntry[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

async function lexicalCandidateIds(
  queryText: string,
  limit: number
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  if (!queryText.trim()) return scores;
  try {
    const rows = await db.$queryRaw<Array<{ id: string; rank: number }>>`
      SELECT n.id,
        GREATEST(
          COALESCE(ts_rank(n.search_document, plainto_tsquery('simple', ${queryText})), 0),
          COALESCE(similarity(n.title, ${queryText}), 0)
        ) AS rank
      FROM novels n
      LEFT JOIN novel_aliases a ON a.novel_id = n.id
      WHERE n.search_document @@ plainto_tsquery('simple', ${queryText})
         OR n.title % ${queryText}
         OR a.title % ${queryText}
      ORDER BY rank DESC
      LIMIT ${limit}
    `;
    for (const row of rows) scores.set(row.id, Number(row.rank) || 0);
  } catch {
    // pg_trgm / tsvector may be unavailable on some hosts.
  }
  return scores;
}

function genreClause(genre: string): Prisma.NovelWhereInput {
  const trimmed = genre.trim();
  const slug = slugifyLabel(trimmed);
  return {
    genres: {
      some: {
        OR: [
          { slug: { equals: slug, mode: "insensitive" } },
          { name: { equals: trimmed, mode: "insensitive" } },
        ],
      },
    },
  };
}

function tagOrGenreClause(label: string): Prisma.NovelWhereInput {
  const trimmed = label.trim();
  const slug = slugifyLabel(trimmed);
  return {
    OR: [
      genreClause(trimmed),
      {
        tags: {
          some: {
            OR: [
              { slug: { equals: slug, mode: "insensitive" } },
              { name: { equals: trimmed, mode: "insensitive" } },
            ],
          },
        },
      },
    ],
  };
}

function applyGenreFilters(
  and: Prisma.NovelWhereInput[],
  genres: string[],
  match: "all" | "any"
) {
  if (genres.length === 0) return;
  if (match === "all" || genres.length === 1) {
    for (const genre of genres) {
      and.push(genreClause(genre));
    }
    return;
  }
  and.push({ OR: genres.map((genre) => genreClause(genre)) });
}

function lengthClause(length: "short" | "medium" | "long"): Prisma.NovelWhereInput {
  if (length === "short") {
    return {
      OR: [
        { lengthBand: "short" },
        {
          lengthBand: null,
          chapterCount: { gt: 0, lt: 80 },
        },
      ],
    };
  }
  if (length === "medium") {
    return {
      OR: [
        { lengthBand: "medium" },
        {
          lengthBand: null,
          chapterCount: { gte: 80, lt: 300 },
        },
      ],
    };
  }
  return {
    OR: [
      { lengthBand: "long" },
      {
        lengthBand: null,
        chapterCount: { gte: 300 },
      },
    ],
  };
}

function hardFilters(
  prefs: MoonieInterpretedPreferences,
  exclude: string[],
  strictGenreFilter = true,
  hard?: MoonieHardInclusionConstraints | null
): Prisma.NovelWhereInput {
  const and: Prisma.NovelWhereInput[] = [];
  if (exclude.length) and.push({ id: { notIn: exclude } });

  if (hasHardInclusionConstraints(hard)) {
    const inclusionClauses = [
      ...hard!.genres.map((genre) => genreClause(genre)),
      ...hard!.tags.map((tag) => tagOrGenreClause(tag)),
    ];
    if (hard!.inclusionMatch === "any" && inclusionClauses.length > 1) {
      and.push({ OR: inclusionClauses });
    } else {
      and.push(...inclusionClauses);
    }
  } else if (strictGenreFilter && prefs.genres.length > 0) {
    applyGenreFilters(and, prefs.genres, "any");
  }

  if (prefs.excludedTags.length > 0) {
    and.push({
      NOT: {
        tags: {
          some: {
            OR: prefs.excludedTags.map((tag) => ({
              name: { contains: tag, mode: "insensitive" },
            })),
          },
        },
      },
    });
  }

  const status = hasHardInclusionConstraints(hard) ? hard!.status : prefs.status;
  const language = hasHardInclusionConstraints(hard)
    ? hard!.language
    : prefs.language;
  const length = hasHardInclusionConstraints(hard) ? hard!.length : prefs.length;

  if (status === "completed") {
    and.push(prismaConstraintEligibleCompletedStatus());
  } else if (status === "ongoing") {
    and.push(prismaConstraintEligibleOngoingStatus());
  }

  if (language) {
    and.push({
      originalLanguage: { contains: language, mode: "insensitive" },
    });
  }

  if (length === "short" || length === "medium" || length === "long") {
    and.push(lengthClause(length));
  }

  if (hard?.requireOfficialReadingLink) {
    and.push({ readingLinks: { some: officialReadingLinkWhere } });
  }

  return and.length ? { AND: and } : {};
}

export function novelWhereMatchingPreferences(
  prefs: MoonieInterpretedPreferences,
  excludeNovelIds: string[] = [],
  strictGenreFilter = true,
  hardConstraints?: MoonieHardInclusionConstraints | null
): Prisma.NovelWhereInput {
  return hardFilters(
    prefs,
    excludeNovelIds,
    strictGenreFilter,
    hardConstraints
  );
}

export async function countNovelsMatchingPreferences(options: {
  prefs: MoonieInterpretedPreferences;
  excludeNovelIds?: string[];
  strictGenreFilter?: boolean;
  hardConstraints?: MoonieHardInclusionConstraints | null;
}): Promise<number> {
  return db.novel.count({
    where: hardFilters(
      options.prefs,
      options.excludeNovelIds ?? [],
      options.strictGenreFilter,
      options.hardConstraints
    ),
  });
}

/** Theme/other filters match, but publication status is missing or explicitly unknown. */
export async function countUnverifiedHardStatusMatches(options: {
  prefs: MoonieInterpretedPreferences;
  hardConstraints: MoonieHardInclusionConstraints;
  excludeNovelIds?: string[];
  strictGenreFilter?: boolean;
}): Promise<number> {
  if (!options.hardConstraints.status) return 0;
  const withoutStatus: MoonieHardInclusionConstraints = {
    ...options.hardConstraints,
    status: null,
  };
  const themeWhere = hardFilters(
    { ...options.prefs, status: null },
    options.excludeNovelIds ?? [],
    options.strictGenreFilter,
    hasHardInclusionConstraints(withoutStatus) ? withoutStatus : null
  );
  return db.novel.count({
    where: {
      AND: [
        themeWhere,
        {
          OR: [
            { publicationStatus: null },
            { publicationStatus: { equals: "" } },
            {
              publicationStatus: {
                contains: "unknown",
                mode: "insensitive",
              },
            },
          ],
        },
      ],
    },
  });
}

/**
 * Pick a diverse subset from a pre-sorted candidate list.
 * Greedy highest-valid selection preserves the input sort metric; callers
 * re-sort the returned subset when display order must match that metric.
 */
export function selectDiverseCandidates<
  T extends { id: string; genres: string[]; score?: number },
>(ranked: T[], limit: number): T[] {
  const selected: T[] = [];
  const selectedIds = new Set<string>();
  const genreCounts = new Map<string, number>();

  while (selected.length < limit) {
    let picked: T | undefined;
    for (const candidate of ranked) {
      if (selectedIds.has(candidate.id)) continue;
      const primary = candidate.genres[0] ? normalize(candidate.genres[0]) : "none";
      const seen = genreCounts.get(primary) ?? 0;
      if (seen >= 2 && selected.length >= 2) continue;
      picked = candidate;
      break;
    }
    if (!picked) {
      for (const candidate of ranked) {
        if (!selectedIds.has(candidate.id)) {
          picked = candidate;
          break;
        }
      }
    }
    if (!picked) break;
    selected.push(picked);
    selectedIds.add(picked.id);
    const primary = picked.genres[0] ? normalize(picked.genres[0]) : "none";
    genreCounts.set(primary, (genreCounts.get(primary) ?? 0) + 1);
  }

  return selected;
}

const novelInclude = {
  genres: true,
  tags: true,
  reviews: {
    where: { moderationStatus: "OK" as const },
    select: { id: true },
    orderBy: { likeCount: "desc" as const },
    take: 1,
  },
} satisfies Prisma.NovelInclude;

export async function retrieveHybridCandidates(
  options: HybridRetrievalOptions
): Promise<HybridCandidate[]> {
  const limit = options.limit ?? 40;
  const exclude = [...(options.excludeNovelIds ?? [])];
  const strictGenreFilter = options.strictGenreFilter ?? true;
  const where = hardFilters(
    options.prefs,
    exclude,
    strictGenreFilter,
    options.hardConstraints
  );

  const personalization = {
    ...DEFAULT_PERSONALIZATION_SETTINGS,
    ...options.personalization,
  };

  const useFeedback =
    Boolean(options.userId) && personalization.useLikes;

  const [
    lexical,
    pool,
    similar,
    likedGenres,
    moreLikeIds,
    helpfulIds,
    lessLikeIds,
    readingRows,
    savedReviewRows,
    savedNovelRows,
    followedReviewRows,
    searchHistoryNovels,
    catalogue,
  ] = await Promise.all([
    options.queryText
      ? lexicalCandidateIds(options.queryText, limit * 3)
      : Promise.resolve(new Map<string, number>()),
    db.novel.findMany({
      where,
      include: novelInclude,
      take: Math.max(limit * 4, 80),
      orderBy: { updatedAt: "desc" },
    }),
    options.similarToNovelId
      ? db.novel.findUnique({
          where: { id: options.similarToNovelId },
          include: { genres: true, tags: true },
        })
      : Promise.resolve(null),
    options.userId && personalization.useLikes
      ? db.like.findMany({
          where: { userId: options.userId },
          take: 20,
          include: {
            review: { include: { novel: { include: { genres: true } } } },
          },
        })
      : Promise.resolve([]),
    useFeedback
      ? db.recommendationFeedback.findMany({
          where: { userId: options.userId, kind: "MORE_LIKE_THIS" },
          select: { novelId: true },
          take: 20,
        })
      : Promise.resolve([]),
    useFeedback
      ? db.recommendationFeedback.findMany({
          where: { userId: options.userId, kind: "HELPFUL" },
          select: { novelId: true },
          take: 20,
        })
      : Promise.resolve([]),
    useFeedback
      ? db.recommendationFeedback.findMany({
          where: {
            userId: options.userId,
            kind: { in: ["LESS_LIKE_THIS", "NOT_FOR_ME", "NOT_HELPFUL"] },
          },
          select: { novelId: true },
          take: 30,
        })
      : Promise.resolve([]),
    options.userId && personalization.useReadingList
      ? db.novelReadingStatus.findMany({
          where: { userId: options.userId },
          take: 30,
          include: {
            novel: { include: { genres: true, tags: true } },
          },
        })
      : Promise.resolve([]),
    options.userId && personalization.useSavedReviews
      ? db.folderReview.findMany({
          where: { folder: { userId: options.userId } },
          take: 20,
          include: {
            review: { include: { novel: { include: { genres: true, tags: true } } } },
          },
        })
      : Promise.resolve([]),
    options.userId && personalization.useSavedNovels
      ? db.folderReview.findMany({
          where: { folder: { userId: options.userId } },
          take: 40,
          select: {
            review: {
              select: {
                novelId: true,
                novel: { include: { genres: true, tags: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    options.userId && personalization.useFollowedReviewers
      ? db.review.findMany({
          where: {
            moderationStatus: "OK",
            rating: { gte: 4 },
            user: {
              followers: { some: { followerId: options.userId } },
            },
          },
          take: 30,
          orderBy: { createdAt: "desc" },
          include: {
            novel: { include: { genres: true, tags: true } },
          },
        })
      : Promise.resolve([]),
    options.userId &&
    personalization.useSearchHistory &&
    options.recentSearches?.length
      ? resolveSearchHistoryNovels(options.recentSearches)
      : Promise.resolve([]),
    db.review.aggregate({
      where: { moderationStatus: "OK" },
      _avg: { rating: true },
    }),
  ]);

  const seedGenres = similar?.genres.map((g) => g.name) ?? [];
  const seedTags = similar?.tags.map((t) => t.name) ?? [];
  const likedGenreBoost = new Set(
    [
      ...(personalization.useLikes
        ? likedGenres.flatMap((row) =>
            row.review.novel.genres.map((genre) => normalize(genre.name))
          )
        : []),
      ...(personalization.useReadingList
        ? readingRows.flatMap((row) =>
            row.novel.genres.map((genre) => normalize(genre.name))
          )
        : []),
      ...(personalization.useSavedReviews
        ? savedReviewRows.flatMap((row) =>
            row.review.novel.genres.map((genre) => normalize(genre.name))
          )
        : []),
      ...(personalization.useFollowedReviewers
        ? followedReviewRows.flatMap((row) =>
            row.novel.genres.map((genre) => normalize(genre.name))
          )
        : []),
      ...(personalization.useSearchHistory
        ? searchHistoryNovels.flatMap((novel) =>
            novel.genres.map((genre) => normalize(genre.name))
          )
        : []),
    ]
  );
  const moreLike = new Set(moreLikeIds.map((row) => row.novelId));
  const helpful = new Set(helpfulIds.map((row) => row.novelId));
  const lessLike = new Set(lessLikeIds.map((row) => row.novelId));
  const readingNovelIds = new Set(readingRows.map((row) => row.novelId));
  const savedNovelIds = new Set(
    savedNovelRows.map((row) => row.review.novelId)
  );
  const searchHistoryNovelIds = new Set(searchHistoryNovels.map((novel) => novel.id));
  const catalogueMean = catalogue._avg.rating ?? 3.6;

  const seen = new Set(pool.map((novel) => novel.id));
  const extraIds =
    lexical.size > 0
      ? [...lexical.keys()].filter((id) => !seen.has(id))
      : [];
  const statIds = [...seen, ...extraIds];
  const [extra, reviewStats] = await Promise.all([
    extraIds.length
      ? db.novel.findMany({
          where: { AND: [where, { id: { in: extraIds } }] },
          include: novelInclude,
        })
      : Promise.resolve([]),
    statIds.length
      ? db.review.groupBy({
          by: ["novelId"],
          where: { novelId: { in: statIds }, moderationStatus: "OK" },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);
  if (extra.length) pool.push(...extra);
  const statsByNovel = new Map(
    reviewStats.map((row) => [
      row.novelId,
      { average: row._avg.rating, count: row._count._all },
    ])
  );

  const ranked: HybridCandidate[] = pool.map((novel) => {
    const genres = novel.genres.map((g) => g.name);
    const tropes = novel.tags
      .filter((tag) => tag.kind !== "MOOD")
      .map((t) => t.name);
    const moods = novel.tags
      .filter((tag) => tag.kind === "MOOD")
      .map((t) => t.name);
    const tags = novel.tags.map((t) => t.name);
    const stats = statsByNovel.get(novel.id);
    const reviewCount = stats?.count ?? 0;
    const averageRating = stats?.average ?? null;

    const structured = overlapScore(
      [...genres, ...tropes, ...moods],
      [
        ...options.prefs.genres,
        ...options.prefs.tags,
        ...options.prefs.mood,
        ...seedGenres,
        ...seedTags,
      ]
    );
    const quality = bayesianQuality(averageRating, reviewCount, catalogueMean);
    const history =
      (genres.some((g) => likedGenreBoost.has(normalize(g))) ? 0.45 : 0) +
      (useFeedback && moreLike.has(novel.id) ? 0.35 : 0) +
      (useFeedback && helpful.has(novel.id) ? 0.08 : 0) +
      (personalization.useReadingList && readingNovelIds.has(novel.id)
        ? 0.2
        : 0) +
      (personalization.useSavedNovels && savedNovelIds.has(novel.id) ? 0.18 : 0) +
      (personalization.useSearchHistory && searchHistoryNovelIds.has(novel.id)
        ? 0.1
        : 0) -
      (useFeedback && lessLike.has(novel.id) ? 0.12 : 0);

    const embedding = options.disableSemantic
      ? []
      : parseEmbedding(novel.embedding);
    const queryEmbedding =
      options.queryEmbedding && options.queryEmbedding.length
        ? options.queryEmbedding
        : options.disableSemantic || !options.queryText
          ? []
          : lexicalHashEmbedding(options.queryText);
    const semanticRaw =
      queryEmbedding.length && embedding.length
        ? Math.max(0, cosineSimilarity(queryEmbedding, embedding))
        : 0;
    const lexicalScore = Math.min(1, lexical.get(novel.id) ?? 0);
    const semantic = Math.max(semanticRaw, lexicalScore * 0.9);

    const { score, breakdown } = combineRankingScore({
      semantic,
      structured,
      quality,
      history: Math.min(1, history),
      diversity: 0,
    });

    return {
      id: novel.id,
      title: novel.title,
      author: novel.author,
      coverUrl: novel.coverUrl,
      synopsis: novel.synopsis,
      originalLanguage: novel.originalLanguage,
      publicationStatus: novel.publicationStatus,
      lengthBand: novel.lengthBand ?? null,
      chapterCount: novel.chapterCount ?? null,
      metadataSource: novel.metadataSource ?? null,
      createdAt: novel.createdAt,
      genres,
      tags,
      moods,
      reviewCount,
      averageRating,
      topReviewId: novel.reviews[0]?.id ?? null,
      score,
      scoreBreakdown: breakdown,
      semantic,
      lexical: Math.min(1, lexical.get(novel.id) ?? 0),
      historySignals: {
        onReadingList:
          personalization.useReadingList && readingNovelIds.has(novel.id),
        savedNovel:
          personalization.useSavedNovels && savedNovelIds.has(novel.id),
        moreLikeThis: useFeedback && moreLike.has(novel.id),
        helpful: useFeedback && helpful.has(novel.id),
        tasteGenreAffinity:
          (personalization.useLikes ||
            personalization.useSavedReviews ||
            personalization.useReadingList ||
            personalization.useFollowedReviewers ||
            personalization.useSearchHistory) &&
          genres.some((g) => likedGenreBoost.has(normalize(g))),
      },
    };
  });

  ranked.sort((a, b) => b.score - a.score || b.reviewCount - a.reviewCount);
  return ranked.slice(0, limit);
}

async function resolveSearchHistoryNovels(
  entries: MoonieRecentSearchEntry[]
): Promise<
  Array<{
    id: string;
    genres: Array<{ name: string }>;
    tags: Array<{ name: string }>;
  }>
> {
  const novelIds = [
    ...new Set(
      entries
        .map((entry) => entry.novelId)
        .filter((id): id is string => Boolean(id))
    ),
  ].slice(0, 8);

  const unresolvedQueries = entries
    .filter((entry) => !entry.novelId && entry.query.trim().length >= 2)
    .map((entry) => entry.query.trim())
    .slice(0, 5);

  const [byId, byTitle] = await Promise.all([
    novelIds.length
      ? db.novel.findMany({
          where: { id: { in: novelIds } },
          select: {
            id: true,
            genres: { select: { name: true } },
            tags: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    unresolvedQueries.length
      ? db.novel.findMany({
          where: {
            OR: unresolvedQueries.map((query) => ({
              title: { contains: query, mode: "insensitive" as const },
            })),
          },
          select: {
            id: true,
            genres: { select: { name: true } },
            tags: { select: { name: true } },
          },
          take: 8,
        })
      : Promise.resolve([]),
  ]);

  const seen = new Set<string>();
  type SearchHistoryNovel = {
    id: string;
    genres: Array<{ name: string }>;
    tags: Array<{ name: string }>;
  };
  const merged: SearchHistoryNovel[] = [];
  for (const novel of [...byId, ...byTitle]) {
    if (seen.has(novel.id)) continue;
    seen.add(novel.id);
    merged.push(novel);
  }
  return merged;
}

/** Count novels that satisfy hard constraints after metadata eligibility post-filtering. */
export async function countConstraintEligibleNovels(options: {
  prefs: MoonieInterpretedPreferences;
  excludeNovelIds?: string[];
  strictGenreFilter?: boolean;
  hardConstraints: MoonieHardInclusionConstraints;
}): Promise<number> {
  const where = hardFilters(
    options.prefs,
    options.excludeNovelIds ?? [],
    options.strictGenreFilter,
    options.hardConstraints
  );

  const rows = await db.novel.findMany({
    where,
    select: {
      id: true,
      publicationStatus: true,
      originalLanguage: true,
      lengthBand: true,
      chapterCount: true,
      metadataSource: true,
      genres: { select: { name: true } },
      tags: { select: { name: true } },
    },
    take: 2000,
  });

  if (rows.length === 0) return 0;

  const stats =
    options.hardConstraints.minAverageRating != null
      ? await db.review.groupBy({
          by: ["novelId"],
          where: {
            novelId: { in: rows.map((row) => row.id) },
            moderationStatus: "OK",
          },
          _avg: { rating: true },
        })
      : [];

  const avgByNovel = new Map(
    stats.map((row) => [row.novelId, row._avg.rating ?? null])
  );

  const novels = rows.map((row) => ({
    genres: row.genres.map((genre) => genre.name),
    tags: row.tags.map((tag) => tag.name),
    publicationStatus: row.publicationStatus,
    originalLanguage: row.originalLanguage,
    lengthBand: row.lengthBand,
    chapterCount: row.chapterCount,
    metadataSource: row.metadataSource,
    averageRating: avgByNovel.get(row.id) ?? null,
  }));

  return filterNovelsByHardConstraints(novels, options.hardConstraints).length;
}
