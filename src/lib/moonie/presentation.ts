import type { MoonieChatMessage, MoonieRecommendation } from "@/types/moonie";
import { isNovelReviewRequest } from "@/lib/moonie/intent";
import { slateDiversityLine, tasteUsedLabels } from "@/lib/moonie/desk";

const READING_LINK_REQUEST_RE =
  /\b(where can i read|where to read|reading link|novel link|read(?:ing)?\s+link|(?:can you\s+)?(?:give|get|send)\s+me\s+(?:the\s+)?link|(?:give|get|send)\s+me\s+link|(?:the\s+)?link\s+(?:for|of)|official (?:source|link)|verified source|reading source|find\s+me\b[\s\S]*\blink\b|find (?:me )?(?:the\s+)?link|publisher site)\b/i;

const RECOMMEND_REQUEST_RE =
  /\b(recommend|suggest|something like|more like|in the mood|what should i read|pick(?:s)? for me|surprise me|discover)\b/i;

const FIND_NOVEL_REQUEST_RE =
  /\b(find(?:\s+me)?|look(?:ing)?\s+up|lookup|search for|tell me about|what is|who wrote)\b/i;

const TASTE_SUMMARY_RE = /^I matched \d+ MoonVerse/i;

export type MoonieCardDensity = "widget" | "desk";
export type MoonieCardMode =
  | "recommendation"
  | "reading_link"
  | "overview"
  | "reviews"
  | "reviewers"
  | "reviewer_detail"
  | "reviewer_group_detail"
  | "series";

export type MoonieReplyIntent =
  | "reading_link"
  | "find_novel"
  | "novel_reviews"
  | "find_reviewers"
  | "reviewer_overview"
  | "recommend"
  | "ambiguous"
  | "chat";

export function isReadingLinkRequest(query: string): boolean {
  if (isNovelReviewRequest(query)) return false;
  return READING_LINK_REQUEST_RE.test(query.trim());
}

export function isRecommendRequest(query: string): boolean {
  return RECOMMEND_REQUEST_RE.test(query.trim().toLowerCase());
}

export function isFindNovelRequest(query: string): boolean {
  const queryText = query.trim().toLowerCase();
  if (isReadingLinkRequest(query)) return false;
  if (isRecommendRequest(query)) return false;
  if (FIND_NOVEL_REQUEST_RE.test(queryText)) return true;
  return /\bfind\s+me\b/i.test(queryText) && !/\b(recommend|suggest|mood|genre)\b/i.test(queryText);
}

export function isLikelyTitleLookup(query: string): boolean {
  return isReadingLinkRequest(query) || isFindNovelRequest(query);
}

export function resolveMoonieReplyIntent(
  message: MoonieChatMessage,
  userQuery: string
): MoonieReplyIntent {
  const analyticsIntent = message.analyticsIntent;
  if (analyticsIntent === "reading_source") return "reading_link";
  if (analyticsIntent === "novel_reviews") return "novel_reviews";
  if (analyticsIntent === "find_reviewers") return "find_reviewers";
  if (analyticsIntent === "reviewer_overview") return "reviewer_overview";
  if (analyticsIntent === "find_novel" || analyticsIntent === "novel_overview") {
    return "find_novel";
  }
  if (
    analyticsIntent === "recommend" ||
    analyticsIntent === "refine" ||
    analyticsIntent === "more_like_this"
  ) {
    return "recommend";
  }
  if (analyticsIntent === "compare") return "recommend";

  const candidates = message.lookupSession?.candidates ?? [];
  const recs = message.recommendations ?? [];

  if (candidates.length > 0 && recs.length === 0) {
    return "ambiguous";
  }

  if (isNovelReviewRequest(userQuery)) return "novel_reviews";
  if (isReadingLinkRequest(userQuery)) return "reading_link";
  if (isFindNovelRequest(userQuery)) return "find_novel";
  if (
    isRecommendRequest(userQuery) ||
    message.responseKind === "recommendations"
  ) {
    return "recommend";
  }
  if (message.responseKind === "novel_bundle" && recs.length === 1) {
    return isReadingLinkRequest(userQuery) ? "reading_link" : "find_novel";
  }

  return "chat";
}

