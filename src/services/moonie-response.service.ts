import {
  buildConversationalReply,
  buildColdStartReply,
} from "@/lib/moonie/chat-replies";
import { resolveAnalyticsIntent } from "@/lib/moonie/analytics-intent";
import { resolveResponseConfidenceTier } from "@/lib/moonie/analytics";
import {
  decodeBase64Text,
  FILE_UNSUPPORTED_TYPE_MESSAGE,
  isAllowedFileAttachment,
  parseNovelTitlesFromFileContent,
} from "@/lib/moonie/file-attachment";
import {
  buildConversationContext,
  collectAllConversationRecommendationsForReplay,
  collectConversationExcludedNovelIds,
  resolveSimilarNovelTargetId,
} from "@/lib/moonie/conversation-context";
import {
  classifyMoonieIntents,
  isBareReadingLinkRequest,
  isBareCommunityConsensusRequestWithoutNovel,
  isCommunityPeopleQuery,
  isExplicitUnresolvableNovelLookup,
  extractExplicitNovelLookupFragment,
  formatBareReviewRequestClarification,
  resolveBareReviewRequest,
  unresolvableNovelLookupReply,
  isCompareTheseMessage,
  isConstraintRelaxationRequest,
  isHardConstraintFollowUpMessage,
  isConversationalOnly,
  extractReviewNovelQuery,
  extractNovelQuery,
  isMoreLikeThisActionMessage,
  isMoonieGeneratedFollowUpQuestion,
  isHighestRatedSelectionRequest,
  isTopBestAmongShownRequest,
  isTopBestCatalogueSelectionRequest,
  isReviewFollowUpMessage,
  isNovelContextFollowUpMessage,
  messageReferencesActiveNovel,
  isConfirmCandidateMessage,
  isDirectTitleLookupMessage,
  isPartialMemoryQuery,
  isRecommendationReplayRequest,
  isRejectCandidateMessage,
  isShowAlternativesMessage,
  isVagueContinuationRequest,
  isRecommendationDiscoveryMessage,
  isBrowseClarifyFirstRequest,
  normalizeLookupConfirmationMessage,
  prefsLookEmpty,
  primaryRetrievalIntent,
  resolveLookupTitleQuery,
  resolveNovelFactualFieldQuestion,
  resolveEmbeddedNovelFactualQuestion,
  resolveOrdinalIndex,
  shouldSkipTasteExtraction,
  type MoonieIntent,
} from "@/lib/moonie/intent";
import {
  extractPreferencesWithOpenAI,
  mergeStructuredPreferences,
} from "@/lib/moonie/preference-schema";
import {
  EMPTY_INTERPRETED_PREFERENCES,
  extractPreferencesFromMessage,
  mergeConversationPreferences,
} from "@/lib/moonie/preferences";
import {
  DEFAULT_SPOILER_MODE,
  normalizeSpoilerMode,
  parseSpoilerModeFromMessage,
  isSpoilerModeOnlyMessage,
  isSpoilerModeNegationMessage,
  SPOILER_MODE_LABELS,
  shouldOfferSpoilerModeSwitch,
} from "@/lib/moonie/spoiler-mode";
import {
  answerCompareFollowUp,
  buildNovelComparison,
} from "@/services/moonie-compare.service";
import {
  extractNovelCandidatesFromImage,
  verifyVisionCandidates,
  validateImageAttachment,
  visionExtractionUserMessage,
} from "@/services/moonie-vision.service";
import {
  buildConstraintRelaxationClarification,
  buildCurrentTurnHardConstraints,
  completeHardInclusionConstraints,
  constraintRelaxationPending,
  hasHardInclusionConstraints,
  parseRequestedRecommendationCount,
  resolveConstraintRelaxationAnswer,
  stripLengthFromHardConstraints,
} from "@/lib/moonie/hard-constraints";
import {
  resolveCatalogueTask,
  resolveReviewRankingMetric,
} from "@/lib/moonie/catalogue-task";
import { resolveShelfRecommendationAnchors } from "@/lib/moonie/shelf-context";
import { db } from "@/lib/db";
import { resolveKnownGenreFromMessage } from "@/lib/moonie/preferences";
import { latestPendingClarification } from "@/lib/moonie/pending-clarification";
import { buildMostReviewedNovelResponse, buildHighestRatedNovelsResponse } from "@/services/moonie-catalogue-stats.service";
import {
  buildTopReviewsRankingClarification,
  buildTopReviewsResponse,
} from "@/services/moonie-top-reviews.service";
import {
  buildForYouShelfReviewClarification,
  buildSalonReviewPreferenceClarification,
  buildSalonReviewRecommendResponse,
  hasUsableSalonReviewPreference,
} from "@/services/moonie-salon-reviews.service";
import {
  buildGroundedRecommendations,
  polishExplanationsWithOpenAI,
} from "@/services/moonie-pipeline.service";
import {
  confirmLookupCandidate,
  identifyFromPartialMemory,
  identifyNovels,
  lookupCandidateByOrdinal,
  parseConfirmNovelId,
  parseRejectNovelId,
  rejectAndShowAlternatives,
  resolveExactLookupNovelIds,
  scoreCatalogueCandidates,
} from "@/services/moonie-identification.service";
import {
  isExplicitTitleLookup,
  resolveLookupExcludeNovelIds,
} from "@/lib/moonie/lookup-exclusions";
import {
  buildNovelBundle,
  formatNovelBundleReply,
  formatNovelFactualFieldReply,
  refreshRecommendationsForSpoilerMode,
} from "@/services/moonie-novel-lookup.service";
import { buildMoonieReviewerOverviewResponse, buildMoonieReviewerResponse } from "@/services/moonie-reviewer.service";
import { buildReviewerReviewFollowUpResponse } from "@/services/moonie-reviewer-review.service";
import {
  buildMoonieSeriesResponse,
  buildVerifiedSeriesDiscoveryResponse,
} from "@/services/moonie-series.service";
import {
  isSeriesFollowUpMessage,
  isSeriesQueryMessage,
  isVerifiedSeriesDiscoveryRequest,
} from "@/lib/moonie/series-intent";
import { resolveReviewerReviewFollowUpKind } from "@/lib/moonie/reviewer-review-intent";
import {
  buildAmbiguousPluralNovelReviewClarification,
  isAmbiguousPluralNovelReviewReference,
  isPluralNovelReviewReference,
  resolveLatestDisplayedNovelBatch,
} from "@/lib/moonie/review-reference";
import {
  resolveNovelDiscoverySort,
} from "@/lib/moonie/discovery-sort";
import {
  resolveNovelScopedReviewRequest,
} from "@/lib/moonie/novel-review-intent";
import {
  buildBatchNovelReviewsResponse,
  buildSingleNovelReviewsFromConfirmation,
} from "@/services/moonie-novel-reviews.service";
import {
  buildNovelReviewsListResponse,
  buildNovelReviewLinksResponse,
  buildNovelScopedReviewsResponse,
  resolveNovelForScopedReviewRequest,
} from "@/services/moonie-novel-scoped-reviews.service";
import {
  buildTypedConversationContext,
  isNovelLookupContextSuppressed,
  isNovelOrdinalFollowUpMessage,
  isReviewAuthorFollowUpMessage,
  resolveRecommendationOrdinalNovel,
  resolveNovelAuthorFromRecentRecommendations,
  resolveReviewAuthorFromTypedContext,
  reviewAuthorFollowUpClarification,
  reviewAuthorFollowUpSupersededByRecommendations,
} from "@/lib/moonie/follow-up-context";
import { isMoonieDeskChipPrompt } from "@/lib/moonie/desk";
import {
  parseSimilarityRequest,
  similarityPreferenceSource,
} from "@/lib/moonie/similarity-request";
import { isReviewerAuthoredReviewsMessage } from "@/lib/moonie/reviewer-intent";
import type {
  MooniePersonalizationSettings,
  MoonieSessionPreferences,
} from "@/lib/moonie/personalization";
import {
  mergeSessionWithLongTermPrefs,
  shouldOfferRememberPreference,
} from "@/lib/moonie/personalization";
import type { MoonieRecentSearchEntry } from "@/services/hybrid-retrieval.service";
import type {
  MoonieCompareResult,
  MoonieInterpretedPreferences,
  MoonieLookupSession,
  MooniePendingClarification,
  MoonieRecommendResponse,
  MoonieResponseKind,
  MoonieSpoilerMode,
} from "@/types/moonie";

interface StoredMessage {
  role: string;
  content: string;
  meta?: unknown;
}

export interface MoonieRequestContext {
  message: string;
  messages: StoredMessage[];
  userId?: string;
  isLoggedIn: boolean;
  contextNovelId?: string | null;
  contextNovelTitle?: string | null;
  similarToNovelId?: string;
  excludeNovelIds?: string[];
  previouslyShownNovelIds?: string[];
  hasExplicitExclusions?: boolean;
  seekingUnseen?: boolean;
  useTaste?: boolean;
  attachmentType?: "image" | "file" | null;
  imageData?: string | null;
  imageMimeType?: string | null;
  fileData?: string | null;
  fileName?: string | null;
  fileMimeType?: string | null;
  spoilerMode?: MoonieSpoilerMode;
  tastePrefs?: Partial<MoonieInterpretedPreferences>;
  hasTasteHistory?: boolean;
  personalization?: MooniePersonalizationSettings;
  sessionPreferences?: MoonieSessionPreferences | null;
  recentSearches?: MoonieRecentSearchEntry[];
  rememberPreferenceOffer?: Partial<MoonieInterpretedPreferences> | null;
  /** Structured lookup confirmation from candidate UI (preferred over title text). */
  confirmLookupNovelId?: string | null;
}

function pendingCompareClarification(
  comparison: MoonieCompareResult
): MooniePendingClarification | undefined {
  if (comparison.rows.length >= 2) return undefined;
  return {
    kind: "compare_titles",
    ...(comparison.unresolvedTitles?.length
      ? { unresolvedTitles: comparison.unresolvedTitles }
      : {}),
    ...(comparison.rows.length
      ? { resolvedNovelIds: comparison.rows.map((row) => row.novelId) }
      : {}),
  };
}

