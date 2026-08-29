import {
  displayReviewTitle,
  isCuratedWebNovelTitle,
  isTemplateReviewTitle,
} from "./landing-reviews";
import type { TrendingNovelPreview } from "../types/discovery";

export function isLandingDiscoverCandidate(input: {
  title: string;
  hasOfficialLink?: boolean;
}): boolean {
  return isCuratedWebNovelTitle(input.title) || Boolean(input.hasOfficialLink);
}

/** Display-only. Drops seed template titles. Does not invent a quote. */
export function discoverShelfQuote(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const cleaned = displayReviewTitle(raw.trim());
  if (!cleaned || isTemplateReviewTitle(cleaned)) return undefined;
  if (cleaned.length < 24) return undefined;
  return cleaned;
}

export function pickLandingDiscoverNovels(
  novels: TrendingNovelPreview[],
  limit = 12,
  sort: "trending" | "highest" = "trending"
): TrendingNovelPreview[] {
  const eligible = novels.filter((novel) =>
    isLandingDiscoverCandidate({
      title: novel.title,
      hasOfficialLink: novel.hasOfficialLink,
    })
  );

  const ranked = [...eligible].sort((a, b) => {
    const aCover = a.coverUrl ? 1 : 0;
    const bCover = b.coverUrl ? 1 : 0;
    if (bCover !== aCover) return bCover - aCover;

    if (sort === "highest") {
      return (
        b.averageRating - a.averageRating ||
        b.reviewCount - a.reviewCount ||
        a.title.localeCompare(b.title)
      );
    }
    return (
      b.score - a.score ||
      b.mostRecentReviewAt.localeCompare(a.mostRecentReviewAt) ||
      a.title.localeCompare(b.title)
    );
  });

  const picked: TrendingNovelPreview[] = [];
  const seen = new Set<string>();
  for (const novel of ranked) {
    if (seen.has(novel.novelId)) continue;
    seen.add(novel.novelId);
    picked.push({
      ...novel,
      communityQuote: discoverShelfQuote(novel.communityQuote),
    });
    if (picked.length >= limit) break;
  }
  return picked;
}
