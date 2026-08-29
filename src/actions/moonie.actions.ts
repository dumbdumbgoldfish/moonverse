"use server";

import { RecommendationFeedbackKind } from "@prisma/client";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { MooniePersonalizationSettings } from "@/lib/moonie/personalization";
import { DEFAULT_PERSONALIZATION_SETTINGS } from "@/lib/moonie/personalization";
import { userAttachmentFromPersisted } from "@/lib/moonie/user-message-attachment";
import { MOONIE_MAX_PINNED_CONVERSATIONS } from "@/lib/moonie/constants";

export type MoonieActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("You must be logged in.");
  return session.user.id;
}

const recommendationFeedbackSchema = z.object({
  novelId: z.string().min(1).max(64),
  kind: z.enum([
    "NOT_FOR_ME",
    "MORE_LIKE_THIS",
    "LESS_LIKE_THIS",
    "SAVED",
    "CLICKED",
    "SOURCE_OPENED",
    "HELPFUL",
    "NOT_HELPFUL",
  ]),
  note: z.string().max(120).optional(),
});

export async function recordRecommendationFeedbackAction(input: {
  novelId: string;
  kind:
    | "NOT_FOR_ME"
    | "MORE_LIKE_THIS"
    | "LESS_LIKE_THIS"
    | "SAVED"
    | "CLICKED"
    | "SOURCE_OPENED"
    | "HELPFUL"
    | "NOT_HELPFUL";
  note?: string;
}): Promise<MoonieActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = recommendationFeedbackSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid recommendation feedback." };
    }
    const novel = await db.novel.findUnique({
      where: { id: parsed.data.novelId },
      select: { id: true },
    });
    if (!novel) return { success: false, error: "Novel not found." };

    await db.$transaction([
      db.recommendationFeedback.create({
        data: {
          userId,
          novelId: parsed.data.novelId,
          kind: parsed.data.kind as RecommendationFeedbackKind,
          note: parsed.data.note ?? null,
        },
      }),
      db.moonieRecommendationEvent.create({
        data: {
          userId,
          novelId: parsed.data.novelId,
          event: parsed.data.kind.toLowerCase(),
          meta: parsed.data.note ? { note: parsed.data.note } : undefined,
        },
      }),
    ]);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save feedback.",
    };
  }
}

export async function getMoonieTasteProfileAction() {
  const userId = await requireUserId();
  const [taste, onboarding, readingStatusCount] = await Promise.all([
    db.moonieTasteProfile.findUnique({ where: { userId } }),
    db.userPreferredGenre.findMany({
      where: { userId },
      include: { genre: true },
    }),
    db.novelReadingStatus.count({ where: { userId } }),
  ]);

  return {
    favouriteGenres: taste?.favouriteGenres ?? [],
    favouriteTags: taste?.favouriteTags ?? [],
    favouriteMoods: taste?.favouriteMoods ?? [],
    preferredPlatforms: taste?.preferredPlatforms ?? [],
    avoidedTags: taste?.avoidedTags ?? [],
    preferredStatus: taste?.preferredStatus ?? null,
    preferredLength: taste?.preferredLength ?? null,
    romanceLevel: taste?.romanceLevel ?? null,
    preferredProtagonist: taste?.preferredProtagonist ?? null,
    preferredLanguage: taste?.preferredLanguage ?? null,
    useTasteByDefault: taste?.useTasteByDefault ?? true,
    preferredGenreNamesFromOnboarding: onboarding.map((g) => g.genre.name),
    readingStatusCount,
    personalization: {
      useSavedNovels: taste?.useSavedNovels ?? true,
      useSavedReviews: taste?.useSavedReviews ?? true,
      useReadingList: taste?.useReadingList ?? true,
      useLikes: taste?.useLikes ?? true,
      useFollowedReviewers: taste?.useFollowedReviewers ?? true,
      useSearchHistory: taste?.useSearchHistory ?? true,
    },
  };
}

