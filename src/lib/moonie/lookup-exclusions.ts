import type { MoonieIntent } from "@/lib/moonie/intent";
import {
  isBareCatalogueTitleQuery,
  isNonTitleLookupPhrase,
  isReadingSourceRequest,
  isDirectTitleLookupMessage,
  normalizeLookupQueryText,
  resolveLookupTitleQuery,
} from "@/lib/moonie/intent";

const EXPLICIT_LOOKUP_INTENTS = new Set<MoonieIntent>([
  "FIND_READING_SOURCE",
  "FIND_NOVEL",
  "NOVEL_OVERVIEW",
  "NOVEL_REVIEWS",
  "COMPARE",
]);

/** True when the user names a catalogue title for lookup (not open-ended discovery). */
export function isExplicitTitleLookup(
  message: string,
  intents: MoonieIntent[]
): boolean {
  const text = normalizeLookupQueryText(message);
  if (isNonTitleLookupPhrase(text)) return false;
  const title = resolveLookupTitleQuery(text, intents);
  if (!title) return false;

  if (isDirectTitleLookupMessage(text)) {
    return true;
  }

  if (intents.some((intent) => EXPLICIT_LOOKUP_INTENTS.has(intent))) {
    return true;
  }

  if (isBareCatalogueTitleQuery(text)) {
    return intents.some((intent) => EXPLICIT_LOOKUP_INTENTS.has(intent));
  }

  return (
    isReadingSourceRequest(text) ||
    /\b(find|look up|search for|tell me about|what is|where can i read)\b/i.test(
      text
    )
  );
}

/**
 * Recommendation/session duplicate suppression must not block an explicitly named title.
 * Lookup clarification rejections may still apply unless the user names that title again.
 */
export function resolveLookupExcludeNovelIds(options: {
  message: string;
  intents: MoonieIntent[];
  recommendationExcludeIds?: string[];
  lookupRejectedNovelIds?: string[];
  explicitNovelIds?: string[];
}): string[] {
  if (!isExplicitTitleLookup(options.message, options.intents)) {
    return options.recommendationExcludeIds ?? [];
  }

  const explicitIds = new Set(options.explicitNovelIds ?? []);
  const rejected = (options.lookupRejectedNovelIds ?? []).filter(
    (id) => !explicitIds.has(id)
  );
  return rejected;
}
