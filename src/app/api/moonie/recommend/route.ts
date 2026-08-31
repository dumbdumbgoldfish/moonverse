import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOffTopicMoonieResponse } from "@/lib/moonie/client";
import {
  isValidUserMessage,
  looksOffTopic,
  sanitizeUserMessage,
} from "@/lib/moonie/guardrails";
import {
  consumeMoonieQuota,
  MOONIE_DAILY_DISCOVERY_LIMIT,
  peekMoonieQuota,
} from "@/lib/moonie/rate-limit";
import { buildMoonieRateLimitApiError, buildGuestRateLimitApiError } from "@/lib/moonie/quota-copy";
import {
  buildMoonieIntentContextFromMessages,
  moonieRequestLikelyConsumesQuota,
} from "@/lib/moonie/guest-quota-enforcement";
import { collectPriorRecommendedNovelIds } from "@/lib/moonie/conversation-context";
import { logMoonieDevQuotaToolsStatus } from "@/lib/moonie/dev-quota";
import { MOONIE_IMAGE_BASE64_MAX_CHARS } from "@/lib/image-upload-limits";
import { validateMoonieMessage } from "@/lib/validation";
import { getSystemSettings } from "@/lib/system-settings";
import { normalizeSpoilerMode } from "@/lib/moonie/spoiler-mode";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import { trackMoonieEvent, resolveResponseConfidenceTier } from "@/lib/moonie/analytics";
import { buildPersistedAssistantMeta } from "@/lib/moonie/persist-assistant-turn";
import type { MoonieSessionPreferences } from "@/lib/moonie/personalization";
import { DEFAULT_PERSONALIZATION_SETTINGS } from "@/lib/moonie/personalization";
import { resolveMoonieUseTaste } from "@/lib/moonie/recommend-request";
import { findStoredMoonieTurnResponse } from "@/lib/moonie/recommend-idempotency";
import { isUnseenRecommendationRequest } from "@/lib/moonie/intent";
import type { MoonieInterpretedPreferences } from "@/types/moonie";

logMoonieDevQuotaToolsStatus();

const bodySchema = z.object({
  message: z.string().max(500).optional(),
  clientTurnId: z.string().min(1).max(100).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(500),
        meta: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .max(30)
    .optional(),
  conversationId: z.string().max(64).optional(),
  guestDemo: z.boolean().optional(),
  newConversation: z.boolean().optional(),
  similarToNovelId: z.string().max(64).optional(),
  excludeNovelIds: z.array(z.string().max(64)).max(100).optional(),
  useTaste: z.boolean().optional(),
  contextNovelId: z.string().max(64).optional(),
  contextNovelTitle: z.string().max(200).optional(),
  confirmLookupNovelId: z.string().max(64).optional(),
  attachmentType: z.enum(["image", "file"]).optional(),
  imageData: z.string().max(MOONIE_IMAGE_BASE64_MAX_CHARS).optional(),
  imageMimeType: z.string().max(64).optional(),
  fileData: z.string().max(96_000).optional(),
  fileName: z.string().max(200).optional(),
  fileMimeType: z.string().max(64).optional(),
  recentSearches: z
    .array(
      z.object({
        query: z.string().max(120),
        novelId: z.string().max(64).optional(),
      })
    )
    .max(8)
    .optional(),
  spoilerMode: z.enum(["none", "light", "full"]).optional(),
  sessionPreferences: z
    .object({
      genres: z.array(z.string().max(40)).max(12).optional(),
      tags: z.array(z.string().max(40)).max(12).optional(),
      mood: z.array(z.string().max(40)).max(8).optional(),
      excludedTags: z.array(z.string().max(40)).max(12).optional(),
      status: z.string().max(32).nullable().optional(),
      language: z.string().max(32).nullable().optional(),
      length: z.string().max(32).nullable().optional(),
    })
    .optional(),
  userAttachmentMeta: z
    .object({
      type: z.enum(["image", "file", "voice"]),
      name: z.string().max(200).optional(),
      mimeType: z.string().max(64).optional(),
    })
    .optional(),
});

const GUEST_TURNS_COOKIE = "mv-moonie-guest-turns";

function userAttachmentPersistenceMeta(
  meta: z.infer<typeof bodySchema>["userAttachmentMeta"]
): Prisma.InputJsonValue | undefined {
  if (!meta) return undefined;
  return { userAttachment: meta };
}