export async function updateMoonieTasteProfileAction(input: {
  favouriteGenres: string[];
  favouriteTags: string[];
  favouriteMoods?: string[];
  preferredPlatforms?: string[];
  avoidedTags: string[];
  preferredStatus: string | null;
  preferredLength?: string | null;
  romanceLevel?: string | null;
  preferredProtagonist?: string | null;
  preferredLanguage?: string | null;
  useTasteByDefault: boolean;
  personalization?: Partial<MooniePersonalizationSettings>;
}): Promise<MoonieActionResult> {
  try {
    const userId = await requireUserId();
    const privacy = {
      ...DEFAULT_PERSONALIZATION_SETTINGS,
      ...input.personalization,
    };
    await db.moonieTasteProfile.upsert({
      where: { userId },
      create: {
        userId,
        favouriteGenres: input.favouriteGenres,
        favouriteTags: input.favouriteTags,
        favouriteMoods: input.favouriteMoods ?? [],
        preferredPlatforms: input.preferredPlatforms ?? [],
        avoidedTags: input.avoidedTags,
        preferredStatus: input.preferredStatus,
        preferredLength: input.preferredLength ?? null,
        romanceLevel: input.romanceLevel ?? null,
        preferredProtagonist: input.preferredProtagonist ?? null,
        preferredLanguage: input.preferredLanguage ?? null,
        useTasteByDefault: input.useTasteByDefault,
        useSavedNovels: privacy.useSavedNovels,
        useSavedReviews: privacy.useSavedReviews,
        useReadingList: privacy.useReadingList,
        useLikes: privacy.useLikes,
        useFollowedReviewers: privacy.useFollowedReviewers,
        useSearchHistory: privacy.useSearchHistory,
      },
      update: {
        favouriteGenres: input.favouriteGenres,
        favouriteTags: input.favouriteTags,
        ...(input.favouriteMoods !== undefined
          ? { favouriteMoods: input.favouriteMoods }
          : {}),
        ...(input.preferredPlatforms !== undefined
          ? { preferredPlatforms: input.preferredPlatforms }
          : {}),
        avoidedTags: input.avoidedTags,
        preferredStatus: input.preferredStatus,
        ...(input.preferredLength !== undefined
          ? { preferredLength: input.preferredLength }
          : {}),
        ...(input.romanceLevel !== undefined
          ? { romanceLevel: input.romanceLevel }
          : {}),
        ...(input.preferredProtagonist !== undefined
          ? { preferredProtagonist: input.preferredProtagonist }
          : {}),
        ...(input.preferredLanguage !== undefined
          ? { preferredLanguage: input.preferredLanguage }
          : {}),
        useTasteByDefault: input.useTasteByDefault,
        ...(input.personalization
          ? {
              useSavedNovels: privacy.useSavedNovels,
              useSavedReviews: privacy.useSavedReviews,
              useReadingList: privacy.useReadingList,
              useLikes: privacy.useLikes,
              useFollowedReviewers: privacy.useFollowedReviewers,
              useSearchHistory: privacy.useSearchHistory,
            }
          : {}),
      },
    });
    revalidatePath("/moonie");
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update taste.",
    };
  }
}

export async function resetMoonieTasteProfileAction(): Promise<MoonieActionResult> {
  try {
    const userId = await requireUserId();
    await db.$transaction([
      db.moonieTasteProfile.deleteMany({ where: { userId } }),
      db.recommendationFeedback.deleteMany({ where: { userId } }),
    ]);
    revalidatePath("/moonie");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not reset taste.",
    };
  }
}

export async function removeTastePreferenceAction(input: {
  type: "genre" | "tag" | "mood" | "avoid";
  value: string;
}): Promise<MoonieActionResult> {
  try {
    const userId = await requireUserId();
    const taste = await db.moonieTasteProfile.findUnique({ where: { userId } });
    if (!taste) return { success: true };

    const key = input.value.toLowerCase();
    const filter = (items: string[]) =>
      items.filter((item) => item.toLowerCase() !== key);

    const data =
      input.type === "genre"
        ? { favouriteGenres: filter(taste.favouriteGenres) }
        : input.type === "tag"
          ? { favouriteTags: filter(taste.favouriteTags) }
          : input.type === "mood"
            ? { favouriteMoods: filter(taste.favouriteMoods) }
            : { avoidedTags: filter(taste.avoidedTags) };

    await db.moonieTasteProfile.update({ where: { userId }, data });
    revalidatePath("/moonie");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Could not remove preference.",
    };
  }
}

export interface MoonieConversationListItem {
  id: string;
  title: string;
  updatedAt: string;
  pinned: boolean;
}

function mapStoredMoonieMessage(message: {
  id: string;
  role: string;
  content: string;
  meta: unknown;
}): import("@/types/moonie").MoonieChatMessage {
  const meta =
    message.meta && typeof message.meta === "object"
      ? (message.meta as Record<string, unknown>)
      : {};
  return {
    id: message.id,
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
    userAttachment: userAttachmentFromPersisted(meta.userAttachment),
    recommendations: meta.recommendations as
      | import("@/types/moonie").MoonieRecommendation[]
      | undefined,
    novelOverview: meta.novelOverview as
      | import("@/types/moonie").MoonieNovelOverview
      | undefined,
    compare: meta.compare as import("@/types/moonie").MoonieCompareResult | undefined,
    lookupSession: meta.lookupSession as
      | import("@/types/moonie").MoonieLookupSession
      | undefined,
    interpretedPreferences: meta.interpretedPreferences as
      | import("@/types/moonie").MoonieInterpretedPreferences
      | undefined,
    responseKind: meta.responseKind as
      | import("@/types/moonie").MoonieResponseKind
      | undefined,
    analyticsIntent:
      typeof meta.analyticsIntent === "string" ? meta.analyticsIntent : undefined,
    reviewerResults: meta.reviewerResults as
      | import("@/types/moonie").MoonieReviewerResult[]
      | undefined,
    reviewerSession: meta.reviewerSession as
      | import("@/types/moonie").MoonieReviewerSession
      | undefined,
    reviewerOverview: meta.reviewerOverview as
      | import("@/types/moonie").MoonieReviewerOverview
      | undefined,
    reviewerGroupOverview: meta.reviewerGroupOverview as
      | import("@/types/moonie").MoonieReviewerGroupOverview
      | undefined,
    reviewerReviewSession: meta.reviewerReviewSession as
      | import("@/types/moonie").MoonieReviewerReviewSession
      | undefined,
    seriesInfo: meta.seriesInfo as
      | import("@/types/moonie").MoonieSeriesInfo
      | undefined,
    followUpQuestion:
      typeof meta.followUpQuestion === "string" ? meta.followUpQuestion : undefined,
    state:
      typeof meta.state === "string"
        ? (meta.state as import("@/types/moonie").MoonieResponseState)
        : undefined,
  };
}

