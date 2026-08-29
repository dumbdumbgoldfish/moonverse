import { genreLabel } from "@/lib/genres";
import {
  getCachedGenresWithReviewCounts,
  getCachedTopReviewers,
} from "@/lib/cached-queries";
import { getFollowingIds } from "@/services/follow-queries";
import { getAllReviews } from "@/services/review.service";
import type { ReviewsSalonShelfData } from "@/components/reviews/salon/reviews-salon-shelf-data";
import type { TopReviewerPreview } from "@/types/discovery";
import type { GenreOption } from "@/types/review";

export type { ReviewsSalonShelfData } from "@/components/reviews/salon/reviews-salon-shelf-data";
export {
  ReviewsSalonShelvesSkeleton,
  ReviewsSalonShelvesView,
} from "@/components/reviews/salon/ReviewsSalonShelvesView";

const SHELF_SIZE = 10;
const shelfQuery = { lightweight: true as const };

export async function loadReviewsSalonShelvesForUser(
  isLoggedIn: boolean,
  userId?: string,
  preloaded?: {
    genres?: GenreOption[];
    topReviewers?: TopReviewerPreview[];
  }
): Promise<ReviewsSalonShelfData> {
  const genresPromise = preloaded?.genres
    ? Promise.resolve(preloaded.genres)
    : getCachedGenresWithReviewCounts();
  const topReviewersPromise = preloaded?.topReviewers
    ? Promise.resolve(preloaded.topReviewers)
    : getCachedTopReviewers();

  const [genres, topReviewers, momentumReviews, hiddenGemsRaw, lovedRaw] =
    await Promise.all([
      genresPromise,
      topReviewersPromise,
      getAllReviews({ sort: "trending", limit: SHELF_SIZE, ...shelfQuery }),
      isLoggedIn && userId
        ? getAllReviews({
            sort: "hidden-gems",
            personalizedUserId: userId,
            limit: SHELF_SIZE,
            ...shelfQuery,
          })
        : getAllReviews({ sort: "most-saved", limit: SHELF_SIZE, ...shelfQuery }),
      getAllReviews({ sort: "highest-rated", limit: SHELF_SIZE, ...shelfQuery }),
    ]);

  const lovedReviews = lovedRaw.filter((review) => review.rating >= 4);
  const rankedGenres = [...genres].sort(
    (a, b) => b.reviewCount - a.reviewCount || a.name.localeCompare(b.name)
  );
  const spotlightGenre = rankedGenres.find((g) => g.reviewCount > 0);
  const genreSpotlightReviews = spotlightGenre
    ? await getAllReviews({
        sort: "trending",
        genreSlug: spotlightGenre.slug,
        limit: SHELF_SIZE,
        ...shelfQuery,
      })
    : [];

  let enrichedTopReviewers = topReviewers;
  if (isLoggedIn && userId && topReviewers.length > 0) {
    const followingIds = await getFollowingIds(
      userId,
      topReviewers.map((reviewer) => reviewer.id)
    );
    enrichedTopReviewers = topReviewers.map((reviewer) => ({
      ...reviewer,
      viewerIsFollowing: followingIds.has(reviewer.id),
    }));
  }

  return {
    momentumReviews,
    lovedReviews,
    hiddenGemsReviews: hiddenGemsRaw,
    genreSpotlightReviews,
    genreSpotlightName: spotlightGenre
      ? genreLabel(spotlightGenre.slug)
      : undefined,
    genreSpotlightSlug: spotlightGenre?.slug,
    topReviewers: enrichedTopReviewers,
    isLoggedIn,
  };
}

/** @deprecated Use ReviewsSalonShelvesView in client code. */
export { ReviewsSalonShelvesView as ReviewsSalonShelvesServer } from "@/components/reviews/salon/ReviewsSalonShelvesView";
