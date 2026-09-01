import {
  extractPreferencesFromMessage,
  KNOWN_GENRE_CANONICALS,
  messageMentionsHardInclusion,
  resolveKnownGenreFromMessage,
} from "@/lib/moonie/preferences";
import { labelsMatch } from "@/lib/moonie/label-match";
import {
  isLegacyHardConstraintFollowUpQuestion,
  isRecommendationDiscoveryMessage,
  normalizeLookupQueryText,
} from "@/lib/moonie/intent";
import type { StructuredPreferences } from "@/lib/moonie/preference-schema";
import type {
  MoonieInterpretedPreferences,
  MooniePendingClarification,
} from "@/types/moonie";
import { novelForHardConstraintCheck } from "@/lib/moonie/metadata-eligibility";
import { parseSimilarityRequest } from "@/lib/moonie/similarity-request";

/** Matches the explanation schema cap used by recommendation polish. */
export const MOONIE_MAX_RECOMMENDATION_TAKE = 8;

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

export type MoonieGenreMatchMode = "all" | "any";

export interface MoonieHardInclusionConstraints {
  genres: string[];
  /** Canonical trope/tag labels explicitly requested in the current turn. */
  tags: string[];
  /** How explicit genre and tag labels combine across the current request. */
  inclusionMatch: MoonieGenreMatchMode;
  /** Default is conjunction: every explicitly requested genre must match. */
  genreMatch: MoonieGenreMatchMode;
  /** How explicitly requested tags combine when multiple tags are stated. */
  tagMatch: MoonieGenreMatchMode;
  status: "completed" | "ongoing" | null;
  language: string | null;
  length: "short" | "medium" | "long" | null;
  /** Minimum verified MoonVerse community average rating (1–5). */
  minAverageRating: number | null;
  /** Alternatives must have an approved official/verified reading link on MoonVerse. */
  requireOfficialReadingLink?: boolean;
}

export const EMPTY_HARD_CONSTRAINTS: MoonieHardInclusionConstraints = {
  genres: [],
  tags: [],
  inclusionMatch: "all",
  genreMatch: "all",
  tagMatch: "all",
  status: null,
  language: null,
  length: null,
  minAverageRating: null,
};

/** Fill omitted hard-constraint fields from EMPTY_HARD_CONSTRAINTS (e.g. persisted pending state). */
export function completeHardInclusionConstraints(
  hard: Pick<
    MoonieHardInclusionConstraints,
    | "genres"
    | "tags"
    | "inclusionMatch"
    | "genreMatch"
    | "status"
    | "language"
    | "length"
  > &
    Partial<MoonieHardInclusionConstraints>
): MoonieHardInclusionConstraints {
  return { ...EMPTY_HARD_CONSTRAINTS, ...hard };
}

