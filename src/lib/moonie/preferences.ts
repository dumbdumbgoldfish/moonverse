import type { MoonieInterpretedPreferences } from "@/types/moonie";
import {
  containsOutputFormatBrevityCue,
  mentionsNovelLengthConstraint,
} from "@/lib/moonie/output-format";

export const EMPTY_INTERPRETED_PREFERENCES: MoonieInterpretedPreferences = {
  genres: [],
  tags: [],
  excludedTags: [],
  status: null,
  mood: [],
  language: null,
  length: null,
  influencedBy: [],
};

const GENRE_ALIASES: Record<string, string[]> = {
  fantasy: ["fantasy"],
  romance: ["romance"],
  "sci-fi": ["sci-fi", "science fiction", "scifi"],
  gl: ["gl", "yuri", "girls love"],
  bl: ["bl", "yaoi", "boys love"],
  action: ["action"],
  adventure: ["adventure"],
  mystery: ["mystery"],
  horror: ["horror"],
  comedy: ["comedy", "humor", "humour"],
  drama: ["drama"],
  historical: ["historical", "history"],
  cultivation: ["cultivation", "xianxia", "wuxia"],
  reincarnation: ["reincarnation", "isekai", "transmigration"],
  villainess: ["villainess"],
};

const TAG_ALIASES: Record<string, string[]> = {
  "slow-burn": ["slow burn", "slow-burn"],
  "strong fl": ["strong fl", "strong female lead", "capable female lead"],
  "enemies-to-lovers": ["enemies to lovers", "enemies-to-lovers"],
  "found family": ["found family", "found-family"],
  "slice-of-life": ["slice of life", "slice-of-life"],
  harem: ["harem"],
  tragedy: ["tragedy", "tragic", "sad ending"],
  completed: ["completed", "complete", "finished"],
  "no romance": ["no romance", "without romance"],
  "character-driven": ["character driven", "character-driven"],
};

const MOOD_WORDS: Record<string, string[]> = {
  cosy: ["cosy", "cozy", "comforting", "comfort", "soft"],
  dark: ["dark", "darker", "grim", "gritty"],
  hopeful: ["hopeful", "uplifting"],
  emotional: ["emotional", "tearjerker", "make me cry"],
  intense: ["intense", "thrilling"],
  "fast-paced": ["fast paced", "fast-paced", "page turner"],
};

function includesPhrase(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\W)${escaped}(?=$|\\W)`, "i").test(text);
}

function includesAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => includesPhrase(text, needle));
}

const LANGUAGE_ALIASES: Record<string, string[]> = {
  en: ["en", "english"],
  zh: ["zh", "chinese", "cn novel", "cn"],
  ko: ["ko", "korean", "kr novel", "kr"],
  ja: ["ja", "japanese", "jp novel", "jp"],
};

const STATUS_ALIASES: Record<string, string[]> = {
  completed: [
    "completed",
    "complete",
    "finished",
    "completed only",
    "only completed",
    "finished novel",
  ],
  ongoing: ["ongoing"],
};

const LENGTH_ALIASES: Record<string, string[]> = {
  short: ["short"],
  medium: ["medium"],
  long: ["long"],
};

export const KNOWN_GENRE_CANONICALS = Object.keys(GENRE_ALIASES);

/** Canonical genre when the whole message is a known genre answer (e.g. "romance"). */
export function resolveKnownGenreFromMessage(message: string): string | null {
  const text = message.trim().toLowerCase().replace(/[?.!]+$/, "");
  if (!text) return null;
  for (const [canonical, aliases] of Object.entries(GENRE_ALIASES)) {
    if (text === canonical || aliases.some((alias) => text === alias)) {
      return canonical;
    }
  }
  return null;
}

type HardInclusionField =
  | "genre"
  | "tag"
  | "status"
  | "language"
  | "length";

function phrasesForHardInclusion(
  field: HardInclusionField,
  value: string
): string[] {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return [];

  const aliasTable =
    field === "genre"
      ? GENRE_ALIASES
      : field === "tag"
        ? TAG_ALIASES
      : field === "status"
        ? STATUS_ALIASES
        : field === "language"
          ? LANGUAGE_ALIASES
          : LENGTH_ALIASES;

  const phrases = new Set<string>([normalized, value.trim()]);
  const direct = aliasTable[normalized];
  if (direct) {
    for (const alias of direct) phrases.add(alias);
  }
  for (const [canonical, aliases] of Object.entries(aliasTable)) {
    if (
      canonical === normalized ||
      aliases.some((alias) => alias.toLowerCase() === normalized)
    ) {
      phrases.add(canonical);
      for (const alias of aliases) phrases.add(alias);
    }
  }
  return [...phrases];
}

/**
 * Current-turn exclusion wording. Aligns with extractPreferencesFromMessage
 * (`no` / `without`) and shouldOfferRememberPreference (dislike / avoid /
 * don't like / hate / never want).
 */
function labelIsNegatedInMessage(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    `(?:no|without|not|avoid|excluding|exclude|dislike|hate)\\s+${escaped}`,
    `(?:don't|don’t|dont|do not)\\s+(?:want|like)\\s+(?:any\\s+)?(?:more\\s+)?${escaped}`,
    `anything\\s+but\\s+${escaped}`,
    `no\\s+more\\s+${escaped}`,
    `never\\s+want\\s+${escaped}`,
  ];
  return patterns.some((pattern) =>
    new RegExp(`(?:^|\\W)${pattern}(?=$|\\W)`, "i").test(text)
  );
}

