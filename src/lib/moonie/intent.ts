import type {
  MoonieInterpretedPreferences,
  MoonieLookupPendingIntent,
} from "@/types/moonie";
import {
  buildConversationalState,
  isUnrelatedFactualQuestion,
  resolveConversationalFollowUp,
} from "@/lib/moonie/conversational-state";
import {
  extractReviewerLookupQuery,
  isCommunityPeopleQuery,
  isReviewerAuthoredReviewsMessage,
  isReviewerOverviewMessage,
  isReviewerRankingMessage,
  isReviewerDetailsFollowUpMessage,
  messageReferencesActiveReviewer,
  messageReferencesReviewerGroup,
} from "@/lib/moonie/reviewer-intent";
import {
  messageReferencesReviewerReviewSession,
  resolveReviewerReviewFollowUpKind,
} from "@/lib/moonie/reviewer-review-intent";
import {
  isSeriesFollowUpMessage,
  isSeriesQueryMessage,
} from "@/lib/moonie/series-intent";
import { isMoonieDeskChipPrompt } from "@/lib/moonie/desk";

export type MoonieIntent =
  | "GREETING"
  | "CHAT"
  | "SMALL_TALK"
  | "HELP"
  | "IDENTITY"
  | "THANKS"
  | "RECOMMEND"
  | "FIND_NOVEL"
  | "FIND_READING_SOURCE"
  | "NOVEL_OVERVIEW"
  | "NOVEL_REVIEWS"
  | "COMPARE"
  | "REFINE"
  | "MORE_LIKE_THIS"
  | "IMAGE_LOOKUP"
  | "FILE_LOOKUP"
  | "FIND_REVIEWERS"
  | "REVIEWER_OVERVIEW"
  | "NOVEL_SERIES";

export interface MoonieIntentContext {
  hasPriorRecommendations?: boolean;
  hasActiveNovel?: boolean;
  hasPriorReviewerResults?: boolean;
  hasPriorReviewerReviewSession?: boolean;
  hasActiveReviewer?: boolean;
  hasConversationPrefs?: boolean;
  attachmentType?: "image" | "file" | null;
  recentMessages?: Array<{ role: string; content: string }>;
  pendingLookupIntent?: MoonieLookupPendingIntent | null;
}

const GREETING_RE =
  /^(hi|hey|hello|yo|hiya|howdy|sup)\b[!?.…\s]*$/i;