function conversationalReply(
  intents: MoonieIntent[],
  message: string,
  isLoggedIn: boolean,
  messages: Array<{ role: string; content: string }>
): string {
  return buildConversationalReply(intents, message, isLoggedIn, messages);
}

function latestRecommendationHardConstraints(
  messages: Array<{ role: string; content: string }>
) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (
      message?.role !== "user" ||
      isConstraintRelaxationRequest(message.content)
    ) {
      continue;
    }
    const hard = stripLengthFromHardConstraints(
      buildCurrentTurnHardConstraints(message.content)
    );
    if (hasHardInclusionConstraints(hard)) return hard;
  }
  return null;
}

function recommendationHardConstraints(
  message: string,
  extracted?: Parameters<typeof buildCurrentTurnHardConstraints>[1]
) {
  return stripLengthFromHardConstraints(
    buildCurrentTurnHardConstraints(message, extracted)
  );
}

function responseKindForIntent(
  intent: MoonieIntent | null,
  hasRecommendations: boolean
): MoonieResponseKind {
  if (!intent) return "chat";
  if (intent === "COMPARE") return "compare";
  if (
    intent === "FIND_NOVEL" ||
    intent === "FIND_READING_SOURCE" ||
    intent === "NOVEL_OVERVIEW" ||
    intent === "NOVEL_REVIEWS" ||
    intent === "IMAGE_LOOKUP" ||
    intent === "FILE_LOOKUP"
  ) {
    return "novel_bundle";
  }
  if (hasRecommendations) return "recommendations";
  return intent === "RECOMMEND" || intent === "REFINE" || intent === "MORE_LIKE_THIS"
    ? "recommendations"
    : "chat";
}

function identificationToResponse(
  result: Awaited<ReturnType<typeof identifyNovels>>,
  options?: {
    emphasizeReadingLink?: boolean;
    emphasizeReviews?: boolean;
    emphasizeStatus?: boolean;
    factualField?: import("@/lib/moonie/intent").NovelFactualField | null;
    interpretedPreferences?: MoonieInterpretedPreferences;
    spoilerMode?: MoonieSpoilerMode;
    lookupContextSuppressed?: boolean;
  }
): MoonieRecommendResponse {
  if (result.mode === "high_confidence" && result.recommendation && result.overview) {
    let reply = result.reply;
    if (options?.factualField) {
      reply = formatNovelFactualFieldReply(
        result.overview,
        options.factualField
      );
    } else if (
      options?.emphasizeReadingLink ||
      options?.emphasizeReviews ||
      options?.emphasizeStatus
    ) {
      reply = formatNovelBundleReply({
        overview: result.overview,
        emphasizeReadingLink: options.emphasizeReadingLink,
        emphasizeReviews: options.emphasizeReviews,
        emphasizeStatus: options.emphasizeStatus,
      });
    }
    return {
      reply,
      recommendations:
        options?.factualField ||
        (options?.emphasizeReviews && !options?.emphasizeReadingLink)
          ? []
          : [result.recommendation],
      novelOverview: result.overview,
      lookupSession: result.session,
      responseKind: options?.factualField ? "chat" : "novel_bundle",
      followUpQuestion: result.followUpQuestion,
      interpretedPreferences: options?.interpretedPreferences,
      spoilerMode: options?.spoilerMode,
      consumesQuota: true,
    };
  }

  if (
    result.mode === "clarification" ||
    result.mode === "partial_memory"
  ) {
    return {
      reply: result.reply,
      recommendations: [],
      lookupSession: result.session,
      responseKind: result.candidates.length > 0 ? "novel_bundle" : "chat",
      followUpQuestion: result.followUpQuestion,
      interpretedPreferences: options?.interpretedPreferences,
      spoilerMode: options?.spoilerMode,
      consumesQuota: true,
    };
  }

  return {
    reply: result.reply,
    recommendations: [],
    lookupSession: result.session,
    responseKind: "chat",
    followUpQuestion: result.followUpQuestion,
    interpretedPreferences: options?.interpretedPreferences,
    spoilerMode: options?.spoilerMode,
    consumesQuota: result.consumesQuota ?? false,
    lookupContextSuppressed: options?.lookupContextSuppressed ?? false,
  };
}

async function identificationToResponseWithReviews(
  result: Awaited<ReturnType<typeof identifyNovels>>,
  options?: {
    emphasizeReadingLink?: boolean;
    emphasizeReviews?: boolean;
    emphasizeStatus?: boolean;
    factualField?: import("@/lib/moonie/intent").NovelFactualField | null;
    interpretedPreferences?: MoonieInterpretedPreferences;
    spoilerMode?: MoonieSpoilerMode;
    lookupContextSuppressed?: boolean;
  }
): Promise<MoonieRecommendResponse> {
  if (
    options?.emphasizeReviews &&
    !options?.factualField &&
    result.mode === "high_confidence" &&
    result.overview
  ) {
    const list = await buildNovelReviewsListResponse({
      novelId: result.overview.novelId,
      title: result.overview.title,
      overview: result.overview,
      spoilerMode: options.spoilerMode ?? DEFAULT_SPOILER_MODE,
      lookupSession: {
        ...result.session,
        mode: "confirmed",
        confirmedNovelId: result.overview.novelId,
        pendingIntent: "NOVEL_REVIEWS",
      },
    });
    return {
      ...list,
      followUpQuestion: result.followUpQuestion,
      interpretedPreferences: options.interpretedPreferences,
    };
  }

  return identificationToResponse(result, options);
}

async function handleScopedNovelReviewRequest(
  ctx: MoonieRequestContext,
  conversationContext: ReturnType<typeof buildConversationContext>,
  spoilerMode: MoonieSpoilerMode
): Promise<MoonieRecommendResponse | null> {
  const scoped = resolveNovelScopedReviewRequest(ctx.message);
  if (!scoped) return null;

  let novelId: string | null = null;
  let title: string | null = null;
  let overview: import("@/types/moonie").MoonieNovelOverview | null = null;
  let lookupSession: import("@/types/moonie").MoonieLookupSession | undefined;

  if (scoped.usesActiveNovelContext && conversationContext.activeNovelId) {
    if (isNovelLookupContextSuppressed(ctx.messages)) {
      return {
        reply: formatBareReviewRequestClarification(scoped.count),
        recommendations: [],
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
      };
    }
    const bundle = await buildNovelBundle({
      novelId: conversationContext.activeNovelId,
      userId: ctx.userId,
      spoilerMode,
    });
    if (!bundle.overview) {
      return {
        reply: "I couldn't load review data for the active novel on MoonVerse.",
        recommendations: [],
        responseKind: "chat",
        consumesQuota: true,
        spoilerMode,
      };
    }
    novelId = bundle.overview.novelId;
    title = bundle.overview.title;
    overview = bundle.overview;
    lookupSession = conversationContext.lookupSession ?? undefined;
  } else if (scoped.novelQuery) {
    const resolved = await resolveNovelForScopedReviewRequest({
      novelQuery: scoped.novelQuery,
      userId: ctx.userId,
      spoilerMode,
    });
    if (resolved.kind === "clarification" || resolved.kind === "no_match") {
      return resolved.response;
    }
    novelId = resolved.novelId;
    title = resolved.title;
    overview = resolved.overview;
    lookupSession = resolved.lookupSession;
  } else {
    return {
      reply: formatBareReviewRequestClarification(scoped.count),
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode,
    };
  }

  const metric = scoped.metric ?? "review_recent";

  if (scoped.kind === "who_reviewed") {
    return buildNovelScopedReviewsResponse({
      novelId: novelId!,
      title: title!,
      overview,
      metric,
      count: scoped.count,
      spoilerMode,
      whoReviewed: true,
      lookupSession,
    });
  }

  if (scoped.kind === "review_link" || scoped.kind === "review_links") {
    return buildNovelReviewLinksResponse({
      novelId: novelId!,
      title: title!,
      overview,
      metric,
      count: scoped.count,
      spoilerMode,
      singular: scoped.kind === "review_link",
      lookupSession,
    });
  }

  if (scoped.kind === "spoiler_free_list" || scoped.spoilerFreeOnly) {
    return buildNovelScopedReviewsResponse({
      novelId: novelId!,
      title: title!,
      overview,
      metric,
      count: scoped.count,
      spoilerMode,
      spoilerFreeOnly: true,
      lookupSession,
    });
  }

  if (scoped.kind === "ranked") {
    return buildNovelScopedReviewsResponse({
      novelId: novelId!,
      title: title!,
      overview,
      metric,
      count: scoped.count,
      spoilerMode,
      lookupSession,
      explicitCountRequest: true,
    });
  }

  return buildNovelScopedReviewsResponse({
    novelId: novelId!,
    title: title!,
    overview,
    metric,
    count: scoped.count,
    spoilerMode,
    lookupSession,
    explicitCountRequest: scoped.explicitCountRequest ?? false,
  });
}

function resolveLookupSessionEmphasis(
  session: MoonieLookupSession,
  intents: MoonieIntent[]
): { emphasizeReadingLink: boolean; emphasizeReviews: boolean } {
  const pending = session.pendingIntent;
  return {
    emphasizeReadingLink:
      pending === "FIND_READING_SOURCE" ||
      intents.includes("FIND_READING_SOURCE"),
    emphasizeReviews:
      pending === "NOVEL_REVIEWS" || intents.includes("NOVEL_REVIEWS"),
  };
}

