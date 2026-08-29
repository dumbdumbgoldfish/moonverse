import { Suspense } from "react";
import { ReviewsSalonPage } from "@/components/discovery/DiscoverPage";
import { ReviewsJsonLd } from "@/components/reviews/salon/ReviewsJsonLd";
import { ReviewsSalonShelvesClient } from "@/components/reviews/salon/ReviewsSalonShelvesClient";
import { DISCOVER_PATH } from "@/lib/home-view";
import { parseReviewVerdictFilter } from "@/lib/review-verdict-filter";
import { WEB_NOVEL_TAGS } from "@/lib/tags";
import { redirectIncompleteOnboarding } from "@/lib/onboarding-guard";
import { countReviews, getAllReviews } from "@/services/review.service";
import { parseReviewSort } from "@/types/review";

export const metadata = {
  title: "Discover · MoonVerse",
  description:
    "Discover community reviews: trending, highest-rated, and curated shelves from MoonVerse readers.",
};

export const dynamic = "force-dynamic";

const REVIEWS_PAGE_SIZE = 10;
const MAX_TAGS = 3;
const CONTEXTUAL_SHELF_SIZE = 8;

interface DiscoverPageProps {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    genre?: string;
    tags?: string;
    tag?: string;
    spoilers?: string;
    link?: string;
    verdict?: string;
    page?: string;
  }>;
}

function parseTagSlugs(tags?: string, legacyTag?: string): string[] {
  const fromTags = (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const merged = [...fromTags];
  const legacy = legacyTag?.trim();
  if (legacy && !merged.includes(legacy)) merged.push(legacy);
  return merged.slice(0, MAX_TAGS);
}

async function DiscoverContent({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const { q, sort, genre, tags, tag, spoilers, link, verdict, page: pageParam } =
    params;

  const session = await redirectIncompleteOnboarding();
  const isLoggedIn = !!session?.user?.id;
  const tagSlugs = parseTagSlugs(tags, tag);
  const spoilerFree = spoilers === "hide";
  const hasOfficialLink = link === "official";
  const parsedVerdict = parseReviewVerdictFilter(verdict);
  const parsedSort = parseReviewSort(sort, isLoggedIn);
  const parsedPage = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const initialPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const reviewOffset = (initialPage - 1) * REVIEWS_PAGE_SIZE;

  const reviewFilters = {
    query: q,
    genreSlug: genre,
    tagSlugs: tagSlugs.length ? tagSlugs : undefined,
    sort: parsedSort,
    personalizedUserId: session?.user?.id,
    spoilerFree: spoilerFree || undefined,
    hasOfficialLink: hasOfficialLink || undefined,
    verdictFilter: parsedVerdict ?? undefined,
  };

  const hasActiveFilters =
    Boolean(q?.trim()) ||
    Boolean(genre) ||
    tagSlugs.length > 0 ||
    spoilerFree ||
    hasOfficialLink ||
    Boolean(parsedVerdict) ||
    parsedSort !== "trending";

  const contextualShelfPromise = hasActiveFilters
    ? getAllReviews({
        sort: parsedSort,
        genreSlug: genre,
        tagSlugs: tagSlugs.length ? tagSlugs : undefined,
        personalizedUserId: session?.user?.id,
        spoilerFree: spoilerFree || undefined,
        hasOfficialLink: hasOfficialLink || undefined,
        verdictFilter: parsedVerdict ?? undefined,
        limit: CONTEXTUAL_SHELF_SIZE,
        offset: REVIEWS_PAGE_SIZE,
        lightweight: true,
      })
    : Promise.resolve([]);

  const [reviews, totalReviews, contextualShelfReviews] = await Promise.all([
    getAllReviews({
      ...reviewFilters,
      limit: REVIEWS_PAGE_SIZE,
      offset: reviewOffset,
    }),
    countReviews(reviewFilters),
    contextualShelfPromise,
  ]);

  const showDefaultPitch =
    !q?.trim() &&
    !genre &&
    tagSlugs.length === 0 &&
    !spoilerFree &&
    !hasOfficialLink &&
    !parsedVerdict &&
    parsedSort === "trending";

  return (
    <>
      <ReviewsJsonLd reviews={reviews} pageUrl={DISCOVER_PATH} />
      <ReviewsSalonPage
        reviews={reviews}
        totalReviews={totalReviews}
        reviewPageSize={REVIEWS_PAGE_SIZE}
        profilePageSize={REVIEWS_PAGE_SIZE}
        profiles={[]}
        genres={[]}
        catalogTags={WEB_NOVEL_TAGS.map((t) => ({
          name: t.name,
          slug: t.slug,
        }))}
        popularTags={[]}
        topReviewers={[]}
        folders={[]}
        initialQuery={q ?? ""}
        initialGenre={genre}
        initialTags={tagSlugs}
        initialSort={parsedSort}
        initialSpoilerFree={spoilerFree}
        initialHasOfficialLink={hasOfficialLink}
        initialVerdict={parsedVerdict}
        initialPage={initialPage}
        contextualShelfReviews={contextualShelfReviews}
        isLoggedIn={isLoggedIn}
        currentUserId={session?.user?.id}
        loadSidebarMeta
      >
        {showDefaultPitch ? <ReviewsSalonShelvesClient /> : null}
      </ReviewsSalonPage>
    </>
  );
}

export default function DiscoverRoute(props: DiscoverPageProps) {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-10 text-muted-foreground">Loading Discover…</div>
      }
    >
      <DiscoverContent {...props} />
    </Suspense>
  );
}
