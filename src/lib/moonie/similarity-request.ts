import {
  normalizeLookupQueryText,
  normalizeLookupTitle,
  isNonCatalogueTitleQuery,
} from "@/lib/moonie/intent";

export interface ParsedSimilarityRequest {
  seedTitle: string;
  preferenceTail: string | null;
  requiresVerifiedReadingLinks: boolean;
}

const COUNT_TOKEN =
  "(?:\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)";

/** Lead phrase for explicit similar-to recommendation requests (not bare title lookup). */
const SIMILARITY_LEAD_RE = new RegExp(
  `^(?:find|recommend|suggest|show|give)\\s+(?:me\\s+)?` +
    `(?:(?:the\\s+)?${COUNT_TOKEN}\\s+)?` +
    `(?:(?:(?:novels?|books?)|something|(?:a|an)\\s+(?:novel|book))\\s+)?` +
    `(?:like|similar\\s+to)\\s+`,
  "i"
);

const READING_LINK_ON_RESULTS_RE =
  /\b(?:with\s+)?(?:verified\s+)?(?:official\s+)?reading\s+links?\b/i;

function isPlausibleSeedTitle(candidate: string): boolean {
  const normalized = candidate.trim();
  if (normalized.length < 2) return false;
  if (isNonCatalogueTitleQuery(normalized)) return false;
  return true;
}

function splitSeedAndPreferences(rest: string): {
  seedTitle: string;
  preferenceTail: string | null;
} {
  const trimmed = rest.trim().replace(/[?.!]+$/, "").trim();
  const quoted = trimmed.match(/^["“'](.+?)["”'](?:\s+(?:with|but|that)\s+(.+))?$/i);
  if (quoted?.[1]) {
    return {
      seedTitle: normalizeLookupTitle(quoted[1]),
      preferenceTail: quoted[2]?.trim() || null,
    };
  }

  const withSplit = trimmed.match(/^(.+?)\s+with\s+(.+)$/i);
  if (withSplit?.[1] && withSplit[2]) {
    return {
      seedTitle: normalizeLookupTitle(withSplit[1]),
      preferenceTail: withSplit[2].trim(),
    };
  }

  const butSplit = trimmed.match(/^(.+?)\s*,\s*but\s+(.+)$/i);
  if (butSplit?.[1] && butSplit[2]) {
    return {
      seedTitle: normalizeLookupTitle(butSplit[1]),
      preferenceTail: butSplit[2].trim(),
    };
  }

  return {
    seedTitle: normalizeLookupTitle(trimmed),
    preferenceTail: null,
  };
}

/**
 * Parses "novels like TITLE …" recommendation requests.
 * Returns null for bare title lookups and non-similarity discovery.
 */
export function parseSimilarityRequest(message: string): ParsedSimilarityRequest | null {
  const text = normalizeLookupQueryText(message).trim();
  if (!text) return null;

  const lead = text.match(SIMILARITY_LEAD_RE);
  if (!lead) return null;

  const rest = text.slice(lead[0].length).trim();
  if (!rest) return null;

  const { seedTitle, preferenceTail } = splitSeedAndPreferences(rest);
  if (!isPlausibleSeedTitle(seedTitle)) return null;

  const requiresVerifiedReadingLinks = READING_LINK_ON_RESULTS_RE.test(text);

  return {
    seedTitle,
    preferenceTail,
    requiresVerifiedReadingLinks,
  };
}

export function isSimilarityRecommendationMessage(message: string): boolean {
  return parseSimilarityRequest(message) != null;
}

/** Preference text for ranking/hard constraints — excludes link requirement phrases. */
export function similarityPreferenceSource(
  parsed: ParsedSimilarityRequest
): string {
  const parts: string[] = [];
  if (parsed.preferenceTail) parts.push(parsed.preferenceTail);
  return parts.join(" ").trim();
}
