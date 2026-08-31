import { normalizeLookupQueryText } from "@/lib/moonie/intent";
import { scoreTitleMatch } from "@/lib/search";
import type { MoonieLookupCandidate } from "@/types/moonie";

/**
 * Minimum bar for accepting a catalogue candidate in compare / file title flows.
 * Rejects weak fuzzy matches that would substitute unrelated novels.
 */
export function isAcceptedCompareCatalogueMatch(
  candidate: MoonieLookupCandidate
): boolean {
  if (candidate.confidence === "low") {
    return false;
  }

  const hasExactCanonical = candidate.evidence.some(
    (item) => item.kind === "canonical_title"
  );
  if (hasExactCanonical) {
    return true;
  }

  const hasExactAlias = candidate.evidence.some(
    (item) =>
      item.kind === "alias" && item.label.startsWith("Catalogue alias")
  );
  if (hasExactAlias) {
    return true;
  }

  const hasStrongFuzzy = candidate.evidence.some(
    (item) =>
      item.kind === "fuzzy_title" &&
      item.label === "Strong title similarity"
  );
  if (!hasStrongFuzzy) {
    return false;
  }

  if (candidate.confidence === "high") {
    return true;
  }

  return (
    candidate.confidence === "medium" && candidate.confidenceScore >= 0.55
  );
}

/**
 * Named compare titles must align with the accepted candidate.
 * Semantic neighbours (high retrieval score, different title) are rejected.
 */
export function compareQueryAlignsWithLookup(
  query: string,
  lookup: MoonieLookupCandidate
): boolean {
  if (
    lookup.evidence.some(
      (item) =>
        item.kind === "canonical_title" ||
        (item.kind === "alias" && item.label.startsWith("Catalogue alias"))
    )
  ) {
    return true;
  }
  const normalized = normalizeLookupQueryText(query);
  if (scoreTitleMatch(lookup.canonicalTitle, normalized) >= 85) return true;
  if (
    lookup.matchedAlias &&
    scoreTitleMatch(lookup.matchedAlias, normalized) >= 85
  ) {
    return true;
  }
  return false;
}
