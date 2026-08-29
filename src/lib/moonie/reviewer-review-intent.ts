import { normalizeConversationalInput, resolveOrdinalIndex } from "@/lib/moonie/intent";
import type { MoonieReviewerReviewEntry } from "@/types/moonie";

const ORDINAL_REVIEW_NOVEL_RE =
  /\b(?:the\s+)?(?:(?:first|second|third|last|\d+(?:st|nd|rd)?)|(?:top|number)\s+\d+)\s+(?:novel|review)\b/i;

const NOVEL_THEY_REVIEWED_RE =
  /\b(?:the\s+)?(?:(?:first|second|third|last|\d+(?:st|nd|rd)?)|(?:top|number)\s+\d+)\s+novel\s+they\s+reviewed\b/i;

export type ReviewerReviewFollowUpTarget = "novel" | "review";

export type ReviewerReviewFollowUpKind =
  | "NOVEL_OVERVIEW"
  | "FIND_READING_SOURCE"
  | "NOVEL_REVIEWS"
  | "REVIEW_DETAIL";

function normalizeText(message: string): string {
  return normalizeConversationalInput(message).toLowerCase();
}

/** True when the user is referring to a row in the active reviewer-review list. */
export function messageReferencesReviewerReviewSession(message: string): boolean {
  const text = normalizeText(message);
  if (!text) return false;

  if (NOVEL_THEY_REVIEWED_RE.test(text)) return true;

  if (
    /\bwhere\s+(?:can\s+i\s+)?read\b/.test(text) &&
    /\bnovel\s+they\s+reviewed\b/.test(text)
  ) {
    return true;
  }

  if (
    /\b(?:show|see|view)\s+(?:me\s+)?(?:all\s+)?reviews?\s+for\b/.test(text) &&
    /\bnovel\s+they\s+reviewed\b/.test(text)
  ) {
    return true;
  }

  if (/\bwhat\s+novel\b/.test(text) && /\breview\b/.test(text)) {
    return true;
  }

  if (/\bopen\b/.test(text) && ORDINAL_REVIEW_NOVEL_RE.test(text)) {
    return true;
  }

  if (ORDINAL_REVIEW_NOVEL_RE.test(text) && /\bthey\s+reviewed\b/.test(text)) {
    return true;
  }

  if (
    ORDINAL_REVIEW_NOVEL_RE.test(text) &&
    /\b(?:their|the reviewer(?:'s)?)\s+review/.test(text)
  ) {
    return true;
  }

  if (
    ORDINAL_REVIEW_NOVEL_RE.test(text) &&
    /\b(?:tell|more)\s+(?:me\s+)?about\b/.test(text)
  ) {
    return true;
  }

  if (ORDINAL_REVIEW_NOVEL_RE.test(text) && /\bshow\s+me\b/.test(text)) {
    return true;
  }

  return false;
}

export function resolveReviewerReviewOrdinalFromMessage(
  message: string
): number | null {
  const text = normalizeText(message);

  const topMatch = text.match(/\b(?:top|number)\s+(\d{1,2})\s+(?:novel|review)\b/);
  if (topMatch?.[1]) {
    return Math.max(0, Number.parseInt(topMatch[1], 10) - 1);
  }

  if (!ORDINAL_REVIEW_NOVEL_RE.test(text)) return null;
  return resolveOrdinalIndex(message);
}

export function resolveReviewerReviewFollowUpTarget(
  message: string
): ReviewerReviewFollowUpTarget {
  const text = normalizeText(message);

  if (NOVEL_THEY_REVIEWED_RE.test(text)) return "novel";
  if (/\bwhat\s+novel\b/.test(text) && /\breview\b/.test(text)) return "novel";
  if (
    /\b(?:show|see|view)\s+(?:me\s+)?(?:all\s+)?reviews?\s+for\b/.test(text) &&
    /\bnovel\b/.test(text)
  ) {
    return "novel";
  }
  if (/\bwhere\s+(?:can\s+i\s+)?read\b/.test(text) && /\bnovel\b/.test(text)) {
    return "novel";
  }
  if (/\b(?:tell|more)\s+(?:me\s+)?about\b/.test(text) && /\bnovel\b/.test(text)) {
    return "novel";
  }

  if (
    ORDINAL_REVIEW_NOVEL_RE.test(text) &&
    /\breview\b/.test(text) &&
    !/\bnovel\b/.test(text)
  ) {
    return "review";
  }

  if (/\bopen\b/.test(text) && /\breview\b/.test(text)) return "review";

  return "novel";
}

export function resolveReviewerReviewFollowUpKind(
  message: string
): ReviewerReviewFollowUpKind {
  const text = normalizeText(message);

  if (
    /\b(?:show|see|view)\s+(?:me\s+)?(?:all\s+)?reviews?\s+for\b/.test(text)
  ) {
    return "NOVEL_REVIEWS";
  }

  if (/\bwhere\s+(?:can\s+i\s+)?read\b/.test(text)) {
    return "FIND_READING_SOURCE";
  }

  if (resolveReviewerReviewFollowUpTarget(message) === "review") {
    return "REVIEW_DETAIL";
  }

  return "NOVEL_OVERVIEW";
}

export function pickReviewerReviewByOrdinal(
  reviews: MoonieReviewerReviewEntry[],
  ordinal: number
): MoonieReviewerReviewEntry | null {
  if (reviews.length === 0) return null;
  const index =
    ordinal === -1
      ? reviews.length - 1
      : Math.min(Math.max(ordinal, 0), reviews.length - 1);
  return reviews[index] ?? null;
}
