import type { MoonieConfidence } from "@/types/moonie";
import { polishSummaryMakesCatalogueAbsenceClaim } from "@/lib/moonie/hard-constraints";
import { confidenceFromMatchPercent } from "@/lib/moonie/ranking";
import { normalizeConfidence } from "@/lib/moonie/guardrails";

/** Phrases Moonie should not use in normal user-facing replies. */
export const MOONIE_INTERNAL_JARGON_RE =
  /\b(unverified demo metadata|fixture provenance|hard constraint eligibility|retrieval layer|verified retrieval incomplete|metadata eligibility)\b/i;

export function sanitizePolishedReason(
  reason: string,
  matchPercent: number
): string {
  if (matchPercent >= 35) return reason;
  let text = reason;
  text = text.replace(/\bstrong (match|fit)\b/gi, "modest $1");
  text = text.replace(/\bstrong MoonVerse community ratings\b/gi, "early MoonVerse ratings");
  if (/\bstrong\b/i.test(text)) {
    text = text.replace(/\bstrong\b/gi, "modest");
  }
  return text;
}

export function reasonClaimsUnavailablePersonalization(
  text: string,
  influencedBy: string[] = []
): boolean {
  if (influencedBy.length > 0) return false;
  return /\b(saved (?:taste|novels?|preferences?)|your history|who you follow|reading list|saved library)\b/i.test(
    text
  );
}

export function mergePolishedConfidence(
  polished: unknown,
  base: MoonieConfidence,
  matchPercent: number,
  reviewCount = 0
): MoonieConfidence {
  const scoreCap = confidenceFromMatchPercent(matchPercent, reviewCount);
  const polishedLevel = normalizeConfidence(polished ?? base);
  const rank: Record<MoonieConfidence, number> = {
    low: 0,
    medium: 1,
    high: 2,
  };
  return rank[polishedLevel] > rank[scoreCap] ? scoreCap : polishedLevel;
}

export function acceptPolishedSummary(
  candidate: string,
  fallback: string
): string {
  const trimmed = candidate.trim();
  if (!trimmed) return fallback;
  if (polishSummaryMakesCatalogueAbsenceClaim(trimmed)) return fallback;
  if (MOONIE_INTERNAL_JARGON_RE.test(trimmed)) return fallback;
  return trimmed;
}

export function acceptPolishedReason(
  candidate: string,
  fallback: string,
  matchPercent: number,
  influencedBy: string[] = []
): string {
  const trimmed = candidate.trim();
  if (!trimmed) return fallback;
  if (polishSummaryMakesCatalogueAbsenceClaim(trimmed)) return fallback;
  if (reasonClaimsUnavailablePersonalization(trimmed, influencedBy)) return fallback;
  if (MOONIE_INTERNAL_JARGON_RE.test(trimmed)) return fallback;
  return sanitizePolishedReason(trimmed, matchPercent);
}
