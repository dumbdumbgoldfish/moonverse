import { Prisma, ReadingLinkCategory, ReadingLinkModerationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getBrowseWorks } from "@/services/browse.service";
import type { BrowseWorkItem } from "@/types/browse";

const officialReadingLinkWhere: Prisma.ReadingLinkWhereInput = {
  active: true,
  moderationStatus: ReadingLinkModerationStatus.APPROVED,
  OR: [
    { isOfficial: true },
    { isVerified: true },
    { category: ReadingLinkCategory.OFFICIAL },
  ],
};

export const BROWSE_HUB_FEATURED_SLUGS = [
  "fantasy",
  "romance",
  "litrpg",
  "xianxia",
  "sci-fi",
  "cultivation",
] as const;

export interface BrowseHubShelfCover {
  novelId: string;
  title: string;
  author: string;
  coverUrl: string;
  href: string;
}

export interface BrowseHubShelf {
  slug: string;
  name: string;
  novelCount: number;
  officialCount: number;
  covers: BrowseHubShelfCover[];
  href: string;
}

export interface BrowseHubPayload {
  shelves: BrowseHubShelf[];
  proofRail: BrowseWorkItem[];
}

function shelfHref(slug: string) {
  return `/browse/${encodeURIComponent(slug)}?sort=community-strength`;
}

/** Featured genre mosaics + a cross-genre proof rail for the browse hub. */
export async function getBrowseHubPayload(
  genreMeta: { slug: string; name: string }[]
): Promise<BrowseHubPayload> {
  const featured = BROWSE_HUB_FEATURED_SLUGS.map((slug) =>
    genreMeta.find((genre) => genre.slug === slug)
  ).filter((genre): genre is { slug: string; name: string } => Boolean(genre));

  const shelfRows = await Promise.all(
    featured.map(async (genre) => {
      const where: Prisma.NovelWhereInput = {
        genres: { some: { slug: genre.slug } },
      };
      const [novelCount, officialCount, worksPage] = await Promise.all([
        db.novel.count({ where }),
        db.novel.count({
          where: {
            ...where,
            readingLinks: { some: officialReadingLinkWhere },
          },
        }),
        getBrowseWorks({
          genreSlug: genre.slug,
          sort: "community-strength",
          limit: 5,
          offset: 0,
        }),
      ]);

      const shelf: BrowseHubShelf = {
        slug: genre.slug,
        name: genre.name,
        novelCount,
        officialCount,
        href: shelfHref(genre.slug),
        covers: worksPage.works.slice(0, 4).map((work) => ({
          novelId: work.novelId,
          title: work.title,
          author: work.author,
          coverUrl: work.coverUrl,
          href: work.href,
        })),
      };

      return { shelf, works: worksPage.works };
    })
  );

  const shelves = shelfRows.map((row) => row.shelf);
  const proofRail: BrowseWorkItem[] = [];
  const seen = new Set<string>();
  for (const row of shelfRows) {
    for (const work of row.works.slice(0, 2)) {
      if (seen.has(work.novelId)) continue;
      seen.add(work.novelId);
      proofRail.push(work);
      if (proofRail.length >= 12) break;
    }
    if (proofRail.length >= 12) break;
  }

  return { shelves, proofRail };
}
