import type { BrowseWorkItem } from "@/types/browse";
import type { SearchSort, SearchWorkHit } from "@/types/search";

function mapSearchSortToBrowseSort(
  sort: SearchSort
): BrowseWorkItem["rankExplain"]["sort"] {
  switch (sort) {
    case "recent":
      return "new";
    case "highest-rated":
      return "highest-rated";
    case "most-reviewed":
      return "most-discussed";
    default:
      return "hot";
  }
}

export function searchWorkToBrowseItem(
  work: SearchWorkHit,
  sort: SearchSort = "relevance"
): BrowseWorkItem {
  return {
    novelId: work.id,
    title: work.title,
    author: work.author,
    coverUrl: work.coverUrl,
    genres: work.genres,
    tags: work.tags,
    averageRating: work.averageRating ?? 0,
    reviewCount: work.reviewCount,
    hasOfficialLink: work.hasOfficialLink,
    href: `/novels/${work.id}`,
    bayesianRating: work.averageRating ?? 0,
    publicationStatus: null,
    synopsis: work.synopsis ?? null,
    rankExplain: {
      sort: mapSearchSortToBrowseSort(sort),
      reasons: work.matchReason ? [work.matchReason] : ["Matches your search"],
    },
  };
}
