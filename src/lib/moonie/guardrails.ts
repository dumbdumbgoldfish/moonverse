import type { MoonieConfidence, MoonieRecommendation } from "@/types/moonie";

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

export function isValidUserMessage(message: string): boolean {
  return sanitizeUserMessage(message).length >= 3;
}

export function looksOffTopic(message: string): boolean {
  const trimmed = sanitizeUserMessage(message);
  if (!trimmed) return true;
  if (OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(trimmed))) return true;
  if (WEB_NOVEL_KEYWORDS.test(trimmed)) return false;
  // Short vague messages are still allowed — Moonie can ask for preferences
  return trimmed.length > 120;
}

export function offTopicRedirectReply(): string {
  return "I'm Moonie, your web novel recommendation companion! I can only suggest novels based on genres, tags, and MoonVerse reviews. Tell me what kind of story you're in the mood for — for example, fantasy romance with a strong female lead.";
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

export function parseRecommendationsPayload(
  raw: unknown
): { reply: string; recommendations: MoonieRecommendation[] } | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  const reply =
    typeof data.reply === "string"
      ? data.reply.trim()
      : "Here are some web novels you might enjoy!";
  const items = Array.isArray(data.recommendations) ? data.recommendations : [];

  const recommendations: MoonieRecommendation[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const title = typeof rec.title === "string" ? rec.title.trim() : "";
    const reason = typeof rec.reason === "string" ? rec.reason.trim() : "";
    if (!title || !reason) continue;

    recommendations.push({
      title,
      author: typeof rec.author === "string" ? rec.author.trim() : undefined,
      reason,
      genres: Array.isArray(rec.genres)
        ? rec.genres.filter((g): g is string => typeof g === "string").slice(0, 5)
        : [],
      tags: Array.isArray(rec.tags)
        ? rec.tags.filter((t): t is string => typeof t === "string").slice(0, 8)
        : undefined,
      confidence: normalizeConfidence(rec.confidence),
      reviewId:
        typeof rec.reviewId === "string" ? rec.reviewId : undefined,
      novelId: typeof rec.novelId === "string" ? rec.novelId : undefined,
    });

    if (recommendations.length >= 5) break;
  }

  if (recommendations.length < 3) return null;

  return { reply, recommendations: recommendations.slice(0, 5) };
}
