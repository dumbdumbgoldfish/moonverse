import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GenreBrowseView } from "@/components/browse/GenreBrowseView";
import { getSession } from "@/lib/session";
import {
  genreBrowseSortToApi,
  parseGenreBrowseSort,
} from "@/lib/browse-sort";
import { db } from "@/lib/db";
import { WEB_NOVEL_GENRES } from "@/lib/genres";
import { LITERARY_PAGE_BG } from "@/lib/literary-salon";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import { getTagsForGenre } from "@/lib/tags";
import { getBrowseWorks } from "@/services/browse.service";
import { countReviews, getAllReviews } from "@/services/review.service";
import { parseBrowseMode } from "@/types/browse";
import type { ReviewSort } from "@/types/review";

export const dynamic = "force-dynamic";

interface BrowsePageProps {
  params: Promise<{ genre: string }>;
  searchParams: Promise<{
    tags?: string;
    sort?: string;
    mode?: string;
    link?: string;
  }>;
}

async function BrowseContent({ params, searchParams }: BrowsePageProps) {
  const { genre } = await params;
  const { tags, sort, mode: modeParam, link } = await searchParams;
  const session = await getSession();
  const userId = session?.user?.id ?? null;

  const genreMeta = WEB_NOVEL_GENRES.find((g) => g.slug === genre);
  if (!genreMeta) notFound();

  const tagSlugs = (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  const mode = parseBrowseMode(modeParam);
  let browseSort = parseGenreBrowseSort(sort);
  if (browseSort === "affinity" && !userId) {
    browseSort = "community-strength";
  }
  const apiSort = genreBrowseSortToApi(browseSort) as ReviewSort;
  const officialOnly = link === "official";

  const reviewFilters = {
    genreSlug: genre,
    tagSlugs: tagSlugs.length ? tagSlugs : undefined,
    sort: apiSort,
    hasOfficialLink: officialOnly || undefined,
  };

  const [reviewBundle, worksBundle, novelCount, heroShelf] = await Promise.all([
    mode === "reviews"
      ? Promise.all([
          getAllReviews({ ...reviewFilters, limit: 15 }),
          countReviews(reviewFilters),
        ])
      : Promise.resolve([[] as Awaited<ReturnType<typeof getAllReviews>>, 0] as const),
    mode === "works"
      ? getBrowseWorks({
          genreSlug: genre,
          tagSlugs: tagSlugs.length ? tagSlugs : undefined,
          sort: browseSort,
          limit: 15,
          offset: 0,
          officialOnly,
          userId,
        })
      : Promise.resolve({ works: [], total: 0, offset: 0, limit: 15, nextCursor: null }),
    db.novel.count({
      where: { genres: { some: { slug: genre } } },
    }),
    getBrowseWorks({
      genreSlug: genre,
      sort: "community-strength",
      limit: 4,
      offset: 0,
    }),
  ]);

  const initialReviews = mode === "reviews" ? [...reviewBundle[0]] : [];
  const initialTotal =
    mode === "reviews" ? reviewBundle[1] : worksBundle.total;
  const initialWorks = mode === "works" ? worksBundle.works : [];
  const heroCovers = heroShelf.works.map((work) => ({
    novelId: work.novelId,
    title: work.title,
    author: work.author,
    coverUrl: work.coverUrl,
  }));

  const genreTags = getTagsForGenre(genre);

  return (
    <GenreBrowseView
      genreSlug={genre}
      initialMode={mode}
      initialReviews={initialReviews}
      initialWorks={initialWorks}
      initialTotal={initialTotal}
      novelCount={novelCount}
      heroCovers={heroCovers}
      tags={genreTags.map((t) => ({ name: t.name, slug: t.slug }))}
      initialTagSlugs={tagSlugs}
      initialSort={browseSort}
      initialOfficialOnly={officialOnly}
      isAuthenticated={Boolean(userId)}
    />
  );
}

export async function generateMetadata({ params }: BrowsePageProps) {
  const { genre } = await params;
  const genreMeta = WEB_NOVEL_GENRES.find((g) => g.slug === genre);
  if (!genreMeta) return { title: "Browse | MoonVerse" };

  return {
    title: `${genreMeta.name} | Browse | MoonVerse`,
    description: `Browse ${genreMeta.name.toLowerCase()} web novels and reviews on MoonVerse.`,
  };
}

export default function BrowsePage(props: BrowsePageProps) {
  return (
    <div className={cn(LITERARY_PAGE_BG, "flex flex-1 flex-col text-night-blue")}>
      <main className="flex-1">
        <Suspense
          fallback={
            <div className={cn(SITE_SHELL_CLASS, "py-12 text-muted-foreground")}>
              Loading browse…
            </div>
          }
        >
          <BrowseContent {...props} />
        </Suspense>
      </main>
    </div>
  );
}
