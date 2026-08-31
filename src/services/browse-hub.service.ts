import { Prisma, ReadingLinkCategory, ReadingLinkModerationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { resolveCoverUrl } from "@/lib/review-utils";
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

const HUB_COVER_SELECT = {
  id: true,
  title: true,
  author: true,
  coverUrl: true,
  publicationStatus: true,
  _count: { select: { reviews: true } },
} satisfies Prisma.NovelSelect;

function toHubWork(
  novel: Prisma.NovelGetPayload<{ select: typeof HUB_COVER_SELECT }>
): BrowseWorkItem {
  return {
    novelId: novel.id,
    title: novel.title,
    author: novel.author ?? "Unknown author",
    coverUrl: resolveCoverUrl(novel.coverUrl, { title: novel.title }),
    genres: [],
    tags: [],
    averageRating: 0,
    reviewCount: novel._count.reviews,
    hasOfficialLink: false,
    href: `/novels/${novel.id}`,
    bayesianRating: 0,
    publicationStatus: novel.publicationStatus,
    synopsis: null,
    rankExplain: {
      sort: "community-strength",
      reasons: ["Featured on the browse hub by community review volume"],
    },
  };
}

/**
 * Featured genre mosaics + a cross-genre proof rail.
 * Uses slim cover queries instead of full genre ranking (which loads up to
 * 200 novels and every review row per shelf).
 */
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
      const [novelCount, officialCount, covers] = await Promise.all([
        db.novel.count({ where }),
        db.novel.count({
          where: {
            ...where,
            readingLinks: { some: officialReadingLinkWhere },
          },
        }),
        db.novel.findMany({
          where,
          take: 5,
          orderBy: { reviews: { _count: "desc" } },
          select: HUB_COVER_SELECT,
        }),
      ]);

      const works = covers.map(toHubWork);
      const shelf: BrowseHubShelf = {
        slug: genre.slug,
        name: genre.name,
        novelCount,
        officialCount,
        href: shelfHref(genre.slug),
        covers: works.slice(0, 4).map((work) => ({
          novelId: work.novelId,
          title: work.title,
          author: work.author,
          coverUrl: work.coverUrl,
          href: work.href,
        })),
      };

      return { shelf, works };
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
