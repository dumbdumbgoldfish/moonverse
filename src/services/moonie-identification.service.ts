import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  normalizeLookupConfirmationMessage,
  normalizeLookupQueryText,
  isBareReadingLinkRequest,
} from "@/lib/moonie/intent";
import { isAcceptedLookupCatalogueMatch } from "@/lib/moonie/lookup-acceptance";
import { parseSearchQuery } from "@/lib/search";
import {
  computeMatchConfidence,
  shouldClarify,
  shouldClarifyForReadingLink,
} from "@/lib/moonie/match-confidence";
import { matchPercent } from "@/lib/moonie/ranking";
import {
  buildCatalogueFieldProvenance,
  confidenceLabel,
} from "@/lib/moonie/provenance";
import {
  findCandidateNovels,
  type NovelCandidate,
} from "@/services/moonie-pipeline.service";
import {
  buildNovelBundle,
  formatNovelBundleReply,
} from "@/services/moonie-novel-lookup.service";
import type {
  MoonieLookupCandidate,
  MoonieLookupPendingIntent,
  MoonieLookupSession,
  MoonieNovelOverview,
  MoonieRecommendation,
  MoonieSpoilerMode,
} from "@/types/moonie";
import type { MoonieInterpretedPreferences } from "@/types/moonie";

const EMPTY_PREFS: MoonieInterpretedPreferences = {
  genres: [],
  tags: [],
  excludedTags: [],
  status: null,
  mood: [],
  language: null,
  length: null,
};

export interface IdentifyNovelsOptions {
  query: string;
  userId?: string;
  excludeNovelIds?: string[];
  queryAuthor?: string | null;
  visionConfidence?: "high" | "medium" | "low";
  spoilerMode?: MoonieSpoilerMode;
  limit?: number;
  partialMemory?: boolean;
  prefs?: MoonieInterpretedPreferences;
  clueHits?: string[];
  readingLinkIntent?: boolean;
  preferRawTitleQuery?: boolean;
  pendingIntent?: MoonieLookupPendingIntent | null;
  explicitTitleLookup?: boolean;
  explicitNovelIds?: string[];
}

export interface IdentificationResult {
  mode: "high_confidence" | "clarification" | "partial_memory" | "no_match";
  candidates: MoonieLookupCandidate[];
  session: MoonieLookupSession;
  recommendation?: MoonieRecommendation | null;
  overview?: MoonieNovelOverview | null;
  reply: string;
  followUpQuestion?: string | null;
  consumesQuota?: boolean;
}

async function loadAliasesByNovelIds(
  novelIds: string[]
): Promise<Map<string, string[]>> {
  if (novelIds.length === 0) return new Map();
  const rows = await db.novelAlias.findMany({
    where: { novelId: { in: novelIds } },
    select: { novelId: true, title: true },
  });
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.novelId) ?? [];
    list.push(row.title);
    map.set(row.novelId, list);
  }
  return map;
}

async function aliasExactNovelIds(query: string): Promise<string[]> {
  const normalized = normalizeLookupQueryText(query).trim();
  if (normalized.length < 2) return [];
  const rows = await db.novelAlias.findMany({
    where: { title: { equals: normalized, mode: "insensitive" } },
    select: { novelId: true },
    take: 8,
  });
  return [...new Set(rows.map((row) => row.novelId))];
}

async function canonicalExactNovelIds(query: string): Promise<string[]> {
  const normalized = normalizeLookupQueryText(query).trim();
  if (normalized.length < 2) return [];
  const rows = await db.novel.findMany({
    where: { title: { equals: normalized, mode: "insensitive" } },
    select: { id: true },
    take: 8,
  });
  return rows.map((row) => row.id);
}

export async function resolveExactLookupNovelIds(
  query: string
): Promise<string[]> {
  const normalized = normalizeLookupQueryText(query).trim();
  if (normalized.length < 2) return [];
  const [canonicalIds, aliasIds] = await Promise.all([
    canonicalExactNovelIds(normalized),
    aliasExactNovelIds(normalized),
  ]);
  return [...new Set([...canonicalIds, ...aliasIds])];
}

function resolveSessionPendingIntent(
  options: IdentifyNovelsOptions
): MoonieLookupPendingIntent | null {
  if (options.pendingIntent) return options.pendingIntent;
  if (options.readingLinkIntent) return "FIND_READING_SOURCE";
  return "FIND_NOVEL";
}