async function buildExplicitLookupIdentifyOptions(options: {
  ctx: MoonieRequestContext;
  conversationContext: ReturnType<typeof buildConversationContext>;
  intents: MoonieIntent[];
  titleQuery?: string;
  wantsReadingLink: boolean;
  wantsReviews: boolean;
  primary: MoonieIntent | null;
  spoilerMode: MoonieSpoilerMode;
}) {
  const {
    ctx,
    conversationContext,
    intents,
    titleQuery,
    wantsReadingLink,
    wantsReviews,
    primary,
    spoilerMode,
  } = options;
  const explicitTitleLookup =
    isExplicitTitleLookup(ctx.message, intents) && Boolean(titleQuery);
  const explicitNovelIds =
    explicitTitleLookup && titleQuery
      ? await resolveExactLookupNovelIds(titleQuery)
      : [];

  return {
    query: titleQuery || ctx.message,
    userId: ctx.userId,
    spoilerMode,
    excludeNovelIds: resolveLookupExcludeNovelIds({
      message: ctx.message,
      intents,
      recommendationExcludeIds: ctx.excludeNovelIds,
      lookupRejectedNovelIds: conversationContext.lookupSession?.rejectedNovelIds,
      explicitNovelIds,
    }),
    readingLinkIntent: wantsReadingLink,
    preferRawTitleQuery: Boolean(titleQuery),
    explicitTitleLookup,
    explicitNovelIds,
    pendingIntent: wantsReadingLink
      ? ("FIND_READING_SOURCE" as const)
      : wantsReviews
        ? ("NOVEL_REVIEWS" as const)
        : primary === "NOVEL_OVERVIEW"
          ? ("NOVEL_OVERVIEW" as const)
          : ("FIND_NOVEL" as const),
  };
}

async function handleLookupCorrection(
  ctx: MoonieRequestContext,
  session: MoonieLookupSession,
  spoilerMode: MoonieSpoilerMode,
  prefs: MoonieInterpretedPreferences,
  options?: { emphasizeReadingLink?: boolean; emphasizeReviews?: boolean }
): Promise<MoonieRecommendResponse | null> {
  const message = normalizeLookupConfirmationMessage(ctx.message);
  const wantsReviews =
    options?.emphasizeReviews || session.pendingIntent === "NOVEL_REVIEWS";

  const resolveConfirmedNovelId = (): string | null => {
    if (ctx.confirmLookupNovelId) {
      const direct = session.candidates.find(
        (candidate) => candidate.novelId === ctx.confirmLookupNovelId
      );
      if (direct) return direct.novelId;
    }
    return parseConfirmNovelId(message, session);
  };

  if (isRejectCandidateMessage(message)) {
    const rejectedId = parseRejectNovelId(message, session);
    if (!rejectedId) return null;
    const result = await rejectAndShowAlternatives({
      rejectedNovelId: rejectedId,
      session,
      userId: ctx.userId,
      spoilerMode,
    });
    return identificationToResponse(result, {
      ...options,
      interpretedPreferences: prefs,
      spoilerMode,
    });
  }

  if (isShowAlternativesMessage(message)) {
    const rejectedId = session.candidates[0]?.novelId;
    if (!rejectedId) return null;
    const result = await rejectAndShowAlternatives({
      rejectedNovelId: rejectedId,
      session,
      userId: ctx.userId,
      spoilerMode,
    });
    return identificationToResponse(result, {
      interpretedPreferences: prefs,
      spoilerMode,
    });
  }

  const ordinal = resolveOrdinalIndex(message);
  if (ordinal != null && session.candidates.length > 0) {
    const pick = lookupCandidateByOrdinal(session, ordinal);
    if (pick) {
      if (wantsReviews) {
        if (
          session.mode === "confirmed" &&
          session.confirmedNovelId === pick.novelId
        ) {
          return buildSingleNovelReviewsFromConfirmation({
            novelId: pick.novelId,
            userId: ctx.userId,
            spoilerMode,
            lookupSession: session,
            consumesQuota: false,
          });
        }
        return buildSingleNovelReviewsFromConfirmation({
          novelId: pick.novelId,
          userId: ctx.userId,
          spoilerMode,
          lookupSession: session,
        });
      }
      const result = await confirmLookupCandidate({
        novelId: pick.novelId,
        userId: ctx.userId,
        spoilerMode,
        session,
        emphasizeReadingLink: options?.emphasizeReadingLink,
        emphasizeReviews: options?.emphasizeReviews,
      });
      return identificationToResponseWithReviews(result, {
        emphasizeReadingLink: options?.emphasizeReadingLink,
        emphasizeReviews: options?.emphasizeReviews,
        interpretedPreferences: prefs,
        spoilerMode,
      });
    }
  }

  if (isConfirmCandidateMessage(message) || ctx.confirmLookupNovelId) {
    const novelId = resolveConfirmedNovelId();
    if (novelId) {
      if (wantsReviews) {
        if (
          session.mode === "confirmed" &&
          session.confirmedNovelId === novelId
        ) {
          return buildSingleNovelReviewsFromConfirmation({
            novelId,
            userId: ctx.userId,
            spoilerMode,
            lookupSession: session,
            consumesQuota: false,
          });
        }
        return buildSingleNovelReviewsFromConfirmation({
          novelId,
          userId: ctx.userId,
          spoilerMode,
          lookupSession: session,
        });
      }
      const result = await confirmLookupCandidate({
        novelId,
        userId: ctx.userId,
        spoilerMode,
        session,
        emphasizeReadingLink: options?.emphasizeReadingLink,
        emphasizeReviews: options?.emphasizeReviews,
      });
      return identificationToResponseWithReviews(result, {
        emphasizeReadingLink: options?.emphasizeReadingLink,
        emphasizeReviews: options?.emphasizeReviews,
        interpretedPreferences: prefs,
        spoilerMode,
      });
    }
  }

  return null;
}

