import { scoreTitleMatch } from "@/lib/search";
import type { MoonieConfidence, MoonieMatchEvidence } from "@/types/moonie";

export interface MatchScoreInput {
  canonicalTitle: string;
  query: string;
  author?: string | null;
  queryAuthor?: string | null;
  aliases?: string[];
  hybridScore?: number;
  visionConfidence?: "high" | "medium" | "low";
  hasVerifiedReadingSource?: boolean;
  clueHits?: string[];
}

export interface ScoredMatch {
  confidence: MoonieConfidence;
  confidenceScore: number;
  evidence: MoonieMatchEvidence[];
  matchedAlias: string | null;
}

const NON_LATIN_RE = /[\u4e00-\u9fff\u1000-\u109f\u3040-\u30ff\uac00-\ud7af]/;

export function computeMatchConfidence(input: MatchScoreInput): ScoredMatch {
  const evidence: MoonieMatchEvidence[] = [];
  let score = 0;
  let matchedAlias: string | null = null;

  const normalizedQuery = input.query.trim().toLowerCase();
  const normalizedTitle = input.canonicalTitle.trim().toLowerCase();
  const titleScore = scoreTitleMatch(input.canonicalTitle, input.query);

  if (normalizedTitle === normalizedQuery) {
    evidence.push({ kind: "canonical_title", label: "Exact canonical title" });
    score += 0.45;
  } else if (titleScore >= 80) {
    evidence.push({ kind: "fuzzy_title", label: "Strong title similarity" });
    score += 0.3;
  } else if (titleScore >= 55) {
    evidence.push({ kind: "fuzzy_title", label: "Partial title match" });
    score += 0.2;
  } else if (titleScore > 0) {
    evidence.push({ kind: "fuzzy_title", label: "Fuzzy title similarity" });
    score += 0.1;
  }

  let bestAliasScore = 0;
  for (const alias of input.aliases ?? []) {
    const aliasScore = scoreTitleMatch(alias, input.query);
    if (aliasScore > bestAliasScore) {
      bestAliasScore = aliasScore;
      matchedAlias = alias;
    }
  }

  if (bestAliasScore >= 80 && matchedAlias) {
    evidence.push({
      kind: "alias",
      label: `Catalogue alias “${matchedAlias}”`,
    });
    score += 0.4;
  } else if (bestAliasScore >= 55 && matchedAlias) {
    evidence.push({
      kind: "alias",
      label: `Alias match “${matchedAlias}”`,
    });
    score += 0.25;
  } else if (bestAliasScore > titleScore) {
    matchedAlias = null;
  }

  if (input.queryAuthor && input.author) {
    const author = input.author.trim().toLowerCase();
    const queryAuthor = input.queryAuthor.trim().toLowerCase();
    if (
      author === queryAuthor ||
      author.includes(queryAuthor) ||
      queryAuthor.includes(author)
    ) {
      evidence.push({ kind: "author", label: "Author match" });
      score += 0.2;
    }
  }

  if (input.hasVerifiedReadingSource) {
    evidence.push({
      kind: "reading_source",
      label: "Verified reading source on MoonVerse",
    });
    score += 0.05;
  }

  if (input.hybridScore != null && input.hybridScore > 0) {
    evidence.push({
      kind: "catalogue_verified",
      label: "Catalogue retrieval signal",
    });
    score += Math.min(0.25, input.hybridScore * 0.35);
  }

  for (const clue of input.clueHits ?? []) {
    evidence.push({ kind: "genre_tag", label: clue });
    score += 0.05;
  }

  if (input.visionConfidence === "high") {
    evidence.push({ kind: "vision", label: "Clear text in screenshot" });
    score += 0.1;
  } else if (input.visionConfidence === "medium") {
    score += 0.05;
  }

  const multilingualAlias = (input.aliases ?? []).find(
    (alias) =>
      NON_LATIN_RE.test(alias) && scoreTitleMatch(alias, input.query) >= 55
  );
  if (multilingualAlias) {
    evidence.push({
      kind: "multilingual",
      label: "Stored alternate-language title",
    });
    score += 0.1;
    if (!matchedAlias) matchedAlias = multilingualAlias;
  }

  score = Math.min(1, score);

  let confidence: MoonieConfidence = "low";
  if (score >= 0.72) confidence = "high";
  else if (score >= 0.42) confidence = "medium";

  return {
    confidence,
    confidenceScore: score,
    evidence,
    matchedAlias,
  };
}

export function shouldClarify(
  candidates: Array<{ confidenceScore: number; confidence: MoonieConfidence }>
): boolean {
  if (candidates.length <= 1) return false;

  const sorted = [...candidates].sort(
    (a, b) => b.confidenceScore - a.confidenceScore
  );
  const top = sorted[0];
  const second = sorted[1];
  if (!top || !second) return false;

  if (
    top.confidence === "high" &&
    top.confidenceScore >= 0.75 &&
    top.confidenceScore - second.confidenceScore >= 0.15
  ) {
    return false;
  }

  if (
    top.confidenceScore >= 0.42 &&
    second.confidenceScore >= 0.35 &&
    top.confidenceScore - second.confidenceScore < 0.12
  ) {
    return true;
  }

  if (top.confidenceScore < 0.72 && candidates.length >= 2) {
    return true;
  }

  if (
    top.confidenceScore < 0.75 &&
    second.confidenceScore >= top.confidenceScore - 0.08
  ) {
    return true;
  }

  return false;
}

export function shouldClarifyForReadingLink(
  candidates: Array<{
    confidenceScore: number;
    confidence: MoonieConfidence;
    evidence: MoonieMatchEvidence[];
  }>
): boolean {
  if (candidates.length <= 1) return false;

  const exactCanonical = candidates.filter((candidate) =>
    candidate.evidence.some((item) => item.kind === "canonical_title")
  );
  if (exactCanonical.length === 1) {
    return false;
  }
  if (exactCanonical.length > 1) {
    return true;
  }

  const aliasMatches = candidates.filter(
    (candidate) =>
      candidate.evidence.some((item) => item.kind === "alias") &&
      candidate.confidenceScore >= 0.55
  );
  if (aliasMatches.length === 1) {
    return false;
  }
  if (aliasMatches.length > 1) {
    return true;
  }

  const sorted = [...candidates].sort(
    (a, b) => b.confidenceScore - a.confidenceScore
  );
  const top = sorted[0];
  const second = sorted[1];
  if (
    top &&
    top.confidence === "high" &&
    top.confidenceScore >= 0.72 &&
    (!second || top.confidenceScore - second.confidenceScore >= 0.12)
  ) {
    return false;
  }

  return shouldClarify(candidates);
}

export function confidenceFromScore(score: number): MoonieConfidence {
  if (score >= 0.72) return "high";
  if (score >= 0.42) return "medium";
  return "low";
}
