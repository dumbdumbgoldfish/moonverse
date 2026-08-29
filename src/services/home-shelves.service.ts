import {
  getAllReviews,
  getCompletedStoryReviews,
  getFollowingReviews,
  getFromSavesReviews,
  getPersonalizedReviews,
} from "@/services/review.service";
import { getPreferredGenres } from "@/services/preference.service";
import type { SalonShelfIconName } from "@/lib/salon-shelf-icons";
import type { DiscoveryShelfData } from "@/types/shelves";
import type { ReviewListItem } from "@/types/review";

const SHELF_SIZE = 12;
const lightweight = { lightweight: true as const };

export interface ForYouShelfData extends DiscoveryShelfData {
  iconName: SalonShelfIconName;
  accentClass: string;
}

function uniqueByNovel(
  reviews: ReviewListItem[],
  limit: number,
  usedNovelIds: Set<string>
): ReviewListItem[] {
  const result: ReviewListItem[] = [];
  for (const review of reviews) {
    if (usedNovelIds.has(review.novelId)) continue;
    usedNovelIds.add(review.novelId);
    result.push(review);
    if (result.length >= limit) break;
  }
  return result;
}

function withMatchReasons(
  reviews: ReviewListItem[],
  preferredNames: string[]
): ReviewListItem[] {
  if (preferredNames.length === 0) return reviews;
  return reviews.map((review) => {
    const matched = review.genres.find((genre) =>
      preferredNames.some(
        (name) => name.toLowerCase() === genre.toLowerCase()
      )
    );
    return {
      ...review,
      feedReason: matched
        ? `Matches your ${matched} preference`
        : review.feedReason ?? "Selected from your reading taste",
    };
  });
}

function shelf(
  data: ForYouShelfData
): ForYouShelfData | null {
  if (data.reviews.length === 0) return null;
  return data;
}

/**
 * Logged-in Home → For You review discovery shelves.
 * Every card is a novel review. No page-shortcut modules.
 */
