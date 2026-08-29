import type { ReadingTasteSnapshot } from "@/services/feed.service";
import { EMPTY_READING_TASTE_SNAPSHOT } from "@/services/feed.service";

export type TasteMaturity = "learning" | "defined" | "distinct";

export interface TasteInsightSnapshot {
  maturity: TasteMaturity;
  maturityLabel: string;
  explainText: string;
  freshMatchCount: number;
  signalTotal: number;
}

export function genreStrengthLabel(
  count: number,
  max: number
): "Strong" | "Moderate" | "Light" {
  if (max <= 0) return "Light";
  const ratio = count / max;
  if (ratio >= 0.75) return "Strong";
  if (ratio >= 0.4) return "Moderate";
  return "Light";
}

export function buildTasteMaturity(
  taste: ReadingTasteSnapshot | null | undefined
): {
  maturity: TasteMaturity;
  label: string;
} {
  const snapshot = taste ?? EMPTY_READING_TASTE_SNAPSHOT;
  const signals =
    snapshot.reviewCount +
    snapshot.savedNovelCount +
    snapshot.followingCount +
    snapshot.topGenres.length;

  if (!snapshot.hasSignals || signals < 4) {
    return { maturity: "learning", label: "Learning" };
  }
  if (snapshot.reviewCount >= 5 || snapshot.savedNovelCount >= 15) {
    return { maturity: "distinct", label: "Distinct" };
  }
  return { maturity: "defined", label: "Defined" };
}

export function buildTasteExplainText(
  taste: ReadingTasteSnapshot | null | undefined
): string {
  const snapshot = taste ?? EMPTY_READING_TASTE_SNAPSHOT;
  const parts: string[] = [];
  if (snapshot.savedNovelCount > 0) {
    parts.push(
      `${snapshot.savedNovelCount} saved ${snapshot.savedNovelCount === 1 ? "story" : "stories"}`
    );
  }
  if (snapshot.reviewCount > 0) {
    parts.push(
      `${snapshot.reviewCount} ${snapshot.reviewCount === 1 ? "review" : "reviews"}`
    );
  }
  if (snapshot.topGenres.length > 0) {
    parts.push("preferred genres");
  }
  if (parts.length === 0) {
    return "Save novels and follow reviewers to shape your taste signature.";
  }
  return `Based on ${parts.join(", ")}. Bars show weight relative to your top genres.`;
}

export function buildTasteInsight(
  taste: ReadingTasteSnapshot,
  freshMatchCount: number
): TasteInsightSnapshot {
  const { maturity, label } = buildTasteMaturity(taste);
  const signalTotal = taste.topGenres.reduce((sum, genre) => sum + genre.count, 0);

  return {
    maturity,
    maturityLabel: label,
    explainText: buildTasteExplainText(taste),
    freshMatchCount,
    signalTotal,
  };
}
