import type { MoonieInterpretedPreferences } from "@/types/moonie";

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
  "found family": ["found family"],
  harem: ["harem"],
  tragedy: ["tragedy", "tragic", "sad ending"],
  completed: ["completed", "complete", "finished"],
  "no romance": ["no romance", "without romance"],
  "character-driven": ["character driven", "character-driven"],
};

const MOOD_WORDS: Record<string, string[]> = {
  cosy: ["cosy", "cozy", "comforting", "comfort", "soft"],
  dark: ["dark", "grim", "gritty"],
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
    text.includes("completed only") ||
    text.includes("only completed") ||
    text.includes("finished novel") ||
    text.includes("no ongoing")
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

  if (text.includes("short") && (text.includes("novel") || text.includes("story") || text.includes("read"))) {
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