function mentionedAsPositiveInclusion(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => {
    if (!includesPhrase(text, phrase)) return false;
    if (labelIsNegatedInMessage(text, phrase)) return false;
    return true;
  });
}

/**
 * True when the current message actually states this inclusion (canonical
 * label or a known alias). Used to verify OpenAI-extracted hard constraints.
 */
export function messageMentionsHardInclusion(
  message: string,
  field: HardInclusionField,
  value: string
): boolean {
  if (
    field === "length" &&
    value.toLowerCase() === "short" &&
    containsOutputFormatBrevityCue(message) &&
    !mentionsNovelLengthConstraint(message)
  ) {
    return false;
  }
  return mentionedAsPositiveInclusion(
    message.toLowerCase(),
    phrasesForHardInclusion(field, value)
  );
}

/** Heuristic preference extraction from natural language (no invented novels). */
export function extractPreferencesFromMessage(
  message: string,
  prior?: Partial<MoonieInterpretedPreferences> | null
): MoonieInterpretedPreferences {
  const text = message.toLowerCase();
  const genres = new Set(prior?.genres ?? []);
  const tags = new Set(prior?.tags ?? []);
  const excludedTags = new Set(prior?.excludedTags ?? []);
  const mood = new Set(prior?.mood ?? []);
  let status = prior?.status ?? null;
  let language = prior?.language ?? null;
  let length = prior?.length ?? null;

  for (const [genre, aliases] of Object.entries(GENRE_ALIASES)) {
    if (includesAny(text, aliases)) genres.add(genre);
  }
  for (const [tag, aliases] of Object.entries(TAG_ALIASES)) {
    if (includesAny(text, aliases)) {
      if (tag === "harem") {
        if (includesAny(text, ["no harem", "without harem"])) {
          excludedTags.add(tag);
          tags.delete(tag);
        } else {
          tags.add(tag);
          excludedTags.delete(tag);
        }
      } else if (tag === "tragedy") {
        if (
          includesAny(text, [
            "no tragedy",
            "not tragic",
            "without tragedy",
            "without a sad ending",
          ])
        ) {
          excludedTags.add(tag);
          tags.delete(tag);
        } else {
          tags.add(tag);
          excludedTags.delete(tag);
        }
      } else if (tag === "completed") {
        status = "completed";
      } else if (tag === "no romance") {
        excludedTags.add("romance");
        tags.delete("romance");
        genres.delete("romance");
      } else {
        tags.add(tag);
      }
    }
  }

  if (
    /\b(remove|drop|exclude|without)\s+romance\b/i.test(text) ||
    /\bremove\s+romance\b/i.test(text)
  ) {
    genres.delete("romance");
    tags.delete("romance");
    excludedTags.add("romance");
  }

  for (const [genre, aliases] of Object.entries(GENRE_ALIASES)) {
    if (genre === "romance" && excludedTags.has("romance")) continue;
    for (const alias of aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (
        new RegExp(`\\b(?:remove|drop|exclude|without)\\s+${escaped}\\b`, "i").test(
          text
        )
      ) {
        genres.delete(genre);
      }
    }
  }

  if (
    text.includes("completed only") ||
    text.includes("only completed") ||
    text.includes("finished novel") ||
    text.includes("no ongoing") ||
    (/\bonly\s+completed\b/i.test(text) && /\bthis\s+time\b/i.test(text))
  ) {
    status = "completed";
  }
  if (text.includes("ongoing") && !text.includes("no ongoing")) {
    status = "ongoing";
  }

  for (const [m, aliases] of Object.entries(MOOD_WORDS)) {
    if (includesAny(text, aliases)) mood.add(m);
  }

  if (text.includes("english")) language = "en";
  if (text.includes("chinese") || text.includes("cn novel")) language = "zh";
  if (text.includes("korean") || text.includes("kr novel")) language = "ko";
  if (text.includes("japanese") || text.includes("jp novel")) language = "ja";

  if (mentionsNovelLengthConstraint(text)) {
    length = "short";
  }
  if (text.includes("long") && (text.includes("novel") || text.includes("epic") || text.includes("chapter"))) {
    length = "long";
  }

  return {
    genres: [...genres],
    tags: [...tags],
    excludedTags: [...excludedTags],
    status,
    mood: [...mood],
    language,
    length,
    influencedBy: prior?.influencedBy ?? [],
  };
}

export function mergeConversationPreferences(
  messages: { role: string; content: string }[]
): MoonieInterpretedPreferences {
  let prefs: MoonieInterpretedPreferences = {
    genres: [],
    tags: [],
    excludedTags: [],
    status: null,
    mood: [],
    language: null,
    length: null,
    influencedBy: [],
  };
  for (const msg of messages) {
    if (msg.role !== "user") continue;
    prefs = extractPreferencesFromMessage(msg.content, prefs);
  }
  return prefs;
}

export function buildFollowUpQuestion(
  prefs: MoonieInterpretedPreferences
): string | null {
  if (prefs.genres.length === 0 && prefs.mood.length === 0 && prefs.tags.length === 0) {
    return "Want me to narrow this to romance, fantasy, cultivation, or something cosy?";
  }
  if (prefs.genres.length === 1 && prefs.mood.length === 0 && !prefs.status) {
    return "Would you prefer something adventurous, romantic, dark, or character-driven?";
  }
  if (!prefs.status && prefs.genres.length > 0) {
    return "Should I stick to completed novels, or are ongoing stories fine?";
  }
  if (prefs.tags.length > 0 && prefs.excludedTags.length === 0) {
    return "Any tropes to avoid? Harem, tragedy, or slow pacing?";
  }
  return "Want more like the top pick, or should I widen the search?";
}