function withLookupSession(
  session: Omit<MoonieLookupSession, "pendingIntent">,
  options: IdentifyNovelsOptions
): MoonieLookupSession {
  return {
    ...session,
    pendingIntent: resolveSessionPendingIntent(options),
  };
}

const aliasNovelInclude = {
  genres: true,
  tags: true,
  reviews: {
    where: { moderationStatus: "OK" as const },
    select: { id: true, rating: true },
    orderBy: { likeCount: "desc" as const },
    take: 1,
  },
} satisfies Prisma.NovelInclude;

export async function fetchNovelCandidatesByIds(
  ids: string[]
): Promise<NovelCandidate[]> {
  if (ids.length === 0) return [];

  const novels = await db.novel.findMany({
    where: { id: { in: ids } },
    include: aliasNovelInclude,
  });

  const reviewStats = await db.review.groupBy({
    by: ["novelId"],
    where: {
      novelId: { in: ids },
      moderationStatus: "OK",
    },
    _count: { _all: true },
    _avg: { rating: true },
  });
  const statsByNovelId = new Map(
    reviewStats.map((row) => [
      row.novelId,
      {
        reviewCount: row._count._all,
        averageRating: row._avg.rating ?? null,
      },
    ])
  );

  return novels.map((novel) => {
    const genres = novel.genres.map((g) => g.name);
    const tags = novel.tags.map((t) => t.name);
    const moods = novel.tags
      .filter((tag) => tag.kind === "MOOD")
      .map((t) => t.name);
    const stats = statsByNovelId.get(novel.id);
    const reviewCount = stats?.reviewCount ?? 0;
    const averageRating =
      stats?.averageRating ??
      (novel.reviews[0] ? novel.reviews[0].rating : null);
    const topReviewId = novel.reviews[0]?.id ?? null;

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
      topReviewId: topReviewId,
      score: 0.55,
      scoreBreakdown: {
        semantic: 0,
        structured: 0.55,
        quality: 0,
        history: 0,
        diversity: 1,
      },
      semantic: 0,
      lexical: 0.9,
    };
  });
}

function candidateToLookup(
  candidate: NovelCandidate,
  scored: ReturnType<typeof computeMatchConfidence>,
  options: {
    hasVerifiedReadingSource?: boolean;
    hasCommunity?: boolean;
    partialMemory?: boolean;
    clues?: string[];
  }
): MoonieLookupCandidate {
  const reasonParts = scored.evidence.map((item) => item.label);
  if (options.partialMemory && options.clues?.length) {
    reasonParts.push(`Clues: ${options.clues.join(", ")}`);
  }

  return {
    novelId: candidate.id,
    title: candidate.title,
    canonicalTitle: candidate.title,
    author: candidate.author,
    coverUrl: candidate.coverUrl,
    matchedAlias: scored.matchedAlias,
    confidence: scored.confidence,
    confidenceScore: scored.confidenceScore,
    evidence: scored.evidence,
    genres: candidate.genres,
    tags: candidate.tags.slice(0, 6),
    publicationStatus: candidate.publicationStatus,
    originalLanguage: candidate.originalLanguage,
    matchPercent: matchPercent(scored.confidenceScore),
    reason: reasonParts.join(" · "),
    provenance: buildCatalogueFieldProvenance({
      hasCommunity: options.hasCommunity,
      readingLinkBadge: options.hasVerifiedReadingSource ? "verified" : undefined,
    }),
  };
}

