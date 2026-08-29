import { NovelSeriesRelationType } from "@prisma/client";
import { db } from "@/lib/db";
import {
  extractSeriesTitleQuery,
  resolveSeriesBookNumber,
  resolveSeriesQueryKind,
  type MoonieSeriesQueryKind,
} from "@/lib/moonie/series-intent";
import { identifyNovels } from "@/services/moonie-identification.service";
import { buildNovelBundle } from "@/services/moonie-novel-lookup.service";
import type {
  MoonieLookupSession,
  MoonieRecommendResponse,
  MoonieSeriesEntry,
  MoonieSeriesInfo,
  MoonieSpoilerMode,
} from "@/types/moonie";

interface LoadedSeries {
  seriesId: string;
  name: string;
  description: string | null;
  readingOrderVerified: boolean;
  entries: Array<{
    novelId: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    order: number;
    relationType: NovelSeriesRelationType;
  }>;
}

export async function loadSeriesForNovel(
  novelId: string
): Promise<LoadedSeries | null> {
  const entry = await db.novelSeriesEntry.findFirst({
    where: { novelId },
    include: {
      series: {
        include: {
          entries: {
            orderBy: [{ order: "asc" }, { relationType: "asc" }],
            include: {
              novel: {
                select: {
                  id: true,
                  title: true,
                  author: true,
                  coverUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!entry?.series) return null;

  return {
    seriesId: entry.series.id,
    name: entry.series.name,
    description: entry.series.description,
    readingOrderVerified: entry.series.readingOrderVerified,
    entries: entry.series.entries.map((row) => ({
      novelId: row.novel.id,
      title: row.novel.title,
      author: row.novel.author,
      coverUrl: row.novel.coverUrl,
      order: row.order,
      relationType: row.relationType,
    })),
  };
}

function mainReadingEntries(series: LoadedSeries): LoadedSeries["entries"] {
  const main = series.entries.filter(
    (entry) => entry.relationType === NovelSeriesRelationType.MAIN
  );
  return main.length > 0 ? main : series.entries;
}

function hasCompleteMainOrder(series: LoadedSeries): boolean {
  if (!series.readingOrderVerified) return false;
  const main = mainReadingEntries(series);
  if (main.length < 2) return false;
  const orders = [...new Set(main.map((entry) => entry.order))].sort(
    (a, b) => a - b
  );
  if (orders[0] !== 1) return false;
  for (let index = 1; index < orders.length; index += 1) {
    if (orders[index] !== orders[index - 1]! + 1) return false;
  }
  return true;
}

function toSeriesEntries(
  entries: LoadedSeries["entries"]
): MoonieSeriesEntry[] {
  return entries.map((entry) => ({
    novelId: entry.novelId,
    title: entry.title,
    author: entry.author,
    coverUrl: entry.coverUrl,
    order: entry.order,
    relationType: entry.relationType,
  }));
}

function buildSeriesInfo(options: {
  series: LoadedSeries;
  currentNovelId: string;
  focusKind: MoonieSeriesQueryKind;
  highlightedNovelIds?: string[];
}): MoonieSeriesInfo {
  const main = mainReadingEntries(options.series);
  return {
    seriesId: options.series.seriesId,
    name: options.series.name,
    description: options.series.description,
    entries: toSeriesEntries(main),
    allEntries: toSeriesEntries(options.series.entries),
    currentNovelId: options.currentNovelId,
    readingOrderComplete: hasCompleteMainOrder(options.series),
    focusKind: options.focusKind,
    highlightedNovelIds: options.highlightedNovelIds ?? [],
  };
}

function confirmedLookupSession(options: {
  novelId: string;
  novelTitle: string;
}): MoonieLookupSession {
  return {
    mode: "confirmed",
    query: options.novelTitle,
    candidates: [
      {
        novelId: options.novelId,
        title: options.novelTitle,
        canonicalTitle: options.novelTitle,
        confidence: "high",
        confidenceScore: 1,
        evidence: [],
        genres: [],
        tags: [],
        reason: "Resolved from verified series context.",
      },
    ],
    confirmedNovelId: options.novelId,
    rejectedNovelIds: [],
  };
}

function formatSeriesList(series: LoadedSeries, entries: LoadedSeries["entries"]): string {
  return entries
    .map((entry, index) => `${index + 1}. **${entry.title}**`)
    .join("\n");
}

function buildSeriesReply(options: {
  series: LoadedSeries;
  currentNovelId: string;
  currentTitle: string;
  kind: MoonieSeriesQueryKind;
}): { reply: string; seriesInfo: MoonieSeriesInfo; highlightedNovelIds: string[] } {
  const { series, currentNovelId, currentTitle, kind } = options;
  const main = mainReadingEntries(series);
  const currentEntry =
    series.entries.find((entry) => entry.novelId === currentNovelId) ??
    main.find((entry) => entry.novelId === currentNovelId);
  const currentOrder = currentEntry?.order ?? null;
  const complete = hasCompleteMainOrder(series);
  const highlighted: string[] = [];

  if (kind === "membership") {
    return {
      reply: `Yes — **${currentTitle}** is part of the **${series.name}** series on MoonVerse.`,
      seriesInfo: buildSeriesInfo({
        series,
        currentNovelId,
        focusKind: kind,
        highlightedNovelIds: [currentNovelId],
      }),
      highlightedNovelIds: [currentNovelId],
    };
  }

  if (kind === "full_series" || kind === "reading_order") {
    if (!complete) {
      return {
        reply: `**${series.name}** is on MoonVerse, but MoonVerse doesn't have a complete verified reading order for this series yet.\n\nKnown entries:\n${formatSeriesList(series, main)}`,
        seriesInfo: buildSeriesInfo({
          series,
          currentNovelId,
          focusKind: kind,
          highlightedNovelIds: [currentNovelId],
        }),
        highlightedNovelIds: [currentNovelId],
      };
    }
    return {
      reply: `Here is the verified reading order for **${series.name}**:\n${formatSeriesList(series, main)}`,
      seriesInfo: buildSeriesInfo({
        series,
        currentNovelId,
        focusKind: kind,
      }),
      highlightedNovelIds: [],
    };
  }

  if (kind === "first" || kind === "before") {
    const first = main[0];
    if (!first) {
      return {
        reply: `MoonVerse doesn't have a complete verified reading order for **${series.name}** yet.`,
        seriesInfo: buildSeriesInfo({
          series,
          currentNovelId,
          focusKind: kind,
        }),
        highlightedNovelIds: [],
      };
    }
    highlighted.push(first.novelId);
    return {
      reply: `Start with **${first.title}** — book 1 in **${series.name}**.`,
      seriesInfo: buildSeriesInfo({
        series,
        currentNovelId,
        focusKind: kind,
        highlightedNovelIds: highlighted,
      }),
      highlightedNovelIds: highlighted,
    };
  }

  if (kind === "next") {
    if (currentOrder == null || !complete) {
      return {
        reply: `MoonVerse doesn't have a complete verified reading order for **${series.name}** yet.`,
        seriesInfo: buildSeriesInfo({
          series,
          currentNovelId,
          focusKind: kind,
          highlightedNovelIds: [currentNovelId],
        }),
        highlightedNovelIds: [currentNovelId],
      };
    }
    const next = main.find((entry) => entry.order === currentOrder + 1);
    if (!next) {
      return {
        reply: `**${currentTitle}** appears to be the latest verified entry in **${series.name}**.`,
        seriesInfo: buildSeriesInfo({
          series,
          currentNovelId,
          focusKind: kind,
          highlightedNovelIds: [currentNovelId],
        }),
        highlightedNovelIds: [currentNovelId],
      };
    }
    highlighted.push(next.novelId);
    return {
      reply: `After **${currentTitle}**, read **${next.title}** next in **${series.name}**.`,
      seriesInfo: buildSeriesInfo({
        series,
        currentNovelId,
        focusKind: kind,
        highlightedNovelIds: highlighted,
      }),
      highlightedNovelIds: highlighted,
    };
  }

  if (kind === "book_number") {
    return {
      reply: `Here are the numbered entries MoonVerse has for **${series.name}**:\n${formatSeriesList(series, main)}`,
      seriesInfo: buildSeriesInfo({
        series,
        currentNovelId,
        focusKind: kind,
      }),
      highlightedNovelIds: [],
    };
  }

  if (kind === "sequel_check") {
    const isSequel =
      currentEntry?.relationType === NovelSeriesRelationType.SEQUEL ||
      (currentOrder != null && currentOrder > 1);
    return {
      reply: isSequel
        ? `Yes — **${currentTitle}** is listed as part of **${series.name}** and follows earlier entries in MoonVerse's verified series data.`
        : `**${currentTitle}** is in **${series.name}**, but MoonVerse does not mark it as a direct sequel.`,
      seriesInfo: buildSeriesInfo({
        series,
        currentNovelId,
        focusKind: kind,
        highlightedNovelIds: [currentNovelId],
      }),
      highlightedNovelIds: [currentNovelId],
    };
  }

  if (kind === "standalone") {
    const prequels =
      currentOrder != null
        ? main.filter((entry) => entry.order < currentOrder)
        : [];
    const standalone =
      main.length <= 1 ||
      currentEntry?.relationType === NovelSeriesRelationType.MAIN &&
        prequels.length === 0;
    return {
      reply: standalone
        ? `**${currentTitle}** can be read on its own, though the full **${series.name}** experience follows MoonVerse's verified order.`
        : `**${currentTitle}** is part of **${series.name}**. MoonVerse recommends starting with earlier verified entries for the full story.`,
      seriesInfo: buildSeriesInfo({
        series,
        currentNovelId,
        focusKind: kind,
        highlightedNovelIds: prequels.map((entry) => entry.novelId),
      }),
      highlightedNovelIds: prequels.map((entry) => entry.novelId),
    };
  }

  return {
    reply: `**${currentTitle}** is part of **${series.name}** on MoonVerse.`,
    seriesInfo: buildSeriesInfo({
      series,
      currentNovelId,
      focusKind: kind,
      highlightedNovelIds: [currentNovelId],
    }),
    highlightedNovelIds: [currentNovelId],
  };
}

async function resolveNovelIdForSeriesQuery(options: {
  message: string;
  activeNovelId: string | null;
  userId?: string;
  spoilerMode: MoonieSpoilerMode;
}): Promise<{ novelId: string; title: string } | null> {
  if (options.activeNovelId) {
    const novel = await db.novel.findUnique({
      where: { id: options.activeNovelId },
      select: { id: true, title: true },
    });
    if (novel) return { novelId: novel.id, title: novel.title };
  }

  const titleQuery = extractSeriesTitleQuery(options.message);
  if (!titleQuery) return null;

  const identification = await identifyNovels({
    query: titleQuery,
    userId: options.userId,
    spoilerMode: options.spoilerMode,
    explicitTitleLookup: true,
  });

  if (identification.mode === "high_confidence" && identification.overview) {
    return {
      novelId: identification.overview.novelId,
      title: identification.overview.title,
    };
  }

  if (identification.session?.confirmedNovelId) {
    const candidate = identification.session.candidates.find(
      (item) => item.novelId === identification.session?.confirmedNovelId
    );
    if (candidate) {
      return { novelId: candidate.novelId, title: candidate.title };
    }
  }

  return null;
}

export async function buildVerifiedSeriesDiscoveryResponse(options: {
  userId?: string;
  spoilerMode: MoonieSpoilerMode;
}): Promise<MoonieRecommendResponse> {
  const entry = await db.novelSeriesEntry.findFirst({
    where: {
      series: { readingOrderVerified: true },
      relationType: NovelSeriesRelationType.MAIN,
    },
    orderBy: [{ seriesId: "asc" }, { order: "asc" }],
    include: {
      novel: { select: { id: true, title: true } },
    },
  });

  if (!entry) {
    return {
      reply:
        "MoonVerse doesn't currently have a verified series entry available to recommend.",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode: options.spoilerMode,
    };
  }

  const series = await loadSeriesForNovel(entry.novelId);
  if (!series) {
    return {
      reply:
        "MoonVerse doesn't currently have a verified series entry available to recommend.",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode: options.spoilerMode,
    };
  }

  const bundle = await buildNovelBundle({
    novelId: entry.novelId,
    userId: options.userId,
    spoilerMode: options.spoilerMode,
    reason: "Verified series catalogue entry.",
  });

  const payload = buildSeriesReply({
    series,
    currentNovelId: entry.novelId,
    currentTitle: entry.novel.title,
    kind: "full_series",
  });

  return {
    reply: `Here's a novel with verified MoonVerse series data: **${entry.novel.title}** (${series.name}). ${payload.reply}`,
    recommendations: bundle.recommendation ? [bundle.recommendation] : [],
    novelOverview: bundle.overview ?? undefined,
    seriesInfo: payload.seriesInfo,
    lookupSession: confirmedLookupSession({
      novelId: entry.novelId,
      novelTitle: entry.novel.title,
    }),
    responseKind: "novel_bundle",
    consumesQuota: true,
    spoilerMode: options.spoilerMode,
    analyticsConfidenceTier: "high",
  };
}

export async function buildMoonieSeriesResponse(options: {
  message: string;
  activeNovelId: string | null;
  userId?: string;
  spoilerMode: MoonieSpoilerMode;
}): Promise<MoonieRecommendResponse | null> {
  const kind = resolveSeriesQueryKind(options.message);
  const bookNumber = resolveSeriesBookNumber(options.message);

  const resolved = await resolveNovelIdForSeriesQuery(options);
  if (!resolved) {
    return {
      reply:
        "Tell me which novel you mean, or look it up first so I can check verified series data.",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode: options.spoilerMode,
    };
  }

  const series = await loadSeriesForNovel(resolved.novelId);
  if (!series) {
    return {
      reply: `**${resolved.title}** is in the MoonVerse catalogue, but MoonVerse doesn't have verified series data for it yet.`,
      recommendations: [],
      responseKind: "novel_bundle",
      state: "no_results",
      consumesQuota: true,
      spoilerMode: options.spoilerMode,
      analyticsConfidenceTier: "high",
    };
  }

  if (kind === "book_number" && bookNumber != null) {
    const main = mainReadingEntries(series);
    const match = main.find((entry) => entry.order === bookNumber);
    if (match) {
      const payload = buildSeriesReply({
        series,
        currentNovelId: match.novelId,
        currentTitle: match.title,
        kind,
      });
      return {
        reply: `Book ${bookNumber} in **${series.name}** is **${match.title}**.`,
        recommendations: [],
        seriesInfo: payload.seriesInfo,
        lookupSession: confirmedLookupSession({
          novelId: match.novelId,
          novelTitle: match.title,
        }),
        responseKind: "novel_bundle",
        consumesQuota: true,
        spoilerMode: options.spoilerMode,
        analyticsConfidenceTier: "high",
      };
    }
  }

  const payload = buildSeriesReply({
    series,
    currentNovelId: resolved.novelId,
    currentTitle: resolved.title,
    kind,
  });

  return {
    reply: payload.reply,
    recommendations: [],
    seriesInfo: payload.seriesInfo,
    lookupSession: confirmedLookupSession({
      novelId: resolved.novelId,
      novelTitle: resolved.title,
    }),
    responseKind: "novel_bundle",
    consumesQuota: true,
    spoilerMode: options.spoilerMode,
    analyticsConfidenceTier: "high",
  };
}