const SMALL_TALK_RE =
  /^(?:how(?:'s| is) it going|how are (?:you|u)(?: doing)?|you(?:'re| are) okay|are you okay|good\s+(?:morning|afternoon|evening)|(?:nice|great|pleased|good)\s+to\s+meet\s+you|you(?:'re| are) (?:so )?(?:cute|sweet|adorable|lovely)|i (?:like|love) (?:you|moonie))\b[!?.…\s]*$/i;

const THANKS_RE =
  /^(thanks|thank you|ty|thx|appreciate it|cheers)\b[!?.…\s]*$/i;

const HELP_RE =
  /\b(what can you do|how can you help(?: me)?|how do you work|help me|what do you do)\b/i;

const IDENTITY_RE =
  /\b(what(?:'s| is) your name|what can i call you|who are you|what are you(?!\s+reading)|are you moonie|tell me about yourself)\b/i;

const MOONIE_NAME_REFERENCE_RE =
  /^(?:(?:hey|hi|hello|yo|hiya|howdy)\s+)?moonie[!.?…\s]*$/i;

/** Normalize Unicode punctuation/whitespace for conversational intent matching only. */
export function normalizeConversationalInput(message: string): string {
  return message
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u2032`´]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Common whole-word abbreviations readers use in catalogue title lookups. */
const LOOKUP_WORD_ABBREVIATIONS: Readonly<Record<string, string>> = {
  gp: "group",
  grp: "group",
};

function expandLookupWordAbbreviations(text: string): string {
  return text
    .split(/\s+/)
    .map((token) => LOOKUP_WORD_ABBREVIATIONS[token.toLowerCase()] ?? token)
    .join(" ");
}

/** Normalize catalogue title queries for exact/fuzzy lookup (apostrophes, whitespace). */
export function normalizeLookupQueryText(message: string): string {
  return expandLookupWordAbbreviations(normalizeConversationalInput(message));
}

export function isMoonieNameReference(message: string): boolean {
  return MOONIE_NAME_REFERENCE_RE.test(
    normalizeConversationalInput(message).toLowerCase()
  );
}

export function isIdentityMessage(message: string): boolean {
  const text = normalizeConversationalInput(message).toLowerCase();
  if (MOONIE_NAME_REFERENCE_RE.test(text)) {
    return true;
  }
  return IDENTITY_RE.test(text);
}

const READING_SOURCE_RE =
  /\b(where can i read|where to read|reading links?|read(?:ing)?\s+links?|novel\s+link|(?:can you\s+)?(?:give|get|send)\s+me\s+(?:the\s+)?link|(?:do you have|have you got|got)\s+(?:a|an|the)\s+(?:official\s+)?link|(?:the\s+)?link\s+(?:for|of)|official (?:source|link)|verified (?:reading\s+)?(?:source|links?)|reading source|find (?:me )?(?:the\s+)?(?:verified\s+)?(?:reading\s+)?(?:source|links?)|find (?:me )?(?:the\s+)?(?:.+?\s+)?(?:novel\s+)?link|publisher site)\b/i;

const NON_TITLE_LOOKUP_PHRASE_RE = [
  /^find\s+(?:the\s+)?(?:verified\s+)?reading\s+links?\s*[?.!]*$/i,
  /^verified\s+reading\s+links?\s*[?.!]*$/i,
  /^(?:can you\s+)?(?:give|get|send)(?:\s+me)?(?:\s+the)?\s+link\s*[?.!]*$/i,
  /^(?:give|get|send)\s+me\s+(?:the\s+)?(?:a\s+)?(?:novel\s+)?(?:reading\s+)?links?\s*[?.!]*$/i,
  /^(?:the\s+)?(?:novel\s+)?(?:reading\s+)?link\s*[?.!]*$/i,
  /^(?:show(?:\s+me)?\s+)?(?:all\s+)?reviews?\s*[?.!]*$/i,
  /^(?:summarize|summarise)\s+(?:what\s+)?(?:moonverse\s+)?readers\s+think\s*[?.!]*$/i,
  /^tell\s+me\s+more\s*[?.!]*$/i,
  /^and\??\s*$/i,
  /^find\s+(?:a\s+)?novel\s+with\s+verified\s+series\s+data\s*[?.!]*$/i,
  /^(?:please\s+)?use\s+(?:my|your)\s+(?:saved\s+)?(?:preferences?|taste(?:\s+profile)?|profile)\s*[?.!]*$/i,
  /^(?:based|rely)\s+on\s+(?:my|your)\s+(?:saved\s+)?(?:preferences?|taste(?:\s+profile)?)\s*[?.!]*$/i,
  /^(?:from|with)\s+my\s+(?:saved\s+)?(?:preferences?|taste(?:\s+profile)?)\s*[?.!]*$/i,
] as const;

const USE_SAVED_PREFERENCES_RE =
  /\b(?:(?:use|apply|follow)\s+(?:my|your)\s+(?:saved\s+)?(?:preferences?|taste(?:\s+profile)?|profile)|(?:based|rely)\s+on\s+(?:my|your)\s+(?:saved\s+)?(?:preferences?|taste(?:\s+profile)?)|(?:from|with)\s+my\s+(?:saved\s+)?(?:preferences?|taste(?:\s+profile)?))\b/i;

/** Explicit ask to rank from the user's saved taste profile — not a catalogue title. */
export function isUseSavedPreferencesRequest(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim();
  if (!text) return false;
  return USE_SAVED_PREFERENCES_RE.test(text);
}

const CONVERSATIONAL_LOOKUP_FRAGMENTS = new Set([
  "give me",
  "get me",
  "send me",
  "show me",
  "find me",
  "the link",
  "novel link",
  "reading link",
  "a link",
  "the novel",
]);

/** Imperative fragments that must never be treated as catalogue titles. */
export function isConversationalLookupFragment(candidate: string): boolean {
  const normalized = normalizeLookupQueryText(candidate).trim().toLowerCase();
  if (CONVERSATIONAL_LOOKUP_FRAGMENTS.has(normalized)) return true;
  return /^(?:give|get|send|show|find)\s+me$/i.test(normalized);
}

const NOVEL_LOOKUP_RE =
  /\b(find (?:me )?(?:the )?(?:novel|book)|look up|search for|tell me about|what is|who wrote)\b/i;

const NOVEL_QUESTION_RE =
  /\b(is it completed|is there romance|is (?:the )?mc|op|overpowered|worth reading|slow.?burn|angst|spoiler)\b/i;

const COMPARE_RE =
  /\b(which should i read|compare|vs\.?|versus|or\b.*\bor\b)\b/i;

const REFINE_RE =
  /\b(less|more|no |without|darker|lighter|completed only|hidden gem|underrated|similar but|not too|strong fl|low romance|no romance|no harem|no angst|faster|shorter|wider|broaden)\b/i;

const RECOMMEND_RE =
  /\b(recommend|suggest|something|mood for|want to read|in the mood|discover|surprise me|hidden gem|safe pick|trending|more like)\b/i;

const ORDINAL_RE =
  /\b(the )?(first|second|third|1st|2nd|3rd|last|that|this) (one|pick|novel|book|title)\b/i;

const ORDINAL_TOP_RE =
  /\b(?:the )?top (one|pick|novel|book|title)\b/i;

export function isGreetingMessage(message: string): boolean {
  return GREETING_RE.test(normalizeConversationalInput(message));
}

export function isSmallTalkMessage(message: string): boolean {
  return SMALL_TALK_RE.test(normalizeConversationalInput(message).toLowerCase());
}

export function isAllowedShortMoonieMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (trimmed.length >= 3) return true;
  return isGreetingMessage(trimmed) || THANKS_RE.test(trimmed);
}

const NOVEL_QUERY_PRONOUNS = new Set(["it", "this", "that", "one", "them"]);

function isUsableNovelQuery(candidate: string): boolean {
  const normalized = candidate.trim().toLowerCase().replace(/[?.!]+$/, "");
  if (normalized.length < 2) return false;
  if (NOVEL_QUERY_PRONOUNS.has(normalized)) return false;
  if (isConversationalLookupFragment(normalized)) return false;
  return true;
}

export function isReadingSourceRequest(message: string): boolean {
  const text = message.trim().toLowerCase();
  if (containsReviewLinkPhrase(message) || isNovelReviewRequest(message)) {
    return false;
  }
  return READING_SOURCE_RE.test(text);
}

/** Reading-link ask with no catalogue title to look up (e.g. "give me link"). */
export function isBareReadingLinkRequest(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim();
  if (!isReadingSourceRequest(text)) return false;
  if (extractNovelQuery(text)) return false;
  if (extractDirectTitleQuery(text)) return false;
  if (messageReferencesActiveNovel(text)) return false;
  return true;
}

/** Strip only lowercase conversational articles — not title-leading A/An/The. */
export function stripConversationalLeadingArticle(candidate: string): string {
  const match = candidate.match(/^(a|an|the)\s+/);
  if (match?.[1] && match[1] === match[1].toLowerCase()) {
    return candidate.slice(match[0].length).trim();
  }
  return candidate.trim();
}

function cleanExtractedNovelQuery(candidate: string): string {
  return stripConversationalLeadingArticle(candidate)
    .replace(/^(?:novel|book)\s+/i, "")
    .replace(/[?.!]+$/, "")
    .trim();
}

const TRAILING_LOOKUP_TITLE_SUFFIXES = [
  /\s+web\s+novels?$/i,
  /\s+light\s+novels?$/i,
  /\s+reading\s+link$/i,
  /\s+novel\s+link$/i,
  /\s+novels?$/i,
  /\s+books?$/i,
  /\s+stories?$/i,
  /\s+manhua$/i,
  /\s+manhwa$/i,
  /\s+manga$/i,
  /\s+ln$/i,
] as const;

/** Strip trailing generic media words from an extracted catalogue title query. */
export function normalizeLookupTitle(candidate: string): string {
  let normalized = cleanExtractedNovelQuery(candidate);
  let changed = true;

  while (changed) {
    changed = false;
    for (const suffix of TRAILING_LOOKUP_TITLE_SUFFIXES) {
      const next = normalized.replace(suffix, "").trim();
      if (next !== normalized && next.length >= 2) {
        normalized = next;
        changed = true;
      }
    }
  }

  return normalized;
}

export function shouldSkipTasteExtraction(
  message: string,
  intents: MoonieIntent[]
): boolean {
  if (intents.includes("FIND_READING_SOURCE")) {
    return true;
  }
  if (intents.includes("NOVEL_REVIEWS") && isNovelReviewRequest(message)) {
    return true;
  }
  if (intents.includes("FIND_NOVEL") && extractNovelQuery(message)) {
    return true;
  }
  if (
    intents.some((intent) =>
      (
        [
          "NOVEL_OVERVIEW",
          "NOVEL_REVIEWS",
          "COMPARE",
        ] as MoonieIntent[]
      ).includes(intent)
    ) &&
    Boolean(extractDirectTitleQuery(message) ?? extractNovelQuery(message))
  ) {
    return true;
  }
  return false;
}

const REVIEW_LINK_PHRASE_RE = /\breview\s+links?\b/i;

/** Catalogue title extraction for explicit review/review-link requests. */
const REVIEW_TITLE_PATTERNS = [
  /(?:give|get|send|show)(?:\s+me)?\s+(?:all\s+)?(?:the\s+)?review\s+links?\s+(?:for|of|about)\s+(.+?)\s*$/i,
  /(?:give|get|send|show)(?:\s+me)?\s+(?:all\s+)?reviews?\s+(?:for|of|about)\s+(.+?)\s*$/i,
  /(?:find|show)(?:\s+me)?\s+(?:all\s+)?reviews?\s+(?:for|of|about)\s+(.+?)\s*$/i,
  /(?:find|show)(?:\s+me)?\s+(?:the\s+)?reviews?\s+(?:for|of|about)\s+(.+?)\s*$/i,
  /(?:what do|what do the) readers think (?:about|of)\s+(.+?)\s*$/i,
  /what are the reviews(?:\s+for|\s+of)?\s+(.+?)\s*$/i,
  /^review\s+links?\s+(?:for|of|about)\s+(.+?)\s*$/i,
  /^reviews?\s+(?:for|of|about)\s+(.+?)\s*$/i,
] as const;

const REVIEW_FOLLOW_UP_PATTERNS = [
  /^(?:give|get|send|show)(?:\s+me)?\s+(?:all\s+)?(?:the\s+)?review\s+links?\s*[?.!]*$/i,
  /^(?:give|get|send|show)(?:\s+me)?\s+(?:all\s+)?reviews?\s*[?.!]*$/i,
  /^(?:show(?:\s+me)?\s+)?(?:all\s+)?reviews?\s*[?.!]*$/i,
  /^(?:what do|what do the) readers think\s*[?.!]*$/i,
  /^(?:summarize|summarise)\s+(?:what\s+)?(?:moonverse\s+)?readers\s+think\s*[?.!]*$/i,
  /^(?:summarize|summarise)\s+what\s+readers\s+think\s*[?.!]*$/i,
  /^and\s+reviews?\s*[?.!]*$/i,
  /^review\s+link\s*[?.!]*$/i,
  /^find (?:the )?reviews?\s*[?.!]*$/i,
  /^(?:all\s+)?reviews?\s*[?.!]*$/i,
] as const;

const NOVEL_OVERVIEW_FOLLOW_UP_PATTERNS = [
  /^tell me\s+more\s*[?.!]*$/i,
  /^more\s+details?\s*[?.!]*$/i,
  /^more\s+(?:information|info)\s*[?.!]*$/i,
  /^(?:tell me\s+)?detail(?:ed)?\s+information\s*[?.!]*$/i,
  /^(?:tell me\s+)?(?:more|additional)\s+(?:details?|information|info)\s*[?.!]*$/i,
  /^(?:show|give)\s+me\s+more(?:\s+(?:details?|information|info))?\s*[?.!]*$/i,
  /^what about this one\s*[?.!]*$/i,
  /^details?\s*[?.!]*$/i,
] as const;

const READING_SOURCE_FOLLOW_UP_PATTERNS = [
  /^where\s+(?:can i\s+)?(?:to\s+)?read(?:\s+it)?\s*[?.!]*$/i,
  /^(?:can you\s+)?(?:give|get|send)(?:\s+me)?(?:\s+the)?\s+link\s*[?.!]*$/i,
  /^(?:the\s+)?(?:reading\s+)?link\s*[?.!]*$/i,
  /^novel\s+link\s*[?.!]*$/i,
  /^find\s+(?:the\s+)?(?:verified\s+)?reading\s+links?\s*[?.!]*$/i,
  /^verified\s+reading\s+links?\s*[?.!]*$/i,
] as const;

/** Phrases that look like lookups but must never be treated as catalogue titles. */
export function isNonTitleLookupPhrase(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim();
  if (MOONIE_GENERATED_FOLLOW_UP_RE.some((pattern) => pattern.test(text))) {
    return true;
  }
  return NON_TITLE_LOOKUP_PHRASE_RE.some((pattern) => pattern.test(text));
}

const MOONIE_GENERATED_FOLLOW_UP_RE = [
  /^want me to narrow this to romance, fantasy, cultivation, or something cosy\??$/i,
  /^would you prefer something adventurous, romantic, dark, or character-driven\??$/i,
  /^should i stick to completed novels, or are ongoing stories fine\??$/i,
  /^any tropes to avoid\??.*harem.*slow pacing\??$/i,
  /^want more like the top pick, or should i widen the search\??$/i,
] as const;

/** Moonie recommendation chips that must not trigger catalogue lookup. */
export function isMoonieGeneratedFollowUpQuestion(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim();
  return MOONIE_GENERATED_FOLLOW_UP_RE.some((pattern) => pattern.test(text));
}

/** Bare catalogue title with no lookup verb (e.g. "Cultivation Chat Group"). */
export function isBareCatalogueTitleQuery(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim();
  if (!text || text.length < 2 || text.length > 120) return false;
  if (isGreetingMessage(text)) return false;
  if (isSmallTalkMessage(text)) return false;
  if (THANKS_RE.test(text)) return false;
  if (isNonTitleLookupPhrase(text)) return false;
  if (isUnrelatedFactualQuestion(text)) return false;
  if (isLookupSessionReplyMessage(text)) return false;
  if (isMoonieGeneratedFollowUpQuestion(text)) return false;
  if (isMoonieDeskChipPrompt(text)) return false;
  if (extractDirectTitleQuery(text) || extractNovelQuery(text)) return false;
  if (/\?/.test(text)) return false;
  if (
    /^(should|would|can|could|do|does|is|are|what|which|who|when|where|why|how)\b/i.test(
      text
    )
  ) {
    return false;
  }
  if (RECOMMENDATION_DISCOVERY_RE.test(text)) return false;
  if (
    /^(find|recommend|suggest|show|give|get|tell|summarize|summarise|compare)\b/i.test(
      text
    )
  ) {
    return false;
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    const word = words[0]!.toLowerCase().replace(/[?.!]+$/, "");
    if (word.length < 4) return false;
    if (NOVEL_QUERY_PRONOUNS.has(word)) return false;
    if (isConversationalLookupFragment(word)) return false;
    if (/^(ok|okay|yes|no|yep|nah|cool|nice|great|hmm|hm|oh|ah|um|yo)$/i.test(word)) {
      return false;
    }
  } else if (words.length > 10) {
    return false;
  }

  if (isCommunityPeopleQuery(text)) return false;
  if (isReviewerOverviewMessage(text)) return false;
  if (isReviewerRankingMessage(text)) return false;
  if (isReviewerDetailsFollowUpMessage(text)) return false;
  if (/\breviewer\b/i.test(text)) return false;
  if (/^@[\w][\w.-]*$/i.test(text)) return false;
  if (/^their\b/i.test(text)) return false;

  return true;
}

/** Resolve a catalogue title from explicit patterns or a bare title reply. */
export function resolveLookupTitleQuery(
  message: string,
  intents: MoonieIntent[]
): string | null {
  const text = normalizeLookupQueryText(message).trim();
  const extracted =
    extractDirectTitleQuery(text) ??
    extractReviewNovelQuery(text) ??
    extractNovelQuery(text);
  if (extracted) return extracted;
  if (
    isBareCatalogueTitleQuery(text) &&
    intents.some((intent) => EXPLICIT_LOOKUP_INTENT_SET.has(intent))
  ) {
    return text;
  }
  return null;
}

/** Pending lookup intent when Moonie most recently asked for a catalogue title. */
export function resolveAwaitingCatalogueTitleIntent(
  messages: Array<{ role: string; content: string }>
): MoonieLookupPendingIntent | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const entry = messages[i];
    if (entry?.role !== "assistant") continue;
    const content = entry.content.toLowerCase();
    if (content.includes("which novel do you want a reading link for")) {
      return "FIND_READING_SOURCE";
    }
    if (content.includes("which novel would you like to see reviews for")) {
      return "NOVEL_REVIEWS";
    }
    if (content.includes("which novel would you like me to summarise")) {
      return "NOVEL_REVIEWS";
    }
    break;
  }
  return null;
}

/** Bare review ask with no embedded title and no active-novel pronoun. */
export function isBareReviewRequestWithoutNovel(message: string): boolean {
  if (extractReviewNovelQuery(message)) return false;
  const text = normalizeLookupQueryText(message).trim();
  return /^(?:show(?:\s+me)?\s+)?(?:all\s+)?reviews?\s*[?.!]*$/i.test(text);
}

/** Bare community-consensus ask with no embedded title. */
export function isBareCommunityConsensusRequestWithoutNovel(
  message: string
): boolean {
  if (extractReviewNovelQuery(message)) return false;
  const text = normalizeLookupQueryText(message).trim();
  return (
    /^(?:summarize|summarise)\s+(?:what\s+)?(?:moonverse\s+)?readers\s+think\s*[?.!]*$/i.test(
      text
    ) ||
    /^(?:what do|what do the) readers think\s*[?.!]*$/i.test(text)
  );
}

/** Vague continuation with no embedded catalogue title. */
export function isVagueContinuationRequest(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim();
  return /^(?:tell\s+me\s+more|and\??)\s*[?.!]*$/i.test(text);
}

function containsReviewLinkPhrase(message: string): boolean {
  return REVIEW_LINK_PHRASE_RE.test(
    normalizeLookupQueryText(message).toLowerCase()
  );
}

/** Extract the catalogue title from an explicit review-request phrase. */
export function extractReviewNovelQuery(message: string): string | null {
  const source = normalizeLookupQueryText(message);

  for (const pattern of REVIEW_TITLE_PATTERNS) {
    const match = source.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && isUsableNovelQuery(candidate)) {
      return normalizeLookupTitle(candidate);
    }
  }

  return null;
}

/** Review follow-up with no embedded title — uses active novel context. */
export function isReviewFollowUpMessage(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim();
  if (extractReviewNovelQuery(text)) return false;

  return REVIEW_FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(text));
}

/** Overview/detail follow-up with no embedded title — uses active novel context. */
export function isNovelOverviewFollowUpMessage(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim();
  if (extractNovelQuery(text) || extractReviewNovelQuery(text)) return false;

  return NOVEL_OVERVIEW_FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(text));
}

/** Reading-link follow-up with no embedded title — uses active novel context. */
export function isReadingSourceFollowUpMessage(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim();
  if (
    containsReviewLinkPhrase(text) ||
    isNovelReviewRequest(text) ||
    extractNovelQuery(text)
  ) {
    return false;
  }

  if (READING_SOURCE_FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  return (
    messageReferencesActiveNovel(text) &&
    READING_SOURCE_RE.test(text.toLowerCase())
  );
}

/**
 * Map a short contextual follow-up to a retrieval intent when a novel is already active.
 * Returns null when the message names a new title or is unrelated small talk.
 */
export function resolveNovelContextFollowUpIntent(
  message: string
): MoonieIntent | null {
  const text = normalizeLookupQueryText(message).trim();
  if (!text) return null;

  if (
    extractNovelQuery(text) &&
    !isNonTitleLookupPhrase(text) &&
    /\b(find|look up|search for|tell me about|what is)\b/i.test(text)
  ) {
    return null;
  }
  if (extractReviewNovelQuery(text)) return null;

  if (isNovelReviewRequest(text) || isReviewFollowUpMessage(text)) {
    return "NOVEL_REVIEWS";
  }
  if (isReadingSourceFollowUpMessage(text)) {
    return "FIND_READING_SOURCE";
  }
  if (isNovelOverviewFollowUpMessage(text)) {
    return "NOVEL_OVERVIEW";
  }

  return null;
}

export function isNovelContextFollowUpMessage(message: string): boolean {
  return resolveNovelContextFollowUpIntent(message) != null;
}

/** True for named-title review lookup or active-novel review follow-up. */
export function isNovelReviewRequest(message: string): boolean {
  const text = normalizeLookupQueryText(message);
  const lower = text.toLowerCase();

  if (extractReviewNovelQuery(text)) return true;
  if (isReviewFollowUpMessage(text)) return true;

  if (
    /\b(?:recommend|suggest|discover|something|mood for|want to read|surprise me|hidden gem)\b/i.test(
      lower
    )
  ) {
    return false;
  }

  return false;
}

export function extractNovelQuery(message: string): string | null {
  const source = normalizeLookupQueryText(message);

  if (isNonTitleLookupPhrase(source)) return null;
  if (isUnrelatedFactualQuestion(source)) return null;
  if (messageReferencesReviewerReviewSession(source)) return null;

  if (isNovelReviewRequest(source)) {
    return extractReviewNovelQuery(source);
  }

  const readingPatterns = [
    /(?:find|show)\s+(?:me\s+)?(.+?)\s+(?:novel\s+)?link\s*$/i,
    /(?:can you\s+)?(?:give|get|send)\s+me\s+(?:the\s+)?link\s+of\s+["“']?(.+?)["”']?\s*$/i,
    /(?:can you\s+)?(?:give|get|send)\s+me\s+(?:the\s+)?link\s+for\s+["“']?(.+?)["”']?\s*$/i,
    /(?:do you have|have you got|got)\s+(?:a|an|the\s+)?(?:official\s+)?(?:reading\s+)?link\s+(?:for|of)\s+["“']?(.+?)["”']?\s*$/i,
    /(?:the\s+)?(?:reading\s+)?link\s+(?:for|of)\s+["“']?(.+?)["”']?\s*$/i,
    /official\s+(?:reading\s+)?link\s+for\s+["“']?(.+?)["”']?\s*$/i,
    /where\s+(?:can\s+i\s+)?read\s+["“']?(.+?)["”']?\s*$/i,
    /where\s+to\s+read\s+["“']?(.+?)["”']?\s*$/i,
    /(?:find|show)\s+(?:me\s+)?(?:the\s+)?(?:reading\s+)?(?:source|link)\s+for\s+["“']?(.+?)["”']?\s*$/i,
    /(?:can you\s+)?(?:give|get|send)\s+me\s+(?:the\s+)?novel\s+link\s+(?:for|of)\s+["“']?(.+?)["”']?\s*$/i,
    /^(.+?)\s+novel\s+link\s*$/i,
    /^(.+?)\s+reading\s+link\s*$/i,
  ];

  for (const pattern of readingPatterns) {
    const match = source.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && isUsableNovelQuery(candidate)) {
      return normalizeLookupTitle(candidate);
    }
  }

  const patterns = [
    /(?:find|look up|search for|tell me about|what is)\s+(?:me\s+)?(?:the\s+)?(?:novel|book\s+)?["“]?(.+?)["”]?\s*$/i,
    /^(?:tell me\s+)?(?:more )?about\s+["“']?(.+?)["”']?\s*$/i,
    /where can i read\s+["“]?(.+?)["”]?\s*$/i,
    /["“](.+?)["”]/,
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    const candidate = match?.[1]?.trim();
    if (candidate && isUsableNovelQuery(candidate)) {
      return normalizeLookupTitle(candidate);
    }
  }
  return null;
}

export function extractCompareTitles(
  message: string,
  activeNovelTitle?: string | null
): string[] {
  if (activeNovelTitle && /\bcompare\s+it\b/i.test(message)) {
    const other = message
      .replace(/^.*?\bcompare\s+it\s+(?:with|and|vs\.?|versus)\s+/i, "")
      .replace(/[?.!]+$/, "")
      .trim();
    if (other.length >= 2) {
      return [activeNovelTitle, other].slice(0, 3);
    }
  }

  const quoted = [...message.matchAll(/["“]([^"”]+)["”]/g)]
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value && value.length >= 2));
  if (quoted.length >= 2) return quoted.slice(0, 3);

  const cleaned = message
    .replace(/\b(compare|which should i read|between)\b/gi, " ")
    .trim();

  const splitPatterns = [
    /\s+vs\.?\s+/i,
    /\s+versus\s+/i,
    /\s+and\s+/i,
    /\s+or\s+/i,
  ];

  for (const pattern of splitPatterns) {
    const parts = cleaned
      .split(pattern)
      .map((part) => part.replace(/[?.!]+$/, "").trim())
      .filter((part) => part.length >= 2);
    if (parts.length >= 2 && parts.length <= 3) {
      return parts.slice(0, 3);
    }
  }

  return [];
}

export function extractTitlesFromMultiline(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s\-*•\d.]+/, "").trim())
    .filter((line) => line.length >= 2 && !/^compare\b/i.test(line));

  if (lines.length >= 2 && lines.length <= 8) {
    return lines.slice(0, 3);
  }
  return [];
}

export function isCompareTheseMessage(message: string): boolean {
  return /\bcompare (these|them|those)\b/i.test(message.trim());
}

const REJECT_CANDIDATE_RE =
  /\b(not that one|wrong book|not this one|not this|none of these|that's not it|not the right (?:one|book)|no,? not that)\b/i;

const SHOW_ALTERNATIVES_RE =
  /\b(show alternatives|other options|what else|any others|other possibilities)\b/i;

const PARTIAL_MEMORY_RE =
  /\b(forgot the name|don't remember the title|can't remember the title|title had|something (?:like|about)|it was (?:a |about )|involved|i only remember|only remember)\b/i;

const CONFIRM_CANDIDATE_RE =
  /^(?:this one\s*[—\-:]|yes,?\s*(?:this\s+one|that(?:'s| is) (?:the )?one|the (?:right )?one))/i;

/** Normalize chip / follow-up text before lookup confirmation parsing. */
export function normalizeLookupConfirmationMessage(message: string): string {
  return message.trim().replace(/^try:\s*/i, "").trim();
}

export function isLookupSessionReplyMessage(message: string): boolean {
  const text = normalizeLookupConfirmationMessage(message);
  if (isRejectCandidateMessage(text)) return true;
  if (isShowAlternativesMessage(text)) return true;
  if (isConfirmCandidateMessage(text)) return true;
  if (resolveOrdinalIndex(text) != null) {
    return /^(?:the\s+)?(?:first|second|third|1st|2nd|3rd|last)\b/i.test(text);
  }
  return false;
}

export function isRejectCandidateMessage(message: string): boolean {
  return REJECT_CANDIDATE_RE.test(message.trim());
}

export function isShowAlternativesMessage(message: string): boolean {
  return SHOW_ALTERNATIVES_RE.test(message.trim());
}

export function isConfirmCandidateMessage(message: string): boolean {
  return CONFIRM_CANDIDATE_RE.test(
    normalizeLookupConfirmationMessage(message)
  );
}

export function isPartialMemoryQuery(message: string): boolean {
  const text = message.trim();
  if (!PARTIAL_MEMORY_RE.test(text)) return false;
  const exactLookup = extractNovelQuery(text);
  if (exactLookup && exactLookup.length <= 40 && !PARTIAL_MEMORY_RE.test(text)) {
    return false;
  }
  return true;
}

export function resolveOrdinalIndex(message: string): number | null {
  const text = message.toLowerCase();
  if (/\b(first|1st|top)\b/.test(text)) return 0;
  if (/\b(second|2nd)\b/.test(text)) return 1;
  if (/\b(third|3rd)\b/.test(text)) return 2;
  if (/\b(last)\b/.test(text)) return -1;
  return null;
}

/** True when the user is referring to the currently focused novel (not a new title). */
export function messageReferencesActiveNovel(message: string): boolean {
  const text = message.trim().toLowerCase();
  if (!text) return false;
  if (/\b(this one|that one|the one)\b/.test(text)) return true;
  if (/\b(where can i read it|is it completed|about it|read it)\b/.test(text)) {
    return true;
  }
  if (
    /\b(it|this|that)\b/.test(text) &&
    !extractNovelQuery(message) &&
    !extractDirectTitleQuery(message) &&
    !/\bcompare\s+[^.]+\s+(?:and|with|vs)\s+[^.]+\b/i.test(text)
  ) {
    return true;
  }
  return false;
}

export interface DirectTitleTask {
  intent: MoonieIntent;
  title: string;
}

const RECOMMENDATION_DISCOVERY_RE =
  /\b(recommend|suggest|something like|similar to|discover|surprise me|hidden gem|safe pick|trending|mood for|want to read|in the mood|what should i read|pick(?:s)? for me)\b/i;

/** Named-title task + catalogue title for explicit lookup routing. */
export function resolveDirectTitleTask(message: string): DirectTitleTask | null {
  const text = normalizeLookupQueryText(message).trim();
  if (!text || extractCompareTitles(text).length >= 2) return null;
  if (isNonTitleLookupPhrase(text)) return null;
  if (isUnrelatedFactualQuestion(text)) return null;
  if (isCommunityPeopleQuery(text)) return null;

  const reviewTitle = extractReviewNovelQuery(text);
  if (reviewTitle) {
    return { intent: "NOVEL_REVIEWS", title: reviewTitle };
  }

  const readingTitle = extractNovelQuery(text);
  if (
    readingTitle &&
    (isReadingSourceRequest(text) ||
      /\bnovel\s+link\b/i.test(text) ||
      /\breading\s+link\b/i.test(text) ||
      /\bwhere\s+(?:can i\s+)?read\b/i.test(text) ||
      /\bwhere\s+to\s+read\b/i.test(text))
  ) {
    return { intent: "FIND_READING_SOURCE", title: readingTitle };
  }

  if (readingTitle && /\b(find|look up|search for)\b/i.test(text)) {
    return { intent: "FIND_NOVEL", title: readingTitle };
  }

  if (
    readingTitle &&
    /\b(tell me about|what is|who wrote|more about)\b/i.test(text)
  ) {
    return { intent: "NOVEL_OVERVIEW", title: readingTitle };
  }

  return null;
}

export function extractDirectTitleQuery(message: string): string | null {
  return resolveDirectTitleTask(message)?.title ?? null;
}

export function isDirectTitleLookupMessage(message: string): boolean {
  return resolveDirectTitleTask(message) != null;
}

export function isRecommendationDiscoveryMessage(message: string): boolean {
  if (isDirectTitleLookupMessage(message)) return false;
  if (isBareCatalogueTitleQuery(message)) return false;
  if (isMoonieGeneratedFollowUpQuestion(message)) return false;

  if (isMoonieDeskChipPrompt(message)) return true;
  const text = normalizeLookupQueryText(message).toLowerCase();
  if (/\bmore like this\b/i.test(text)) return true;
  if (RECOMMENDATION_DISCOVERY_RE.test(text)) return true;
  // Taste-based requests without a named anchor still enter discovery.
  if (!extractDirectTitleQuery(message) && WEB_NOVEL_SIGNAL.test(text)) {
    return true;
  }
  return false;
}

export function classifyMoonieIntents(
  message: string,
  context: MoonieIntentContext = {}
): MoonieIntent[] {
  const text = normalizeConversationalInput(message);
  const lower = text.toLowerCase();
  const intents: MoonieIntent[] = [];

  if (context.attachmentType === "image") intents.push("IMAGE_LOOKUP");
  if (context.attachmentType === "file") intents.push("FILE_LOOKUP");

  if (isGreetingMessage(text)) intents.push("GREETING");
  if (THANKS_RE.test(text)) intents.push("THANKS");
  if (isIdentityMessage(text)) intents.push("IDENTITY");
  if (HELP_RE.test(lower)) intents.push("HELP");

  const reviewRequest = isNovelReviewRequest(text);
  const directTask = resolveDirectTitleTask(text);
  const communityPeopleQuery = isCommunityPeopleQuery(text);
  const awaitingCatalogueTitle =
    context.pendingLookupIntent ??
    (context.recentMessages
      ? resolveAwaitingCatalogueTitleIntent(context.recentMessages)
      : null);
  const moonieFollowUpChip = isMoonieGeneratedFollowUpQuestion(text);
  const reviewerOverviewRequest =
    isReviewerOverviewMessage(text) ||
    isReviewerAuthoredReviewsMessage(text) ||
    (context.hasPriorReviewerResults &&
      isReviewerDetailsFollowUpMessage(text)) ||
    (context.hasPriorReviewerResults &&
      messageReferencesReviewerGroup(text)) ||
    (context.hasPriorReviewerResults &&
      messageReferencesActiveReviewer(text) &&
      !isReviewerRankingMessage(text) &&
      !messageReferencesReviewerReviewSession(text));

  const reviewerReviewFollowUp =
    Boolean(context.hasPriorReviewerReviewSession) &&
    messageReferencesReviewerReviewSession(text);

  if (reviewerOverviewRequest) {
    intents.push("REVIEWER_OVERVIEW");
  }

  if (reviewerReviewFollowUp) {
    const followUpKind = resolveReviewerReviewFollowUpKind(text);
    if (followUpKind === "NOVEL_REVIEWS") intents.push("NOVEL_REVIEWS");
    else if (followUpKind === "FIND_READING_SOURCE") {
      intents.push("FIND_READING_SOURCE");
    } else if (followUpKind !== "REVIEW_DETAIL") {
      intents.push("NOVEL_OVERVIEW");
    }
  }

  const seriesRequest =
    isSeriesQueryMessage(text) ||
    (Boolean(context.hasActiveNovel) && isSeriesFollowUpMessage(text));
  if (seriesRequest && !communityPeopleQuery) {
    intents.push("NOVEL_SERIES");
  }

  if (
    !reviewerOverviewRequest &&
    (isReviewerRankingMessage(text) || extractReviewerLookupQuery(text))
  ) {
    intents.push("FIND_REVIEWERS");
  }

  if (READING_SOURCE_RE.test(lower) && !reviewRequest && !communityPeopleQuery) {
    intents.push("FIND_READING_SOURCE");
  }
  if (
    !isUnrelatedFactualQuestion(text) &&
    !communityPeopleQuery &&
    NOVEL_LOOKUP_RE.test(lower) &&
    !isReadingSourceRequest(text) &&
    !reviewRequest
  ) {
    intents.push("FIND_NOVEL");
  }
  const extractedTitle = extractNovelQuery(text);
  if (
    !isUnrelatedFactualQuestion(text) &&
    !communityPeopleQuery &&
    !isReadingSourceRequest(text) &&
    !reviewRequest &&
    extractedTitle &&
    /\b(find|look up|search for|tell me about|what is)\b/i.test(lower) &&
    !intents.includes("FIND_NOVEL")
  ) {
    intents.push("FIND_NOVEL");
  }
  if (NOVEL_QUESTION_RE.test(lower) && context.hasActiveNovel) {
    intents.push("NOVEL_OVERVIEW");
  }
  if (reviewRequest) {
    intents.push("NOVEL_REVIEWS");
  }
  if (
    directTask &&
    !intents.includes(directTask.intent) &&
    EXPLICIT_LOOKUP_INTENT_SET.has(directTask.intent)
  ) {
    intents.push(directTask.intent);
  }
  if (COMPARE_RE.test(lower)) intents.push("COMPARE");
  if (/\bmore like this\b/i.test(lower)) intents.push("MORE_LIKE_THIS");

  if (
    REFINE_RE.test(lower) &&
    (context.hasPriorRecommendations || context.hasConversationPrefs)
  ) {
    intents.push("REFINE");
  }

  if (moonieFollowUpChip) {
    if (
      !intents.includes("REFINE") &&
      (context.hasPriorRecommendations || context.hasConversationPrefs)
    ) {
      intents.push("REFINE");
    } else if (intents.length === 0) {
      intents.push("CHAT");
    }
  }

  if (isBareCatalogueTitleQuery(text)) {
    const hasConversationalIntent = intents.some((intent) =>
      (
        [
          "GREETING",
          "CHAT",
          "SMALL_TALK",
          "THANKS",
          "HELP",
          "IDENTITY",
        ] as MoonieIntent[]
      ).includes(intent)
    );
    if (!hasConversationalIntent) {
      const lookupIntent = awaitingCatalogueTitle ?? "FIND_NOVEL";
      if (!intents.includes(lookupIntent)) {
        intents.push(lookupIntent);
      }
    }
  }

  const hasExplicitLookupIntent = intents.some((intent) =>
    EXPLICIT_LOOKUP_INTENT_SET.has(intent)
  );

  if (
    !moonieFollowUpChip &&
    !hasExplicitLookupIntent &&
    !directTask &&
    !isBareCatalogueTitleQuery(text) &&
    (RECOMMEND_RE.test(lower) || WEB_NOVEL_SIGNAL.test(lower)) &&
    isRecommendationDiscoveryMessage(text)
  ) {
    intents.push("RECOMMEND");
  }

  if (
    (ORDINAL_RE.test(lower) || ORDINAL_TOP_RE.test(lower)) &&
    context.hasPriorRecommendations &&
    !communityPeopleQuery
  ) {
    if (!intents.includes("FIND_READING_SOURCE")) intents.push("NOVEL_OVERVIEW");
  }

  if (intents.length === 0) {
    if (isSmallTalkMessage(text)) {
      intents.push("SMALL_TALK");
    } else if (isUnrelatedFactualQuestion(text)) {
      intents.push("CHAT");
    } else if (text.length <= 40 && !WEB_NOVEL_SIGNAL.test(lower)) {
      intents.push("CHAT");
    } else if (WEB_NOVEL_SIGNAL.test(lower) && isRecommendationDiscoveryMessage(text)) {
      intents.push("RECOMMEND");
    } else {
      intents.push("CHAT");
    }
  }

  if (directTask && !communityPeopleQuery) {
    const recommendIdx = intents.indexOf("RECOMMEND");
    if (recommendIdx >= 0) intents.splice(recommendIdx, 1);
    if (!intents.includes(directTask.intent)) {
      intents.push(directTask.intent);
    }
  }

  if (moonieFollowUpChip || isBareCatalogueTitleQuery(text)) {
    const recommendIdx = intents.indexOf("RECOMMEND");
    if (recommendIdx >= 0) intents.splice(recommendIdx, 1);
  }

  if (
    intents.includes("REVIEWER_OVERVIEW") ||
    intents.includes("FIND_REVIEWERS")
  ) {
    for (let index = intents.length - 1; index >= 0; index -= 1) {
      const intent = intents[index];
      if (intent === "FIND_NOVEL" || intent === "RECOMMEND") {
        intents.splice(index, 1);
      }
    }
  }

  if (isMoonieDeskChipPrompt(text)) {
    const findNovelIdx = intents.indexOf("FIND_NOVEL");
    if (findNovelIdx >= 0) intents.splice(findNovelIdx, 1);
    if (!intents.includes("RECOMMEND")) intents.push("RECOMMEND");
  }

  if (context.hasActiveNovel) {
    const novelFollowUp = resolveNovelContextFollowUpIntent(text);
    if (novelFollowUp) {
      const overridable = new Set<MoonieIntent>([
        "CHAT",
        "SMALL_TALK",
        "REFINE",
        "RECOMMEND",
      ]);
      const hasExplicitLookup = intents.some((intent) =>
        EXPLICIT_LOOKUP_INTENT_SET.has(intent)
      );
      const falseTitleLookup =
        hasExplicitLookup && isNonTitleLookupPhrase(text);
      if (
        !hasExplicitLookup ||
        falseTitleLookup ||
        intents.length === 0 ||
        intents.every((intent) => overridable.has(intent))
      ) {
        if (falseTitleLookup) {
          for (let index = intents.length - 1; index >= 0; index -= 1) {
            const intent = intents[index];
            if (intent && EXPLICIT_LOOKUP_INTENT_SET.has(intent)) {
              intents.splice(index, 1);
            }
          }
        } else {
          intents.length = 0;
        }
        intents.push(novelFollowUp);
      }
    }
  }

  if (context.recentMessages?.length) {
    const convState = buildConversationalState(context.recentMessages);
    const followUp = resolveConversationalFollowUp(text, convState);
    if (
      followUp &&
      (intents.length === 0 ||
        (intents.length === 1 && intents[0] === "CHAT"))
    ) {
      intents.length = 0;
      intents.push(followUp);
    }
  }

  if (intents.includes("FIND_REVIEWERS")) {
    for (let index = intents.length - 1; index >= 0; index -= 1) {
      const intent = intents[index];
      if (
        intent &&
        intent !== "FIND_REVIEWERS" &&
        (EXPLICIT_LOOKUP_INTENT_SET.has(intent) ||
          intent === "RECOMMEND" ||
          intent === "NOVEL_OVERVIEW")
      ) {
        intents.splice(index, 1);
      }
    }
  }

  if (intents.includes("REVIEWER_OVERVIEW")) {
    const findIdx = intents.indexOf("FIND_REVIEWERS");
    if (findIdx >= 0) intents.splice(findIdx, 1);
  }

  if (reviewerReviewFollowUp) {
    const findNovelIdx = intents.indexOf("FIND_NOVEL");
    if (findNovelIdx >= 0) intents.splice(findNovelIdx, 1);
  }

  return [...new Set(intents)];
}

const WEB_NOVEL_SIGNAL =
  /\b(novel|web novel|book|read|genre|romance|fantasy|litrpg|xianxia|mc|protagonist|story|chapter|cultivation|dungeon|revenge|slow.?burn|female lead|male lead|completed|ongoing|tag|psychological|mystery|fl)\b/i;

const EXPLICIT_LOOKUP_INTENT_SET = new Set<MoonieIntent>([
  "FIND_READING_SOURCE",
  "FIND_NOVEL",
  "NOVEL_OVERVIEW",
  "NOVEL_REVIEWS",
  "COMPARE",
]);

export function primaryRetrievalIntent(
  intents: MoonieIntent[]
): MoonieIntent | null {
  const retrieval: MoonieIntent[] = [
    "IMAGE_LOOKUP",
    "FILE_LOOKUP",
    "MORE_LIKE_THIS",
    "COMPARE",
    "FIND_REVIEWERS",
    "REVIEWER_OVERVIEW",
    "NOVEL_SERIES",
    "NOVEL_REVIEWS",
    "FIND_READING_SOURCE",
    "FIND_NOVEL",
    "NOVEL_OVERVIEW",
    "REFINE",
    "RECOMMEND",
  ];
  return retrieval.find((intent) => intents.includes(intent)) ?? null;
}

export function isConversationalOnly(intents: MoonieIntent[]): boolean {
  const conversational = new Set<MoonieIntent>([
    "GREETING",
    "CHAT",
    "SMALL_TALK",
    "HELP",
    "IDENTITY",
    "THANKS",
  ]);
  return (
    intents.length > 0 &&
    intents.every((intent) => conversational.has(intent))
  );
}

export { isCommunityPeopleQuery } from "@/lib/moonie/reviewer-intent";

export function prefsLookEmpty(prefs: MoonieInterpretedPreferences): boolean {
  return (
    prefs.genres.length === 0 &&
    prefs.tags.length === 0 &&
    prefs.mood.length === 0 &&
    prefs.excludedTags.length === 0 &&
    !prefs.status &&
    !prefs.language &&
    !prefs.length
  );
}