export async function scoreCatalogueCandidates(
  options: IdentifyNovelsOptions
): Promise<MoonieLookupCandidate[]> {
  const parsed = parseSearchQuery(options.query);
  const queryAuthor = options.queryAuthor ?? parsed.author;
  const useRawTitle =
    options.preferRawTitleQuery ||
    options.readingLinkIntent ||
    options.explicitTitleLookup;
  const searchText = normalizeLookupQueryText(
    useRawTitle
      ? options.query.trim()
      : parsed.quoted || parsed.text || options.query.trim()
  );

  const hybridCandidates = await findCandidateNovels({
    prefs: options.partialMemory
      ? { ...EMPTY_PREFS, ...(options.prefs ?? {}) }
      : EMPTY_PREFS,
    userId: options.userId,
    excludeNovelIds: options.excludeNovelIds,
    queryText: searchText,
    strictGenreFilter: false,
    limit: options.limit ?? 8,
    skipUserHiddenNovels: options.explicitTitleLookup,
  });

  const aliasIds = await aliasExactNovelIds(searchText);
  const canonicalIds = await canonicalExactNovelIds(searchText);
  const hybridIds = new Set(hybridCandidates.map((c) => c.id));
  const exactIds = [
    ...new Set([
      ...canonicalIds,
      ...aliasIds.filter((id) => !canonicalIds.includes(id)),
    ]),
  ];
  const missingExactIds = exactIds.filter((id) => !hybridIds.has(id));
  const exactOnlyCandidates = await fetchNovelCandidatesByIds(missingExactIds);

  const seen = new Set<string>();
  const merged: NovelCandidate[] = [];

  for (const id of exactIds) {
    if (seen.has(id)) continue;
    const fromHybrid = hybridCandidates.find((c) => c.id === id);
    const fromExactFetch = exactOnlyCandidates.find((c) => c.id === id);
    const candidate = fromHybrid ?? fromExactFetch;
    if (candidate) {
      merged.push(candidate);
      seen.add(id);
    }
  }

  for (const candidate of [...exactOnlyCandidates, ...hybridCandidates]) {
    if (seen.has(candidate.id)) continue;
    merged.push(candidate);
    seen.add(candidate.id);
  }

  const aliasMap = await loadAliasesByNovelIds(merged.map((c) => c.id));

  const scored: MoonieLookupCandidate[] = merged.map((candidate) => {
    const aliases = aliasMap.get(candidate.id) ?? [];
    const match = computeMatchConfidence({
      canonicalTitle: candidate.title,
      query: searchText,
      author: candidate.author,
      queryAuthor,
      aliases,
      hybridScore: candidate.score,
      visionConfidence: options.visionConfidence,
      clueHits: options.clueHits,
    });
    return candidateToLookup(candidate, match, {
      partialMemory: options.partialMemory,
      clues: options.clueHits,
    });
  });

  scored.sort((a, b) => b.confidenceScore - a.confidenceScore);

  const deduped = new Map<string, MoonieLookupCandidate>();
  for (const item of scored) {
    const existing = deduped.get(item.novelId);
    if (!existing || item.confidenceScore > existing.confidenceScore) {
      deduped.set(item.novelId, item);
    }
  }

  return [...deduped.values()].sort(
    (a, b) => b.confidenceScore - a.confidenceScore
  );
}