function hasVerifiedReadingSource(rec: MoonieRecommendation): boolean {
  return (
    rec.sourceStatus === "verified" ||
    Boolean(rec.primaryReadUrl) ||
    (rec.readingSources?.length ?? 0) > 0
  );
}

function readingLinkReply(title: string, rec?: MoonieRecommendation): string {
  if (rec && !hasVerifiedReadingSource(rec)) {
    return `I found ${title}, but I couldn't verify a reading link on MoonVerse yet.`;
  }
  return `I found ${title}. Here's where you can read it.`;
}

function stripBackendMarkdown(content: string): string {
  return content.replace(/\*\*/g, "").trim();
}

export function moonieDisplayContent(
  message: MoonieChatMessage,
  userQuery: string
): string {
  if (message.role !== "assistant" || message.isError) {
    return message.content;
  }

  const recs = message.recommendations ?? [];
  const candidates = message.lookupSession?.candidates ?? [];
  const intent = resolveMoonieReplyIntent(message, userQuery);
  const primaryTitle = recs[0]?.title;

  if (intent === "find_reviewers") {
    const firstBlock = stripBackendMarkdown(message.content).split(/\n\n+/)[0]?.trim();
    return firstBlock || message.content;
  }

  if (intent === "reviewer_overview") {
    const firstBlock = stripBackendMarkdown(message.content).split(/\n\n+/)[0]?.trim();
    return firstBlock || message.content;
  }

  if (intent === "ambiguous") {
    if (candidates.length > 1) {
      return "I found a few possible matches. Which one do you mean?";
    }
    return "I think this might be the one. Does it look right?";
  }

  if (intent === "reading_link" && primaryTitle) {
    return readingLinkReply(primaryTitle, recs[0]);
  }

  if (intent === "novel_reviews") {
    const firstBlock = stripBackendMarkdown(message.content).split(/\n\n+/)[0]?.trim();
    if (firstBlock) return firstBlock;
    if (primaryTitle) {
      const count = message.novelOverview?.community?.reviewCount ?? 0;
      if (count === 0) {
        return `There aren't any MoonVerse reviews for ${primaryTitle} yet.`;
      }
      return `I found ${count} MoonVerse review${count === 1 ? "" : "s"} for ${primaryTitle}.`;
    }
  }

  if (intent === "find_novel" && primaryTitle) {
    return `I found ${primaryTitle} in MoonVerse.`;
  }

  if (intent === "recommend" && recs.length > 0) {
    if (TASTE_SUMMARY_RE.test(message.content.trim())) {
      return recs.length === 1
        ? "I found a match based on what you asked for."
        : "I found a few matches based on what you asked for.";
    }
    const firstLine = stripBackendMarkdown(message.content).split(/\n+/)[0]?.trim();
    if (firstLine && firstLine.length <= 220 && !TASTE_SUMMARY_RE.test(firstLine)) {
      return firstLine;
    }
    return recs.length === 1
      ? "I found a match based on what you asked for."
      : "I found a few matches based on what you asked for.";
  }

  if (isLikelyTitleLookup(userQuery) && TASTE_SUMMARY_RE.test(message.content.trim())) {
    if (recs.length === 1 && primaryTitle) {
      return isReadingLinkRequest(userQuery)
        ? readingLinkReply(primaryTitle, recs[0])
        : `I found ${primaryTitle} in MoonVerse.`;
    }
    if (recs.length > 1) {
      return "I found a few possible matches. Which one do you mean?";
    }
  }

  if (
    recs.length === 1 &&
    primaryTitle &&
    message.responseKind === "novel_bundle" &&
    !isRecommendRequest(userQuery)
  ) {
    return isReadingLinkRequest(userQuery)
      ? readingLinkReply(primaryTitle, recs[0])
      : `I found ${primaryTitle} in MoonVerse.`;
  }

  return stripBackendMarkdown(message.content);
}

