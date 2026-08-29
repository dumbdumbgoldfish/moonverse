import type { MoonieConfidence } from "@/types/moonie";

const OFF_TOPIC_PATTERNS = [
  /\b(write|draft|compose)\s+(a\s+)?review\b/i,
  /\bhelp me review\b/i,
  /\bhomework\b/i,
  /\bwrite code\b/i,
  /\bpolitics\b/i,
  /\bmedical advice\b/i,
];

const WEB_NOVEL_KEYWORDS =
  /\b(novel|web novel|book|read|genre|romance|fantasy|litrpg|xianxia|mc|protagonist|story|chapter|cultivation|dungeon|revenge|slow.?burn|female lead|male lead|completed|ongoing|recommend|tag)\b/i;

export function sanitizeUserMessage(message: string): string {
  return message.trim().slice(0, 500);
}

import { isAllowedShortMoonieMessage } from "@/lib/moonie/intent";

export function isValidUserMessage(message: string): boolean {
  return isAllowedShortMoonieMessage(sanitizeUserMessage(message));
}

export function looksOffTopic(message: string): boolean {
  const trimmed = sanitizeUserMessage(message);
  if (!trimmed) return true;
  if (OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(trimmed))) return true;
  if (WEB_NOVEL_KEYWORDS.test(trimmed)) return false;
  // Short vague messages are still allowed. Moonie can ask for preferences
  return trimmed.length > 120;
}

export function offTopicRedirectReply(): string {
  return "I'm Moonie, your web novel recommendation companion! I can only suggest novels based on genres, tags and MoonVerse reviews. Tell me what kind of story you're in the mood for. For example, fantasy romance with a strong female lead.";
}

export function normalizeConfidence(value: unknown): MoonieConfidence {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  if (typeof value === "number") {
    if (value >= 0.75) return "high";
    if (value >= 0.45) return "medium";
    return "low";
  }
  return "medium";
}
