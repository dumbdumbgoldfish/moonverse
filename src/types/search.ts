import type { ReviewListItem } from "@/types/review";
import type { UserSearchResult } from "@/services/user.service";

export const SEARCH_RESULT_TYPES = [
  "all",
  "works",
  "reviews",
  "people",
  "lists",
] as const;

export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number];

export const SEARCH_SORTS = [
  "relevance",
  "most-reviewed",
  "highest-rated",
  "recent",
] as const;

export type SearchSort = (typeof SEARCH_SORTS)[number];

export interface SearchWorkHit {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  genres: string[];
  tags: string[];
  averageRating: number | null;
  reviewCount: number;
  hasOfficialLink: boolean;
  officialLinkUrl?: string;
  officialLinkLabel?: string;
  matchReason: string;
  synopsis?: string | null;
}

export interface SearchListHit {
  id: string;
  name: string;
  description: string | null;
  ownerName: string;
  ownerUsername: string;
  reviewCount: number;
  coverUrls: string[];
  novelTitles: string[];
  matchReason: string;
}

export interface SearchFacets {
  genre: string | null;
  tags: string[];
  handle: string | null;
  author: string | null;
  quoted: string | null;
}

export interface SearchResponse {
  query: string;
  type: SearchResultType;
  sort: SearchSort;
  works: SearchWorkHit[];
  reviews: ReviewListItem[];
  people: UserSearchResult[];
  lists: SearchListHit[];
  totals: {
    works: number;
    reviews: number;
    people: number;
    lists: number;
  };
  didYouMean: string | null;
  facets: SearchFacets;
}

export const EMPTY_SEARCH_RESPONSE: SearchResponse = {
  query: "",
  type: "all",
  sort: "relevance",
  works: [],
  reviews: [],
  people: [],
  lists: [],
  totals: { works: 0, reviews: 0, people: 0, lists: 0 },
  didYouMean: null,
  facets: {
    genre: null,
    tags: [],
    handle: null,
    author: null,
    quoted: null,
  },
};
