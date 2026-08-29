import { ContentModerationStatus } from "@prisma/client";

/** Light heuristic slur/abuse list. Intentionally small and blunt-edged. */
const FLAGGED_TERMS = [
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "kike",
  "spic",
  "chink",
  "tranny",
  "whore",
  "cunt",
];

const URL_PATTERN = /\bhttps?:\/\/[^\s]+/gi;

const SPAM_URL_HOST_HINTS = [
  "bit.ly",
  "tinyurl",
  "t.me",
  "wa.me",
  "discord.gg",
  "onlyfans",
  "telegram",
];

function countAllCapsWords(text: string): number {
  const words = text.split(/\s+/).filter((word) => word.length >= 4);
  return words.filter(
    (word) => word === word.toUpperCase() && /[A-Z]/.test(word)
  ).length;
}

function hasFlaggedTerm(text: string): boolean {
  const lower = text.toLowerCase();
  return FLAGGED_TERMS.some((term) => lower.includes(term));
}

function hasSpamUrls(text: string): boolean {
  const urls = text.match(URL_PATTERN) ?? [];
  if (urls.length >= 3) return true;
  return urls.some((url) =>
    SPAM_URL_HOST_HINTS.some((hint) => url.toLowerCase().includes(hint))
  );
}

function hasCapsFlood(text: string): boolean {
  if (text.trim().length < 20) return false;
  const capsWords = countAllCapsWords(text);
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  if (totalWords === 0) return false;
  return capsWords >= 6 || capsWords / totalWords > 0.6;
}

export function isPubliclyVisibleModerationStatus(
  status: ContentModerationStatus
): boolean {
  return status !== ContentModerationStatus.HIDDEN;
}

export interface ModerationCheckResult {
  status: ContentModerationStatus;
  reasons: string[];
}

/**
 * Heuristic auto-moderation. Never HIDDEN automatically: only flags for
 * human review. Admins can escalate to HIDDEN manually.
 */
export function checkContentModeration(text: string): ModerationCheckResult {
  const reasons: string[] = [];

  if (hasFlaggedTerm(text)) {
    reasons.push("Possible slur or abusive language detected.");
  }
  if (hasSpamUrls(text)) {
    reasons.push("Possible spam links detected.");
  }
  if (hasCapsFlood(text)) {
    reasons.push("Excessive capitalization detected.");
  }

  return {
    status:
      reasons.length > 0
        ? ContentModerationStatus.AUTO_FLAGGED
        : ContentModerationStatus.OK,
    reasons,
  };
}
