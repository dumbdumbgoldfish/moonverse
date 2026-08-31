import { isAcceptedCompareCatalogueMatch } from "@/lib/moonie/compare-acceptance";
import type { MoonieLookupCandidate } from "@/types/moonie";

/**
 * Catalogue lookup acceptance — slightly broader than compare acceptance so
 * partial-title and close fuzzy matches can resolve without substituting unrelated novels.
 */
export function isAcceptedLookupCatalogueMatch(
  candidate: MoonieLookupCandidate
): boolean {
  if (isAcceptedCompareCatalogueMatch(candidate)) {
    return true;
  }

  if (candidate.confidence === "low") {
    return false;
  }

  const hasPartialFuzzy = candidate.evidence.some(
    (item) =>
      item.kind === "fuzzy_title" && item.label === "Partial title match"
  );
  if (hasPartialFuzzy && candidate.confidenceScore >= 0.45) {
    return true;
  }

  const hasWeakFuzzy = candidate.evidence.some(
    (item) =>
      item.kind === "fuzzy_title" && item.label === "Fuzzy title similarity"
  );
  return hasWeakFuzzy && candidate.confidenceScore >= 0.55;
}
