import { unstable_cache } from "next/cache";
import { getDiscoverPopularTags, getTopReviewers } from "@/services/discovery.service";
import { getCommunityStats } from "@/services/community.service";
import { getGenresWithReviewCounts } from "@/services/review.service";

const REVALidate_SHORT = 60;
const REVALidate_STATS = 120;

export const getCachedGenresWithReviewCounts = unstable_cache(
  async () => getGenresWithReviewCounts(),
  ["reviews-genres-with-counts"],
  { revalidate: REVALidate_SHORT }
);

export const getCachedCommunityStats = unstable_cache(
  async () => getCommunityStats(),
  ["community-stats"],
  { revalidate: REVALidate_STATS }
);

export const getCachedDiscoverPopularTags = unstable_cache(
  async () => getDiscoverPopularTags(14),
  ["discover-popular-tags"],
  { revalidate: REVALidate_STATS }
);

export const getCachedTopReviewers = unstable_cache(
  async () => getTopReviewers(6),
  ["top-reviewers"],
  { revalidate: REVALidate_STATS }
);
