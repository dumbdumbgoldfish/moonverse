import { ReadingLinkModerationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeConfidence } from "@/lib/moonie/guardrails";
import { createOpenAiChatCompletion, hasOpenAiApiKey } from "@/lib/moonie/openai";
import { explanationResponseSchema } from "@/lib/moonie/preference-schema";
import { buildFollowUpQuestion } from "@/lib/moonie/preferences";
import { moonieDisplayCoverUrl } from "@/lib/review-utils";
import { matchPercent } from "@/lib/moonie/ranking";
import { spoilerConstraintForOpenAI } from "@/lib/moonie/spoiler-mode";
import type { MooniePersonalizationSettings } from "@/lib/moonie/personalization";
import { matchedPreferenceLabels } from "@/lib/moonie/label-match";
import {
  retrieveHybridCandidates,
  selectDiverseCandidates,
  type HybridCandidate,
  type MoonieRecentSearchEntry,
} from "@/services/hybrid-retrieval.service";
import { buildCommunityInsight } from "@/services/moonie-novel-lookup.service";
import type {
  MoonieConfidence,
  MoonieInterpretedPreferences,
  MoonieRecommendResponse,
  MoonieRecommendation,
  MoonieSourceStatus,
  MoonieSpoilerMode,
} from "@/types/moonie";

export type NovelCandidate = HybridCandidate;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export async function getHiddenNovelIds(userId: string): Promise<string[]> {
  const rows = await db.recommendationFeedback.findMany({
    where: { userId },
    select: { novelId: true, kind: true },
    orderBy: { createdAt: "desc" },
  });

  const latestByNovel = new Map<string, (typeof rows)[number]["kind"]>();
  for (const row of rows) {
    if (!latestByNovel.has(row.novelId)) {
      latestByNovel.set(row.novelId, row.kind);
    }
  }
  return [...latestByNovel]
    .filter(([, kind]) => kind === "NOT_FOR_ME")
    .map(([novelId]) => novelId);
}

export async function findCandidateNovels(options: {
  prefs: MoonieInterpretedPreferences;
  userId?: string;
  excludeNovelIds?: string[];
  similarToNovelId?: string;
  queryText?: string;
  queryEmbedding?: number[];
  disableSemantic?: boolean;
  strictGenreFilter?: boolean;
  limit?: number;
  personalization?: import("@/lib/moonie/personalization").MooniePersonalizationSettings;
  recentSearches?: MoonieRecentSearchEntry[];
  skipUserHiddenNovels?: boolean;
}): Promise<NovelCandidate[]> {
  const hidden =
    options.userId && !options.skipUserHiddenNovels
      ? await getHiddenNovelIds(options.userId)
      : [];
  const exclude = [...(options.excludeNovelIds ?? []), ...hidden];
  const base = {
    prefs: options.prefs,
    queryText: options.queryText,
    queryEmbedding: options.queryEmbedding,
    userId: options.userId,
    excludeNovelIds: exclude,
    similarToNovelId: options.similarToNovelId,
    disableSemantic: options.disableSemantic,
    strictGenreFilter: options.strictGenreFilter,
    limit: options.limit ?? 40,
    personalization: options.personalization,
    recentSearches: options.recentSearches,
  };

  const candidates = await retrieveHybridCandidates(base);

  const hasRestrictivePrefs =
    options.prefs.genres.length > 0 ||
    options.prefs.status ||
    options.prefs.language ||
    options.prefs.length;

  if (candidates.length < 5 && hasRestrictivePrefs) {
    const relaxed = await retrieveHybridCandidates({
      ...base,
      prefs: {
        ...options.prefs,
        genres: [],
        status: null,
        language: null,
        length: null,
      },
      strictGenreFilter: false,
    });
    const seen = new Set(candidates.map((row) => row.id));
    for (const row of relaxed) {
      if (!seen.has(row.id)) {
        candidates.push(row);
        seen.add(row.id);
      }
    }
    candidates.sort(
      (a, b) => b.score - a.score || b.reviewCount - a.reviewCount
    );
  }

  return candidates;
}