export async function handleMoonieRequest(
  ctx: MoonieRequestContext
): Promise<MoonieRecommendResponse> {
  let spoilerMode = normalizeSpoilerMode(
    ctx.spoilerMode ?? DEFAULT_SPOILER_MODE
  );

  const conversationContext = buildConversationContext(ctx.messages, {
    contextNovelId: ctx.contextNovelId,
    contextNovelTitle: ctx.contextNovelTitle,
    currentMessage: ctx.message,
  });

  const priorRecommendationCards =
    collectAllConversationRecommendationsForReplay(ctx.messages);
  const conversationExcludedIds = collectConversationExcludedNovelIds(
    ctx.messages,
    priorRecommendationCards
  );
  if (conversationExcludedIds.length > 0) {
    ctx.excludeNovelIds = [
      ...new Set([...(ctx.excludeNovelIds ?? []), ...conversationExcludedIds]),
    ];
    ctx.hasExplicitExclusions = true;
  }

  const priorConversationPrefs = mergeConversationPreferences(
    ctx.messages.map((entry) => ({
      role: entry.role,
      content: entry.content,
    }))
  );

  if (isSpoilerModeNegationMessage(ctx.message)) {
    return {
      reply: `I'll keep spoiler shield at **${SPOILER_MODE_LABELS[spoilerMode]}** unless you choose a different mode from the eye icon.`,
      recommendations: [],
      interpretedPreferences: priorConversationPrefs,
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode,
      analyticsIntent: "CHAT",
    };
  }

  const spoilerModeCommand = parseSpoilerModeFromMessage(ctx.message);
  if (isSpoilerModeOnlyMessage(ctx.message) && spoilerModeCommand) {
    return {
      reply: `Spoiler shield set to **${SPOILER_MODE_LABELS[spoilerModeCommand]}** for your next Moonie replies. You can also tap the eye icon in the composer.`,
      recommendations: [],
      interpretedPreferences: priorConversationPrefs,
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode: spoilerModeCommand,
      analyticsIntent: "CHAT",
    };
  }
  if (spoilerModeCommand) {
    spoilerMode = spoilerModeCommand;
  }

  if (isRecommendationReplayRequest(ctx.message)) {
    const rawReplayRecommendations =
      collectAllConversationRecommendationsForReplay(ctx.messages);
    if (rawReplayRecommendations.length === 0) {
      return {
        reply:
          "There are no earlier recommendations in this conversation to show again.",
        recommendations: [],
        interpretedPreferences: priorConversationPrefs,
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
        analyticsIntent: "REFINE",
      };
    }
    const replayRecommendations = await refreshRecommendationsForSpoilerMode(
      rawReplayRecommendations,
      spoilerMode
    );
    return {
      reply: `Here are all ${replayRecommendations.length} verified recommendation${
        replayRecommendations.length === 1 ? "" : "s"
      } from this request again.`,
      recommendations: replayRecommendations,
      interpretedPreferences: priorConversationPrefs,
      responseKind: "recommendations",
      consumesQuota: false,
      spoilerMode,
      analyticsIntent: "REFINE",
      followUpQuestion: null,
    };
  }

  if (isReviewAuthorFollowUpMessage(ctx.message)) {
    const typedContext = buildTypedConversationContext(ctx.messages);

    if (reviewAuthorFollowUpSupersededByRecommendations(ctx.message, typedContext)) {
      const novelAuthor = resolveNovelAuthorFromRecentRecommendations({
        message: ctx.message,
        typed: typedContext,
      });
      if (novelAuthor.clarification) {
        return {
          reply: novelAuthor.clarification,
          recommendations: [],
          responseKind: "chat",
          consumesQuota: false,
          spoilerMode,
          analyticsIntent: "NOVEL_OVERVIEW",
        };
      }
      if (novelAuthor.title && novelAuthor.author) {
        return {
          reply: `**${novelAuthor.title}** was written by **${novelAuthor.author}**.`,
          recommendations: [],
          responseKind: "chat",
          consumesQuota: false,
          spoilerMode,
          analyticsIntent: "NOVEL_OVERVIEW",
        };
      }
      return {
        reply: reviewAuthorFollowUpClarification(),
        recommendations: [],
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
        analyticsIntent: "NOVEL_REVIEWS",
      };
    }

    const { review, ambiguous, missingContext } =
      resolveReviewAuthorFromTypedContext({
        message: ctx.message,
        typed: typedContext,
      });
    if (missingContext) {
      return {
        reply: reviewAuthorFollowUpClarification(),
        recommendations: [],
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
        analyticsIntent: "NOVEL_REVIEWS",
      };
    }
    if (ambiguous) {
      return {
        reply:
          "Which review do you mean? Say **first review**, **second review**, or name the reviewer.",
        recommendations: [],
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
        analyticsIntent: "NOVEL_REVIEWS",
      };
    }
    if (review) {
      const profileSuffix = review.reviewerUsername
        ? ` (@${review.reviewerUsername})`
        : "";
      return {
        reply: `**${review.title}** was written by **${review.reviewerName}**${profileSuffix}.`,
        recommendations: [],
        rankedReviews: [review],
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
        analyticsIntent: "NOVEL_REVIEWS",
      };
    }
  }

  if (isExplicitUnresolvableNovelLookup(ctx.message)) {
    return {
      reply: unresolvableNovelLookupReply(),
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode,
      lookupContextSuppressed: true,
      analyticsIntent: "FIND_NOVEL",
    };
  }

  if (isNovelOrdinalFollowUpMessage(ctx.message)) {
    const typedContext = buildTypedConversationContext(ctx.messages);
    const ordinalNovel = resolveRecommendationOrdinalNovel({
      message: ctx.message,
      typed: typedContext,
    });
    if (ordinalNovel) {
      const bundle = await buildNovelBundle({
        novelId: ordinalNovel.novelId,
        userId: ctx.userId,
        spoilerMode,
      });
      if (bundle.overview) {
        return {
          reply: formatNovelBundleReply({ overview: bundle.overview }),
          recommendations: bundle.recommendation ? [bundle.recommendation] : [],
          novelOverview: bundle.overview,
          responseKind: "novel_bundle",
          consumesQuota: true,
          spoilerMode,
          analyticsIntent: "NOVEL_OVERVIEW",
        };
      }
    }
  }

  const activeNovelFactualField = resolveNovelFactualFieldQuestion(ctx.message);
  if (
    activeNovelFactualField &&
    conversationContext.activeNovelId &&
    !resolveEmbeddedNovelFactualQuestion(ctx.message) &&
    !extractNovelQuery(ctx.message) &&
    !extractReviewNovelQuery(ctx.message)
  ) {
    const bundle = await buildNovelBundle({
      novelId: conversationContext.activeNovelId,
      userId: ctx.userId,
      spoilerMode,
    });
    if (bundle.overview) {
      return {
        reply: formatNovelFactualFieldReply(
          bundle.overview,
          activeNovelFactualField
        ),
        recommendations: [],
        novelOverview: bundle.overview,
        responseKind: "chat",
        consumesQuota: true,
        spoilerMode,
        analyticsIntent: "NOVEL_OVERVIEW",
      };
    }
  }

  const intents = classifyMoonieIntents(ctx.message, {
    hasPriorRecommendations: conversationContext.priorRecommendations.length > 0,
    hasActiveNovel: Boolean(conversationContext.activeNovelId),
    hasPriorReviewerResults: Boolean(
      conversationContext.reviewerSession?.reviewers.length
    ),
    hasPriorReviewerReviewSession: Boolean(
      conversationContext.reviewerReviewSession?.reviews.length
    ),
    hasActiveReviewer: Boolean(conversationContext.activeReviewerId),
    hasConversationPrefs: !prefsLookEmpty(priorConversationPrefs),
    attachmentType: ctx.attachmentType,
    pendingLookupIntent: conversationContext.lookupSession?.pendingIntent ?? null,
    pendingClarification: conversationContext.pendingClarification,
    recentMessages: ctx.messages.map((entry) => ({
      role: entry.role,
      content: entry.content,
    })),
  });

  const skipTasteExtraction = shouldSkipTasteExtraction(ctx.message, intents);

  let prefs = skipTasteExtraction
    ? { ...priorConversationPrefs }
    : mergeConversationPreferences([
        ...ctx.messages.map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
        { role: "user", content: ctx.message },
      ]);

  const extracted = skipTasteExtraction
    ? null
    : await extractPreferencesWithOpenAI(ctx.message);
  if (extracted) prefs = mergeStructuredPreferences(prefs, extracted);

  if (ctx.tastePrefs) {
    prefs = {
      ...prefs,
      genres: [...new Set([...prefs.genres, ...(ctx.tastePrefs.genres ?? [])])],
      tags: [...new Set([...prefs.tags, ...(ctx.tastePrefs.tags ?? [])])],
      mood: [...new Set([...prefs.mood, ...(ctx.tastePrefs.mood ?? [])])],
      excludedTags: [
        ...new Set([
          ...prefs.excludedTags,
          ...(ctx.tastePrefs.excludedTags ?? []),
        ]),
      ],
      status: prefs.status ?? ctx.tastePrefs.status ?? null,
      language: prefs.language ?? ctx.tastePrefs.language ?? null,
      length: null,
      influencedBy: ctx.tastePrefs.influencedBy,
    };
  }

  if (ctx.sessionPreferences) {
    prefs = mergeSessionWithLongTermPrefs({
      longTerm: prefs,
      session: ctx.sessionPreferences,
    });
  }

  const primary = primaryRetrievalIntent(intents);
  const messagePrefs = extractPreferencesFromMessage(ctx.message);
  const currentRequestPrefs = extracted
    ? mergeStructuredPreferences(messagePrefs, extracted)
    : messagePrefs;

  const attach = (
    response: MoonieRecommendResponse,
    intentOverride?: MoonieIntent | null
  ): MoonieRecommendResponse => ({
    ...response,
    spoilerMode: response.spoilerMode ?? spoilerMode,
    analyticsConfidenceTier:
      response.analyticsConfidenceTier ??
      resolveResponseConfidenceTier(response) ??
      null,
    analyticsIntent:
      response.analyticsIntent ??
      resolveAnalyticsIntent({
        intents,
        primary: intentOverride ?? primary,
        responseKind: response.responseKind,
      }),
    rememberPreferenceOffer:
      response.rememberPreferenceOffer ?? ctx.rememberPreferenceOffer ?? null,
  });

  const pendingClarification =
    conversationContext.pendingClarification ??
    latestPendingClarification(ctx.messages);

  if (pendingClarification?.kind === "review_preference") {
    const answeredPrefs = extractPreferencesFromMessage(ctx.message);
    if (
      hasUsableSalonReviewPreference(answeredPrefs) ||
      answeredPrefs.mood.length > 0
    ) {
      return attach(
        await buildSalonReviewRecommendResponse({
          prefs: {
            ...answeredPrefs,
            genres: [
              ...new Set([...answeredPrefs.genres, ...prefs.genres]),
            ],
            tags: [...new Set([...answeredPrefs.tags, ...prefs.tags])],
            mood: [...new Set([...answeredPrefs.mood, ...prefs.mood])],
          },
          spoilerMode,
          count: pendingClarification.count,
        }),
        "SALON_REVIEWS"
      );
    }
    if (
      !isDirectTitleLookupMessage(ctx.message) &&
      !resolveCatalogueTask(ctx.message)
    ) {
      return attach(
        buildSalonReviewPreferenceClarification({
          count: pendingClarification.count,
        }),
        "SALON_REVIEWS"
      );
    }
  }

  if (pendingClarification?.kind === "review_ranking") {
    const metric = resolveReviewRankingMetric(ctx.message);
    if (metric) {
      const amongIds = pendingClarification.amongThese
        ? conversationContext.priorRecommendations.map((rec) => rec.novelId)
        : undefined;
      return attach(
        await buildTopReviewsResponse({
          count: pendingClarification.count,
          metric,
          amongNovelIds: amongIds,
          amongThese: pendingClarification.amongThese,
          spoilerMode,
        }),
        "TOP_REVIEWS"
      );
    }
    if (
      !isDirectTitleLookupMessage(ctx.message) &&
      !resolveCatalogueTask(ctx.message)
    ) {
      return attach(
        buildTopReviewsRankingClarification({
          count: pendingClarification.count,
          amongThese: pendingClarification.amongThese,
        }),
        "TOP_REVIEWS"
      );
    }
  }

  if (
    pendingClarification?.kind === "constraint_relaxation" &&
    !(
      isDirectTitleLookupMessage(ctx.message) &&
      !resolveKnownGenreFromMessage(ctx.message)
    )
  ) {
    const resolution = resolveConstraintRelaxationAnswer(
      ctx.message,
      pendingClarification
    );
    if (resolution.kind === "clarify_genre_or_status") {
      return attach(
        {
          reply: resolution.reply,
          recommendations: [],
          quickPrompts: resolution.quickPrompts,
          pendingClarification: constraintRelaxationPending(
            resolution.hard,
            "genre_or_status",
            resolution.genre
          ),
          interpretedPreferences: currentRequestPrefs,
          responseKind: "chat",
          consumesQuota: false,
        },
        "REFINE"
      );
    }
    if (resolution.kind === "clarify_again") {
      return attach(
        {
          reply: resolution.reply,
          recommendations: [],
          quickPrompts: resolution.quickPrompts,
          pendingClarification: constraintRelaxationPending(
            completeHardInclusionConstraints(pendingClarification.hard),
            pendingClarification.phase,
            pendingClarification.offeredGenre
          ),
          interpretedPreferences: currentRequestPrefs,
          responseKind: "chat",
          consumesQuota: false,
        },
        "REFINE"
      );
    }

    let relaxed = await buildGroundedRecommendations({
      prefs,
      requestPrefs: currentRequestPrefs,
      userId: ctx.userId,
      queryText: ctx.message,
      excludeNovelIds: ctx.excludeNovelIds,
      previouslyShownNovelIds: ctx.previouslyShownNovelIds,
      hasExplicitExclusions: ctx.hasExplicitExclusions,
      seekingUnseen: ctx.seekingUnseen,
      similarToNovelId: ctx.similarToNovelId,
      strictGenreFilter: resolution.hard.genres.length > 0,
      hardConstraints: stripLengthFromHardConstraints(resolution.hard),
      personalization: ctx.personalization,
      recentSearches: ctx.recentSearches,
      spoilerMode,
    });
    relaxed = await polishExplanationsWithOpenAI(
      ctx.message,
      relaxed,
      spoilerMode,
      resolution.hard
    );
    return attach(
      {
        ...relaxed,
        responseKind:
          relaxed.recommendations.length > 0 ? "recommendations" : "chat",
        state:
          relaxed.recommendations.length === 0 ? "no_results" : relaxed.state,
        consumesQuota: true,
      },
      "REFINE"
    );
  }

  const scopedReviewResponse = await handleScopedNovelReviewRequest(
    ctx,
    conversationContext,
    spoilerMode
  );
  if (scopedReviewResponse) {
    return attach(scopedReviewResponse, "NOVEL_REVIEWS");
  }

  const catalogueTask = resolveCatalogueTask(ctx.message);
  if (isBrowseClarifyFirstRequest(ctx.message)) {
    const coldStart = buildColdStartReply();
    return attach({
      reply: coldStart.reply,
      quickPrompts: coldStart.quickPrompts,
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
    });
  }
  if (catalogueTask?.kind === "for_you_shelf_reviews") {
    const shelfPrefs = extractPreferencesFromMessage(ctx.message, {
      ...priorConversationPrefs,
      genres: [
        ...priorConversationPrefs.genres,
        ...(ctx.tastePrefs?.genres ?? []),
      ],
      tags: [...priorConversationPrefs.tags, ...(ctx.tastePrefs?.tags ?? [])],
      mood: [...priorConversationPrefs.mood, ...(ctx.tastePrefs?.mood ?? [])],
      excludedTags: [
        ...priorConversationPrefs.excludedTags,
        ...(ctx.tastePrefs?.excludedTags ?? []),
      ],
    });
    if (hasUsableSalonReviewPreference(shelfPrefs) || ctx.hasTasteHistory) {
      return attach(
        await buildSalonReviewRecommendResponse({
          prefs: shelfPrefs,
          spoilerMode,
          count: catalogueTask.count,
        }),
        "SALON_REVIEWS"
      );
    }
    return attach(
      buildForYouShelfReviewClarification({ count: catalogueTask.count }),
      "SALON_REVIEWS"
    );
  }
  if (catalogueTask?.kind === "salon_reviews") {
    const salonPrefs = extractPreferencesFromMessage(ctx.message, {
      ...priorConversationPrefs,
      genres: [
        ...priorConversationPrefs.genres,
        ...(ctx.tastePrefs?.genres ?? []),
      ],
      tags: [...priorConversationPrefs.tags, ...(ctx.tastePrefs?.tags ?? [])],
      mood: [...priorConversationPrefs.mood, ...(ctx.tastePrefs?.mood ?? [])],
      excludedTags: [
        ...priorConversationPrefs.excludedTags,
        ...(ctx.tastePrefs?.excludedTags ?? []),
      ],
    });
    if (hasUsableSalonReviewPreference(salonPrefs)) {
      return attach(
        await buildSalonReviewRecommendResponse({
          prefs: salonPrefs,
          spoilerMode,
          count: catalogueTask.count,
        }),
        "SALON_REVIEWS"
      );
    }
    return attach(
      buildSalonReviewPreferenceClarification({
        count: catalogueTask.count,
      }),
      "SALON_REVIEWS"
    );
  }
  if (catalogueTask?.kind === "top_reviews") {
    return attach(
      buildTopReviewsRankingClarification({
        count: catalogueTask.count,
        amongThese: catalogueTask.amongThese,
      }),
      "TOP_REVIEWS"
    );
  }
  if (catalogueTask?.kind === "most_reviewed_novel") {
    const amongIds = catalogueTask.amongThese
      ? conversationContext.priorRecommendations.map((rec) => rec.novelId)
      : undefined;
    return attach(
      await buildMostReviewedNovelResponse({
        amongNovelIds: amongIds,
        amongThese: catalogueTask.amongThese,
        spoilerMode,
      }),
      "CATALOGUE_STAT"
    );
  }
  if (catalogueTask?.kind === "highest_rated_novels") {
    const amongIds = catalogueTask.amongThese
      ? conversationContext.priorRecommendations.map((rec) => rec.novelId)
      : undefined;
    return attach(
      await buildHighestRatedNovelsResponse({
        amongNovelIds: amongIds,
        amongThese: catalogueTask.amongThese,
        count: catalogueTask.count,
        spoilerMode,
      }),
      "CATALOGUE_STAT"
    );
  }

  if (
    isTopBestAmongShownRequest(ctx.message) &&
    conversationContext.priorRecommendations.length > 0
  ) {
    const pool = conversationContext.priorRecommendations;
    const byRating = isHighestRatedSelectionRequest(ctx.message);
    const sorted = [...pool].sort((a, b) => {
      if (byRating) {
        return (b.averageRating ?? 0) - (a.averageRating ?? 0);
      }
      return (b.matchPercent ?? 0) - (a.matchPercent ?? 0);
    });
    const pick = sorted[0]!;
    const basis = byRating
      ? "highest MoonVerse community rating among the recommendations already shown in this thread"
      : "strongest preference match among the recommendations already shown in this thread";
    const [sanitizedPick] = await refreshRecommendationsForSpoilerMode(
      [pick],
      spoilerMode
    );
    return attach(
      {
        reply: `Among the cards already in this thread, **${sanitizedPick.title}** is the ${byRating ? "highest-rated" : "best preference match"} (${basis}).`,
        recommendations: [sanitizedPick],
        responseKind: "recommendations",
        consumesQuota: false,
        spoilerMode,
      },
      "RECOMMEND"
    );
  }

  if (isTopBestCatalogueSelectionRequest(ctx.message)) {
    const hardConstraints = recommendationHardConstraints(
      ctx.message,
      extracted
    );
    let catalogueBest = await buildGroundedRecommendations({
      prefs,
      requestPrefs: currentRequestPrefs,
      userId: ctx.userId,
      queryText: ctx.message,
      excludeNovelIds: ctx.excludeNovelIds,
      previouslyShownNovelIds: ctx.previouslyShownNovelIds,
      hasExplicitExclusions: ctx.hasExplicitExclusions,
      seekingUnseen: ctx.seekingUnseen,
      similarToNovelId: ctx.similarToNovelId,
      strictGenreFilter:
        messagePrefs.genres.length > 0 ||
        Boolean(extracted?.genres && extracted.genres.length > 0),
      take: 1,
      hardConstraints,
      sortBy: isHighestRatedSelectionRequest(ctx.message) ? "rating" : "hybrid",
      personalization: ctx.personalization,
      recentSearches: ctx.recentSearches,
      spoilerMode,
    });
    catalogueBest = await polishExplanationsWithOpenAI(
      ctx.message,
      catalogueBest,
      spoilerMode,
      hardConstraints
    );
    if (catalogueBest.recommendations.length > 0) {
      const byRating = isHighestRatedSelectionRequest(ctx.message);
      const [sanitizedPick] = await refreshRecommendationsForSpoilerMode(
        [catalogueBest.recommendations[0]!],
        spoilerMode
      );
      catalogueBest.recommendations = [sanitizedPick];
      catalogueBest.reply = byRating
        ? `From the current verified candidate shortlist, **${sanitizedPick.title}** has the strongest MoonVerse community rating I can verify for this request. This is not a claim about every catalogue title MoonVerse indexes.`
        : `From the current verified candidate shortlist, **${sanitizedPick.title}** is the strongest preference match I can verify for this request. This is not a claim about every catalogue title MoonVerse indexes.`;
    }
    return attach(
      {
        ...catalogueBest,
        responseKind:
          catalogueBest.recommendations.length > 0
            ? "recommendations"
            : "chat",
        state:
          catalogueBest.recommendations.length === 0
            ? "no_results"
            : catalogueBest.state,
        consumesQuota: true,
      },
      "RECOMMEND"
    );
  }

  if (isConstraintRelaxationRequest(ctx.message)) {
    const priorHard = latestRecommendationHardConstraints(ctx.messages);
    const clarification = priorHard
      ? buildConstraintRelaxationClarification(priorHard)
      : {
          reply:
            "Which constraint should I relax? Restate the criteria you want to keep so I do not discard the wrong preference.",
          quickPrompts: [],
        };
    return attach(
      {
        reply: clarification.reply,
        recommendations: [],
        interpretedPreferences: currentRequestPrefs,
        quickPrompts: clarification.quickPrompts,
        pendingClarification: priorHard
          ? constraintRelaxationPending(
              stripLengthFromHardConstraints(priorHard)
            )
          : undefined,
        responseKind: "chat",
        consumesQuota: false,
      },
      "REFINE"
    );
  }

  let parsedFileTitles: string[] | undefined;
  if (ctx.attachmentType === "file") {
    if (!ctx.fileData || !ctx.fileName) {
      return attach({
        reply: "Attach a .txt, .md, or .csv file with one novel title per line.",
        recommendations: [],
        responseKind: "error",
        state: "error",
        consumesQuota: false,
        spoilerMode,
      });
    }

    if (!isAllowedFileAttachment(ctx.fileName, ctx.fileMimeType ?? undefined)) {
      return attach({
        reply: FILE_UNSUPPORTED_TYPE_MESSAGE,
        recommendations: [],
        responseKind: "error",
        state: "error",
        consumesQuota: false,
        spoilerMode,
      });
    }

    const parsed = parseNovelTitlesFromFileContent(
      decodeBase64Text(ctx.fileData),
      ctx.fileName
    );
    if (!parsed.ok) {
      return attach({
        reply: parsed.reason,
        recommendations: [],
        responseKind: "error",
        state: "error",
        consumesQuota: false,
        spoilerMode,
      });
    }
    parsedFileTitles = parsed.titles;
  }

  const lookupSession = conversationContext.lookupSession;
  if (lookupSession && lookupSession.candidates.length > 0) {
    const sessionEmphasis = resolveLookupSessionEmphasis(lookupSession, intents);
    const correction = await handleLookupCorrection(
      ctx,
      lookupSession,
      spoilerMode,
      prefs,
      sessionEmphasis
    );
    if (correction) return attach(correction);
  }

  const reviewerReviewFollowUp = await buildReviewerReviewFollowUpResponse({
    message: ctx.message,
    session: conversationContext.reviewerReviewSession,
    userId: ctx.userId,
    spoilerMode,
  });
  if (reviewerReviewFollowUp) {
    const followUpKind = resolveReviewerReviewFollowUpKind(ctx.message);
    const intentOverride =
      followUpKind === "FIND_READING_SOURCE"
        ? "FIND_READING_SOURCE"
        : followUpKind === "NOVEL_REVIEWS"
          ? "NOVEL_REVIEWS"
          : followUpKind === "REVIEW_DETAIL"
            ? "REVIEWER_OVERVIEW"
            : "NOVEL_OVERVIEW";
    return attach(reviewerReviewFollowUp, intentOverride);
  }

  if (isVerifiedSeriesDiscoveryRequest(ctx.message)) {
    return attach(
      await buildVerifiedSeriesDiscoveryResponse({
        userId: ctx.userId,
        spoilerMode,
      }),
      "NOVEL_SERIES"
    );
  }

  const lacksStructuredContext =
    !conversationContext.activeNovelId &&
    !conversationContext.activeReviewerId &&
    !conversationContext.reviewerReviewSession;

  const bareReviewRequest = resolveBareReviewRequest(ctx.message);

  if (
    bareReviewRequest ||
    (intents.includes("NOVEL_REVIEWS") &&
      !extractReviewNovelQuery(ctx.message) &&
      !isReviewFollowUpMessage(ctx.message) &&
      !isPluralNovelReviewReference(ctx.message) &&
      !isAmbiguousPluralNovelReviewReference(ctx.message))
  ) {
    const reviewCount = bareReviewRequest?.count ?? 10;
    if (
      !conversationContext.activeNovelId ||
      isNovelLookupContextSuppressed(ctx.messages)
    ) {
      return attach({
        reply: formatBareReviewRequestClarification(reviewCount),
        recommendations: [],
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
      }, "NOVEL_REVIEWS");
    }
  }

  if (isAmbiguousPluralNovelReviewReference(ctx.message)) {
    const batch = resolveLatestDisplayedNovelBatch(ctx.messages);
    return attach({
      reply: buildAmbiguousPluralNovelReviewClarification(batch),
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode,
    }, "NOVEL_REVIEWS");
  }

  if (isPluralNovelReviewReference(ctx.message)) {
    const batch = resolveLatestDisplayedNovelBatch(ctx.messages);
    if (batch.length === 0) {
      return attach({
        reply:
          "Which novel(s) would you like reviews for? Name the titles or ask after I show recommendation cards.",
        recommendations: [],
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
      }, "NOVEL_REVIEWS");
    }
    return attach(
      await buildBatchNovelReviewsResponse({
        novelIds: batch.map((rec) => rec.novelId),
        userId: ctx.userId,
        spoilerMode,
      }),
      "NOVEL_REVIEWS"
    );
  }

  if (
    /^what\s+is\s+this\s+novel\s+about\s*[?.!]*$/i.test(ctx.message.trim()) &&
    !conversationContext.activeNovelId
  ) {
    return attach({
      reply:
        "Which novel should I summarize? Name the title, or ask after a recommendation card so I know which one you mean.",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode,
    }, "NOVEL_OVERVIEW");
  }

  if (
    isBareCommunityConsensusRequestWithoutNovel(ctx.message) &&
    lacksStructuredContext
  ) {
    return attach({
      reply:
        "Which novel would you like me to summarise reader opinions for?",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode,
    });
  }

  if (isVagueContinuationRequest(ctx.message) && lacksStructuredContext) {
    const reply = /^\s*and\??\s*$/i.test(ctx.message.trim())
      ? "What would you like me to continue with?"
      : "Sure — what would you like to know more about?";
    return attach({
      reply,
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode,
    });
  }

  if (isMoonieGeneratedFollowUpQuestion(ctx.message)) {
    const reply = /completed novels, or are ongoing/i.test(ctx.message)
      ? "Either works. Say **completed only** if you want finished stories, or **ongoing is fine** to include active series."
      : /narrow this to romance/i.test(ctx.message)
        ? "Tell me a lane — romance, fantasy, cultivation, or something cosy — and I will narrow the next picks."
        : /adventurous, romantic, dark/i.test(ctx.message)
          ? "Pick a mood — adventurous, romantic, dark, or character-driven — and I will tune the next slate."
          : /tropes to avoid/i.test(ctx.message)
            ? "Name any tropes to avoid — harem, tragedy, slow pacing, or anything else — and I will respect them."
            : "Say whether you want more like the top pick or a wider search, and I will adjust.";
    return attach({
      reply,
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode,
    });
  }

  const parsedSimilarity = parseSimilarityRequest(ctx.message);

  const similarNovelTargetId = resolveSimilarNovelTargetId(
    ctx.similarToNovelId,
    conversationContext.activeNovelId,
    {
      allowContextFallback:
        !isMoreLikeThisActionMessage(ctx.message) &&
        primary !== "MORE_LIKE_THIS" &&
        !parsedSimilarity,
    }
  );

  let resolvedSimilaritySeedId = similarNovelTargetId;
  if (!resolvedSimilaritySeedId && parsedSimilarity) {
    const exactIds = await resolveExactLookupNovelIds(parsedSimilarity.seedTitle);
    if (exactIds.length === 1) {
      resolvedSimilaritySeedId = exactIds[0]!;
    } else if (exactIds.length > 1) {
      const identification = await identifyNovels({
        query: parsedSimilarity.seedTitle,
        userId: ctx.userId,
        spoilerMode,
        excludeNovelIds: ctx.excludeNovelIds,
      });
      if (identification.mode === "high_confidence" && identification.recommendation) {
        resolvedSimilaritySeedId = identification.recommendation.novelId;
      } else {
        const response = identificationToResponse(identification, { spoilerMode });
        return attach(
          {
            ...response,
            reply: `Which novel should I base the similarity search on? I read **${parsedSimilarity.seedTitle}** — pick the seed title or type the full catalogue name.`,
          },
          "MORE_LIKE_THIS"
        );
      }
    } else {
      const identification = await identifyNovels({
        query: parsedSimilarity.seedTitle,
        userId: ctx.userId,
        spoilerMode,
        excludeNovelIds: ctx.excludeNovelIds,
      });
      if (identification.mode === "high_confidence" && identification.recommendation) {
        resolvedSimilaritySeedId = identification.recommendation.novelId;
      } else if (
        identification.mode === "clarification" ||
        identification.mode === "partial_memory"
      ) {
        return attach(
          {
            ...identificationToResponse(identification, { spoilerMode }),
            reply: `I couldn't verify **${parsedSimilarity.seedTitle}** as a MoonVerse seed title. Try the full title, an alternate spelling, or browse the catalogue.`,
          },
          "MORE_LIKE_THIS"
        );
      }
    }
  }

  if (
    primary === "MORE_LIKE_THIS" ||
    parsedSimilarity ||
    (isMoreLikeThisActionMessage(ctx.message) && intents.includes("MORE_LIKE_THIS"))
  ) {
    if (!resolvedSimilaritySeedId) {
      return attach(
        {
          reply:
            "Which novel should I base the similarity search on? Click **More like this** on a recommendation card, or name the title.",
          recommendations: [],
          responseKind: "chat",
          consumesQuota: false,
          spoilerMode,
        },
        "MORE_LIKE_THIS"
      );
    }

    const similarityConstraintMessage = parsedSimilarity
      ? [ctx.message, similarityPreferenceSource(parsedSimilarity)]
          .filter(Boolean)
          .join(" ")
      : ctx.message;
    const similarityHardConstraints = recommendationHardConstraints(
      similarityConstraintMessage,
      extracted
    );

    let result = await buildGroundedRecommendations({
      prefs,
      requestPrefs: currentRequestPrefs,
      userId: ctx.userId,
      queryText: similarityConstraintMessage,
      excludeNovelIds: [
        ...new Set([
          ...(ctx.excludeNovelIds ?? []),
          resolvedSimilaritySeedId,
        ]),
      ],
      previouslyShownNovelIds: ctx.previouslyShownNovelIds,
      hasExplicitExclusions: ctx.hasExplicitExclusions,
      seekingUnseen: ctx.seekingUnseen,
      similarToNovelId: resolvedSimilaritySeedId,
      strictGenreFilter: false,
      hardConstraints: similarityHardConstraints,
      personalization: ctx.personalization,
      recentSearches: ctx.recentSearches,
      spoilerMode,
      take: parsedSimilarity
        ? parseRequestedRecommendationCount(ctx.message) ?? undefined
        : undefined,
    });
    result = await polishExplanationsWithOpenAI(
      ctx.message,
      result,
      spoilerMode,
      similarityHardConstraints
    );
    return attach({
      ...result,
      responseKind: "recommendations",
      consumesQuota: true,
      rememberPreferenceOffer: shouldOfferRememberPreference(ctx.message, extracted)
        ? extracted
        : null,
    }, "MORE_LIKE_THIS");
  }

  if (
    intents.includes("NOVEL_SERIES") ||
    (conversationContext.activeNovelId && isSeriesFollowUpMessage(ctx.message)) ||
    isSeriesQueryMessage(ctx.message)
  ) {
    const seriesResponse = await buildMoonieSeriesResponse({
      message: ctx.message,
      activeNovelId: conversationContext.activeNovelId,
      userId: ctx.userId,
      spoilerMode,
    });
    if (seriesResponse) {
      return attach(seriesResponse, "NOVEL_SERIES");
    }
  }

  if (isConversationalOnly(intents)) {
    return attach({
      reply: conversationalReply(
        intents,
        ctx.message,
        ctx.isLoggedIn,
        ctx.messages.map((entry) => ({
          role: entry.role,
          content: entry.content,
        }))
      ),
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      pendingClarification:
        pendingClarification?.kind === "compare_titles"
          ? pendingClarification
          : undefined,
    });
  }

  if (primary === "REVIEWER_OVERVIEW" || intents.includes("REVIEWER_OVERVIEW")) {
    const reviewerResponse = await buildMoonieReviewerOverviewResponse({
      message: ctx.message,
      userId: ctx.userId,
      reviewerSession: conversationContext.reviewerSession,
      activeReviewerId: conversationContext.activeReviewerId,
      activeReviewerUsername: conversationContext.activeReviewerUsername,
      emphasizeAuthoredReviews: isReviewerAuthoredReviewsMessage(ctx.message),
    });
    return attach(reviewerResponse, "REVIEWER_OVERVIEW");
  }

  if (primary === "FIND_REVIEWERS" || intents.includes("FIND_REVIEWERS")) {
    const reviewerResponse = await buildMoonieReviewerResponse({
      message: ctx.message,
      userId: ctx.userId,
    });
    return attach(reviewerResponse, "FIND_REVIEWERS");
  }

  if (primary === "IMAGE_LOOKUP" || (ctx.attachmentType === "image" && ctx.imageData)) {
    if (!ctx.imageData) {
      return attach({
        reply:
          "Attach a cover or title screenshot, then tell me what you want — for example: Find this novel and tell me where I can read it.",
        recommendations: [],
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
      });
    }

    const validation = validateImageAttachment({
      base64: ctx.imageData,
      mimeType: ctx.imageMimeType ?? undefined,
    });
    if (!validation.ok) {
      return attach({
        reply: visionExtractionUserMessage("unsupported_image", {
          validationReason: validation.reason,
        }),
        recommendations: [],
        responseKind: "error",
        state: "error",
        consumesQuota: false,
        spoilerMode,
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return attach({
        reply: visionExtractionUserMessage("no_api"),
        recommendations: [],
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
      });
    }

    const extraction = await extractNovelCandidatesFromImage({
      base64: ctx.imageData,
      mimeType: validation.mimeType,
      userMessage: ctx.message,
    });

    if (
      extraction.error &&
      extraction.error !== "empty" &&
      extraction.candidates.length === 0
    ) {
      return attach({
        reply: visionExtractionUserMessage(extraction.error),
        recommendations: [],
        responseKind:
          extraction.error === "insufficient_quota" ||
          extraction.error === "unavailable"
            ? "error"
            : "novel_bundle",
        state: "no_results",
        consumesQuota:
          extraction.error !== "insufficient_quota" &&
          extraction.error !== "unavailable" &&
          extraction.error !== "no_api",
        spoilerMode,
      });
    }

    if (extraction.error === "empty" || extraction.candidates.length === 0) {
      return attach({
        reply: visionExtractionUserMessage("empty"),
        recommendations: [],
        responseKind: "novel_bundle",
        state: "no_results",
        consumesQuota: true,
        spoilerMode,
      });
    }

    const verifiedMatches = await verifyVisionCandidates({
      candidates: extraction.candidates,
      userId: ctx.userId,
      spoilerMode,
    });

    const confirmed = verifiedMatches.filter(
      (match) => match.verified && match.recommendation
    );

    if (confirmed.length === 0) {
      const readTitles = extraction.candidates
        .map((item) => item.title)
        .slice(0, 5)
        .join(", ");
      return attach({
        reply: readTitles
          ? `I read possible titles from your image (${readTitles}) but could not verify them in the MoonVerse catalogue. Please type the exact title or try a clearer screenshot.`
          : visionExtractionUserMessage("empty"),
        recommendations: [],
        responseKind: "novel_bundle",
        state: "no_results",
        followUpQuestion: extraction.candidates[0]
          ? `Try: Find ${extraction.candidates[0].title}`
          : null,
        consumesQuota: true,
        spoilerMode,
      });
    }

    const wantsReadingLink = intents.includes("FIND_READING_SOURCE");
    const wantsReviews = intents.includes("NOVEL_REVIEWS");

    if (confirmed.length === 1) {
      const match = confirmed[0];
      const overview = match.overview!;
      const reply = formatNovelBundleReply({
        overview,
        emphasizeReadingLink: wantsReadingLink,
        emphasizeReviews: wantsReviews,
      });
      return attach({
        reply: `Verified from your screenshot.\n\n${reply}`,
        recommendations: [match.recommendation!],
        novelOverview: overview,
        responseKind: "novel_bundle",
        consumesQuota: true,
        spoilerMode,
      });
    }

    const scoredCandidates = await scoreCatalogueCandidates({
      query: confirmed.map((m) => m.extractedTitle).join(" "),
      userId: ctx.userId,
      spoilerMode,
      limit: 6,
    });

    const identification = await identifyNovels({
      query: confirmed[0]?.extractedTitle ?? ctx.message,
      userId: ctx.userId,
      visionConfidence: confirmed[0]?.extractionConfidence,
      spoilerMode,
    });

    if (
      identification.mode === "clarification" ||
      identification.mode === "partial_memory"
    ) {
      return attach({
        ...identificationToResponse(identification, { spoilerMode }),
        reply: `I found ${confirmed.length} possible matches from your screenshot. Which one do you mean?`,
        lookupSession: {
          ...identification.session,
          candidates:
            identification.session.candidates.length > 0
              ? identification.session.candidates
              : scoredCandidates.slice(0, 5),
        },
      });
    }

    const recommendations = confirmed
      .map((match) => match.recommendation!)
      .slice(0, 6);

    return attach({
      reply: `I found ${confirmed.length} verified MoonVerse matches in your screenshot. Pick one (first, second, third…) for reading links and community reviews.`,
      recommendations,
      responseKind: "novel_bundle",
      followUpQuestion: "Which title should I open in full detail?",
      lookupSession: identification.session,
      consumesQuota: true,
      spoilerMode,
    });
  }

  if (primary === "FILE_LOOKUP" || (parsedFileTitles && parsedFileTitles.length > 0)) {
    const titles = parsedFileTitles ?? [];

    if (
      titles.length >= 2 &&
      (intents.includes("COMPARE") || isCompareTheseMessage(ctx.message))
    ) {
      const comparison = await buildNovelComparison({
        message: ctx.message,
        userId: ctx.userId,
        spoilerMode,
        titleHints: titles,
        priorUserMessage: conversationContext.lastUserMessage,
        activeNovelTitle: conversationContext.activeNovelTitle,
        priorResolvedNovelIds:
          pendingClarification?.kind === "compare_titles"
            ? pendingClarification.resolvedNovelIds
            : undefined,
      });

      return attach({
        reply: comparison.reply,
        recommendations: comparison.recommendations,
        compare: comparison,
        responseKind: "compare",
        consumesQuota: comparison.rows.length >= 2,
        spoilerMode,
        pendingClarification: pendingCompareClarification(comparison),
      });
    }

    if (titles.length === 1) {
      const identification = await identifyNovels({
        query: titles[0]!,
        userId: ctx.userId,
        spoilerMode,
        excludeNovelIds: ctx.excludeNovelIds,
      });
      return attach(
        identificationToResponse(identification, {
          interpretedPreferences: prefs,
          spoilerMode,
        })
      );
    }

    if (titles.length >= 2) {
      return attach({
        reply: `I read ${titles.length} titles from your file: ${titles.slice(0, 4).join(", ")}${titles.length > 4 ? "…" : ""}. Say **compare these** and I will verify each one in the MoonVerse catalogue.`,
        recommendations: [],
        responseKind: "chat",
        followUpQuestion: "Compare these.",
        consumesQuota: false,
        spoilerMode,
      });
    }
  }

  if (primary === "COMPARE") {
    const comparison = await buildNovelComparison({
      message: ctx.message,
      userId: ctx.userId,
      spoilerMode,
      titleHints: parsedFileTitles,
      priorUserMessage: conversationContext.lastUserMessage,
      activeNovelTitle: conversationContext.activeNovelTitle,
      priorRecommendations: conversationContext.priorRecommendations,
      priorResolvedNovelIds:
        pendingClarification?.kind === "compare_titles"
          ? pendingClarification.resolvedNovelIds
          : undefined,
    });

    return attach({
      reply: comparison.reply,
      recommendations: comparison.recommendations,
      compare: comparison,
      responseKind: "compare",
      consumesQuota: comparison.rows.length >= 2,
      spoilerMode,
      pendingClarification: pendingCompareClarification(comparison),
    });
  }

  if (conversationContext.priorCompareRows.length >= 2) {
    const followUp = await answerCompareFollowUp({
      message: ctx.message,
      compareRows: conversationContext.priorCompareRows,
      spoilerMode,
    });
    if (followUp) {
      return {
        reply: followUp,
        recommendations: conversationContext.priorRecommendations,
        compare: {
          rows: conversationContext.priorCompareRows,
          recommendations: conversationContext.priorRecommendations,
          reply: followUp,
        },
        responseKind: "compare",
        consumesQuota: true,
        spoilerMode,
      };
    }
  }

  const wantsReadingLink = intents.includes("FIND_READING_SOURCE");
  const wantsReviews = intents.includes("NOVEL_REVIEWS");
  const reviewFollowUp =
    wantsReviews && isReviewFollowUpMessage(ctx.message);
  const novelContextFollowUp =
    Boolean(conversationContext.activeNovelId) &&
    isNovelContextFollowUpMessage(ctx.message);
  const usesActiveNovelContext =
    reviewFollowUp ||
    novelContextFollowUp ||
    messageReferencesActiveNovel(ctx.message);
  const wantsNovelLookup =
    !isMoreLikeThisActionMessage(ctx.message) &&
    !isTopBestCatalogueSelectionRequest(ctx.message) &&
    !isCommunityPeopleQuery(ctx.message) &&
    !isHardConstraintFollowUpMessage(ctx.message) &&
    primary !== "RECOMMEND" &&
    primary !== "REFINE" &&
    (primary === "FIND_NOVEL" ||
      primary === "FIND_READING_SOURCE" ||
      primary === "NOVEL_OVERVIEW" ||
      (primary === "NOVEL_REVIEWS" &&
        (extractReviewNovelQuery(ctx.message) ||
          isReviewFollowUpMessage(ctx.message))) ||
      (conversationContext.activeNovelId &&
        (usesActiveNovelContext ||
          /\b(it|this|that|completed|romance|worth|slow.?burn|angst)\b/i.test(
            ctx.message
          ))));

  if (wantsNovelLookup) {
    const embeddedFactual = resolveEmbeddedNovelFactualQuestion(ctx.message);
    const novelContextOnly =
      isNovelContextFollowUpMessage(ctx.message) &&
      !extractReviewNovelQuery(ctx.message) &&
      !extractNovelQuery(ctx.message);
    const extractedTitle = novelContextOnly
      ? null
      : resolveLookupTitleQuery(ctx.message, intents);
    const explicitFragment = extractExplicitNovelLookupFragment(ctx.message);
    const lookupSuppressed = isNovelLookupContextSuppressed(ctx.messages);
    const blockActiveNovelFallback =
      lookupSuppressed || (explicitFragment != null && !extractedTitle);
    const titleQuery =
      embeddedFactual?.title ??
      extractedTitle ??
      (conversationContext.activeNovelId &&
      usesActiveNovelContext &&
      !blockActiveNovelFallback
        ? conversationContext.activeNovelTitle ?? undefined
        : undefined);

    const lookupPrefs = skipTasteExtraction
      ? EMPTY_INTERPRETED_PREFERENCES
      : prefs;

    if (explicitFragment && !titleQuery && !embeddedFactual) {
      return attach({
        reply: unresolvableNovelLookupReply(),
        recommendations: [],
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
        lookupContextSuppressed: true,
      }, "FIND_NOVEL");
    }

    if (isPartialMemoryQuery(ctx.message) && !titleQuery) {
      const partial = await identifyFromPartialMemory({
        query: ctx.message,
        userId: ctx.userId,
        spoilerMode,
        excludeNovelIds: ctx.excludeNovelIds,
        prefs,
      });
      return attach(
        identificationToResponse(partial, {
          interpretedPreferences: lookupPrefs,
          spoilerMode,
        })
      );
    }

    const hasAnchoredNovel =
      Boolean(conversationContext.activeNovelId) &&
      (conversationContext.lookupSession?.mode === "confirmed" ||
        Boolean(conversationContext.lookupSession?.confirmedNovelId) ||
        conversationContext.priorRecommendations.some(
          (rec) => rec.novelId === conversationContext.activeNovelId
        ));
    const unambiguousReadingTarget =
      Boolean(ctx.contextNovelId) ||
      conversationContext.lookupSession?.mode === "confirmed" ||
      Boolean(conversationContext.lookupSession?.confirmedNovelId) ||
      (conversationContext.priorRecommendations.length === 1 &&
        conversationContext.priorCompareRows.length < 2);

    if (
      wantsReadingLink &&
      isBareReadingLinkRequest(ctx.message) &&
      !extractedTitle &&
      !unambiguousReadingTarget
    ) {
      return attach({
        reply:
          "Which novel do you want a reading link for? Tell me the title and I'll verify it in the MoonVerse catalogue.",
        recommendations: [],
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
      });
    }

    if (
      conversationContext.activeNovelId &&
      usesActiveNovelContext &&
      hasAnchoredNovel &&
      !extractedTitle &&
      !blockActiveNovelFallback
    ) {
      const bundle = await buildNovelBundle({
        novelId: conversationContext.activeNovelId,
        userId: ctx.userId,
        spoilerMode,
      });
      if (bundle.overview) {
        const factualField = resolveNovelFactualFieldQuestion(ctx.message);
        if (wantsReviews && !wantsReadingLink && !factualField) {
          return attach(
            await buildNovelReviewsListResponse({
              novelId: bundle.overview.novelId,
              title: bundle.overview.title,
              overview: bundle.overview,
              spoilerMode,
              lookupSession: conversationContext.lookupSession ?? undefined,
            }),
            "NOVEL_REVIEWS"
          );
        }
        const reply = factualField
          ? formatNovelFactualFieldReply(bundle.overview, factualField)
          : formatNovelBundleReply({
              overview: bundle.overview,
              emphasizeReadingLink: wantsReadingLink,
              emphasizeReviews: wantsReviews,
              emphasizeStatus: /\bcompleted\b/i.test(ctx.message),
            });
        return attach({
          reply,
          recommendations:
            wantsReviews && !wantsReadingLink
              ? []
              : bundle.recommendation
                ? [bundle.recommendation]
                : [],
          novelOverview: bundle.overview,
          responseKind: "novel_bundle",
          consumesQuota: true,
          spoilerMode,
        });
      }
    }

    if (
      wantsReadingLink &&
      isBareReadingLinkRequest(ctx.message) &&
      !titleQuery &&
      !(conversationContext.activeNovelId && usesActiveNovelContext)
    ) {
      return attach({
        reply:
          "Which novel do you want a reading link for? Tell me the title and I'll verify it in the MoonVerse catalogue.",
        recommendations: [],
        responseKind: "chat",
        consumesQuota: false,
        spoilerMode,
      });
    }

    const identification = await identifyNovels(
      await buildExplicitLookupIdentifyOptions({
        ctx,
        conversationContext,
        intents,
        titleQuery,
        wantsReadingLink,
        wantsReviews,
        primary,
        spoilerMode,
      })
    );

    const factualField =
      embeddedFactual?.field ??
      resolveNovelFactualFieldQuestion(ctx.message);
    const response = await identificationToResponseWithReviews(identification, {
      emphasizeReadingLink: wantsReadingLink,
      emphasizeReviews: wantsReviews,
      emphasizeStatus: /^is\s+(?!it\b|this\b|that\b).+\s+(?:completed|complete|ongoing|finished|on\s+hiatus)\b/i.test(
        ctx.message.trim()
      ),
      factualField,
      interpretedPreferences: lookupPrefs,
      spoilerMode,
      lookupContextSuppressed:
        identification.mode === "no_match" &&
        Boolean(extractedTitle || explicitFragment),
    });

    if (
      shouldOfferSpoilerModeSwitch(ctx.message) &&
      spoilerMode === "none" &&
      response.novelOverview
    ) {
      response.reply +=
        " I am in spoiler-safe mode. Switch to Light or Full discussion if you want plot details.";
    }

    return attach(response);
  }

  if (primary === "RECOMMEND" || primary === "REFINE") {
    const hardConstraints = recommendationHardConstraints(
      ctx.message,
      extracted
    );
    const topBestCatalogue = isTopBestCatalogueSelectionRequest(ctx.message);
    const requestedTake = topBestCatalogue
      ? 1
      : parseRequestedRecommendationCount(ctx.message);
    const cold =
      prefsLookEmpty(prefs) &&
      !ctx.hasTasteHistory &&
      !extracted?.genres?.length &&
      !extracted?.tags?.length;
    const skipColdStart =
      isMoonieDeskChipPrompt(ctx.message) ||
      isRecommendationDiscoveryMessage(ctx.message);

    if (cold && primary === "RECOMMEND" && !skipColdStart) {
      const coldStart = buildColdStartReply();
      return attach({
        reply: coldStart.reply,
        quickPrompts: coldStart.quickPrompts,
        recommendations: [],
        responseKind: "chat",
        consumesQuota: false,
      });
    }

    let similarToNovelId = ctx.similarToNovelId;
    let excludeNovelIds = [...(ctx.excludeNovelIds ?? [])];
    let mergedRequestPrefs = currentRequestPrefs;

    const shelfAnchors = await resolveShelfRecommendationAnchors(
      ctx.message,
      resolveExactLookupNovelIds
    );
    if (shelfAnchors) {
      if (shelfAnchors.novelIds.length === 0) {
        return attach({
          reply: `I could not verify the nearby shelf titles in the MoonVerse catalogue (${shelfAnchors.unresolvedTitles.join("; ")}). Name one anchor title or browse the shelf filters.`,
          recommendations: [],
          responseKind: "chat",
          consumesQuota: false,
          spoilerMode,
        });
      }
      similarToNovelId = similarToNovelId ?? shelfAnchors.novelIds[0];
      excludeNovelIds = [...new Set([...excludeNovelIds, ...shelfAnchors.novelIds])];
      const anchorNovels = await db.novel.findMany({
        where: { id: { in: shelfAnchors.novelIds } },
        include: { genres: true, tags: true },
      });
      const shelfGenres = anchorNovels.flatMap((novel) =>
        novel.genres.map((genre) => genre.name)
      );
      const shelfTags = anchorNovels.flatMap((novel) =>
        novel.tags.map((tag) => tag.name)
      );
      mergedRequestPrefs = {
        ...mergedRequestPrefs,
        genres: [...new Set([...mergedRequestPrefs.genres, ...shelfGenres])],
        tags: [...new Set([...mergedRequestPrefs.tags, ...shelfTags])],
      };
    }

    let result = await buildGroundedRecommendations({
      prefs,
      requestPrefs: mergedRequestPrefs,
      userId: ctx.userId,
      queryText: ctx.message,
      excludeNovelIds,
      previouslyShownNovelIds: ctx.previouslyShownNovelIds,
      hasExplicitExclusions: ctx.hasExplicitExclusions,
      seekingUnseen: ctx.seekingUnseen,
      similarToNovelId,
      strictGenreFilter:
        messagePrefs.genres.length > 0 ||
        Boolean(extracted?.genres && extracted.genres.length > 0),
      take: requestedTake ?? undefined,
      hardConstraints,
      sortBy: resolveNovelDiscoverySort(ctx.message),
      personalization: ctx.personalization,
      recentSearches: ctx.recentSearches,
      spoilerMode,
    });
    result = await polishExplanationsWithOpenAI(
      ctx.message,
      result,
      spoilerMode,
      hardConstraints
    );

    if (topBestCatalogue && result.recommendations.length > 0) {
      const pick = result.recommendations[0]!;
      const byRating = isHighestRatedSelectionRequest(ctx.message);
      result.recommendations = [pick];
      result.reply = byRating
        ? `From the current verified candidate shortlist, **${pick.title}** has the strongest MoonVerse community rating I can verify for this request. This is not a claim about every catalogue title MoonVerse indexes.`
        : `From the current verified candidate shortlist, **${pick.title}** is the strongest preference match I can verify for this request. This is not a claim about every catalogue title MoonVerse indexes.`;
    }

    return attach({
      ...result,
      responseKind: responseKindForIntent(
        primary,
        result.recommendations.length > 0
      ),
      state:
        result.recommendations.length === 0 ? "no_results" : result.state,
      consumesQuota: true,
      rememberPreferenceOffer: shouldOfferRememberPreference(ctx.message, extracted)
        ? extracted
        : null,
    });
  }

  return attach({
    reply: conversationalReply(
      intents,
      ctx.message,
      ctx.isLoggedIn,
      ctx.messages.map((entry) => ({
        role: entry.role,
        content: entry.content,
      }))
    ),
    recommendations: [],
    responseKind: "chat",
    consumesQuota: false,
    spoilerMode,
  });
}
