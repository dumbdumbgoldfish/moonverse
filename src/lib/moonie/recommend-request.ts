import type { MoonieSessionPreferences } from "@/lib/moonie/personalization";
import type {
  MoonieChatMessage,
  MooniePersistedUserAttachment,
  MoonieSpoilerMode,
} from "@/types/moonie";

/**
 * Build the POST body for `/api/moonie/recommend`.
 *
 * Optional API fields must be omitted when unused — never send `null` unless the
 * route schema explicitly allows `.nullable()`.
 */
export interface MoonieRecommendRequestInput {
  message: string;
  conversationId?: string | null;
  similarToNovelId?: string;
  excludeNovelIds?: string[];
  useTaste?: boolean;
  contextNovelId?: string;
  contextNovelTitle?: string;
  attachmentType?: "image" | "file" | null;
  imageData?: string | null;
  imageMimeType?: string | null;
  fileData?: string | null;
  fileName?: string | null;
  fileMimeType?: string | null;
  spoilerMode: MoonieSpoilerMode;
  sessionPreferences?: MoonieSessionPreferences | null;
  recentSearches?: Array<{ query: string; novelId?: string }>;
  userAttachmentMeta?: MooniePersistedUserAttachment | null;
  guestDemo?: boolean;
  newConversation?: boolean;
  priorMessages?: Array<{
    role: "user" | "assistant";
    content: string;
    meta?: Record<string, unknown>;
  }>;
}

function buildAssistantPriorMeta(
  message: MoonieChatMessage
): Record<string, unknown> | undefined {
  if (message.role !== "assistant") return undefined;
  const meta: Record<string, unknown> = {};
  if (message.recommendations?.length) {
    meta.recommendations = message.recommendations;
  }
  if (message.compare) meta.compare = message.compare;
  if (message.lookupSession) meta.lookupSession = message.lookupSession;
  if (message.novelOverview) meta.novelOverview = message.novelOverview;
  if (message.responseKind) meta.responseKind = message.responseKind;
  if (message.reviewerResults?.length) {
    meta.reviewerResults = message.reviewerResults;
  }
  if (message.reviewerSession) meta.reviewerSession = message.reviewerSession;
  if (message.reviewerOverview) meta.reviewerOverview = message.reviewerOverview;
  if (message.reviewerGroupOverview) {
    meta.reviewerGroupOverview = message.reviewerGroupOverview;
  }
  if (message.reviewerReviewSession) {
    meta.reviewerReviewSession = message.reviewerReviewSession;
  }
  if (message.seriesInfo) meta.seriesInfo = message.seriesInfo;
  return Object.keys(meta).length > 0 ? meta : undefined;
}

export function buildGuestPriorMessages(messages: MoonieChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
    meta: buildAssistantPriorMeta(message),
  }));
}

export function buildMoonieRecommendRequestBody(
  input: MoonieRecommendRequestInput
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    message: input.message,
    spoilerMode: input.spoilerMode,
    excludeNovelIds: input.excludeNovelIds ?? [],
  };

  if (input.conversationId) {
    body.conversationId = input.conversationId;
  }
  if (input.similarToNovelId) {
    body.similarToNovelId = input.similarToNovelId;
  }
  if (input.useTaste !== undefined) {
    body.useTaste = input.useTaste;
  }
  if (input.contextNovelId) {
    body.contextNovelId = input.contextNovelId;
  }
  if (input.contextNovelTitle) {
    body.contextNovelTitle = input.contextNovelTitle;
  }

  if (input.attachmentType === "image" && input.imageData) {
    body.attachmentType = "image";
    body.imageData = input.imageData;
    if (input.imageMimeType) {
      body.imageMimeType = input.imageMimeType;
    }
  } else if (input.attachmentType === "file" && input.fileData) {
    body.attachmentType = "file";
    body.fileData = input.fileData;
    if (input.fileName) {
      body.fileName = input.fileName;
    }
    if (input.fileMimeType) {
      body.fileMimeType = input.fileMimeType;
    }
  }

  const sessionPreferences = input.sessionPreferences;
  if (sessionPreferences && Object.keys(sessionPreferences).length > 0) {
    body.sessionPreferences = sessionPreferences;
  }

  const recentSearches = input.recentSearches;
  if (recentSearches?.length) {
    body.recentSearches = recentSearches.map((entry) =>
      entry.novelId
        ? { query: entry.query, novelId: entry.novelId }
        : { query: entry.query }
    );
  }

  if (input.userAttachmentMeta) {
    body.userAttachmentMeta = input.userAttachmentMeta;
  }
  if (input.guestDemo) {
    body.guestDemo = true;
  }
  if (input.newConversation) {
    body.newConversation = true;
  }
  if (input.priorMessages?.length) {
    body.messages = input.priorMessages.map((entry) => {
      const payload: Record<string, unknown> = {
        role: entry.role,
        content: entry.content,
      };
      if (entry.meta && Object.keys(entry.meta).length > 0) {
        payload.meta = entry.meta;
      }
      return payload;
    });
  }

  return body;
}
