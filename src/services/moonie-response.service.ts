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
import { buildConversationContext } from "@/lib/moonie/conversation-context";
import {
  classifyMoonieIntents,
  extractNovelQuery,
  extractDirectTitleQuery,
  isBareReadingLinkRequest,
  isBareReviewRequestWithoutNovel,
  isBareCommunityConsensusRequestWithoutNovel,
  isCommunityPeopleQuery,
  isCompareTheseMessage,
  isConversationalOnly,
  isMoonieGeneratedFollowUpQuestion,
  isReviewFollowUpMessage,
  isNovelContextFollowUpMessage,
  messageReferencesActiveNovel,
  isConfirmCandidateMessage,
  isPartialMemoryQuery,
  isRejectCandidateMessage,
  isShowAlternativesMessage,
  isVagueContinuationRequest,
  isRecommendationDiscoveryMessage,
  normalizeLookupConfirmationMessage,
  prefsLookEmpty,
  primaryRetrievalIntent,
  resolveLookupTitleQuery,
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
import { isMoonieDeskChipPrompt } from "@/lib/moonie/desk";
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
  MoonieInterpretedPreferences,
  MoonieLookupSession,
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
}

function conversationalReply(
  intents: MoonieIntent[],
  message: string,
  isLoggedIn: boolean,
  messages: Array<{ role: string; content: string }>
): string {
  return buildConversationalReply(intents, message, isLoggedIn, messages);
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
    interpretedPreferences?: MoonieInterpretedPreferences;
    spoilerMode?: MoonieSpoilerMode;
  }
): MoonieRecommendResponse {
  if (result.mode === "high_confidence" && result.recommendation && result.overview) {
    let reply = result.reply;
    if (options?.emphasizeReadingLink || options?.emphasizeReviews) {
      reply = formatNovelBundleReply({
        overview: result.overview,
        emphasizeReadingLink: options.emphasizeReadingLink,
        emphasizeReviews: options.emphasizeReviews,
      });
    }
    return {
      reply,
      recommendations: [result.recommendation],
      novelOverview: result.overview,
      lookupSession: result.session,
      responseKind: "novel_bundle",
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
  };
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
      const result = await confirmLookupCandidate({
        novelId: pick.novelId,
        userId: ctx.userId,
        spoilerMode,
        session,
        emphasizeReadingLink: options?.emphasizeReadingLink,
        emphasizeReviews: options?.emphasizeReviews,
      });
      return identificationToResponse(result, {
        emphasizeReadingLink: options?.emphasizeReadingLink,
        emphasizeReviews: options?.emphasizeReviews,
        interpretedPreferences: prefs,
        spoilerMode,
      });
    }
  }

  if (isConfirmCandidateMessage(message)) {
    const novelId = parseConfirmNovelId(message, session);
    if (novelId) {
      const result = await confirmLookupCandidate({
        novelId,
        userId: ctx.userId,
        spoilerMode,
        session,
        emphasizeReadingLink: options?.emphasizeReadingLink,
        emphasizeReviews: options?.emphasizeReviews,
      });
      return identificationToResponse(result, {
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
  const spoilerMode = normalizeSpoilerMode(
    ctx.spoilerMode ?? DEFAULT_SPOILER_MODE
  );

  const conversationContext = buildConversationContext(ctx.messages, {
    contextNovelId: ctx.contextNovelId,
    contextNovelTitle: ctx.contextNovelTitle,
    currentMessage: ctx.message,
  });

  const priorConversationPrefs = mergeConversationPreferences(
    ctx.messages.map((entry) => ({
      role: entry.role,
      content: entry.content,
    }))
  );

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
      length: prefs.length ?? ctx.tastePrefs.length ?? null,
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
    analyticsIntent: resolveAnalyticsIntent({
      intents,
      primary: intentOverride ?? primary,
      responseKind: response.responseKind,
    }),
    rememberPreferenceOffer:
      response.rememberPreferenceOffer ?? ctx.rememberPreferenceOffer ?? null,
  });

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

  if (isBareReviewRequestWithoutNovel(ctx.message) && lacksStructuredContext) {
    return attach({
      reply: "Which novel would you like to see reviews for?",
      recommendations: [],
      responseKind: "chat",
      consumesQuota: false,
      spoilerMode,
    });
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
    });
  }

  if (primary === "REVIEWER_OVERVIEW" || intents.includes("REVIEWER_OVERVIEW")) {
    const reviewerResponse = await buildMoonieReviewerOverviewResponse({
      message: ctx.message,
      userId: ctx.userId,
      reviewerSession: conversationContext.reviewerSession,
      activeReviewerId: conversationContext.activeReviewerId,
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
      });

      return attach({
        reply: comparison.reply,
        recommendations: comparison.recommendations,
        compare: comparison,
        responseKind: "compare",
        state: comparison.rows.length < 2 ? "no_results" : undefined,
        consumesQuota: true,
        spoilerMode,
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
    });

    return attach({
      reply: comparison.reply,
      recommendations: comparison.recommendations,
      compare: comparison,
      responseKind: "compare",
      state: comparison.rows.length < 2 ? "no_results" : undefined,
      consumesQuota: true,
      spoilerMode,
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
    !isCommunityPeopleQuery(ctx.message) &&
    (primary === "FIND_NOVEL" ||
      primary === "FIND_READING_SOURCE" ||
      primary === "NOVEL_OVERVIEW" ||
      primary === "NOVEL_REVIEWS" ||
      (conversationContext.activeNovelId &&
        (usesActiveNovelContext ||
          /\b(it|this|that|completed|romance|worth|slow.?burn|angst)\b/i.test(
            ctx.message
          ))));

  if (wantsNovelLookup) {
    const extractedTitle = resolveLookupTitleQuery(ctx.message, intents);
    const titleQuery =
      extractedTitle ??
      (conversationContext.activeNovelId && usesActiveNovelContext
        ? conversationContext.activeNovelTitle ?? undefined
        : undefined);

    const lookupPrefs = skipTasteExtraction
      ? EMPTY_INTERPRETED_PREFERENCES
      : prefs;

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

    if (
      conversationContext.activeNovelId &&
      usesActiveNovelContext &&
      hasAnchoredNovel &&
      !extractedTitle
    ) {
      const bundle = await buildNovelBundle({
        novelId: conversationContext.activeNovelId,
        userId: ctx.userId,
        spoilerMode,
      });
      if (bundle.overview) {
        let reply = formatNovelBundleReply({
          overview: bundle.overview,
          emphasizeReadingLink: wantsReadingLink,
          emphasizeReviews: wantsReviews,
        });
        if (/\bcompleted\b/i.test(ctx.message)) {
          const status = bundle.overview.publicationStatus ?? "unknown";
          reply = `${bundle.overview.title} is listed as **${status}** in the MoonVerse catalogue.`;
        }
        return attach({
          reply,
          recommendations: bundle.recommendation ? [bundle.recommendation] : [],
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

    const response = identificationToResponse(identification, {
      emphasizeReadingLink: wantsReadingLink,
      emphasizeReviews: wantsReviews,
      interpretedPreferences: lookupPrefs,
      spoilerMode,
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

  if (primary === "MORE_LIKE_THIS" && conversationContext.activeNovelId) {
    let result = await buildGroundedRecommendations({
      prefs,
      userId: ctx.userId,
      queryText: ctx.message,
      excludeNovelIds: ctx.excludeNovelIds,
      similarToNovelId: conversationContext.activeNovelId,
      strictGenreFilter: false,
      personalization: ctx.personalization,
      recentSearches: ctx.recentSearches,
      spoilerMode,
    });
    result = await polishExplanationsWithOpenAI(ctx.message, result, spoilerMode);
    return attach({
      ...result,
      responseKind: "recommendations",
      consumesQuota: true,
      rememberPreferenceOffer: shouldOfferRememberPreference(ctx.message, extracted)
        ? extracted
        : null,
    });
  }

  if (primary === "RECOMMEND" || primary === "REFINE") {
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

    let result = await buildGroundedRecommendations({
      prefs,
      userId: ctx.userId,
      queryText: ctx.message,
      excludeNovelIds: ctx.excludeNovelIds,
      similarToNovelId: ctx.similarToNovelId,
      strictGenreFilter:
        messagePrefs.genres.length > 0 ||
        Boolean(extracted?.genres && extracted.genres.length > 0),
      personalization: ctx.personalization,
      recentSearches: ctx.recentSearches,
      spoilerMode,
    });
    result = await polishExplanationsWithOpenAI(ctx.message, result, spoilerMode);

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
