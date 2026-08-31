import {
  isCloseNightShelfCandidate,
  normalizeNovelTitle,
  scoreLandingDoorFace,
} from "@/lib/landing-genres";
import { isMissingCoverUrl, resolveCoverUrl } from "@/lib/review-utils";
import type { LandingGenreCover } from "@/types/discovery";

export type LandingDoorNovelInput = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  _count: { reviews: number; readingLinks: number };
};

function coverSourceScore(coverUrl: string | null): number {
  if (!coverUrl || isMissingCoverUrl(coverUrl)) return 0;
  if (
    coverUrl.includes("cdn.wuxiaworld.com") ||
    coverUrl.includes("wikimedia.org") ||
    coverUrl.includes("wikipedia.org")
  ) {
    return 30;
  }
  if (coverUrl.includes("openlibrary.org")) return 15;
  if (coverUrl.includes("royalroadcdn.com")) return 5;
  return 1;
}

export function landingNovelDisplayCover(novel: LandingDoorNovelInput): string {
  return resolveCoverUrl(novel.coverUrl, { title: novel.title });
}

/**
 * Pick genre-door preview faces from eligible catalogue records in this door.
 * Eligibility (curated web novel or verified reading link) is separate from cover art:
 * missing jackets still appear with the branded placeholder.
 */
export function pickLandingDoorCovers(
  novels: LandingDoorNovelInput[],
  limit: number,
  curatedTitles: ReadonlySet<string>
): LandingGenreCover[] {
  const eligible = novels.filter((novel) =>
    isCloseNightShelfCandidate({
      curated: curatedTitles.has(normalizeNovelTitle(novel.title)),
      readingLinkCount: novel._count.readingLinks,
    })
  );

  if (eligible.length === 0) return [];

  return [...eligible]
    .sort((a, b) => {
      const coverDelta =
        coverSourceScore(landingNovelDisplayCover(b)) -
        coverSourceScore(landingNovelDisplayCover(a));
      if (coverDelta !== 0) return coverDelta;
      const scoreDelta =
        scoreLandingDoorFace({
          missingCover: isMissingCoverUrl(landingNovelDisplayCover(b)),
          reviewCount: b._count.reviews,
          readingLinkCount: b._count.readingLinks,
          curated: curatedTitles.has(normalizeNovelTitle(b.title)),
        }) -
        scoreLandingDoorFace({
          missingCover: isMissingCoverUrl(landingNovelDisplayCover(a)),
          reviewCount: a._count.reviews,
          readingLinkCount: a._count.readingLinks,
          curated: curatedTitles.has(normalizeNovelTitle(a.title)),
        });
      if (scoreDelta !== 0) return scoreDelta;
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit)
    .map((novel) => ({
      novelId: novel.id,
      title: novel.title,
      author: novel.author ?? "Unknown author",
      coverUrl: landingNovelDisplayCover(novel),
    }));
}