export async function identifyNovels(
  options: IdentifyNovelsOptions
): Promise<IdentificationResult> {
  let candidates = await scoreCatalogueCandidates(options);
  const query = normalizeLookupQueryText(options.query).trim();

  if (options.readingLinkIntent && isBareReadingLinkRequest(query)) {
    return {
      mode: "no_match",
      candidates: [],
      session: withLookupSession(
        {
          mode: "exact",
          query,
          candidates: [],
          rejectedNovelIds: options.excludeNovelIds ?? [],
        },
        options
      ),
      reply:
        "Which novel do you want a reading link for? Tell me the title and I'll verify it in the MoonVerse catalogue.",
      followUpQuestion: null,
      consumesQuota: false,
    };
  }

  const forcedNovelId =
    options.explicitTitleLookup && options.explicitNovelIds?.length === 1
      ? options.explicitNovelIds[0]!
      : null;

  if (forcedNovelId) {
    let forced = candidates.find((candidate) => candidate.novelId === forcedNovelId);
    if (!forced) {
      const exactOnly = await fetchNovelCandidatesByIds([forcedNovelId]);
      const candidate = exactOnly[0];
      if (candidate) {
        const match = computeMatchConfidence({
          canonicalTitle: candidate.title,
          query,
          author: candidate.author,
          queryAuthor: options.queryAuthor,
          aliases: (await loadAliasesByNovelIds([forcedNovelId])).get(forcedNovelId) ?? [],
          hybridScore: candidate.score,
          visionConfidence: options.visionConfidence,
          clueHits: options.clueHits,
        });
        forced = candidateToLookup(candidate, match, {
          partialMemory: options.partialMemory,
          clues: options.clueHits,
        });
      }
    }
    if (forced) {
      candidates = [forced];
    }
  }

  if (candidates.length === 0) {
    return {
      mode: "no_match",
      candidates: [],
      session: withLookupSession(
        {
          mode: "exact",
          query,
          candidates: [],
          rejectedNovelIds: options.excludeNovelIds ?? [],
        },
        options
      ),
      reply: `I could not find a verified match for “${query}” in the MoonVerse catalogue. Try the full title, an alternate spelling, or browse the catalogue.`,
      followUpQuestion: "Can you share another clue — author, genre, or a longer title fragment?",
      consumesQuota: false,
    };
  }

  if (options.explicitTitleLookup && !forcedNovelId) {
    const accepted = candidates.filter(isAcceptedLookupCatalogueMatch);
    if (accepted.length === 0) {
      return {
        mode: "no_match",
        candidates: [],
        session: withLookupSession(
          {
            mode: "exact",
            query,
            candidates: [],
            rejectedNovelIds: options.excludeNovelIds ?? [],
          },
          options
        ),
        reply: `I couldn't verify "${query}" in the MoonVerse catalogue.`,
        followUpQuestion:
          "Try the full title, an alternate spelling, or browse the catalogue.",
        consumesQuota: false,
      };
    }
    candidates = accepted;
  }

  const top = candidates[0]!;
  let clarify = options.explicitTitleLookup
    ? candidates.length > 1
    : options.readingLinkIntent
      ? shouldClarifyForReadingLink(candidates)
      : shouldClarify(candidates);

  const exactCanonicalMatches = candidates.filter((candidate) =>
    candidate.evidence.some((item) => item.kind === "canonical_title")
  );
  const hasSoleExactCanonical =
    exactCanonicalMatches.length === 1 &&
    exactCanonicalMatches[0]!.novelId === top.novelId;
  if (hasSoleExactCanonical) {
    clarify = false;
  }

  if (!clarify && (top.confidence === "high" || hasSoleExactCanonical)) {
    const bundle = await buildNovelBundle({
      novelId: top.novelId,
      userId: options.userId,
      spoilerMode: options.spoilerMode,
      reason: `Verified catalogue match (${confidenceLabel(top.confidence).toLowerCase()}).`,
      lookupCandidate: top,
    });

    return {
      mode: "high_confidence",
      candidates: [top],
      session: withLookupSession(
        {
          mode: "confirmed",
          query,
          candidates: [top],
          rejectedNovelIds: options.excludeNovelIds ?? [],
          confirmedNovelId: top.novelId,
        },
        options
      ),
      recommendation: bundle.recommendation,
      overview: bundle.overview,
      reply: bundle.overview
        ? formatNovelBundleReply({
            overview: bundle.overview,
            emphasizeReadingLink: options.readingLinkIntent,
          })
        : `Verified match for **${top.title}**.`,
    };
  }

  const shouldPresentCandidates =
    (options.explicitTitleLookup && clarify) ||
    (!options.explicitTitleLookup &&
      (clarify ||
        options.partialMemory ||
        (top.confidence !== "high" &&
          (!options.readingLinkIntent || top.confidence === "low") &&
          !hasSoleExactCanonical)));

  if (shouldPresentCandidates) {
    const shortlist = candidates.slice(0, 5);
    const mode = options.partialMemory ? "partial_memory" : "clarification";
    const intro = options.partialMemory
      ? "I found a few catalogue possibilities from your clues — not confirmed identifications."
      : `I found several possible matches for “${query}”. Which one do you mean?`;

    return {
      mode: options.partialMemory ? "partial_memory" : "clarification",
      candidates: shortlist,
      session: withLookupSession(
        {
          mode,
          query,
          candidates: shortlist,
          rejectedNovelIds: options.excludeNovelIds ?? [],
          clues: options.clueHits,
        },
        options
      ),
      reply: intro,
      followUpQuestion: shortlist[0]
        ? `This one — ${shortlist[0].title}`
        : null,
    };
  }

  if (top.confidence === "low") {
    if (candidates.length > 1) {
      const shortlist = candidates.slice(0, 5);
      return {
        mode: "clarification",
        candidates: shortlist,
        session: withLookupSession(
          {
            mode: "clarification",
            query,
            candidates: shortlist,
            rejectedNovelIds: options.excludeNovelIds ?? [],
          },
          options
        ),
        reply: `I found several possible matches for “${query}”. Which one do you mean?`,
        followUpQuestion: shortlist[0]
          ? `This one — ${shortlist[0].title}`
          : null,
      };
    }
    return {
      mode: "no_match",
      candidates: [],
      session: withLookupSession(
        {
          mode: "exact",
          query,
          candidates: [],
          rejectedNovelIds: options.excludeNovelIds ?? [],
        },
        options
      ),
      reply: `I could not find a verified match for “${query}” in the MoonVerse catalogue. Try the full title, an alternate spelling, or browse the catalogue.`,
      followUpQuestion:
        "Can you share another clue — author, genre, or a longer title fragment?",
      consumesQuota: false,
    };
  }

  if (
    options.explicitTitleLookup &&
    !isAcceptedLookupCatalogueMatch(top)
  ) {
    return {
      mode: "no_match",
      candidates: [],
      session: withLookupSession(
        {
          mode: "exact",
          query,
          candidates: [],
          rejectedNovelIds: options.excludeNovelIds ?? [],
        },
        options
      ),
      reply: `I couldn't verify "${query}" in the MoonVerse catalogue.`,
      followUpQuestion:
        "Try the full title, an alternate spelling, or browse the catalogue.",
      consumesQuota: false,
    };
  }

  const bundle = await buildNovelBundle({
    novelId: top.novelId,
    userId: options.userId,
    spoilerMode: options.spoilerMode,
    lookupCandidate: top,
  });

  return {
    mode: "high_confidence",
    candidates: [top],
    session: withLookupSession(
      {
        mode: "confirmed",
        query,
        candidates: [top],
        rejectedNovelIds: options.excludeNovelIds ?? [],
        confirmedNovelId: top.novelId,
      },
      options
    ),
    recommendation: bundle.recommendation,
    overview: bundle.overview,
    reply: bundle.overview
      ? formatNovelBundleReply({
          overview: bundle.overview,
          emphasizeReadingLink: options.readingLinkIntent,
        })
      : `Best match: **${top.title}**.`,
  };
}