async function resolveSourceStatus(
  novelId: string
): Promise<{
  status: MoonieSourceStatus;
  availableOn: string[];
  primaryReadUrl?: string;
  platformName?: string;
}> {
  const links = await db.readingLink.findMany({
    where: {
      novelId,
      active: true,
      moderationStatus: {
        in: [
          ReadingLinkModerationStatus.APPROVED,
          ReadingLinkModerationStatus.PENDING,
          ReadingLinkModerationStatus.NEEDS_REVIEW,
        ],
      },
    },
    orderBy: [{ isVerified: "desc" }, { isOfficial: "desc" }, { sortOrder: "asc" }],
  });

  const verified = links.filter(
    (l) =>
      l.moderationStatus === ReadingLinkModerationStatus.APPROVED &&
      (l.isVerified || l.isOfficial)
  );
  if (verified.length > 0) {
    const primary = verified[0];
    return {
      status: "verified",
      availableOn: verified.slice(0, 4).map((l) => l.label || l.platform),
      primaryReadUrl: primary.url,
      platformName: primary.label || primary.platform,
    };
  }

  const pending = links.some(
    (l) =>
      l.moderationStatus === ReadingLinkModerationStatus.PENDING ||
      l.moderationStatus === ReadingLinkModerationStatus.NEEDS_REVIEW
  );
  if (pending) {
    return { status: "pending", availableOn: [] };
  }

  return { status: "none", availableOn: [] };
}

function confidenceFor(candidate: NovelCandidate): MoonieConfidence {
  if (candidate.score >= 0.55 && candidate.reviewCount >= 2) return "high";
  if (candidate.score >= 0.35) return "medium";
  return "low";
}

function buildReason(
  candidate: NovelCandidate,
  prefs: MoonieInterpretedPreferences,
  queryText?: string
): { reason: string; reasons: string[]; drawback: string | null; matchingLabels: string[]; personalizationReasons: string[] } {
  const matchedGenres = matchedPreferenceLabels(candidate.genres, prefs.genres);
  const matchedTags = matchedPreferenceLabels(candidate.tags, [
    ...prefs.tags,
    ...prefs.mood,
  ]);
  const matchingLabels = [...matchedGenres, ...matchedTags].slice(0, 4);

  const reasons: string[] = [];
  if (matchedGenres.length) {
    reasons.push(`Fits your ${matchedGenres.slice(0, 2).join(" / ")} interest`);
  }
  if (matchedTags.length) {
    reasons.push(`Shares your ${matchedTags.slice(0, 2).join(", ")} taste`);
  }
  if (prefs.status === "completed" && candidate.publicationStatus) {
    reasons.push("Matches your completed-novel preference");
  }
  const history = candidate.historySignals;
  if (history?.onReadingList) {
    reasons.push("On your MoonVerse reading list");
  } else if (history?.moreLikeThis) {
    reasons.push("Similar to a novel you asked for more like");
  } else if (history?.tasteGenreAffinity) {
    reasons.push("Shares genres with your saved taste and library");
  }
  if (candidate.scoreBreakdown.quality >= 0.08) {
    reasons.push("Strong MoonVerse community ratings");
  }
  if (
    reasons.length === 0 &&
    queryText?.trim() &&
    candidate.title.toLowerCase().includes(queryText.trim().toLowerCase().slice(0, 12))
  ) {
    reasons.push("Title closely matches your search words");
  }
  if (reasons.length === 0 && candidate.reviewCount >= 3) {
    reasons.push("Well-reviewed pick from the MoonVerse catalogue");
  }
  if (reasons.length === 0) {
    reasons.push("Closest catalogue match for this request");
  }

  let drawback: string | null = null;
  if (candidate.reviewCount === 0) {
    drawback =
      "Few MoonVerse reviews yet. This match is based on metadata rather than community evidence.";
  } else if (candidate.averageRating != null && candidate.averageRating < 3.5) {
    drawback =
      "Community ratings on MoonVerse are mixed. Several readers may find the pacing uneven.";
  } else if (candidate.reviewCount < 3) {
    drawback = "Early MoonVerse reviews are limited, so treat the community signal as provisional.";
  }

  const excludedHit = matchedPreferenceLabels(candidate.tags, prefs.excludedTags)[0];
  if (excludedHit) {
    drawback = `Possible conflict: this title is still tagged with ${excludedHit}.`;
  }

  const personalizationReasons = [...reasons];

  return {
    reason: reasons.slice(0, 3).join(". ") + ".",
    reasons: reasons.slice(0, 3),
    drawback,
    matchingLabels,
    personalizationReasons: personalizationReasons.slice(0, 4),
  };
}