function userTurnPersistenceMeta(
  attachment: z.infer<typeof bodySchema>["userAttachmentMeta"],
  clientTurnId?: string
): Prisma.InputJsonValue | undefined {
  const attachmentMeta = userAttachmentPersistenceMeta(attachment);
  if (!clientTurnId) return attachmentMeta;
  return {
    ...((attachmentMeta as Record<string, unknown> | undefined) ?? {}),
    clientTurnId,
  } as Prisma.InputJsonValue;
}

function priorRecommendedNovelIds(
  messages: Array<{ role: string; meta: unknown }>
): string[] {
  return collectPriorRecommendedNovelIds(messages);
}

async function trackEvent(
  event: string,
  userId: string | null,
  novelId?: string,
  meta?: Record<string, unknown>
) {
  try {
    await db.moonieRecommendationEvent.create({
      data: {
        event,
        userId: userId ?? undefined,
        novelId,
        meta: (meta as Prisma.InputJsonValue | undefined) ?? undefined,
      },
    });
  } catch {
    // analytics must not break recommendations
  }
}

async function loadTasteContext(userId: string, useTaste?: boolean): Promise<{
  tastePrefs?: Partial<MoonieInterpretedPreferences>;
  hasTasteHistory: boolean;
  personalization: typeof DEFAULT_PERSONALIZATION_SETTINGS;
}> {
  const taste = await db.moonieTasteProfile.findUnique({ where: { userId } });
  const onboarding = await db.userPreferredGenre.findMany({
    where: { userId },
    include: { genre: true },
  });
  const [readingCount, followCount] = await Promise.all([
    db.novelReadingStatus.count({ where: { userId } }),
    db.follow.count({ where: { followerId: userId } }),
  ]);

  const hasTasteHistory =
    onboarding.length > 0 ||
    Boolean(taste?.favouriteGenres?.length) ||
    Boolean(taste?.favouriteTags?.length) ||
    readingCount > 0 ||
    followCount > 0;

  const shouldUseTaste = resolveMoonieUseTaste(
    useTaste,
    taste?.useTasteByDefault
  );
  const personalization = {
    useSavedNovels: taste?.useSavedNovels ?? true,
    useSavedReviews: taste?.useSavedReviews ?? true,
    useReadingList: taste?.useReadingList ?? true,
    useLikes: taste?.useLikes ?? true,
    useFollowedReviewers: taste?.useFollowedReviewers ?? true,
    useSearchHistory: taste?.useSearchHistory ?? true,
  };

  if (!shouldUseTaste) {
    return { hasTasteHistory, personalization };
  }

  const influencedBy: string[] = [];
  if (onboarding.length) influencedBy.push("onboarding genres");
  if (taste?.favouriteGenres?.length) influencedBy.push("saved genres");
  if (taste?.favouriteTags?.length) influencedBy.push("saved tropes");
  if (taste?.favouriteMoods?.length) influencedBy.push("saved moods");
  if (taste?.avoidedTags?.length) influencedBy.push("things to avoid");
  if (taste?.preferredStatus) influencedBy.push("preferred status");
  if (readingCount > 0 && personalization.useReadingList) {
    influencedBy.push("your reading list");
  }
  if (followCount > 0 && personalization.useFollowedReviewers) {
    influencedBy.push("reviewers you follow");
  }

  return {
    hasTasteHistory,
    personalization,
    tastePrefs: {
      genres: [
        ...new Set([
          ...(taste?.favouriteGenres ?? []),
          ...onboarding.map((g) => g.genre.name),
        ]),
      ],
      tags: taste?.favouriteTags ?? [],
      mood: taste?.favouriteMoods ?? [],
      excludedTags: taste?.avoidedTags ?? [],
      status: taste?.preferredStatus ?? null,
      language: taste?.preferredLanguage ?? null,
      length: taste?.preferredLength ?? null,
      influencedBy,
    },
  };
}