/** Text safe to copy — mirrors the visible assistant reply. */
export function moonieCopyableContent(
  message: MoonieChatMessage,
  userQuery: string
): string {
  return moonieDisplayContent(message, userQuery);
}

export function resolveMoonieCardMode(
  message: MoonieChatMessage,
  userQuery: string
): MoonieCardMode {
  if (
    message.analyticsIntent === "find_reviewers" &&
    (message.reviewerResults?.length ?? 0) > 0
  ) {
    return "reviewers";
  }

  if (
    message.analyticsIntent === "reviewer_overview" &&
    message.reviewerGroupOverview
  ) {
    return "reviewer_group_detail";
  }

  if (
    message.analyticsIntent === "reviewer_overview" &&
    message.reviewerOverview
  ) {
    return "reviewer_detail";
  }

  if (message.analyticsIntent === "novel_reviews") {
    return "reviews";
  }

  if (message.analyticsIntent === "novel_series" && message.seriesInfo) {
    return "series";
  }

  const intent = resolveMoonieReplyIntent(message, userQuery);
  const recs = message.recommendations ?? [];

  if (recs.length === 1 && intent === "reading_link") {
    return "reading_link";
  }
  if (intent === "novel_reviews") {
    return "reviews";
  }
  if (message.responseKind === "novel_bundle" && recs.length === 1) {
    return "overview";
  }
  return "recommendation";
}

export function formatPublicationStatus(status?: string | null): string | null {
  if (!status) return null;
  return status.replace(/_/g, " ");
}

export function primaryReason(recommendation: MoonieRecommendation): string {
  const reasons = recommendation.reasons?.length
    ? recommendation.reasons
    : [recommendation.reason];
  return reasons[0] ?? "";
}

export function hasResultDiagnostics(
  message: MoonieChatMessage,
  options?: {
    prefs?: import("@/types/moonie").MoonieInterpretedPreferences | null;
    hiddenCount?: number;
  }
): boolean {
  const prefs = options?.prefs ?? message.interpretedPreferences;
  const used = tasteUsedLabels(prefs);
  const excluded = prefs?.excludedTags ?? [];
  const recs = message.recommendations ?? [];
  const rec = recs[0];

  return (
    used.length > 0 ||
    excluded.length > 0 ||
    recs.length > 1 ||
    Boolean(rec?.matchPercent != null) ||
    Boolean(rec?.provenance?.length) ||
    Boolean(rec?.matchEvidence?.length) ||
    Boolean(rec?.scoreBreakdown) ||
    Boolean(rec?.personalizationReasons?.length) ||
    (options?.hiddenCount ?? 0) > 0
  );
}

export function requestDiagnosticsSummary(
  message: MoonieChatMessage,
  options?: {
    prefs?: import("@/types/moonie").MoonieInterpretedPreferences | null;
    hiddenCount?: number;
  }
): string[] {
  const lines: string[] = [];
  const prefs = options?.prefs ?? message.interpretedPreferences;
  const used = tasteUsedLabels(prefs);
  const excluded = prefs?.excludedTags ?? [];

  if (used.length > 0) {
    lines.push(`Used this turn: ${used.join(", ")}`);
  }
  if (excluded.length > 0) {
    lines.push(`Excluded: ${excluded.join(", ")}`);
  }

  const recs = message.recommendations ?? [];
  if (recs.length > 0) {
    lines.push(slateDiversityLine(recs, options?.hiddenCount ?? 0));
  }

  return lines;
}

export function resolveMoonieQuickPrompts(
  message: MoonieChatMessage
): string[] {
  if (message.quickPrompts?.length) {
    return message.quickPrompts;
  }

  const followUp = message.followUpQuestion?.trim();
  if (!followUp?.toLowerCase().startsWith("quick starts:")) {
    return [];
  }

  return followUp
    .slice("quick starts:".length)
    .split(",")
    .map((part) => part.trim().replace(/[.!?…]+$/u, ""))
    .filter(Boolean);
}
