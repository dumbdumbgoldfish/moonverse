import { ContentModerationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type {
  MoonieCatalogueStat,
  MoonieRecommendResponse,
  MoonieSpoilerMode,
} from "@/types/moonie";

const PUBLIC_REVIEW_WHERE = {
  moderationStatus: { not: ContentModerationStatus.HIDDEN },
} as const;

export async function findMostReviewedNovels(options: {
  novelIds?: string[];
  take?: number;
}): Promise<MoonieCatalogueStat["ties"]> {
  const take = Math.min(20, Math.max(1, options.take ?? 8));
  const groups = await db.review.groupBy({
    by: ["novelId"],
    where: {
      ...PUBLIC_REVIEW_WHERE,
      ...(options.novelIds?.length ? { novelId: { in: options.novelIds } } : {}),
    },
    _count: { _all: true },
    orderBy: { _count: { novelId: "desc" } },
    take,
  });

  if (groups.length === 0) return [];

  const novels = await db.novel.findMany({
    where: { id: { in: groups.map((group) => group.novelId) } },
    select: { id: true, title: true },
  });
  const titleById = new Map(novels.map((novel) => [novel.id, novel.title]));

  return groups.map((group) => ({
    novelId: group.novelId,
    title: titleById.get(group.novelId) ?? "Unknown title",
    count: group._count._all,
  }));
}

export async function findHighestRatedNovels(options: {
  novelIds?: string[];
  take?: number;
}): Promise<
  Array<{ novelId: string; title: string; averageRating: number; reviewCount: number }>
> {
  const take = Math.min(20, Math.max(1, options.take ?? 8));
  const groups = await db.review.groupBy({
    by: ["novelId"],
    where: {
      ...PUBLIC_REVIEW_WHERE,
      ...(options.novelIds?.length ? { novelId: { in: options.novelIds } } : {}),
    },
    _avg: { rating: true },
    _count: { _all: true },
  });

  if (groups.length === 0) return [];

  const ranked = groups
    .map((group) => ({
      novelId: group.novelId,
      averageRating: group._avg.rating ?? 0,
      reviewCount: group._count._all,
    }))
    .sort(
      (a, b) =>
        b.averageRating - a.averageRating ||
        b.reviewCount - a.reviewCount ||
        a.novelId.localeCompare(b.novelId)
    )
    .slice(0, take);

  const novels = await db.novel.findMany({
    where: { id: { in: ranked.map((row) => row.novelId) } },
    select: { id: true, title: true },
  });
  const titleById = new Map(novels.map((novel) => [novel.id, novel.title]));

  return ranked.map((row) => ({
    novelId: row.novelId,
    title: titleById.get(row.novelId) ?? "Unknown title",
    averageRating: row.averageRating,
    reviewCount: row.reviewCount,
  }));
}

export async function buildHighestRatedNovelsResponse(options: {
  amongNovelIds?: string[];
  amongThese: boolean;
  count: number;
  spoilerMode: MoonieSpoilerMode;
}): Promise<MoonieRecommendResponse> {
  const ranked = await findHighestRatedNovels({
    novelIds: options.amongNovelIds,
    take: options.count,
  });

  if (ranked.length === 0) {
    return {
      reply: options.amongThese
        ? "None of the novels already shown in this thread have public MoonVerse ratings yet."
        : "I could not find public MoonVerse ratings to rank novels by average score.",
      recommendations: [],
      responseKind: "catalogue_stat",
      state: "no_results",
      emptyReason: "no_matches",
      rankingMetric: "novel_average_rating",
      requestedCount: options.count,
      consumesQuota: true,
      spoilerMode: options.spoilerMode,
      analyticsIntent: "catalogue_stat",
    };
  }

  const lead = ranked[0]!;
  const ties = ranked.filter(
    (row) => row.averageRating === lead.averageRating
  );
  const catalogueStat: MoonieCatalogueStat = {
    metric: "novel_average_rating",
    novelId: lead.novelId,
    title: lead.title,
    count: Math.round(lead.averageRating * 10) / 10,
    ties: ties.slice(1).map((row) => ({
      novelId: row.novelId,
      title: row.title,
      count: Math.round(row.averageRating * 10) / 10,
    })),
  };

  const scope = options.amongThese
    ? "among the novels already shown in this thread"
    : "in the public MoonVerse catalogue";
  const tieNote =
    ties.length > 1
      ? ` Tied with ${ties
          .slice(1)
          .map(
            (row) =>
              `**${row.title}** (${row.averageRating.toFixed(1)} from ${row.reviewCount} reviews)`
          )
          .join(", ")}.`
      : "";

  return {
    reply: `**${lead.title}** has the highest public MoonVerse community rating ${scope}: **${lead.averageRating.toFixed(1)}** from ${lead.reviewCount} review${lead.reviewCount === 1 ? "" : "s"}.${tieNote} This is a catalogue aggregate, not a personalised recommendation.`,
    recommendations: [],
    responseKind: "catalogue_stat",
    catalogueStat,
    rankingMetric: "novel_average_rating",
    requestedCount: options.count,
    consumesQuota: true,
    spoilerMode: options.spoilerMode,
    analyticsIntent: "catalogue_stat",
  };
}

export async function buildMostReviewedNovelResponse(options: {
  amongNovelIds?: string[];
  amongThese: boolean;
  spoilerMode: MoonieSpoilerMode;
}): Promise<MoonieRecommendResponse> {
  const ranked = await findMostReviewedNovels({
    novelIds: options.amongNovelIds,
    take: 8,
  });

  if (ranked.length === 0) {
    return {
      reply: options.amongThese
        ? "None of the novels already shown in this thread have public MoonVerse reviews yet."
        : "I could not find any public MoonVerse reviews to rank novels by review count.",
      recommendations: [],
      responseKind: "catalogue_stat",
      state: "no_results",
      emptyReason: "no_matches",
      rankingMetric: "novel_review_count",
      requestedCount: 1,
      consumesQuota: true,
      spoilerMode: options.spoilerMode,
      analyticsIntent: "catalogue_stat",
    };
  }

  const leadCount = ranked[0]!.count;
  const ties = ranked.filter((row) => row.count === leadCount);
  const lead = ties[0]!;
  const catalogueStat: MoonieCatalogueStat = {
    metric: "novel_review_count",
    novelId: lead.novelId,
    title: lead.title,
    count: lead.count,
    ties: ties.slice(1),
  };

  const scope = options.amongThese
    ? "among the novels already shown in this thread"
    : "in the public MoonVerse catalogue";
  const tieNote =
    ties.length > 1
      ? ` Tied with ${ties
          .slice(1)
          .map((row) => `**${row.title}** (${row.count})`)
          .join(", ")}.`
      : "";

  return {
    reply: `**${lead.title}** has the most public MoonVerse reviews ${scope}: **${lead.count}**.${tieNote} This is a catalogue aggregate, not a personalised recommendation.`,
    recommendations: [],
    responseKind: "catalogue_stat",
    catalogueStat,
    rankingMetric: "novel_review_count",
    requestedCount: 1,
    consumesQuota: true,
    spoilerMode: options.spoilerMode,
    analyticsIntent: "catalogue_stat",
  };
}