export async function confirmLookupCandidate(options: {
  novelId: string;
  userId?: string;
  spoilerMode?: MoonieSpoilerMode;
  session: MoonieLookupSession;
  emphasizeReadingLink?: boolean;
  emphasizeReviews?: boolean;
}): Promise<IdentificationResult> {
  const candidate =
    options.session.candidates.find((c) => c.novelId === options.novelId) ??
    null;

  const bundle = await buildNovelBundle({
    novelId: options.novelId,
    userId: options.userId,
    spoilerMode: options.spoilerMode,
    lookupCandidate: candidate
      ? {
          ...candidate,
          confidence: "high",
          confidenceScore: Math.max(candidate.confidenceScore, 0.95),
          evidence: [
            { kind: "catalogue_verified", label: "You chose this match" },
            ...candidate.evidence.filter((item) => item.kind !== "fuzzy_title"),
          ],
        }
      : undefined,
    reason: "Confirmed from your selection.",
  });

  if (!bundle.recommendation || !bundle.overview) {
    return {
      mode: "no_match",
      candidates: options.session.candidates,
      session: options.session,
      reply: "I could not load that catalogue record. Try another candidate.",
    };
  }

  const reply = formatNovelBundleReply({
    overview: bundle.overview,
    emphasizeReadingLink: options.emphasizeReadingLink,
    emphasizeReviews: options.emphasizeReviews,
  });

  return {
    mode: "high_confidence",
    candidates: candidate ? [candidate] : [],
    session: {
      ...options.session,
      mode: "confirmed",
      confirmedNovelId: options.novelId,
      candidates: candidate ? [candidate] : [],
      pendingIntent: options.emphasizeReviews
        ? "NOVEL_REVIEWS"
        : options.session.pendingIntent,
    },
    recommendation: bundle.recommendation,
    overview: bundle.overview,
    reply,
  };
}