async function persistAssistantTurn(options: {
  conversationId: string;
  message: string;
  result: Awaited<ReturnType<typeof handleMoonieRequest>>;
  userAttachmentMeta?: z.infer<typeof bodySchema>["userAttachmentMeta"];
  clientTurnId?: string;
}) {
  const userMeta = userTurnPersistenceMeta(
    options.userAttachmentMeta,
    options.clientTurnId
  );

  await db.$transaction([
    db.moonieMessage.create({
      data: {
        conversationId: options.conversationId,
        role: "user",
        content: options.message,
        meta: userMeta,
      },
    }),
    db.moonieMessage.create({
      data: {
        conversationId: options.conversationId,
        role: "assistant",
        content: options.result.reply,
        meta: buildPersistedAssistantMeta(
          options.result,
          options.clientTurnId
        ),
      },
    }),
    db.moonieConversation.update({
      where: { id: options.conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const session = await auth();
    const guestDemo = Boolean(parsed.data.guestDemo);
    const message = sanitizeUserMessage(parsed.data.message ?? "");
    const userAttachmentMeta = parsed.data.userAttachmentMeta;

    const messageError = validateMoonieMessage(message);
    if (messageError) {
      return NextResponse.json({ error: messageError }, { status: 400 });
    }
    if (!isValidUserMessage(message)) {
      return NextResponse.json(
        { error: "Please enter a message." },
        { status: 400 }
      );
    }

    if (looksOffTopic(message)) {
      return NextResponse.json(getOffTopicMoonieResponse());
    }

    if (!session?.user?.id && !guestDemo) {
      return NextResponse.json(
        {
          error:
            "Log in to let Moonie use your saved novels and reading preferences.",
        },
        { status: 401 }
      );
    }

    const settings = await getSystemSettings();

    if (guestDemo && !session?.user?.id) {
      const jar = await cookies();
      const turnsRaw = jar.get(GUEST_TURNS_COOKIE)?.value ?? "0";
      let turnsUsed = Number.parseInt(turnsRaw, 10);
      if (!Number.isFinite(turnsUsed) || turnsUsed < 0) {
        turnsUsed = 0;
      }

      const priorMessages = (parsed.data.messages ?? []).map((entry) => ({
        role: entry.role,
        content: entry.content,
        meta: entry.meta,
      }));

      const seekingUnseen = isUnseenRecommendationRequest(message);
      const priorIds = priorRecommendedNovelIds(priorMessages);
      const explicitExcludeIds = [
        ...new Set(parsed.data.excludeNovelIds ?? []),
      ];
      const excludeIds = [
        ...new Set([
          ...explicitExcludeIds,
          ...(seekingUnseen ? priorIds : []),
        ]),
      ];

      const guestIntentContext = buildMoonieIntentContextFromMessages(
        priorMessages
      );
      const guestLikelyConsumes = moonieRequestLikelyConsumesQuota(
        message,
        guestIntentContext
      );
      if (
        turnsUsed >= settings.guestMoonieDemoCap &&
        guestLikelyConsumes
      ) {
        return NextResponse.json(
          {
            error: buildGuestRateLimitApiError(),
            rateLimited: true,
            guestTurnsRemaining: 0,
          },
          { status: 429 }
        );
      }

      const result = await handleMoonieRequest({
        message,
        messages: priorMessages,
        isLoggedIn: false,
        excludeNovelIds: excludeIds,
        previouslyShownNovelIds: priorIds,
        hasExplicitExclusions: explicitExcludeIds.length > 0,
        seekingUnseen,
        similarToNovelId: parsed.data.similarToNovelId,
        contextNovelId: parsed.data.contextNovelId,
        contextNovelTitle: parsed.data.contextNovelTitle,
        confirmLookupNovelId: parsed.data.confirmLookupNovelId,
        attachmentType: parsed.data.attachmentType ?? null,
        imageData: parsed.data.imageData ?? null,
        imageMimeType: parsed.data.imageMimeType ?? null,
        fileData: parsed.data.fileData ?? null,
        fileName: parsed.data.fileName ?? null,
        fileMimeType: parsed.data.fileMimeType ?? null,
        spoilerMode: normalizeSpoilerMode(parsed.data.spoilerMode),
      });

      const consumesQuota = result.consumesQuota !== false;
      if (consumesQuota && turnsUsed >= settings.guestMoonieDemoCap) {
        return NextResponse.json(
          {
            error: buildGuestRateLimitApiError(),
            rateLimited: true,
            guestTurnsRemaining: 0,
          },
          { status: 429 }
        );
      }

      if (consumesQuota) {
        turnsUsed += 1;
        jar.set(GUEST_TURNS_COOKIE, String(turnsUsed), {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
        await trackEvent("guest_recommend", null, undefined, {
          count: result.recommendations.length,
          responseKind: result.responseKind,
          intent: result.analyticsIntent,
        });
      }

      return NextResponse.json({
        ...result,
        conversationId: parsed.data.conversationId,
        guestTurnsRemaining: Math.max(
          0,
          settings.guestMoonieDemoCap - turnsUsed
        ),
      });
    }

    const userId = session!.user!.id;

    const existingConversation = parsed.data.conversationId
      ? await db.moonieConversation.findFirst({
          where: { id: parsed.data.conversationId, userId },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        })
      : null;
    const conversation =
      existingConversation ??
      (await db.moonieConversation.create({
        data: { userId },
        include: { messages: true },
      }));
    const conversationId = conversation.id;

    const storedResponse = findStoredMoonieTurnResponse(
      conversation.messages,
      parsed.data.clientTurnId
    );
    if (storedResponse) {
      const quota = await peekMoonieQuota(userId);
      return NextResponse.json({
        ...storedResponse,
        consumesQuota: false,
        conversationId,
        quotaRemaining: quota.remaining,
      });
    }

    const seekingUnseen = isUnseenRecommendationRequest(message);
    const priorIds = priorRecommendedNovelIds(conversation.messages);
    const explicitExcludeIds = [
      ...new Set(parsed.data.excludeNovelIds ?? []),
    ];
    const excludeIds = [
      ...new Set([
        ...explicitExcludeIds,
        ...(seekingUnseen ? priorIds : []),
      ]),
    ];

    const tasteContext = await loadTasteContext(userId, parsed.data.useTaste);

    const result = await handleMoonieRequest({
      message,
      messages: conversation.messages,
      userId,
      isLoggedIn: true,
      excludeNovelIds: excludeIds,
      previouslyShownNovelIds: priorIds,
      hasExplicitExclusions: explicitExcludeIds.length > 0,
      seekingUnseen,
      similarToNovelId: parsed.data.similarToNovelId,
      useTaste: parsed.data.useTaste,
      contextNovelId: parsed.data.contextNovelId,
      contextNovelTitle: parsed.data.contextNovelTitle,
      confirmLookupNovelId: parsed.data.confirmLookupNovelId,
      attachmentType: parsed.data.attachmentType ?? null,
      imageData: parsed.data.imageData ?? null,
      imageMimeType: parsed.data.imageMimeType ?? null,
      fileData: parsed.data.fileData ?? null,
      fileName: parsed.data.fileName ?? null,
      fileMimeType: parsed.data.fileMimeType ?? null,
      spoilerMode: normalizeSpoilerMode(parsed.data.spoilerMode),
      tastePrefs: tasteContext.tastePrefs,
      hasTasteHistory: tasteContext.hasTasteHistory,
      personalization: tasteContext.personalization,
      sessionPreferences: parsed.data.sessionPreferences as
        | MoonieSessionPreferences
        | undefined,
      recentSearches: parsed.data.recentSearches,
    });

    const consumesQuota = result.consumesQuota !== false;
    let quotaRemaining: number | undefined;

    if (consumesQuota) {
      const rateLimit = await consumeMoonieQuota(userId);
      if (!rateLimit.allowed) {
        await trackEvent("rate_limit", userId);
        return NextResponse.json(
          {
            error: buildMoonieRateLimitApiError(MOONIE_DAILY_DISCOVERY_LIMIT),
            rateLimited: true,
            quotaRemaining: 0,
          },
          { status: 429 }
        );
      }
      quotaRemaining = rateLimit.remaining;

      await persistAssistantTurn({
        conversationId,
        message,
        result,
        userAttachmentMeta,
        clientTurnId: parsed.data.clientTurnId,
      });
      await trackMoonieEvent({
        event: "recommend",
        userId,
        meta: {
          responseKind: result.responseKind,
          intent: result.analyticsIntent,
          resultCount: result.recommendations.length,
          success:
            result.recommendations.length > 0 ||
            Boolean(result.lookupSession) ||
            Boolean(result.seriesInfo),
          clarification: Boolean(result.lookupSession?.mode === "clarification"),
          confidenceTier: resolveResponseConfidenceTier(result),
          consumesQuota: true,
          attachmentType: parsed.data.attachmentType ?? null,
          spoilerMode: result.spoilerMode,
        },
      });
    } else {
      const peek = await peekMoonieQuota(userId);
      quotaRemaining = peek.remaining;
      await db.$transaction([
        db.moonieMessage.create({
          data: {
            conversationId,
            role: "user",
            content: message,
            meta: userTurnPersistenceMeta(
              userAttachmentMeta,
              parsed.data.clientTurnId
            ),
          },
        }),
        db.moonieMessage.create({
          data: {
            conversationId,
            role: "assistant",
            content: result.reply,
            meta: buildPersistedAssistantMeta(
              result,
              parsed.data.clientTurnId
            ),
          },
        }),
        db.moonieConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        }),
      ]);
    }

    return NextResponse.json({
      ...result,
      conversationId,
      quotaRemaining,
    });
  } catch (error) {
    console.error("[moonie/recommend]", error);
    return NextResponse.json(
      {
        error:
          "Moonie is having trouble reaching the reading archive. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
