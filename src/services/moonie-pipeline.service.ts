import { ReadingLinkModerationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
  acceptPolishedReason,
  acceptPolishedSummary,
  mergePolishedConfidence,
} from "@/lib/moonie/polish-safety";
import { createOpenAiChatCompletion, hasOpenAiApiKey } from "@/lib/moonie/openai";
import { explanationResponseSchema } from "@/lib/moonie/preference-schema";
import { buildFollowUpQuestion } from "@/lib/moonie/preferences";
import { stripLengthFromHardConstraints } from "@/lib/moonie/hard-constraints";
import {
  mentionsNovelLengthConstraint,
  prependNovelLengthTransparency,
} from "@/lib/moonie/output-format";
import { moonieDisplayCoverUrl } from "@/lib/review-utils";
import { matchPercent, confidenceFromMatchPercent } from "@/lib/moonie/ranking";
import { spoilerConstraintForOpenAI } from "@/lib/moonie/spoiler-mode";
import type { MooniePersonalizationSettings } from "@/lib/moonie/personalization";
import { matchedPreferenceLabels } from "@/lib/moonie/label-match";
import {
  buildHardConstraintFollowUp,
  buildHardConstraintExhaustionCopy,
  buildHardConstraintMatchCopy,
  filterNovelsByHardConstraints,
  formatHardConstraintLabel,
  hasHardInclusionConstraints,
  polishFollowUpRespectsHardConstraints,
  shouldKeepGroundedReplyAfterPolish,
  shouldRelaxRestrictiveRetrieval,
  type MoonieHardInclusionConstraints,
} from "@/lib/moonie/hard-constraints";
import {
  countConstraintEligibleNovels,
  countNovelsMatchingPreferences,
  countUnverifiedHardStatusMatches,
  retrieveHybridCandidates,
  selectDiverseCandidates,
  type HybridCandidate,
  type MoonieRecentSearchEntry,
} from "@/services/hybrid-retrieval.service";
import {
  resolveNovelDiscoverySort,
  sortHybridCandidates,
  type MoonieDiscoverySort,
} from "@/lib/moonie/discovery-sort";
import {
  constraintEligibleGenreLabels,
  constraintEligiblePublicationStatus,
} from "@/lib/moonie/metadata-eligibility";
import { emptyReasonFromHardConstraintCopy } from "@/lib/moonie/empty-reason";
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
  hardConstraints?: MoonieHardInclusionConstraints | null;
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
    hardConstraints: options.hardConstraints,
    limit: options.limit ?? 40,
    personalization: options.personalization,
    recentSearches: options.recentSearches,
  };

  const candidates = await retrieveHybridCandidates(base);

  const hasRestrictivePrefs =
    options.prefs.genres.length > 0 ||
    options.prefs.status ||
    options.prefs.language;

  if (
    candidates.length < 5 &&
    hasRestrictivePrefs &&
    shouldRelaxRestrictiveRetrieval(options.hardConstraints)
  ) {
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

async function resolveSourceStatuses(
  novelIds: string[]
): Promise<
  Map<
    string,
    {
      status: MoonieSourceStatus;
      availableOn: string[];
      primaryReadUrl?: string;
      platformName?: string;
    }
  >
> {
  const uniqueIds = [...new Set(novelIds.filter(Boolean))];
  const results = new Map<
    string,
    {
      status: MoonieSourceStatus;
      availableOn: string[];
      primaryReadUrl?: string;
      platformName?: string;
    }
  >();
  if (uniqueIds.length === 0) return results;

  const links = await db.readingLink.findMany({
    where: {
      novelId: { in: uniqueIds },
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

  const byNovel = new Map<string, typeof links>();
  for (const link of links) {
    const current = byNovel.get(link.novelId) ?? [];
    current.push(link);
    byNovel.set(link.novelId, current);
  }

  for (const novelId of uniqueIds) {
    const novelLinks = byNovel.get(novelId) ?? [];
    const verified = novelLinks.filter(
      (link) =>
        link.moderationStatus === ReadingLinkModerationStatus.APPROVED &&
        (link.isVerified || link.isOfficial)
    );
    if (verified.length > 0) {
      const primary = verified[0]!;
      results.set(novelId, {
        status: "verified",
        availableOn: verified.slice(0, 4).map((link) => link.label || link.platform),
        primaryReadUrl: primary.url,
        platformName: primary.label || primary.platform,
      });
      continue;
    }
    const pending = novelLinks.some(
      (link) =>
        link.moderationStatus === ReadingLinkModerationStatus.PENDING ||
        link.moderationStatus === ReadingLinkModerationStatus.NEEDS_REVIEW
    );
    results.set(novelId, {
      status: pending ? "pending" : "none",
      availableOn: [],
    });
  }

  return results;
}

function confidenceFor(candidate: NovelCandidate): MoonieConfidence {
  return confidenceFromMatchPercent(
    matchPercent(candidate.score),
    candidate.reviewCount
  );
}

/** Historical MORE_LIKE_THIS feedback may still rank; cite it only on a current more-like request. */
export function shouldCiteMoreLikeThisHistory(
  similarToNovelId?: string | null
): boolean {
  return Boolean(similarToNovelId?.trim());
}

export function buildRecommendationReason(
  candidate: NovelCandidate,
  prefs: MoonieInterpretedPreferences,
  queryText?: string,
  similarToNovelId?: string,
  options?: { allowPersonalization?: boolean }
): {
  reason: string;
  reasons: string[];
  drawback: string | null;
  matchingLabels: string[];
  personalizationReasons: string[];
} {
  const allowPersonalization = options?.allowPersonalization ?? false;
  const fitPct = matchPercent(candidate.score);
  const eligibleGenres = constraintEligibleGenreLabels(
    candidate.metadataSource,
    candidate.genres,
    candidate.tags
  );
  const eligibleStatus = constraintEligiblePublicationStatus(
    candidate.metadataSource,
    candidate.publicationStatus,
    candidate.genres,
    candidate.tags
  );
  const matchedGenres = matchedPreferenceLabels(eligibleGenres, prefs.genres);
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
  if (prefs.status === "completed" && eligibleStatus) {
    reasons.push("Matches your completed-novel preference");
  }

  const personalizationReasons: string[] = [];
  const history = candidate.historySignals;
  if (allowPersonalization && history?.onReadingList) {
    personalizationReasons.push("On your MoonVerse reading list");
  }
  if (
    allowPersonalization &&
    shouldCiteMoreLikeThisHistory(similarToNovelId) &&
    history?.moreLikeThis
  ) {
    personalizationReasons.push("Similar to a novel you asked for more like");
  }
  if (allowPersonalization && history?.savedNovel) {
    personalizationReasons.push("Matches a novel in your saved library");
  }
  if (
    allowPersonalization &&
    history?.tasteGenreAffinity &&
    !history?.savedNovel
  ) {
    personalizationReasons.push("Shares genres with your saved taste profile");
  }

  if (
    candidate.scoreBreakdown.quality >= 0.08 &&
    fitPct >= 35 &&
    candidate.reviewCount >= 2
  ) {
    reasons.push("Strong MoonVerse community ratings");
  }
  if (
    reasons.length === 0 &&
    queryText?.trim() &&
    candidate.title.toLowerCase().includes(queryText.trim().toLowerCase().slice(0, 12))
  ) {
    reasons.push("Title closely matches your search words");
  }
  if (reasons.length === 0 && candidate.reviewCount >= 3 && fitPct >= 35) {
    reasons.push("Well-reviewed pick from the MoonVerse catalogue");
  }
  if (reasons.length === 0) {
    reasons.push(
      fitPct >= 35
        ? "Closest verified catalogue match for this request"
        : "Limited catalogue overlap for this request"
    );
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
  } else if (fitPct < 35) {
    drawback =
      "Catalogue overlap is limited for this request — treat this as a tentative match.";
  }

  const excludedHit = matchedPreferenceLabels(candidate.tags, prefs.excludedTags)[0];
  if (excludedHit) {
    drawback = `Possible conflict: this title is still tagged with ${excludedHit}.`;
  }

  return {
    reason: reasons.slice(0, 3).join(". ") + ".",
    reasons: reasons.slice(0, 3),
    drawback,
    matchingLabels,
    personalizationReasons: personalizationReasons.slice(0, 4),
  };
}

export async function buildGroundedRecommendations(options: {
  /** Combined conversation and saved-taste signals used only for ranking. */
  prefs: MoonieInterpretedPreferences;
  /** Explicit criteria from the current user turn, used for display and evidence. */
  requestPrefs?: MoonieInterpretedPreferences;
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
  hardConstraints?: MoonieHardInclusionConstraints | null;
  seekingUnseen?: boolean;
  hasExplicitExclusions?: boolean;
  previouslyShownNovelIds?: string[];
  sortBy?: MoonieDiscoverySort;
}): Promise<MoonieRecommendResponse> {
  const requestPrefs = options.requestPrefs ?? options.prefs;
  const hardConstraints = options.hardConstraints
    ? stripLengthFromHardConstraints(options.hardConstraints)
    : options.hardConstraints;
  const pipelineOptions = { ...options, hardConstraints };
  const queryText = options.queryText ?? "";
  const finalizeResponse = (
    response: MoonieRecommendResponse
  ): MoonieRecommendResponse => ({
    ...response,
    reply: prependNovelLengthTransparency(
      response.reply,
      mentionsNovelLengthConstraint(queryText)
    ),
  });

  const candidates = await findCandidateNovels({
    ...pipelineOptions,
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
  const verified = filterNovelsByHardConstraints(
    deduped,
    hardConstraints
  );
  const sortBy =
    options.sortBy ?? resolveNovelDiscoverySort(options.queryText ?? "");
  const sortedVerified = sortHybridCandidates(verified, sortBy);
  const diverse = selectDiverseCandidates(sortedVerified, take);
  const top =
    sortBy === "hybrid"
      ? [...diverse].sort(
          (a, b) => b.score - a.score || b.reviewCount - a.reviewCount
        )
      : sortHybridCandidates(diverse, sortBy);
  const hasPreviouslyShownMatches =
    (options.previouslyShownNovelIds?.length ?? 0) > 0;
  const eligibility = hasHardInclusionConstraints(hardConstraints)
    ? await (async () => {
        const hidden = options.userId
          ? await getHiddenNovelIds(options.userId)
          : [];
        const shown = new Set(options.previouslyShownNovelIds ?? []);
        const explicitOnly = (options.excludeNovelIds ?? []).filter(
          (id) => !shown.has(id)
        );
        const [totalEligible, unseenEligible, unverifiedStatusMatches] =
          await Promise.all([
          countConstraintEligibleNovels({
            prefs: options.prefs,
            excludeNovelIds: [...new Set([...explicitOnly, ...hidden])],
            strictGenreFilter: options.strictGenreFilter,
            hardConstraints: hardConstraints!,
          }),
          countConstraintEligibleNovels({
            prefs: options.prefs,
            excludeNovelIds: [
              ...new Set([...(options.excludeNovelIds ?? []), ...hidden]),
            ],
            strictGenreFilter: options.strictGenreFilter,
            hardConstraints: hardConstraints!,
          }),
          hardConstraints?.status
            ? countUnverifiedHardStatusMatches({
                prefs: options.prefs,
                hardConstraints,
                excludeNovelIds: [...new Set([...explicitOnly, ...hidden])],
                strictGenreFilter: options.strictGenreFilter,
              })
            : Promise.resolve(0),
        ]);
        return { totalEligible, unseenEligible, unverifiedStatusMatches };
      })()
    : null;

  if (top.length === 0) {
    const noResults =
      eligibility && eligibility.unseenEligible > 0
        ? {
            reply:
              "I found eligible novels for those criteria, but couldn't verify a recommendation batch just now. Please try again shortly.",
            summary: "Could not verify this batch yet",
          }
        : hasHardInclusionConstraints(hardConstraints)
          ? buildHardConstraintExhaustionCopy({
          hard: hardConstraints!,
          seekingUnseen:
            Boolean(options.seekingUnseen) &&
            Boolean(eligibility?.totalEligible),
          hasExplicitExclusions: Boolean(options.hasExplicitExclusions),
          hasPreviouslyShownMatches,
          unverifiedStatusMatches: eligibility?.unverifiedStatusMatches,
        })
      : options.seekingUnseen && hasPreviouslyShownMatches
        ? {
            reply:
              "I found no additional unseen MoonVerse matches. Previously shown verified recommendations may still fit.",
            summary: "No additional unseen matches",
          }
        : options.hasExplicitExclusions
          ? {
              reply:
                "I found no remaining MoonVerse matches after respecting the titles you hid or rejected.",
              summary: "No remaining matches after your exclusions",
            }
          : {
          reply:
            "I could not find a close match in MoonVerse yet. Try removing one restriction or choosing a broader genre.",
          summary: "No matching novels",
            };
    const emptyReason =
      eligibility && eligibility.unseenEligible > 0
        ? ("retrieval_incomplete" as const)
        : hasHardInclusionConstraints(hardConstraints)
          ? emptyReasonFromHardConstraintCopy(noResults)
          : options.seekingUnseen && hasPreviouslyShownMatches
            ? ("unseen_exhausted" as const)
            : options.hasExplicitExclusions
              ? ("excluded_exhausted" as const)
              : ("no_matches" as const);
    return finalizeResponse({
      reply: noResults.reply,
      summary: noResults.summary,
      recommendations: [],
      interpretedPreferences: requestPrefs,
      followUpQuestion: hasPreviouslyShownMatches
        ? "Show all previous recommendations again"
        : null,
      state: "no_results",
      emptyReason,
    });
  }

  const recommendations: MoonieRecommendation[] = [];
  const spoilerMode = options.spoilerMode ?? "none";

  const sourceByNovel = await resolveSourceStatuses(
    top.map((candidate) => candidate.id)
  );
  const communityByNovel = [];
  for (const candidate of top) {
    communityByNovel.push({
      novelId: candidate.id,
      community:
        candidate.reviewCount > 0
          ? await buildCommunityInsight(candidate.id, spoilerMode)
          : null,
    });
  }
  const communityMap = new Map(
    communityByNovel.map((row) => [row.novelId, row.community])
  );

  for (const candidate of top) {
    const source = sourceByNovel.get(candidate.id) ?? {
      status: "none" as const,
      availableOn: [],
    };
    const { reason, reasons, drawback, matchingLabels, personalizationReasons } =
      buildRecommendationReason(
        candidate,
        requestPrefs,
        options.queryText,
        options.similarToNovelId,
        { allowPersonalization: Boolean(options.userId) }
      );
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
      publicationStatus: constraintEligiblePublicationStatus(
        candidate.metadataSource,
        candidate.publicationStatus,
        candidate.genres,
        candidate.tags
      ),
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
          interpretedPreferences: requestPrefs as object,
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

  const hard = hardConstraints;
  const followUp = hasHardInclusionConstraints(hard)
    ? buildHardConstraintFollowUp(hard!)
    : buildFollowUpQuestion(options.prefs);
  if (hasHardInclusionConstraints(hard)) {
    if (
      options.seekingUnseen &&
      hasPreviouslyShownMatches &&
      recommendations.length < take
    ) {
      const label = formatHardConstraintLabel(hard!);
      const hasMoreEligible =
        (eligibility?.unseenEligible ?? recommendations.length) >
        recommendations.length;
      return finalizeResponse({
        reply: hasMoreEligible
          ? `I verified ${recommendations.length} additional unseen MoonVerse novel${recommendations.length === 1 ? "" : "s"} matching ${label} in this batch. You asked for ${take}; more eligible catalogue records remain, but this retrieval did not verify them yet.`
          : `I found ${recommendations.length} additional unseen verified MoonVerse novel${recommendations.length === 1 ? "" : "s"} matching ${label}. That is fewer than the ${take} requested because no other unseen verified matches remain under those criteria.`,
        summary: `${recommendations.length} additional unseen matches for ${label}`,
        recommendations,
        interpretedPreferences: requestPrefs,
        followUpQuestion: hasMoreEligible
          ? "Try this request again"
          : "Show all previous recommendations again",
      });
    }
    const copy = buildHardConstraintMatchCopy({
      matchCount: recommendations.length,
      take,
      explicitCount: options.take ?? null,
      hard: hard!,
    });
    return finalizeResponse({
      reply: copy.reply,
      summary: copy.summary,
      recommendations,
      interpretedPreferences: requestPrefs,
      followUpQuestion: followUp,
    });
  }

  const hasTasteSignals =
    Boolean(options.userId) && (options.prefs.influencedBy?.length ?? 0) > 0;
  if (
    options.seekingUnseen &&
    hasPreviouslyShownMatches &&
    recommendations.length < take
  ) {
    return finalizeResponse({
      reply: `I found ${recommendations.length} additional unseen verified MoonVerse novel${recommendations.length === 1 ? "" : "s"}. That is fewer than the ${take} requested because no other unseen verified matches remain under the same criteria.`,
      summary: `${recommendations.length} additional unseen matches`,
      recommendations,
      interpretedPreferences: requestPrefs,
      followUpQuestion: "Show all previous recommendations again",
    });
  }
  const summaryParts = [
    `I matched ${recommendations.length} MoonVerse novel${recommendations.length === 1 ? "" : "s"}`,
  ];
  if (requestPrefs.genres.length) {
    summaryParts.push(`around ${requestPrefs.genres.slice(0, 2).join(" & ")}`);
  }
  if (requestPrefs.mood.length) {
    summaryParts.push(`with a ${requestPrefs.mood[0]} mood`);
  }
  if (hasTasteSignals && recommendations.length > 0) {
    summaryParts.push("using your saved taste where it helped");
  }

  const coldStartNote =
    !hasTasteSignals &&
    requestPrefs.genres.length === 0 &&
    requestPrefs.tags.length === 0
      ? " Tell me a genre, mood, or trope to sharpen the next round."
      : "";

  return finalizeResponse({
    reply: `${summaryParts.join(" ")}. These are real MoonVerse catalogue titles — I won't invent novels or reading links.${coldStartNote}`,
    summary: summaryParts.join(" "),
    recommendations,
    interpretedPreferences: requestPrefs,
    followUpQuestion: followUp,
  });
}

/** Optional AI polish: explain only over provided candidate IDs. */
export async function polishExplanationsWithOpenAI(
  message: string,
  grounded: MoonieRecommendResponse,
  spoilerMode: MoonieSpoilerMode = "none",
  hardConstraints?: MoonieHardInclusionConstraints | null
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
            "You are Moonie, MoonVerse's warm reading companion. Be concise, natural, and friendly — not robotic. Answer the user's question first. You ONLY explain novels from the provided candidate list. Never invent titles, authors, ratings, reviews, or links. Never claim the catalogue has no novels of a requested genre, status, or language based only on this candidate list. Do not claim personalization from saved novels, reading history, follows, or taste profile unless preferences.influencedBy lists that signal. Never call a recommendation a strong match when catalogue fit is below 35%. Use cautious wording for fit scores under 35%. Never mention retrieval layers, fixtures, hard constraints, or eligibility internals. Return JSON: { summary: string, recommendations: [{ novelId, reason, drawback, confidence }], followUpQuestion: string|null }. novelId must be from the list. " +
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

    const keepGroundedReply =
      shouldKeepGroundedReplyAfterPolish(hardConstraints);
    const influencedBy = grounded.interpretedPreferences?.influencedBy ?? [];
    const polished = grounded.recommendations.map((base) => {
      const row = parsedById.get(base.novelId);
      if (!row) return base;
      const pct = base.matchPercent ?? 0;
      const groundedReason = keepGroundedReply
        ? base.reason
        : acceptPolishedReason(
            row.reason ?? "",
            base.reason,
            pct,
            influencedBy
          );
      return {
        ...base,
        reason: groundedReason,
        drawback: row.drawback ?? base.drawback,
        confidence: mergePolishedConfidence(
          row.confidence,
          base.confidence,
          pct,
          base.reviewCount
        ),
      };
    });

    const polishSummary = parsed.data.summary?.trim() || "";
    const polishedFollowUp = parsed.data.followUpQuestion?.trim() || null;
    let followUpQuestion = parsed.data.followUpQuestion ?? grounded.followUpQuestion;
    if (keepGroundedReply) {
      const safeFollowUp = buildHardConstraintFollowUp(hardConstraints!);
      followUpQuestion =
        polishedFollowUp &&
        polishFollowUpRespectsHardConstraints(
          polishedFollowUp,
          hardConstraints!
        )
          ? polishedFollowUp
          : safeFollowUp;
    }

    const polishedResponse: MoonieRecommendResponse = {
      ...grounded,
      reply: keepGroundedReply
        ? grounded.reply
        : acceptPolishedSummary(polishSummary, grounded.reply),
      summary: keepGroundedReply
        ? grounded.summary
        : acceptPolishedSummary(
            polishSummary,
            grounded.summary ?? grounded.reply
          ),
      followUpQuestion,
      recommendations: polished,
    };

    return {
      ...polishedResponse,
      reply: prependNovelLengthTransparency(
        polishedResponse.reply,
        mentionsNovelLengthConstraint(message)
      ),
    };
  } catch {
    return grounded;
  }
}
