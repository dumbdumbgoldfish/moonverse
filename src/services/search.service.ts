import {
  Prisma,
  ReadingLinkCategory,
  ReadingLinkModerationStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { genreLabel } from "@/lib/genres";
import {
  hasSearchIntent,
  parseSearchQuery,
  scoreTitleMatch,
  searchLexicalQuery,
  trigramSimilarity,
  type ParsedSearchQuery,
} from "@/lib/search";
import {
  listMatchReason,
  popularWorkReason,
  reviewMatchReason,
  workMatchReason,
} from "@/lib/search-rank";
import { resolveCoverUrl } from "@/lib/review-utils";
import {
  constraintEligibleGenreLabels,
  constraintEligibleTagLabels,
  novelMatchesSearchGenreFacet,
  PROGRESSION_FANTASY_GENRE_SLUGS,
} from "@/lib/moonie/metadata-eligibility";
import { labelsMatch } from "@/lib/moonie/label-match";
import { getTrendingNovels } from "@/services/discovery.service";
import {
  countReviews,
  getAllReviews,
} from "@/services/review.service";
import { countUsers, searchUsers } from "@/services/user.service";
import type { ReviewSort } from "@/types/review";
import type {
  SearchListHit,
  SearchResponse,
  SearchResultType,
  SearchSort,
  SearchWorkHit,
} from "@/types/search";

const officialReadingLinkWhere: Prisma.ReadingLinkWhereInput = {
  active: true,
  moderationStatus: ReadingLinkModerationStatus.APPROVED,
  OR: [
    { isOfficial: true },
    { isVerified: true },
    { category: ReadingLinkCategory.OFFICIAL },
  ],
};

const workInclude = {
  genres: true,
  tags: true,
  aliases: { select: { title: true }, take: 12 },
  readingLinks: {
    where: officialReadingLinkWhere,
    orderBy: { sortOrder: "asc" as const },
    take: 1,
    select: { url: true, label: true, platform: true },
  },
  _count: { select: { reviews: true } },
} satisfies Prisma.NovelInclude;

type NovelSearchRow = Prisma.NovelGetPayload<{ include: typeof workInclude }>;

export interface RunSearchOptions {
  query: string;
  type?: SearchResultType;
  sort?: SearchSort;
  genreSlug?: string;
  tagSlugs?: string[];
  limit?: number;
  offset?: number;
  viewerId?: string;
}

export async function runSearch(
  options: RunSearchOptions
): Promise<SearchResponse> {
  const parsed = parseSearchQuery(options.query);
  const type = options.type ?? "all";
  const sort = options.sort ?? "relevance";
  const urlGenre = options.genreSlug || parsed.genreSlug;
  const urlTags = [
    ...(options.tagSlugs ?? []),
    ...parsed.tagSlugs,
  ].filter((slug, index, all) => all.indexOf(slug) === index);
  const limit = Math.min(Math.max(options.limit ?? (type === "all" ? 8 : 12), 1), 24);
  const offset = Math.max(options.offset ?? 0, 0);
  const lexical = searchLexicalQuery(parsed);

  const empty: SearchResponse = {
    query: options.query.trim(),
    type,
    sort,
    works: [],
    reviews: [],
    people: [],
    lists: [],
    totals: { works: 0, reviews: 0, people: 0, lists: 0 },
    didYouMean: null,
    facets: {
      genre: urlGenre ?? null,
      tags: urlTags,
      handle: parsed.handle,
      author: parsed.author,
      quoted: parsed.quoted,
    },
  };

  if (!hasSearchIntent(parsed, urlGenre, urlTags)) {
    const popular = await getTrendingNovels(10);
    const works: SearchWorkHit[] = popular.map((novel) => {
      const work: SearchWorkHit = {
        id: novel.novelId,
        title: novel.title,
        author: novel.author,
        coverUrl: novel.coverUrl,
        genres: novel.primaryGenre ? [novel.primaryGenre] : [],
        tags: [],
        averageRating: novel.averageRating || null,
        reviewCount: novel.reviewCount,
        hasOfficialLink: false,
        matchReason: "",
      };
      return { ...work, matchReason: popularWorkReason(work) };
    });
    return { ...empty, works, totals: { ...empty.totals, works: works.length } };
  }

  const wantWorks = type === "all" || type === "works";
  const wantReviews = type === "all" || type === "reviews";
  const wantPeople = type === "all" || type === "people";
  const wantLists = type === "all" || type === "lists";

  const workLimit = type === "all" ? Math.min(limit, 8) : limit;
  const reviewLimit = type === "all" ? Math.min(limit, 6) : limit;
  const peopleLimit = type === "all" ? Math.min(limit, 4) : limit;
  const listLimit = type === "all" ? Math.min(limit, 4) : limit;

  const peopleQuery = parsed.handle || lexical;
  const reviewQuery = parsed.quoted || parsed.text || lexical;

  const [worksResult, reviews, reviewTotal, people, peopleTotal, listsResult] =
    await Promise.all([
      wantWorks
        ? searchWorks({
            parsed,
            lexical,
            genreSlug: urlGenre,
            tagSlugs: urlTags,
            sort,
            limit: workLimit,
            offset: type === "works" ? offset : 0,
          })
        : Promise.resolve({ items: [] as SearchWorkHit[], total: 0, didYouMean: null as string | null }),
      wantReviews
        ? getAllReviews({
            query: reviewQuery || undefined,
            genreSlug: urlGenre || undefined,
            tagSlugs: urlTags.length ? urlTags : undefined,
            sort: reviewSort(sort),
            limit: reviewLimit,
            offset: type === "reviews" ? offset : 0,
            personalizedUserId: options.viewerId,
          })
        : Promise.resolve([]),
      wantReviews
        ? countReviews({
            query: reviewQuery || undefined,
            genreSlug: urlGenre || undefined,
            tagSlugs: urlTags.length ? urlTags : undefined,
            sort: reviewSort(sort),
            personalizedUserId: options.viewerId,
          })
        : Promise.resolve(0),
      wantPeople && peopleQuery
        ? searchUsers(
            peopleQuery,
            peopleLimit,
            type === "people" ? offset : 0,
            options.viewerId
          )
        : Promise.resolve([]),
      wantPeople && peopleQuery ? countUsers(peopleQuery) : Promise.resolve(0),
      wantLists
        ? searchLists({
            lexical: parsed.quoted || parsed.text || lexical,
            limit: listLimit,
            offset: type === "lists" ? offset : 0,
          })
        : Promise.resolve({ items: [] as SearchListHit[], total: 0 }),
    ]);

  const reviewsWithReasons = reviews.map((review) => ({
    ...review,
    feedReason: reviewMatchReason(review, lexical),
  }));

  return {
    ...empty,
    works: worksResult.items,
    reviews: reviewsWithReasons,
    people,
    lists: listsResult.items,
    totals: {
      works: worksResult.total,
      reviews: reviewTotal,
      people: peopleTotal,
      lists: listsResult.total,
    },
    didYouMean: worksResult.didYouMean,
  };
}

function reviewSort(sort: SearchSort): ReviewSort {
  switch (sort) {
    case "highest-rated":
      return "highest-rated";
    case "recent":
      return "latest";
    case "most-reviewed":
      return "most-discussed";
    default:
      return "trending";
  }
}

async function searchWorks(input: {
  parsed: ParsedSearchQuery;
  lexical: string;
  genreSlug?: string | null;
  tagSlugs: string[];
  sort: SearchSort;
  limit: number;
  offset: number;
}): Promise<{ items: SearchWorkHit[]; total: number; didYouMean: string | null }> {
  const where = buildWorkWhere(input);
  const fetchTake = Math.min(300, Math.max(input.offset + input.limit, 80));
  const [matchCount, candidates] = await Promise.all([
    db.novel.count({ where }),
    db.novel.findMany({
      where,
      include: workInclude,
      take: fetchTake,
    }),
  ]);

  const facetFilteredCandidates =
    input.genreSlug &&
    (PROGRESSION_FANTASY_GENRE_SLUGS.has(input.genreSlug) ||
      input.genreSlug === "cultivation")
      ? candidates.filter((novel) =>
          novelMatchesSearchGenreFacet(
            novel.metadataSource,
            novel.genres,
            input.genreSlug!
          )
        )
      : candidates;

  const novelIds = facetFilteredCandidates.map((novel) => novel.id);
  const stats = novelIds.length
    ? await db.review.groupBy({
        by: ["novelId"],
        where: { novelId: { in: novelIds } },
        _avg: { rating: true },
        _count: { _all: true },
      })
    : [];
  const statsById = new Map(
    stats.map((row) => [
      row.novelId,
      { average: row._avg.rating, count: row._count._all },
    ])
  );

  const scored = facetFilteredCandidates
    .map((novel) => scoreWork(novel, input, statsById.get(novel.id)))
    .sort((a, b) => {
      if (input.sort === "most-reviewed") {
        return (
          b.hit.reviewCount - a.hit.reviewCount ||
          (b.hit.averageRating ?? 0) - (a.hit.averageRating ?? 0)
        );
      }
      if (input.sort === "highest-rated") {
        return (
          (b.hit.averageRating ?? 0) - (a.hit.averageRating ?? 0) ||
          b.hit.reviewCount - a.hit.reviewCount
        );
      }
      return b.score - a.score || b.hit.reviewCount - a.hit.reviewCount;
    });

  const total = matchCount;
  const items = scored
    .slice(input.offset, input.offset + input.limit)
    .map((row) => row.hit);

  let didYouMean: string | null = null;
  const exactish = scored.some((row) => row.titleScore >= 50);
  if (!exactish && input.lexical.length >= 4) {
    didYouMean = await suggestTitle(input.lexical);
  }

  return { items, total, didYouMean };
}

function buildWorkWhere(input: {
  parsed: ParsedSearchQuery;
  lexical: string;
  genreSlug?: string | null;
  tagSlugs: string[];
}): Prisma.NovelWhereInput {
  const and: Prisma.NovelWhereInput[] = [];

  if (input.genreSlug) {
    and.push({
      genres: {
        some: {
          OR: [
            { slug: input.genreSlug },
            { name: { equals: input.genreSlug, mode: "insensitive" } },
          ],
        },
      },
    });
  }

  for (const slug of input.tagSlugs) {
    and.push({ tags: { some: { slug } } });
  }

  if (input.parsed.author) {
    and.push({
      author: { contains: input.parsed.author, mode: "insensitive" },
    });
  }

  const text = input.parsed.quoted || input.parsed.text || input.lexical;
  if (text && !input.parsed.author) {
    and.push({
      OR: [
        { title: { contains: text, mode: "insensitive" } },
        { author: { contains: text, mode: "insensitive" } },
        {
          aliases: {
            some: { title: { contains: text, mode: "insensitive" } },
          },
        },
        {
          genres: { some: { name: { contains: text, mode: "insensitive" } } },
        },
        { tags: { some: { name: { contains: text, mode: "insensitive" } } } },
      ],
    });
  } else if (text && input.parsed.author && (input.parsed.quoted || input.parsed.text)) {
    const titleQ = input.parsed.quoted || input.parsed.text;
    and.push({ title: { contains: titleQ, mode: "insensitive" } });
  }

  return and.length ? { AND: and } : {};
}

function scoreWork(
  novel: NovelSearchRow,
  input: {
    parsed: ParsedSearchQuery;
    lexical: string;
    genreSlug?: string | null;
    tagSlugs: string[];
  },
  stats?: { average: number | null; count: number } | undefined
): { hit: SearchWorkHit; score: number; titleScore: number } {
  const query = input.parsed.quoted || input.parsed.text || input.lexical;
  const directTitleScore = query ? scoreTitleMatch(novel.title, query) : 0;
  const aliasScore = query
    ? Math.max(
        0,
        ...novel.aliases.map((alias) => scoreTitleMatch(alias.title, query))
      )
    : 0;
  const titleScore = Math.max(directTitleScore, aliasScore);
  const aliasHit = aliasScore >= 50 && aliasScore > directTitleScore;
  const authorHit = Boolean(
    input.parsed.author &&
      novel.author?.toLowerCase().includes(input.parsed.author.toLowerCase())
  ) || Boolean(
    query && novel.author?.toLowerCase().includes(query.toLowerCase())
  );
  const genreNames = novel.genres.map((genre) => genre.name);
  const tagNames = novel.tags.map((tag) => tag.name);
  const eligibleGenres = constraintEligibleGenreLabels(
    novel.metadataSource,
    genreNames,
    tagNames
  );
  const eligibleTags = constraintEligibleTagLabels(
    novel.metadataSource,
    genreNames,
    tagNames
  );
  const genreHit = Boolean(
    input.genreSlug &&
      (PROGRESSION_FANTASY_GENRE_SLUGS.has(input.genreSlug)
        ? eligibleGenres.some((label) =>
            novel.genres.some(
              (genre) =>
                genre.slug === input.genreSlug &&
                labelsMatch(label, genre.name)
            )
          )
        : novel.genres.some((genre) => genre.slug === input.genreSlug))
  );
  const tagHit = input.tagSlugs.some((slug) => {
    if (PROGRESSION_FANTASY_GENRE_SLUGS.has(slug) || slug === "cultivation") {
      return novel.tags.some(
        (tag) =>
          tag.slug === slug &&
          eligibleTags.some((label) => labelsMatch(label, tag.name))
      );
    }
    return novel.tags.some((tag) => tag.slug === slug);
  });
  const official = novel.readingLinks[0];
  const reviewCount = stats?.count ?? novel._count.reviews;
  const averageRating = stats?.average ?? null;

  let score = titleScore;
  if (authorHit) score += 40;
  if (genreHit) score += 18;
  if (tagHit) score += 12;
  score += Math.log10(1 + reviewCount) * 6;
  if (averageRating) score += averageRating;

  const hit: SearchWorkHit = {
    id: novel.id,
    title: novel.title,
    author: novel.author ?? "Unknown",
    coverUrl: resolveCoverUrl(novel.coverUrl),
    genres: novel.genres.map((genre) => genre.name),
    tags: novel.tags
      .map((tag) => tag.name)
      .filter((name) => !/spoiler/i.test(name)),
    averageRating,
    reviewCount,
    hasOfficialLink: Boolean(official),
    officialLinkUrl: official?.url,
    officialLinkLabel: official?.label || official?.platform,
    matchReason: workMatchReason({
      titleScore,
      authorHit,
      genreHit,
      tagHit,
      aliasHit,
      genreName: novel.genres[0]?.name ?? (input.genreSlug ? genreLabel(input.genreSlug) : null),
    }),
    synopsis: novel.synopsis,
  };

  return { hit, score, titleScore };
}

async function searchLists(input: {
  lexical: string;
  limit: number;
  offset: number;
}): Promise<{ items: SearchListHit[]; total: number }> {
  const q = input.lexical.trim();
  if (!q) return { items: [], total: 0 };

  const where: Prisma.FolderWhereInput = {
    isPublic: true,
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      {
        reviews: {
          some: {
            review: { novel: { title: { contains: q, mode: "insensitive" } } },
          },
        },
      },
    ],
  };

  const [folders, total] = await Promise.all([
    db.folder.findMany({
      where,
      include: {
        user: { select: { displayName: true, username: true } },
        reviews: {
          take: 3,
          orderBy: { addedAt: "desc" },
          include: {
            review: {
              select: {
                novel: { select: { title: true, coverUrl: true } },
              },
            },
          },
        },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: input.offset,
      take: input.limit,
    }),
    db.folder.count({ where }),
  ]);

  return {
    total,
    items: folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      ownerName: folder.user.displayName,
      ownerUsername: folder.user.username,
      reviewCount: folder._count.reviews,
      coverUrls: folder.reviews.map((entry) =>
        resolveCoverUrl(entry.review.novel.coverUrl)
      ),
      novelTitles: folder.reviews.map((entry) => entry.review.novel.title),
      matchReason: listMatchReason(folder.name, q),
    })),
  };
}

async function suggestTitle(query: string): Promise<string | null> {
  const titles = await db.novel.findMany({
    select: { title: true },
    orderBy: { reviews: { _count: "desc" } },
    take: 250,
  });

  let best: { title: string; score: number } | null = null;
  for (const row of titles) {
    const score = Math.max(
      scoreTitleMatch(row.title, query) / 100,
      trigramSimilarity(row.title, query)
    );
    if (!best || score > best.score) best = { title: row.title, score };
  }

  if (!best || best.score < 0.34) return null;
  if (best.title.toLowerCase() === query.toLowerCase()) return null;
  return best.title;
}