function mapConversationRow(row: {
  id: string;
  title: string | null;
  updatedAt: Date;
  pinnedAt: Date | null;
  messages: { content: string }[];
}): MoonieConversationListItem {
  return {
    id: row.id,
    title:
      row.title?.trim() ||
      row.messages[0]?.content.trim().slice(0, 80) ||
      "Moonie conversation",
    updatedAt: row.updatedAt.toISOString(),
    pinned: row.pinnedAt != null,
  };
}

const conversationListInclude = {
  messages: {
    where: { role: "user" as const },
    orderBy: { createdAt: "asc" as const },
    take: 1,
    select: { content: true },
  },
};

export async function listMoonieConversationsAction(): Promise<
  | { success: true; conversations: MoonieConversationListItem[] }
  | { success: false; error: string }
> {
  noStore();
  try {
    const userId = await requireUserId();
    const [pinnedRows, recentRows] = await Promise.all([
      db.moonieConversation.findMany({
        where: { userId, pinnedAt: { not: null } },
        orderBy: { pinnedAt: "desc" },
        take: MOONIE_MAX_PINNED_CONVERSATIONS,
        include: conversationListInclude,
      }),
      db.moonieConversation.findMany({
        where: { userId, pinnedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 24,
        include: conversationListInclude,
      }),
    ]);

    return {
      success: true,
      conversations: [...pinnedRows, ...recentRows].map(mapConversationRow),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not load Moonie conversations.",
    };
  }
}

export async function loadMoonieConversationAction(
  conversationId: string
): Promise<
  | {
      success: true;
      conversationId: string;
      messages: import("@/types/moonie").MoonieChatMessage[];
    }
  | { success: false; error: string }
> {
  try {
    const userId = await requireUserId();
    const conversation = await db.moonieConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!conversation) {
      return { success: false, error: "Conversation not found." };
    }
    return {
      success: true,
      conversationId: conversation.id,
      messages: conversation.messages.map(mapStoredMoonieMessage),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not resume Moonie conversation.",
    };
  }
}

export async function loadLatestMoonieConversationAction(): Promise<
  | {
      success: true;
      conversationId: string;
      messages: import("@/types/moonie").MoonieChatMessage[];
    }
  | { success: false; error: string }
> {
  noStore();
  try {
    const userId = await requireUserId();
    const conversation = await db.moonieConversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!conversation || conversation.messages.length === 0) {
      return { success: false, error: "No conversations yet." };
    }
    return {
      success: true,
      conversationId: conversation.id,
      messages: conversation.messages.map(mapStoredMoonieMessage),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not load your latest Moonie conversation.",
    };
  }
}

export async function deleteMoonieConversationAction(
  conversationId: string
): Promise<MoonieActionResult> {
  try {
    const userId = await requireUserId();
    await db.moonieConversation.deleteMany({
      where: { id: conversationId, userId },
    });
    revalidatePath("/moonie");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not delete conversation.",
    };
  }
}

const renameConversationSchema = z.object({
  conversationId: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(80),
});

export async function renameMoonieConversationAction(
  conversationId: string,
  title: string
): Promise<MoonieActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = renameConversationSchema.safeParse({ conversationId, title });
    if (!parsed.success) {
      return { success: false, error: "Enter a title up to 80 characters." };
    }

    const updated = await db.moonieConversation.updateMany({
      where: { id: parsed.data.conversationId, userId },
      data: { title: parsed.data.title },
    });
    if (updated.count === 0) {
      return { success: false, error: "Conversation not found." };
    }

    revalidatePath("/moonie");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not rename conversation.",
    };
  }
}

export async function pinMoonieConversationAction(
  conversationId: string,
  pinned: boolean
): Promise<MoonieActionResult> {
  noStore();
  try {
    const userId = await requireUserId();
    if (pinned) {
      const pinnedCount = await db.moonieConversation.count({
        where: {
          userId,
          pinnedAt: { not: null },
          id: { not: conversationId },
        },
      });
      if (pinnedCount >= MOONIE_MAX_PINNED_CONVERSATIONS) {
        return {
          success: false,
          error: `You can pin up to ${MOONIE_MAX_PINNED_CONVERSATIONS} chats.`,
        };
      }
    }

    const updated = await db.moonieConversation.updateMany({
      where: { id: conversationId, userId },
      data: { pinnedAt: pinned ? new Date() : null },
    });
    if (updated.count === 0) {
      return { success: false, error: "Conversation not found." };
    }

    revalidatePath("/moonie");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not update pin state.",
    };
  }
}
