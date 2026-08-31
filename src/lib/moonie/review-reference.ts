import { recommendationsFromStoredMeta } from "@/lib/moonie/conversation-context";
import { normalizeLookupQueryText } from "@/lib/moonie/intent";
import type { MoonieRecommendation } from "@/types/moonie";

export interface StoredMessage {
  role: string;
  content: string;
  meta?: unknown;
}

const PLURAL_NOVEL_REVIEW_RE =
  /\b(?:give|get|show)(?:\s+me)?\s+(?:the\s+)?reviews?\s+(?:for|of)\s+(?:these|those)\s+novels?\b/i;

const PLURAL_NOVEL_REVIEW_ALT_RE =
  /\b(?:these|those)\s+novels?\b.*\breviews?\b/i;

const PLURAL_THEIR_REVIEWS_RE =
  /\b(?:show\s+me\s+)?(?:their|its)\s+reviews?\b/i;

const AMBIGUOUS_THAT_NOVELS_RE =
  /\b(?:give|get|show)(?:\s+me)?\s+(?:the\s+)?reviews?\s+(?:for|of)\s+that\s+novels?\b/i;

const AMBIGUOUS_THAT_NOVELS_ALT_RE =
  /\bthat\s+novels?\b.*\breviews?\b/i;

/** Plural novel review reference anchored to a displayed recommendation batch. */
export function isPluralNovelReviewReference(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim();
  return (
    PLURAL_NOVEL_REVIEW_RE.test(text) ||
    PLURAL_NOVEL_REVIEW_ALT_RE.test(text) ||
    (PLURAL_THEIR_REVIEWS_RE.test(text) &&
      /\b(?:these|those|them|novels?)\b/i.test(text))
  );
}

/** Grammatically invalid singular reference that should clarify instead of lookup. */
export function isAmbiguousPluralNovelReviewReference(message: string): boolean {
  const text = normalizeLookupQueryText(message).trim();
  return (
    AMBIGUOUS_THAT_NOVELS_RE.test(text) || AMBIGUOUS_THAT_NOVELS_ALT_RE.test(text)
  );
}

/** Latest assistant turn that displayed recommendation cards (not full-conversation replay). */
export function resolveLatestDisplayedNovelBatch(
  messages: StoredMessage[]
): MoonieRecommendation[] {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const entry = messages[index];
    if (entry?.role !== "assistant") continue;
    const recs = recommendationsFromStoredMeta(entry.meta);
    if (recs.length > 0) return recs;
  }
  return [];
}

export function buildAmbiguousPluralNovelReviewClarification(
  batch: MoonieRecommendation[]
): string {
  if (batch.length === 0) {
    return "Which novel(s) would you like reviews for? Name the titles or ask after I show recommendation cards.";
  }
  const titles = batch
    .slice(0, 4)
    .map((rec) => rec.title)
    .join(", ");
  const suffix = batch.length > 4 ? "…" : "";
  return `I’m not sure which novel you mean by “that novels”. Did you want reviews for ${titles}${suffix}? Say **reviews of these novels** after a recommendation batch, or name a specific title.`;
}