export async function buildGroundedRecommendations(options: {
  prefs: MoonieInterpretedPreferences;
  userId?: string;
  excludeNovelIds?: string[];
  similarToNovelId?: string;
  queryText?: string;
  queryEmbedding?: number[];
  disableSemantic?: boolean;
  strictGenreFilter?: boolean;
  conversationId?: string;
  take?: number;
  personalization?: MooniePersonalizationSettings;
  recentSearches?: MoonieRecentSearchEntry[];
  spoilerMode?: MoonieSpoilerMode;
}): Promise<MoonieRecommendResponse> {
  const candidates = await findCandidateNovels({
    ...options,
    limit: 30,
  });

  const take = options.take ?? 5;
  const seenTitles = new Set<string>();
  const deduped: NovelCandidate[] = [];
  for (const candidate of candidates) {
    const key = `${normalize(candidate.title)}::${normalize(candidate.author ?? "")}`;
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);
    deduped.push(candidate);
  }
  const top = selectDiverseCandidates(deduped, take);

  if (top.length === 0) {
    return {
      reply:
        "I could not find a close match in MoonVerse yet. Try removing one restriction or choosing a broader genre.",
      summary: "No matching novels",
      recommendations: [],
      interpretedPreferences: options.prefs,
      followUpQuestion: buildFollowUpQuestion(options.prefs),
    };
  }

  const recommendations: MoonieRecommendation[] = [];
  const spoilerMode = options.spoilerMode ?? "none";

  const communityByNovel = await Promise.all(
    top.map(async (candidate) => ({
      novelId: candidate.id,
      community:
        candidate.reviewCount > 0
          ? await buildCommunityInsight(candidate.id, spoilerMode)
          : null,
    }))
  );
  const communityMap = new Map(
    communityByNovel.map((row) => [row.novelId, row.community])
  );

  for (const candidate of top) {
    const source = await resolveSourceStatus(candidate.id);
    const { reason, reasons, drawback, matchingLabels, personalizationReasons } =
      buildReason(candidate, options.prefs, options.queryText);
    const community = communityMap.get(candidate.id) ?? null;
    recommendations.push({
      novelId: candidate.id,
      title: candidate.title,
      author: candidate.author,
      coverUrl: moonieDisplayCoverUrl(candidate.coverUrl),
      reason,
      reasons,
      drawback,
      genres: candidate.genres,
      tags: candidate.tags.slice(0, 6),
      matchingLabels,
      personalizationReasons,
      confidence: confidenceFor(candidate),
      matchPercent: matchPercent(candidate.score),
      scoreBreakdown: candidate.scoreBreakdown,
      influencedBy: options.prefs.influencedBy ?? [],
      publicationStatus: candidate.publicationStatus,
      averageRating: candidate.averageRating,
      reviewCount: candidate.reviewCount,
      reviewId: candidate.topReviewId ?? undefined,
      sourceStatus: source.status,
      availableOn: source.availableOn,
      primaryReadUrl: source.primaryReadUrl,
      platformName: source.platformName,
      community,
    });
  }

  if (options.userId) {
    try {
      await db.recommendationSession.create({
        data: {
          userId: options.userId,
          conversationId: options.conversationId,
          query: options.queryText?.slice(0, 500) || "taste request",
          interpretedPreferences: options.prefs as object,
          results: {
            create: recommendations.map((rec, index) => ({
              novelId: rec.novelId,
              rank: index + 1,
              matchScore: rec.matchPercent ?? 0,
              scoreBreakdown: rec.scoreBreakdown as object,
              reasons: rec.reasons ?? [rec.reason],
              caveat: rec.drawback,
              explanation: rec.reason,
            })),
          },
        },
      });
    } catch {
      // Session persistence must not break recommendations.
    }
  }

  const followUp = buildFollowUpQuestion(options.prefs);
  const hasTasteSignals = (options.prefs.influencedBy?.length ?? 0) > 0;
  const summaryParts = [
    `I matched ${recommendations.length} MoonVerse novel${recommendations.length === 1 ? "" : "s"}`,
  ];
  if (options.prefs.genres.length) {
    summaryParts.push(`around ${options.prefs.genres.slice(0, 2).join(" & ")}`);
  }
  if (options.prefs.mood.length) {
    summaryParts.push(`with a ${options.prefs.mood[0]} mood`);
  }
  if (hasTasteSignals && recommendations.length > 0) {
    summaryParts.push("using your saved taste where it helped");
  }

  const coldStartNote =
    !hasTasteSignals &&
    options.prefs.genres.length === 0 &&
    options.prefs.tags.length === 0
      ? " Tell me a genre, mood, or trope to sharpen the next round."
      : "";

  return {
    reply: `${summaryParts.join(" ")}. Every title below exists in the MoonVerse catalogue. I never invent novels or reading links.${coldStartNote}`,
    summary: summaryParts.join(" "),
    recommendations,
    interpretedPreferences: options.prefs,
    followUpQuestion: followUp,
  };
}