function uniqueLabels(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

/** MoonVerse does not filter recommendations by novel length. */
export function stripLengthFromHardConstraints(
  hard: MoonieHardInclusionConstraints
): MoonieHardInclusionConstraints {
  return { ...hard, length: null };
}

export function hasHardInclusionConstraints(
  hard: MoonieHardInclusionConstraints | null | undefined
): boolean {
  if (!hard) return false;
  return (
    hard.genres.length > 0 ||
    hard.tags.length > 0 ||
    Boolean(hard.status) ||
    Boolean(hard.language) ||
    Boolean(hard.length) ||
    hard.minAverageRating != null ||
    Boolean(hard.requireOfficialReadingLink)
  );
}

export function resolveGenreMatchMode(
  message: string,
  genres: string[]
): MoonieGenreMatchMode {
  if (genres.length < 2) return "all";
  const lower = message.toLowerCase();
  for (let i = 0; i < genres.length; i += 1) {
    for (let j = i + 1; j < genres.length; j += 1) {
      const left = genres[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const right = genres[j].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const eitherOr = new RegExp(
        `\\b(?:${left}\\s+or\\s+${right}|${right}\\s+or\\s+${left})\\b`,
        "i"
      );
      if (eitherOr.test(lower)) return "any";
    }
  }
  return "all";
}

export function resolveInclusionMatchMode(
  message: string,
  labels: string[]
): MoonieGenreMatchMode {
  if (labels.length < 2) return "all";
  return /\bor\b/i.test(message) ? "any" : "all";
}

function normalizeHardStatus(
  value: string | null | undefined
): "completed" | "ongoing" | null {
  if (value === "completed" || value === "ongoing") return value;
  return null;
}

function normalizeHardLength(
  value: string | null | undefined
): "short" | "medium" | "long" | null {
  if (value === "short" || value === "medium" || value === "long") return value;
  return null;
}

function verifiedExtractedLabels(
  message: string,
  field: "genre" | "tag" | "status" | "language" | "length",
  values: string[]
): string[] {
  return uniqueLabels(
    values.filter((value) => messageMentionsHardInclusion(message, field, value))
  );
}

export function buildCurrentTurnHardConstraints(
  message: string,
  extracted?: (Pick<
    StructuredPreferences,
    "genres" | "status" | "language" | "length"
  > &
    Partial<Pick<StructuredPreferences, "tags">>) | null
): MoonieHardInclusionConstraints {
  if (isLegacyHardConstraintFollowUpQuestion(message)) {
    const heuristic = extractPreferencesFromMessage(message);
    const genres = uniqueLabels(
      heuristic.genres.filter((genre) =>
        messageMentionsHardInclusion(message, "genre", genre)
      )
    );
    const tags = uniqueLabels(
      heuristic.tags.filter((tag) =>
        messageMentionsHardInclusion(message, "tag", tag)
      )
    );
    return {
      genres,
      tags,
      inclusionMatch: resolveInclusionMatchMode(message, [...genres, ...tags]),
      genreMatch: resolveGenreMatchMode(message, genres),
      tagMatch: resolveInclusionMatchMode(message, tags),
      status: null,
      language: null,
      length: null,
      minAverageRating: parseMinimumAverageRating(message),
      requireOfficialReadingLink: false,
    };
  }

  const heuristic = extractPreferencesFromMessage(message);
  const verifiedExtractedGenres = verifiedExtractedLabels(
    message,
    "genre",
    extracted?.genres ?? []
  ).filter(
    (genre) =>
      !heuristic.tags.some((tag) => labelsMatch(tag, genre))
  );
  const genres = uniqueLabels([
    ...heuristic.genres.filter((genre) =>
      messageMentionsHardInclusion(message, "genre", genre)
    ),
    ...verifiedExtractedGenres,
  ]);
  const verifiedExtractedTags = verifiedExtractedLabels(
    message,
    "tag",
    extracted?.tags ?? []
  ).filter(
    (tag) =>
      !heuristic.genres.some((genre) => labelsMatch(genre, tag))
  );
  const tags = uniqueLabels([
    ...heuristic.tags.filter((tag) =>
      messageMentionsHardInclusion(message, "tag", tag)
    ),
    ...verifiedExtractedTags,
  ]).filter(
    (tag) => !genres.some((genre) => labelsMatch(genre, tag))
  );

  const extractedStatus = normalizeHardStatus(extracted?.status);
  const extractedLanguage = extracted?.language?.trim() || null;
  const heuristicStatus = normalizeHardStatus(heuristic.status);
  const parsedSimilarity = parseSimilarityRequest(message);

  return {
    genres,
    tags,
    inclusionMatch: resolveInclusionMatchMode(message, [...genres, ...tags]),
    genreMatch: resolveGenreMatchMode(message, genres),
    tagMatch: resolveInclusionMatchMode(message, tags),
    status:
      (heuristicStatus &&
      messageMentionsHardInclusion(message, "status", heuristicStatus)
        ? heuristicStatus
        : null) ??
      (extractedStatus &&
      messageMentionsHardInclusion(message, "status", extractedStatus)
        ? extractedStatus
        : null),
    language:
      (heuristic.language &&
      messageMentionsHardInclusion(message, "language", heuristic.language)
        ? heuristic.language
        : null) ||
      (extractedLanguage &&
      messageMentionsHardInclusion(message, "language", extractedLanguage)
        ? extractedLanguage
        : null),
    length: null,
    requireOfficialReadingLink:
      parsedSimilarity?.requiresVerifiedReadingLinks ?? false,
    minAverageRating: parseMinimumAverageRating(message),
  };
}

function parseCountToken(token: string): number | null {
  const word = NUMBER_WORDS[token];
  if (word) return word;
  if (/^10$/.test(token) || /^[1-9]$/.test(token)) return Number(token);
  return null;
}

/** Minimum community average rating explicitly requested in the current turn. */
export function parseMinimumAverageRating(message: string): number | null {
  const lower = message.toLowerCase();
  const patterns = [
    /\brating\s+(?:of\s+)?(?:at\s+least\s+)?(\d(?:\.\d+)?)\s*(?:or\s+higher|\+|and\s+up|plus)?/i,
    /(\d(?:\.\d+)?)\s*(?:or\s+higher|\+)\s*(?:average\s+)?ratings?\b/i,
    /(?:average\s+rating|rated)\s+(?:at\s+least\s+)?(\d(?:\.\d+)?)/i,
    /(\d)\s*stars?\s+(?:or\s+higher|and\s+up|\+)/i,
    /\b(?:at\s+least|minimum)\s+(\d(?:\.\d+)?)\s*(?:star|stars|rating)/i,
  ];
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    const value = match?.[1] ? Number.parseFloat(match[1]) : null;
    if (value != null && value >= 1 && value <= 5) return value;
  }
  return null;
}

/**
 * Parses 1–10 when clearly attached to a recommendation request.
 * Ignores years, star ratings, and isolated numbers.
 */
export function parseRequestedRecommendationCount(
  message: string
): number | null {
  const looksLikeRecommend =
    isRecommendationDiscoveryMessage(message) ||
    /\brecommend(?:ation)?s?\b/i.test(message) ||
    /\b(?:show|give|find)\s+(?:me\s+)?(?:top\s+)?\d{1,2}\b/i.test(message) ||
    /\btop\s+\d{1,2}\b/i.test(message);

  if (!looksLikeRecommend) return null;

  const cleaned = message
    .toLowerCase()
    .replace(/\b(?:19|20)\d{2}\b/g, " ")
    .replace(
      /\b(?:[1-5](?:\.\d+)?|one|two|three|four|five)\s*-?\s*stars?\b/g,
      " "
    )
    .replace(/\bchapter\s+\d+\b/g, " ");

  const token = `(?:${Object.keys(NUMBER_WORDS).join("|")}|10|[1-9])`;
  const unit = `(?:novels?|books?|titles?|recommendations?|stories|picks?|reads?)`;
  const patterns = [
    new RegExp(
      `(?:recommend(?:\\s+me)?|suggest(?:\\s+me)?|give(?:\\s+me)?|show(?:\\s+me)?|want)\\s+(${token})\\s+(?:[\\w'-]+\\s+){0,5}${unit}`
    ),
    new RegExp(`\\b(${token})\\s+(?:[\\w'-]+\\s+){0,4}${unit}\\b`),
    new RegExp(`\\b(?:top|show)\\s+(${token})\\s*(?:results?|picks?|novels?|books?)?\\s*[?.!]*$`),
    new RegExp(`^top\\s+(${token})\\s*(?:results?|picks?)?\\s*[?.!]*$`),
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (!match?.[1]) continue;
    const count = parseCountToken(match[1]);
    if (count == null) continue;
    return Math.min(MOONIE_MAX_RECOMMENDATION_TAKE, Math.max(1, count));
  }
  return null;
}

export function shouldRelaxRestrictiveRetrieval(
  hard: MoonieHardInclusionConstraints | null | undefined
): boolean {
  return !hasHardInclusionConstraints(hard);
}

export interface HardConstraintNovel {
  genres: string[];
  tags?: string[];
  publicationStatus?: string | null;
  originalLanguage?: string | null;
  lengthBand?: string | null;
  chapterCount?: number | null;
  metadataSource?: string | null;
  averageRating?: number | null;
}

function novelForConstraintMatch(novel: HardConstraintNovel): HardConstraintNovel {
  if (!novel.metadataSource) return novel;
  const adjusted = novelForHardConstraintCheck({
    metadataSource: novel.metadataSource,
    genres: novel.genres,
    tags: novel.tags,
    publicationStatus: novel.publicationStatus,
    originalLanguage: novel.originalLanguage,
    lengthBand: novel.lengthBand,
    chapterCount: novel.chapterCount,
  });
  return {
    ...novel,
    genres: adjusted.genres,
    tags: adjusted.tags,
    publicationStatus: adjusted.publicationStatus,
    originalLanguage: adjusted.originalLanguage,
    lengthBand: adjusted.lengthBand,
    chapterCount: adjusted.chapterCount,
  };
}

export type NovelLengthBand = "short" | "medium" | "long";

export function inferLengthBandFromChapterCount(
  chapterCount: number | null | undefined
): NovelLengthBand | null {
  if (!chapterCount || chapterCount <= 0) return null;
  if (chapterCount < 80) return "short";
  if (chapterCount < 300) return "medium";
  return "long";
}

export function effectiveNovelLengthBand(
  novel: Pick<HardConstraintNovel, "lengthBand" | "chapterCount">
): NovelLengthBand | null {
  if (
    novel.lengthBand === "short" ||
    novel.lengthBand === "medium" ||
    novel.lengthBand === "long"
  ) {
    return novel.lengthBand;
  }
  return inferLengthBandFromChapterCount(novel.chapterCount);
}

export function novelMatchesHardConstraints(
  novel: HardConstraintNovel,
  hard: MoonieHardInclusionConstraints
): boolean {
  const eligible = novelForConstraintMatch(novel);

  if (hard.genres.length > 0) {
    const genreMatches = hard.genres.map((genre) =>
      eligible.genres.some((label) => labelsMatch(label, genre))
    );
    if (hard.genreMatch === "any") {
      if (!genreMatches.some(Boolean)) return false;
    } else if (!genreMatches.every(Boolean)) {
      return false;
    }
  }

  if (hard.tags.length > 0) {
    const tagMatches = hard.tags.map((tag) =>
      [...eligible.genres, ...(eligible.tags ?? [])].some((label) =>
        labelsMatch(label, tag)
      )
    );
    const tagMode = hard.tags.length >= 2 ? hard.tagMatch : "all";
    if (tagMode === "any") {
      if (!tagMatches.some(Boolean)) return false;
    } else if (!tagMatches.every(Boolean)) {
      return false;
    }
  }

  if (hard.minAverageRating != null) {
    const rating = novel.averageRating;
    if (rating == null || rating < hard.minAverageRating) return false;
  }

  if (hard.status === "completed") {
    if (!/complet/i.test(eligible.publicationStatus ?? "")) return false;
  } else if (hard.status === "ongoing") {
    if (!/(ongoing|hiatus)/i.test(eligible.publicationStatus ?? "")) return false;
  }

  if (hard.language) {
    if (
      !(novel.originalLanguage ?? "")
        .toLowerCase()
        .includes(hard.language.toLowerCase())
    ) {
      return false;
    }
  }

  if (hard.length) {
    const band = effectiveNovelLengthBand(novel);
    if (band !== hard.length) return false;
  }

  return true;
}

export function filterNovelsByHardConstraints<T extends HardConstraintNovel>(
  novels: T[],
  hard: MoonieHardInclusionConstraints | null | undefined
): T[] {
  if (!hasHardInclusionConstraints(hard)) return novels;
  return novels.filter((novel) => novelMatchesHardConstraints(novel, hard!));
}

/** Retrieval hard-filter prefs: current-turn inclusions only; exclusions stay. */
export function retrievalPrefsForHardConstraints(
  rankingPrefs: MoonieInterpretedPreferences,
  hard: MoonieHardInclusionConstraints | null | undefined
): MoonieInterpretedPreferences {
  if (!hasHardInclusionConstraints(hard)) return rankingPrefs;
  return {
    ...rankingPrefs,
    genres: hard!.genres,
    tags: hard!.tags,
    status: hard!.status,
    language: hard!.language,
    length: null,
  };
}

export function formatHardConstraintLabel(
  hard: MoonieHardInclusionConstraints
): string {
  const parts: string[] = [];
  const inclusionLabels = uniqueLabels([...hard.genres, ...hard.tags]);
  if (inclusionLabels.length) {
    const joiner = hard.inclusionMatch === "any" ? " or " : " and ";
    parts.push(inclusionLabels.join(joiner));
  }
  if (hard.status) parts.push(hard.status);
  if (hard.language) parts.push(hard.language);
  if (hard.minAverageRating != null) {
    parts.push(`rating ${hard.minAverageRating}+`);
  }
  if (hard.requireOfficialReadingLink) parts.push("verified reading links");
  return parts.join(", ") || "your request";
}

function formatHardFollowUpGenrePhrase(
  hard: MoonieHardInclusionConstraints
): string {
  const inclusionLabels = uniqueLabels([...hard.genres, ...hard.tags]);
  if (!inclusionLabels.length) return "";
  const joiner = hard.inclusionMatch === "any" ? " or " : " and ";
  return inclusionLabels.join(joiner);
}

/** Deterministic follow-up command that stays a recommendation when clicked. */
export function buildHardConstraintFollowUp(
  hard: MoonieHardInclusionConstraints
): string | null {
  if (!hasHardInclusionConstraints(hard)) return null;
  const genre = formatHardFollowUpGenrePhrase(hard);
  const genrePhrase = genre ? `${genre} ` : "";
  if (!hard.status) {
    return `Show me completed ${genrePhrase}novels`.replace(/\s+/g, " ").trim();
  }
  return `Show me more ${genrePhrase}novels`.replace(/\s+/g, " ").trim();
}

export function buildHardConstraintNoResultsCopy(
  hard: MoonieHardInclusionConstraints
): { reply: string; summary: string } {
  const label = formatHardConstraintLabel(hard);
  return {
    summary: `No matching novels for ${label}`,
    reply: `I could not find any MoonVerse novels that match ${label}. I will not fill the list with unrelated titles.`,
  };
}

/** Eligible count is 0 because generated/low-trust status cannot satisfy a hard status filter. */
export function buildHardConstraintUnknownStatusCopy(
  hard: MoonieHardInclusionConstraints
): { reply: string; summary: string } {
  const label = formatHardConstraintLabel(hard);
  const status = hard.status ?? "that";
  return {
    summary: `Unverified ${status} status for ${label}`,
    reply: `I couldn't confirm any MoonVerse novels as ${status} for ${label}. Some rows match your other criteria but don't list a clear ${status} status, so I won't guess or pad the list with unrelated titles.`,
  };
}

export function buildHardConstraintLengthUnknownCopy(
  hard: MoonieHardInclusionConstraints
): { reply: string; summary: string } {
  const label = formatHardConstraintLabel(hard);
  return {
    summary: `Cannot verify ${hard.length ?? "requested"} length for ${label}`,
    reply: `I found MoonVerse novels that may match other parts of your request, but length isn't listed clearly enough in the catalogue for me to recommend ${hard.length ?? "that"} length safely. I won't guess from review length.`,
  };
}

export function buildHardConstraintExhaustionCopy(options: {
  hard: MoonieHardInclusionConstraints;
  seekingUnseen: boolean;
  hasExplicitExclusions: boolean;
  hasPreviouslyShownMatches: boolean;
  unverifiedStatusMatches?: number;
}): { reply: string; summary: string } {
  const label = formatHardConstraintLabel(options.hard);
  if (
    options.hard.status &&
    (options.unverifiedStatusMatches ?? 0) > 0 &&
    !options.seekingUnseen &&
    !options.hasExplicitExclusions
  ) {
    return buildHardConstraintUnknownStatusCopy(options.hard);
  }
  if (options.seekingUnseen && options.hasPreviouslyShownMatches) {
    const exclusionNote = options.hasExplicitExclusions
      ? " after respecting the titles you hid or rejected"
      : "";
    return {
      summary: `No additional unseen matches for ${label}`,
      reply: `I found no additional unseen MoonVerse novels that match ${label}${exclusionNote}. Previously shown verified matches still satisfy the request.`,
    };
  }
  if (options.hasExplicitExclusions) {
    return {
      summary: `No remaining matches for ${label} after your exclusions`,
      reply: `I found no remaining MoonVerse novels that match ${label} after respecting the titles you hid or rejected.`,
    };
  }
  return buildHardConstraintNoResultsCopy(options.hard);
}

export function buildConstraintRelaxationClarification(
  hard: MoonieHardInclusionConstraints
): { reply: string; quickPrompts: string[] } {
  const inclusionLabels = [...hard.genres, ...hard.tags];
  const inclusion = inclusionLabels.join(
    hard.inclusionMatch === "any" ? " or " : " and "
  );
  const criteria = [
    hard.status
      ? { label: `${hard.status} status`, promptPart: hard.status, key: "status" }
      : null,
    inclusion
      ? {
          label: `${inclusion} match`,
          promptPart: inclusion,
          key: "inclusion",
        }
      : null,
    hard.language
      ? {
          label: `${hard.language} language`,
          promptPart: hard.language,
          key: "language",
        }
      : null,
  ].filter(
    (
      criterion
    ): criterion is { label: string; promptPart: string; key: string } =>
      criterion !== null
  );

  if (criteria.length < 2) {
    return {
      reply:
        "Which constraint should I relax? Restate the criteria you want to keep so I do not discard the wrong preference.",
      quickPrompts: [],
    };
  }

  return {
    reply: `Which criterion should I relax: ${criteria
      .map((criterion) => criterion.label)
      .join(", ")}? I will keep the others unchanged.`,
    quickPrompts: criteria.map((removed) => {
      const remaining = criteria
        .filter((criterion) => criterion.key !== removed.key)
        .map((criterion) => criterion.promptPart);
      return `Show me ${remaining.join(" ")} novels`;
    }),
  };
}

export function dropHardConstraintKey(
  hard: MoonieHardInclusionConstraints,
  key: "length" | "status" | "inclusion" | "language"
): MoonieHardInclusionConstraints {
  if (key === "length") return { ...hard, length: null };
  if (key === "status") return { ...hard, status: null };
  if (key === "language") return { ...hard, language: null };
  return { ...hard, genres: [], tags: [] };
}

export function replaceHardInclusionWithGenre(
  hard: MoonieHardInclusionConstraints,
  genre: string
): MoonieHardInclusionConstraints {
  return {
    ...hard,
    genres: [genre],
    tags: [],
    inclusionMatch: "all",
    genreMatch: "all",
    tagMatch: "all",
  };
}

export function constraintRelaxationPending(
  hard: MoonieHardInclusionConstraints,
  phase: "pick_constraint" | "genre_or_status" = "pick_constraint",
  offeredGenre?: string
): MooniePendingClarification {
  return {
    kind: "constraint_relaxation",
    hard,
    phase,
    offeredGenre,
  };
}

export type ConstraintRelaxationResolution =
  | { kind: "apply"; hard: MoonieHardInclusionConstraints }
  | {
      kind: "clarify_genre_or_status";
      hard: MoonieHardInclusionConstraints;
      genre: string;
      reply: string;
      quickPrompts: string[];
    }
  | { kind: "clarify_again"; reply: string; quickPrompts: string[] };

function currentConstraintKeys(hard: MoonieHardInclusionConstraints) {
  const inclusionLabels = [...hard.genres, ...hard.tags];
  return {
    inclusionLabels,
    hasInclusion: inclusionLabels.length > 0,
    hasStatus: Boolean(hard.status),
    hasLanguage: Boolean(hard.language),
  };
}

function formatCurrentConstraints(hard: MoonieHardInclusionConstraints): string {
  const { inclusionLabels } = currentConstraintKeys(hard);
  const parts = [
    hard.status ? `${hard.status} status` : null,
    inclusionLabels.length
      ? `${inclusionLabels.join(hard.inclusionMatch === "any" ? " or " : " and ")} match`
      : null,
    hard.language ? `${hard.language} language` : null,
  ].filter(Boolean);
  return parts.join(", ") || "your current constraints";
}

export function resolveConstraintRelaxationAnswer(
  message: string,
  pending: Extract<MooniePendingClarification, { kind: "constraint_relaxation" }>
): ConstraintRelaxationResolution {
  const text = normalizeLookupQueryText(message).trim();
  const lower = text.toLowerCase();
  const hard = completeHardInclusionConstraints(pending.hard);
  const keys = currentConstraintKeys(hard);

  if (pending.phase === "genre_or_status" && pending.offeredGenre) {
    if (
      /\b(?:change|switch|use|set)\b.*\bgenre\b/i.test(lower) ||
      labelsMatch(text, pending.offeredGenre) ||
      resolveKnownGenreFromMessage(text) === pending.offeredGenre
    ) {
      return {
        kind: "apply",
        hard: replaceHardInclusionWithGenre(hard, pending.offeredGenre),
      };
    }
    if (
      /\b(?:drop|remove|relax|without)\b.*\b(?:complet|status)\b/i.test(lower) ||
      /^(?:drop|remove)\s+(?:the\s+)?completion(?:\s+requirement)?\s*[?.!]*$/i.test(
        lower
      )
    ) {
      return { kind: "apply", hard: dropHardConstraintKey(hard, "status") };
    }
    return {
      kind: "clarify_again",
      reply: `Should I change the genre to ${pending.offeredGenre}, or drop the completion requirement? Current constraints: ${formatCurrentConstraints(hard)}.`,
      quickPrompts: [
        `Change the genre to ${pending.offeredGenre}`,
        "Drop the completion requirement",
      ],
    };
  }

  if (
    keys.hasStatus &&
    /\b(?:complet|status)\b/i.test(lower) &&
    !resolveKnownGenreFromMessage(text)
  ) {
    return { kind: "apply", hard: dropHardConstraintKey(hard, "status") };
  }
  if (keys.hasLanguage && /\blanguage\b/i.test(lower)) {
    return { kind: "apply", hard: dropHardConstraintKey(hard, "language") };
  }
  if (
    keys.hasInclusion &&
    keys.inclusionLabels.some((label) => labelsMatch(text, label))
  ) {
    return { kind: "apply", hard: dropHardConstraintKey(hard, "inclusion") };
  }

  const genre = resolveKnownGenreFromMessage(text);
  if (genre) {
    const alreadyIncluded = [...hard.genres, ...hard.tags].some((label) =>
      labelsMatch(label, genre)
    );
    if (alreadyIncluded) {
      return { kind: "apply", hard: dropHardConstraintKey(hard, "inclusion") };
    }
    if (keys.hasStatus) {
      return {
        kind: "clarify_genre_or_status",
        hard,
        genre,
        reply: `${genre} is not one of the current constraints (${formatCurrentConstraints(hard)}). Should I change the genre to ${genre}, or drop the completion requirement?`,
        quickPrompts: [
          `Change the genre to ${genre}`,
          "Drop the completion requirement",
        ],
      };
    }
    return {
      kind: "apply",
      hard: replaceHardInclusionWithGenre(hard, genre),
    };
  }

  const clarification = buildConstraintRelaxationClarification(hard);
  return {
    kind: "clarify_again",
    reply: `${clarification.reply} Current constraints: ${formatCurrentConstraints(hard)}.`,
    quickPrompts: clarification.quickPrompts,
  };
}

export function buildHardConstraintMatchCopy(options: {
  matchCount: number;
  take: number;
  /** Parsed user-requested count. Omit or null when take is the internal default. */
  explicitCount?: number | null;
  hard: MoonieHardInclusionConstraints;
}): { reply: string; summary: string } {
  const label = formatHardConstraintLabel(options.hard);
  const noun = options.matchCount === 1 ? "novel" : "novels";
  if (options.matchCount < options.take) {
    const summary = `I found ${options.matchCount} MoonVerse ${noun} that match ${label}`;
    const asked =
      options.explicitCount != null
        ? ` You asked for ${options.explicitCount}, so I am only showing those verified matches rather than filling the list with unrelated titles.`
        : " I am only showing those verified matches rather than filling the list with unrelated titles.";
    return {
      summary,
      reply: `${summary}.${asked}`,
    };
  }
  const summary = `I matched ${options.matchCount} MoonVerse ${noun} that match ${label}`;
  return {
    summary,
    reply: `${summary}. These are verified MoonVerse catalogue titles — I won't invent novels or reading links.`,
  };
}

/** True when a polish summary claims the whole catalogue lacks a requested tag. */
export function polishSummaryMakesCatalogueAbsenceClaim(
  summary: string
): boolean {
  const text = summary.trim();
  if (!text) return false;
  return (
    /\bno (?:novels?|titles?|candidates?) (?:in (?:the )?(?:catalogue|catalog) )?(?:are |is )?(?:tagged|labelled|labeled)\b/i.test(
      text
    ) ||
    /\b(?:catalogue|catalog) (?:has|have|contains) no\b/i.test(text) ||
    /\bno candidates? are tagged\b/i.test(text) ||
    /\baren['’]t tagged as\b/i.test(text) ||
    /\bare not tagged as\b/i.test(text) ||
    /\bnone (?:of (?:them|the novels) )?(?:are |is )?tagged\b/i.test(text)
  );
}

export function shouldKeepGroundedReplyAfterPolish(
  hard: MoonieHardInclusionConstraints | null | undefined
): boolean {
  return hasHardInclusionConstraints(hard);
}

export function polishFollowUpRespectsHardConstraints(
  followUp: string,
  hard: MoonieHardInclusionConstraints
): boolean {
  const text = followUp.trim();
  if (!text) return false;
  if (polishSummaryMakesCatalogueAbsenceClaim(text)) return false;

  if (hard.genres.length > 0) {
    for (const genre of KNOWN_GENRE_CANONICALS) {
      if (hard.genres.some((requested) => labelsMatch(requested, genre))) {
        continue;
      }
      if (messageMentionsHardInclusion(text, "genre", genre)) return false;
    }
  }

  if (
    hard.status === "completed" &&
    messageMentionsHardInclusion(text, "status", "ongoing")
  ) {
    return false;
  }
  if (
    hard.status === "ongoing" &&
    messageMentionsHardInclusion(text, "status", "completed")
  ) {
    return false;
  }

  if (hard.language) {
    for (const code of ["en", "zh", "ko", "ja"]) {
      if (labelsMatch(code, hard.language)) continue;
      if (messageMentionsHardInclusion(text, "language", code)) return false;
    }
  }

  if (hard.length) {
    for (const band of ["short", "medium", "long"] as const) {
      if (band === hard.length) continue;
      if (messageMentionsHardInclusion(text, "length", band)) return false;
    }
  }

  return true;
}