export async function getPersonalizedHomeShelves(
  userId: string
): Promise<ForYouShelfData[]> {
  const preferred = await getPreferredGenres(userId);
  const preferredNames = preferred.map((genre) => genre.name);
  const spotlightGenre = preferred[0];

  const [
    trending,
    latest,
    highestRated,
    mostDiscussed,
    mostSaved,
    mostShared,
    personalizedPool,
    following,
    fromSaves,
    hiddenGems,
    genreSpotlight,
    completed,
  ] = await Promise.all([
    getAllReviews({ sort: "trending", limit: SHELF_SIZE, ...lightweight }),
    getAllReviews({ sort: "latest", limit: SHELF_SIZE, ...lightweight }),
    getAllReviews({ sort: "highest-rated", limit: SHELF_SIZE, ...lightweight }),
    getAllReviews({ sort: "most-discussed", limit: SHELF_SIZE, ...lightweight }),
    getAllReviews({ sort: "most-saved", limit: SHELF_SIZE, ...lightweight }),
    getAllReviews({ sort: "most-shared", limit: SHELF_SIZE, ...lightweight }),
    getPersonalizedReviews(userId, {
      limit: 36,
      allowTrendingFallback: false,
      ...lightweight,
    }),
    getFollowingReviews(userId, { limit: SHELF_SIZE, ...lightweight }),
    getFromSavesReviews(userId, { limit: SHELF_SIZE, ...lightweight }),
    getAllReviews({
      sort: "hidden-gems",
      personalizedUserId: userId,
      limit: SHELF_SIZE,
      ...lightweight,
    }),
    spotlightGenre
      ? getAllReviews({
          sort: "trending",
          genreSlug: spotlightGenre.slug,
          limit: 24,
          ...lightweight,
        })
      : Promise.resolve([]),
    getCompletedStoryReviews({
      genreSlugs: preferred.map((genre) => genre.slug).slice(0, 3),
      limit: SHELF_SIZE,
    }),
  ]);

  const personalReviews = withMatchReasons(
    uniqueByNovel(personalizedPool, SHELF_SIZE, new Set()),
    preferredNames
  );
  const personalNovelIds = new Set(personalReviews.map((review) => review.novelId));

  const madeForYou = withMatchReasons(
    uniqueByNovel(genreSpotlight, SHELF_SIZE, new Set(personalNovelIds)),
    preferredNames
  );

  const communityUsed = new Set(highestRated.map((review) => review.novelId));
  const fromCommunity = uniqueByNovel(
    [...mostDiscussed, ...latest],
    SHELF_SIZE,
    communityUsed
  );

  const worthUsed = new Set([
    ...personalNovelIds,
    ...hiddenGems.map((review) => review.novelId),
  ]);
  const worthYourTime = uniqueByNovel(completed, SHELF_SIZE, worthUsed);

  const shelves: Array<ForYouShelfData | null> = [
    shelf({
      id: "trending",
      title: "Trending on MoonVerse",
      subtitle: "Most loved reviews from the community right now",
      iconName: "trending",
      accentClass: "text-[#C45A1A]",
      reviews: uniqueByNovel(trending, SHELF_SIZE, new Set()),
    }),
    shelf({
      id: "latest",
      title: "Latest Novel Reviews",
      subtitle: "Fresh takes just published in the salon",
      iconName: "clock",
      accentClass: "text-[#6E46C7]",
      reviews: uniqueByNovel(latest, SHELF_SIZE, new Set()),
    }),
    shelf({
      id: "highest-rated",
      title: "Highest Rated Novel Reviews",
      subtitle: "Reviews readers scored the highest",
      iconName: "star",
      accentClass: "text-[#C89B4A]",
      reviews: uniqueByNovel(
        highestRated.filter((review) => review.rating >= 4),
        SHELF_SIZE,
        new Set()
      ),
    }),
    shelf({
      id: "most-discussed",
      title: "Most Discussed Novel Reviews",
      subtitle: "Threads with the most conversation",
      iconName: "messages",
      accentClass: "text-[#6E46C7]",
      reviews: uniqueByNovel(mostDiscussed, SHELF_SIZE, new Set()),
    }),
    shelf({
      id: "most-saved",
      title: "Most Saved Novel Reviews",
      subtitle: "Reviews readers keep coming back to",
      iconName: "bookmark",
      accentClass: "text-teal-700",
      reviews: uniqueByNovel(mostSaved, SHELF_SIZE, new Set()),
    }),
    shelf({
      id: "most-shared",
      title: "Most Shared Novel Reviews",
      subtitle: "Reviews people pass along",
      iconName: "share",
      accentClass: "text-[#6E46C7]",
      reviews: uniqueByNovel(mostShared, SHELF_SIZE, new Set()),
    }),
    shelf({
      id: "personal-recommendation",
      title: "Personal Recommendation Novel Reviews",
      subtitle: preferredNames[0]
        ? `Ranked from your ${preferredNames.slice(0, 3).join(", ")} taste`
        : "Ranked from your reading activity",
      iconName: "heart",
      accentClass: "text-[#6E46C7]",
      reviews: personalReviews,
    }),
    shelf({
      id: "following",
      title: "Reviews From People You Follow",
      subtitle: "New writing from your reading circle",
      iconName: "users",
      accentClass: "text-[#6E46C7]",
      reviews: uniqueByNovel(following, SHELF_SIZE, new Set()),
    }),
    shelf({
      id: "because-you-saved",
      title: "Because You Saved",
      subtitle: "Similar reviews to novels already on your shelves",
      iconName: "bookmark",
      accentClass: "text-teal-700",
      reviews: uniqueByNovel(fromSaves, SHELF_SIZE, new Set()),
    }),
    shelf({
      id: "hidden-gems",
      title: "Hidden Gems",
      subtitle: "Highly rated reviews with fewer voices so far",
      iconName: "gem",
      accentClass: "text-teal-700",
      reviews: uniqueByNovel(hiddenGems, SHELF_SIZE, new Set()),
    }),
    shelf({
      id: "made-for-you",
      title: "Made For You",
      subtitle: spotlightGenre
        ? `${spotlightGenre.name} reviews matched to your saved genres`
        : "Matched to the genres you chose",
      iconName: "sparkles",
      accentClass: "text-[#6E46C7]",
      reviews: madeForYou,
    }),
    shelf({
      id: "from-community",
      title: "From the Community",
      subtitle: "Strong recent reviews from MoonVerse readers",
      iconName: "user-plus",
      accentClass: "text-[#6E46C7]",
      reviews: fromCommunity,
    }),
    shelf({
      id: "worth-your-time",
      title: "Worth Your Time",
      subtitle: "Completed stories with reviews worth finishing",
      iconName: "hourglass",
      accentClass: "text-[#C89B4A]",
      reviews: worthYourTime,
    }),
  ];

  return shelves.filter((item): item is ForYouShelfData => item != null);
}
