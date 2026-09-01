import {
  normalizeLookupQueryText,
  resolveOrdinalIndex,
} from "@/lib/moonie/intent";
import { pickStoredMoonieMetaField } from "@/lib/moonie/persist-assistant-turn";
import type { MoonieRankedReview } from "@/types/moonie";

export interface MoonieRankedReviewSession {
  novelId: string;
  novelTitle: string;
  reviews: MoonieRankedReview[];
}

function asStoredMetaRecord(meta: unknown): Record<string, unknown> | null {
  if (!meta || typeof meta !== "object") return null;
  return meta as Record<string, unknown>;
}

export function rankedReviewsFromStoredMeta(meta: unknown): MoonieRankedReview[] {
  const record = asStoredMetaRecord(meta);
  if (!record) return [];
  const reviews = pickStoredMoonieMetaField<MoonieRankedReview[]>(
    record,
    "rankedReviews"
  );
  return Array.isArray(reviews) ? reviews : [];
}

export function buildRankedReviewSessionFromMeta(
  meta: unknown
): MoonieRankedReviewSession | null {
  const reviews = rankedReviewsFromStoredMeta(meta);
  if (reviews.length === 0) return null;
  const first = reviews[0]!;
  return {
    novelId: first.novelId,
    novelTitle: first.novelTitle,
    reviews,
  };
}

export function isWhoWroteReviewQuestion(message: string): boolean {
  return /^who wrote\b/i.test(normalizeLookupQueryText(message).trim());
}

export function messageReferencesDisplayedReview(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim().toLowerCase();
  if (!text) return false;
  if (/\b(this|that|the)\s+review\b/.test(text)) return true;
  if (/\b(first|second|third|last|\d+(?:st|nd|rd|th)?)\s+review\b/.test(text)) {
    return true;
  }
  if (
    /\b(first|second|third|last)\s+one\b/.test(text) &&
    /\breview/.test(text)
  ) {
    return true;
  }
  return false;
}

export function resolveRankedReviewOrdinal(message: string): number | null {
  const text = normalizeLookupQueryText(message).trim().toLowerCase();
  if (!text) return null;

  const numbered = text.match(/\b(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+review\b/);
  if (numbered?.[1]) {
    return Math.max(0, Number.parseInt(numbered[1], 10) - 1);
  }

  const ordinal = resolveOrdinalIndex(message);
  if (ordinal != null && /\breview/.test(text)) {
    return ordinal;
  }

  return null;
}

export function pickRankedReviewByOrdinal(
  reviews: MoonieRankedReview[],
  ordinal: number
): MoonieRankedReview | null {
  if (reviews.length === 0) return null;
  const index =
    ordinal === -1
      ? reviews.length - 1
      : Math.min(Math.max(ordinal, 0), reviews.length - 1);
  return reviews[index] ?? null;
}

export function resolveDisplayedRankedReview(options: {
  message: string;
  session: MoonieRankedReviewSession | null;
}): {
  review: MoonieRankedReview | null;
  ambiguous: boolean;
} {
  const { message, session } = options;
  if (!session || session.reviews.length === 0) {
    return { review: null, ambiguous: false };
  }

  const ordinal = resolveRankedReviewOrdinal(message);
  if (ordinal != null) {
    return {
      review: pickRankedReviewByOrdinal(session.reviews, ordinal),
      ambiguous: false,
    };
  }

  if (session.reviews.length === 1) {
    return { review: session.reviews[0]!, ambiguous: false };
  }

  if (/\b(this|that|the)\s+review\b/i.test(message)) {
    return { review: null, ambiguous: true };
  }

  return { review: null, ambiguous: false };
}

export function resolveRankedReviewAuthorUsername(
  session: MoonieRankedReviewSession | null
): string | null {
  if (!session || session.reviews.length !== 1) return null;
  const username = session.reviews[0]?.reviewerUsername?.trim();
  return username || null;
}