export async function rejectAndShowAlternatives(options: {
  rejectedNovelId: string;
  session: MoonieLookupSession;
  userId?: string;
  spoilerMode?: MoonieSpoilerMode;
}): Promise<IdentificationResult> {
  const rejected = [
    ...new Set([...options.session.rejectedNovelIds, options.rejectedNovelId]),
  ];
  const remaining = options.session.candidates.filter(
    (c) => !rejected.includes(c.novelId)
  );

  if (remaining.length === 0) {
    const refreshed = await scoreCatalogueCandidates({
      query: options.session.query,
      userId: options.userId,
      excludeNovelIds: rejected,
      spoilerMode: options.spoilerMode,
      partialMemory: options.session.mode === "partial_memory",
      clueHits: options.session.clues,
    });

    const next = refreshed.filter((c) => !rejected.includes(c.novelId)).slice(0, 5);

    if (next.length === 0) {
      return {
        mode: "no_match",
        candidates: [],
        session: {
          ...options.session,
          rejectedNovelIds: rejected,
          candidates: [],
          mode: "alternatives",
        },
        reply:
          "None of those matched. Share another clue — a longer title fragment, author, genre, or what you remember about the plot.",
        followUpQuestion: "What else do you remember about the story?",
      };
    }

    return {
      mode: "clarification",
      candidates: next,
      session: {
        ...options.session,
        mode: "alternatives",
        rejectedNovelIds: rejected,
        candidates: next,
      },
      reply: "Here are the next plausible catalogue matches.",
      followUpQuestion: next[0] ? `This one — ${next[0].title}` : null,
    };
  }

  return {
    mode: "clarification",
    candidates: remaining,
    session: {
      ...options.session,
      mode: "alternatives",
      rejectedNovelIds: rejected,
      candidates: remaining,
    },
    reply: "Got it — here are the other possibilities.",
    followUpQuestion: remaining[0]
      ? `This one — ${remaining[0].title}`
      : null,
  };
}

export function extractPartialMemoryClues(message: string): string[] {
  const clues: string[] = [];
  const lower = message.toLowerCase();

  const titleFragment = message.match(
    /\btitle had\s+["“']?([^"”'.!?]+)["”']?/i
  );
  if (titleFragment?.[1]) {
    clues.push(`title contains “${titleFragment[1].trim()}”`);
  }

  const genreSignals = [
    "cultivation",
    "xianxia",
    "romance",
    "revenge",
    "time travel",
    "dungeon",
    "litrpg",
    "female lead",
    "male lead",
    "villainess",
    "regression",
    "transmigration",
  ];
  for (const signal of genreSignals) {
    if (lower.includes(signal)) clues.push(signal);
  }

  if (/\bred hair\b/i.test(message)) clues.push("red-haired MC");
  if (/\bforgot the name\b/i.test(message)) clues.push("title unknown");

  return clues;
}

export async function identifyFromPartialMemory(
  options: IdentifyNovelsOptions & { prefs?: MoonieInterpretedPreferences }
): Promise<IdentificationResult> {
  const clues = extractPartialMemoryClues(options.query);
  return identifyNovels({
    ...options,
    partialMemory: true,
    clueHits: clues,
    limit: 6,
  });
}

export function lookupCandidateByOrdinal(
  session: MoonieLookupSession,
  index: number
): MoonieLookupCandidate | null {
  if (index < 0) {
    return session.candidates[session.candidates.length - 1] ?? null;
  }
  return session.candidates[index] ?? null;
}

export function parseConfirmNovelId(
  message: string,
  session: MoonieLookupSession
): string | null {
  const normalized = normalizeLookupConfirmationMessage(message);

  const explicit = normalized.match(/^this one\s*[—\-:]\s*(.+)$/i);
  if (explicit?.[1]) {
    const title = explicit[1].trim().toLowerCase();
    const match = session.candidates.find(
      (c) => c.title.toLowerCase() === title
    );
    if (match) return match.novelId;
  }

  const yesMatch = normalized.match(
    /^yes,?\s*(?:this\s+one|that(?:'s| is) (?:the )?one|the (?:right )?one)\.?$/i
  );
  if (yesMatch && session.candidates[0]) {
    return session.candidates[0].novelId;
  }

  if (/^this one\.?$/i.test(normalized) && session.candidates[0]) {
    return session.candidates[0].novelId;
  }

  return null;
}

export function parseRejectNovelId(
  message: string,
  session: MoonieLookupSession
): string | null {
  const normalized = normalizeLookupConfirmationMessage(message);
  const named = normalized.match(/^not\s+(?:this|that)\s*[—\-:]\s*(.+)$/i);
  if (named?.[1]) {
    const title = named[1].trim().toLowerCase();
    const match = session.candidates.find(
      (c) => c.title.toLowerCase() === title
    );
    if (match) return match.novelId;
  }
  return session.candidates[0]?.novelId ?? null;
}