/** Optional AI polish: explain only over provided candidate IDs. */
export async function polishExplanationsWithOpenAI(
  message: string,
  grounded: MoonieRecommendResponse,
  spoilerMode: MoonieSpoilerMode = "none"
): Promise<MoonieRecommendResponse> {
  if (!hasOpenAiApiKey() || grounded.recommendations.length === 0) {
    return grounded;
  }

  const allowedIds = new Set(grounded.recommendations.map((r) => r.novelId));
  const catalog = grounded.recommendations.map((r) => ({
    novelId: r.novelId,
    title: r.title,
    author: r.author,
    genres: r.genres,
    tags: r.tags,
    reviewCount: r.reviewCount,
    averageRating: r.averageRating,
  }));

  try {
    const result = await createOpenAiChatCompletion({
      modelKind: "text",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are Moonie, MoonVerse's reading companion. You ONLY explain novels from the provided candidate list. Never invent titles, authors, ratings, reviews, or links. Return JSON: { summary: string, recommendations: [{ novelId, reason, drawback, confidence }], followUpQuestion: string|null }. novelId must be from the list. " +
            spoilerConstraintForOpenAI(spoilerMode),
        },
        {
          role: "user",
          content: JSON.stringify({
            request: message,
            preferences: grounded.interpretedPreferences,
            candidates: catalog,
          }),
        },
      ],
    });
    if (!result.ok) return grounded;
    const content = result.content;
    const parsedJson = JSON.parse(content) as unknown;
    const parsed = explanationResponseSchema.safeParse(parsedJson);
    if (!parsed.success) return grounded;

    const parsedById = new Map(
      parsed.data.recommendations
        .filter((row) => allowedIds.has(row.novelId))
        .map((row) => [row.novelId, row])
    );

    if (parsedById.size === 0) return grounded;

    const polished = grounded.recommendations.map((base) => {
      const row = parsedById.get(base.novelId);
      if (!row) return base;
      return {
        ...base,
        reason: row.reason?.trim() || base.reason,
        drawback: row.drawback ?? base.drawback,
        confidence: normalizeConfidence(row.confidence ?? base.confidence),
      };
    });

    return {
      ...grounded,
      reply: parsed.data.summary?.trim() || grounded.reply,
      summary: parsed.data.summary?.trim() || grounded.summary,
      followUpQuestion:
        parsed.data.followUpQuestion ?? grounded.followUpQuestion,
      recommendations: polished,
    };
  } catch {
    return grounded;
  }
}
