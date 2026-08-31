import { Suspense } from "react";
import { PageRouteLoading } from "@/components/layout/PageRouteLoading";
import { SearchPage } from "@/components/search/SearchPage";
import { parseSearchPage, parseSearchSort, parseSearchType, parseTagSlugs, searchBatchSize } from "@/lib/search";
import { redirectIncompleteOnboarding } from "@/lib/onboarding-guard";
import { runSearch } from "@/services/search.service";

export const metadata = {
  title: "Search · MoonVerse",
  description:
    "Search the MoonVerse stacks for works, reviews, readers, and lists, then refine with genre, tags, and rating.",
};

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    tab?: string;
    sort?: string;
    genre?: string;
    tags?: string;
    tag?: string;
    rating?: string;
    page?: string;
  }>;
}

async function SearchContent({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { q, type, tab, sort, genre, tags, tag, rating, page } = params;

  const session = await redirectIncompleteOnboarding();
  const isLoggedIn = !!session?.user?.id;
  const parsedType = parseSearchType(type ?? tab);
  const parsedSort = parseSearchSort(sort);
  const searchTags = parseTagSlugs(tags, tag);
  const parsedPage = parseSearchPage(page);
  const pagingKind = parsedType === "all" ? "works" : parsedType;
  const pageSize = searchBatchSize(pagingKind, 1280);
  const fetchType =
    parsedType === "all" && parsedPage > 1 ? "works" : parsedType;

  const result = await runSearch({
    query: q ?? "",
    type: fetchType,
    sort: parsedSort,
    genreSlug: genre,
    tagSlugs: searchTags,
    limit: pageSize,
    offset: (parsedPage - 1) * pageSize,
    viewerId: session?.user?.id,
  });

  const parsedRating = Number(rating ?? "0");

  return (
    <SearchPage
      initial={{ ...result, type: parsedType }}
      isLoggedIn={isLoggedIn}
      currentUserId={session?.user?.id}
      minRating={parsedRating === 3 || parsedRating === 4 ? parsedRating : 0}
      initialPage={parsedPage}
    />
  );
}

export default function SearchRoute(props: SearchPageProps) {
  return (
    <Suspense
      fallback={<PageRouteLoading label="Loading search" title="Search" />}
    >
      <SearchContent {...props} />
    </Suspense>
  );
}
